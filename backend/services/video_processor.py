"""
Service de traitement vidéo
Gère la capture vidéo, la détection de personnes et le traitement des frames
"""

import cv2
import numpy as np
from ultralytics import YOLO
import time
from typing import List, Dict, Optional
import threading

class VideoProcessor:
    def __init__(self):
        """
        Initialise le processeur vidéo avec les modèles de détection
        """
        # Initialisation de la caméra
        self.cap = None
        self.is_running = False
        
        # Chargement du modèle YOLO pour détecter les personnes
        print("📦 Chargement du modèle YOLO...")
        try:
            self.model = YOLO('yolov8n.pt')  # Modèle léger et rapide
            print("✅ Modèle YOLO chargé")
        except Exception as e:
            print(f"❌ Erreur chargement YOLO: {e}")
            self.model = None
        
        # Variables pour stocker les détections
        self.detected_persons = []
        self.current_frame = None
        self.processed_frame = None
        
        # Statistiques
        self.total_detections = 0
        self.start_time = None
        self.frame_count = 0
        self.fps = 0
        
        # Thread pour la capture vidéo
        self.capture_thread = None
        self.lock = threading.Lock()
        
        print("✅ VideoProcessor initialisé")
    
    def _convert_to_json_serializable(self, obj):
        """
        Convertit les types NumPy en types Python natifs pour la sérialisation JSON
        
        Args:
            obj: Objet à convertir
            
        Returns:
            Objet converti en type Python natif
        """
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, dict):
            return {key: self._convert_to_json_serializable(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_to_json_serializable(item) for item in obj]
        return obj
    
    def start_camera(self, camera_id: int = 0) -> bool:
        """
        Démarre la capture vidéo depuis la caméra
        
        Args:
            camera_id: ID de la caméra (0 pour caméra par défaut)
        
        Returns:
            True si la caméra a démarré, False sinon
        """
        try:
            # Essayer d'ouvrir la caméra
            self.cap = cv2.VideoCapture(camera_id)
            
            if not self.cap.isOpened():
                print("❌ Impossible d'ouvrir la caméra")
                # Essayer avec une vidéo de test ou créer un frame de test
                print("📹 Création d'un flux vidéo de test...")
                return self._create_test_stream()
            
            # Configuration de la caméra
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
            self.cap.set(cv2.CAP_PROP_FPS, 30)
            
            self.is_running = True
            self.start_time = time.time()
            
            # Démarrer le thread de capture
            self.capture_thread = threading.Thread(target=self._capture_loop, daemon=True)
            self.capture_thread.start()
            
            print("✅ Caméra démarrée")
            return True
            
        except Exception as e:
            print(f"❌ Erreur lors du démarrage de la caméra: {e}")
            return self._create_test_stream()
    
    def _create_test_stream(self) -> bool:
        """
        Crée un flux vidéo de test si aucune caméra n'est disponible
        """
        try:
            self.is_running = True
            self.start_time = time.time()
            
            # Démarrer le thread de génération de frames de test
            self.capture_thread = threading.Thread(target=self._test_stream_loop, daemon=True)
            self.capture_thread.start()
            
            print("✅ Flux vidéo de test démarré")
            return True
        except Exception as e:
            print(f"❌ Erreur création flux test: {e}")
            return False
    
    def _test_stream_loop(self):
        """
        Boucle de génération de frames de test
        """
        frame_counter = 0
        
        while self.is_running:
            # Créer un frame de test
            frame = np.zeros((720, 1280, 3), dtype=np.uint8)
            
            # Fond dégradé
            for i in range(720):
                frame[i, :] = [int(i * 255 / 720), 50, 100]
            
            # Texte
            cv2.putText(
                frame,
                "MODE TEST - Aucune caméra détectée",
                (350, 300),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.2,
                (255, 255, 255),
                2
            )
            
            cv2.putText(
                frame,
                f"Frame: {frame_counter}",
                (550, 400),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (255, 255, 255),
                2
            )
            
            # Simuler quelques détections de test
            if frame_counter % 30 < 15:  # Afficher une détection toutes les 30 frames
                # Dessiner une fausse détection
                cv2.rectangle(frame, (400, 200), (600, 500), (0, 255, 0), 2)
                cv2.putText(frame, "Personne Test (0.95)", (400, 190),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                
                # Créer une détection simulée (avec types Python natifs)
                test_person = {
                    "id": 0,
                    "bbox": {
                        "x1": 400,
                        "y1": 200,
                        "x2": 600,
                        "y2": 500
                    },
                    "center": {
                        "x": 500,
                        "y": 350
                    },
                    "confidence": 0.95,
                    "area": 60000
                }
                
                with self.lock:
                    self.detected_persons = [test_person]
            else:
                with self.lock:
                    self.detected_persons = []
            
            with self.lock:
                self.current_frame = frame.copy()
                self.processed_frame = frame.copy()
                self.frame_count += 1
                
                # Calculer FPS
                if self.frame_count % 30 == 0:
                    elapsed = time.time() - self.start_time
                    self.fps = self.frame_count / elapsed
            
            frame_counter += 1
            time.sleep(0.033)  # ~30 FPS
    
    def _capture_loop(self):
        """
        Boucle de capture vidéo dans un thread séparé
        """
        while self.is_running:
            ret, frame = self.cap.read()
            
            if not ret:
                print("❌ Erreur lecture frame")
                time.sleep(0.1)
                continue
            
            # Traiter le frame
            self._process_frame(frame)
            
            time.sleep(0.001)  # Petit délai pour ne pas surcharger
    
    def _process_frame(self, frame: np.ndarray):
        """
        Traite un frame (détection + dessin)
        """
        with self.lock:
            self.current_frame = frame.copy()
            self.frame_count += 1
            
            # Calculer les FPS
            if self.frame_count % 30 == 0:
                elapsed = time.time() - self.start_time
                self.fps = self.frame_count / elapsed
        
        # Faire la détection si le modèle est chargé
        if self.model is not None:
            try:
                # Détection des personnes avec YOLO
                results = self.model(frame, classes=[0], verbose=False)  # classe 0 = personne
                
                # Réinitialiser la liste des personnes détectées
                detected = []
                
                # Traiter les détections
                for result in results:
                    boxes = result.boxes
                    for box in boxes:
                        # Extraire les coordonnées de la bounding box
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = float(box.conf[0])
                        
                        # Ne garder que les détections avec confiance > 0.5
                        if confidence > 0.5:
                            # Calculer le centre de la personne
                            center_x = int((x1 + x2) / 2)
                            center_y = int((y1 + y2) / 2)
                            
                            # Stocker les informations de la personne (AVEC CONVERSION)
                            person_info = {
                                "id": len(detected),
                                "bbox": {
                                    "x1": int(x1),
                                    "y1": int(y1),
                                    "x2": int(x2),
                                    "y2": int(y2)
                                },
                                "center": {
                                    "x": int(center_x),
                                    "y": int(center_y)
                                },
                                "confidence": float(confidence),  # Conversion explicite
                                "area": int((x2 - x1) * (y2 - y1))
                            }
                            
                            detected.append(person_info)
                            
                            # Dessiner la bounding box sur le frame
                            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), 
                                        (0, 255, 0), 2)
                            
                            # Afficher la confiance
                            label = f"Personne {person_info['id']} ({confidence:.2f})"
                            cv2.putText(frame, label, (int(x1), int(y1) - 10),
                                      cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                            
                            # Dessiner le point central
                            cv2.circle(frame, (center_x, center_y), 5, (255, 0, 0), -1)
                
                with self.lock:
                    self.detected_persons = detected
                    self.total_detections += len(detected)
                    
            except Exception as e:
                print(f"❌ Erreur détection: {e}")
        
        # Afficher le nombre de personnes détectées
        with self.lock:
            person_count = len(self.detected_persons)
        
        info_text = f"Personnes: {person_count} | FPS: {self.fps:.1f}"
        cv2.putText(frame, info_text, (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        with self.lock:
            self.processed_frame = frame
    
    def stop_camera(self):
        """
        Arrête la caméra et libère les ressources
        """
        self.is_running = False
        
        if self.capture_thread is not None:
            self.capture_thread.join(timeout=2)
        
        if self.cap is not None:
            self.cap.release()
        
        print("🛑 Caméra arrêtée")
    
    def get_processed_frame(self) -> Optional[np.ndarray]:
        """
        Récupère le dernier frame traité
        
        Returns:
            Frame traité avec les détections dessinées, ou None si erreur
        """
        with self.lock:
            if self.processed_frame is not None:
                return self.processed_frame.copy()
        return None
    
    def get_detected_persons(self) -> List[Dict]:
        """
        Retourne la liste des personnes détectées dans le dernier frame
        AVEC conversion en types JSON-serializable
        """
        with self.lock:
            # Créer une copie profonde et convertir tous les types NumPy
            persons_copy = []
            for person in self.detected_persons:
                person_converted = self._convert_to_json_serializable(person)
                persons_copy.append(person_converted)
            return persons_copy
    
    def get_person_count(self) -> int:
        """
        Retourne le nombre de personnes actuellement détectées
        """
        with self.lock:
            return len(self.detected_persons)
    
    def get_speaking_person(self) -> Optional[int]:
        """
        Détecte quelle personne est en train de parler
        Pour l'instant, on retourne la personne la plus au centre
        
        Returns:
            ID de la personne qui parle, ou None
        """
        with self.lock:
            if not self.detected_persons:
                return None
            
            if self.current_frame is None:
                return None
            
            frame_center_x = self.current_frame.shape[1] // 2
            
            closest_person = min(
                self.detected_persons,
                key=lambda p: abs(p["center"]["x"] - frame_center_x)
            )
            
            return int(closest_person["id"])
    
    def get_total_detections(self) -> int:
        """
        Retourne le nombre total de détections depuis le démarrage
        """
        return int(self.total_detections)
    
    def get_average_persons(self) -> float:
        """
        Retourne le nombre moyen de personnes détectées
        """
        if self.frame_count == 0:
            return 0.0
        return float(self.total_detections / self.frame_count)
    
    def get_uptime(self) -> float:
        """
        Retourne le temps écoulé depuis le démarrage en secondes
        """
        if self.start_time is None:
            return 0.0
        return float(time.time() - self.start_time)
    
    def get_fps(self) -> float:
        """
        Retourne les FPS actuels
        """
        return float(self.fps)
    
    def get_timestamp(self) -> float:
        """
        Retourne le timestamp actuel
        """
        return float(time.time())