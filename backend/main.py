"""
Point d'entrée principal de l'application FastAPI
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import cv2
import numpy as np
import asyncio
import time

# Import des services locaux
from services.video_processor import VideoProcessor
from services.camera_control import CameraController
from services.face_detection import FaceDetector
from api.websocket import ConnectionManager
from utils.json_encoder import convert_to_serializable

# Import des routes supplémentaires
from api.routes import camera_router, detection_router, faces_router, analytics_router

app = FastAPI(
    title="Spider Camera API",
    description="API pour le contrôle intelligent de caméra spider en studio",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclure les routeurs
app.include_router(camera_router)
app.include_router(detection_router)
app.include_router(faces_router)
app.include_router(analytics_router)

# Initialisation des services
video_processor = VideoProcessor()
camera_controller = CameraController()
face_detector = FaceDetector()
manager = ConnectionManager()

# Variables globales
camera_active = False
current_mode = "manual"


@app.get("/")
async def root():
    return {
        "message": "Spider Camera API",
        "status": "running",
        "version": "1.0.0"
    }


@app.post("/api/camera/start")
async def start_camera():
    global camera_active
    try:
        success = video_processor.start_camera()
        if success:
            camera_active = True
            return {"status": "success", "message": "Caméra démarrée"}
        else:
            return {"status": "error", "message": "Impossible de démarrer la caméra"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/camera/stop")
async def stop_camera():
    global camera_active
    video_processor.stop_camera()
    camera_active = False
    return {"status": "success", "message": "Caméra arrêtée"}


@app.get("/api/camera/status")
async def get_camera_status():
    return {
        "active": camera_active,
        "mode": current_mode,
        "position": camera_controller.get_current_position(),
        "detected_persons": video_processor.get_person_count()
    }


@app.post("/api/camera/mode/{mode}")
async def set_camera_mode(mode: str):
    global current_mode
    valid_modes = ["manual", "speaker", "group", "wide"]
    if mode not in valid_modes:
        return {"status": "error", "message": f"Mode invalide"}
    
    current_mode = mode
    camera_controller.set_mode(mode)
    
    return {
        "status": "success",
        "message": f"Mode changé vers {mode}",
        "mode": current_mode
    }


@app.post("/api/camera/position")
async def set_camera_position(x: float, y: float, z: float):
    try:
        camera_controller.move_to_position(x, y, z)
        return {"status": "success", "position": {"x": x, "y": y, "z": z}}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/detection/persons")
async def get_detected_persons():
    persons = video_processor.get_detected_persons()
    return {"count": len(persons), "persons": persons}


@app.get("/api/detection/faces")
async def get_detected_faces():
    faces = face_detector.get_detected_faces()
    return {"count": len(faces), "faces": faces}


@app.websocket("/ws/video")
async def websocket_video(websocket: WebSocket):
    """WebSocket pour streaming vidéo"""
    await manager.connect(websocket)
    print("📹 Client vidéo connecté")
    
    try:
        while True:
            frame = video_processor.get_processed_frame()
            
            if frame is not None:
                # Encoder et envoyer le frame
                success, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                if success:
                    await websocket.send_bytes(buffer.tobytes())
            else:
                # Envoyer un frame noir si pas de caméra
                blank = np.zeros((720, 1280, 3), dtype=np.uint8)
                cv2.putText(blank, "En attente...", (500, 360),
                          cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                success, buffer = cv2.imencode('.jpg', blank)
                if success:
                    await websocket.send_bytes(buffer.tobytes())
            
            await asyncio.sleep(0.033)  # ~30 FPS
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("📹 Client vidéo déconnecté")
    except Exception as e:
        print(f"❌ Erreur WebSocket vidéo: {e}")
        manager.disconnect(websocket)


@app.websocket("/ws/data")
async def websocket_data(websocket: WebSocket):
    """WebSocket pour les données de détection"""
    await manager.connect(websocket)
    print("📊 Client data connecté")
    
    try:
        while True:
            try:
                # Préparer les données
                data = {
                    "timestamp": time.time(),
                    "persons": video_processor.get_detected_persons(),
                    "faces": face_detector.get_detected_faces(),
                    "camera_position": camera_controller.get_current_position(),
                    "mode": current_mode,
                    "speaking_person": video_processor.get_speaking_person() if camera_active else None
                }
                
                # Convertir en types sérialisables
                data = convert_to_serializable(data)
                
                # Envoyer
                await websocket.send_json(data)
                await asyncio.sleep(0.2)
                
            except Exception as e:
                print(f"❌ Erreur boucle data: {e}")
                await asyncio.sleep(1)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("📊 Client data déconnecté")
    except Exception as e:
        print(f"❌ Erreur WebSocket data: {e}")
        manager.disconnect(websocket)


@app.post("/api/faces/register")
async def register_face(name: str, image: UploadFile = File(...)):
    try:
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        success = face_detector.register_face(name, img)
        
        if success:
            return {"status": "success", "message": f"Visage de {name} enregistré"}
        else:
            return {"status": "error", "message": "Aucun visage détecté"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/analytics")
async def get_analytics():
    return {
        "total_persons_detected": video_processor.get_total_detections(),
        "average_persons": video_processor.get_average_persons(),
        "camera_movements": camera_controller.get_movement_count(),
        "uptime": video_processor.get_uptime(),
        "fps": video_processor.get_fps()
    }


if __name__ == "__main__":
    print("🚀 Démarrage du serveur Spider Camera API...")
    print("🌐 URL: http://localhost:8000")
    print("📚 Documentation: http://localhost:8000/docs")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )