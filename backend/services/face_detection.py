"""
Service de détection et reconnaissance faciale
Utilise MediaPipe pour détecter les visages et les reconnaître
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import List, Dict, Optional
import pickle
import os
from pathlib import Path

class FaceDetector:
    def __init__(self):
        """
        Initialise le détecteur de visages avec MediaPipe
        """
        # Initialisation de MediaPipe Face Detection
        self.mp_face_detection = mp.solutions.face_detection
        self.mp_drawing = mp.solutions.drawing_utils
        
        # Créer le détecteur de visages
        self.face_detection = self.mp_face_detection.FaceDetection(
            model_selection=1,  # 1 pour détection longue distance
            min_detection_confidence=0.5
        )
        
        # MediaPipe Face Mesh pour points de repère détaillés
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=10,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Base de données des visages enregistrés
        self.known_faces = {}  # {nom: encodage}
        self.face_database_path = "data/faces/"
        
        # Créer le dossier s'il n'existe pas
        Path(self.face_database_path).mkdir(parents=True, exist_ok=True)
        
        # Charger les visages enregistrés
        self._load_known_faces()
        
        # Liste des visages détectés dans le dernier frame
        self.detected_faces = []
        
        print("✅ FaceDetector initialisé")
    
    def _load_known_faces(self):
        """
        Charge les visages enregistrés depuis le disque
        """
        database_file = os.path.join(self.face_database_path, "faces.pkl")
        
        if os.path.exists(database_file):
            try:
                with open(database_file, 'rb') as f:
                    self.known_faces = pickle.load(f)
                print(f"📚 {len(self.known_faces)} visages chargés depuis la base de données")
            except Exception as e:
                print(f"⚠️ Erreur lors du chargement des visages: {e}")
                self.known_faces = {}
        else:
            print("📝 Nouvelle base de données de visages créée")
    
    def _save_known_faces(self):
        """
        Sauvegarde les visages enregistrés sur le disque
        """
        database_file = os.path.join(self.face_database_path, "faces.pkl")
        
        try:
            with open(database_file, 'wb') as f:
                pickle.dump(self.known_faces, f)
            print(f"💾 Base de données sauvegardée ({len(self.known_faces)} visages)")
        except Exception as e:
            print(f"❌ Erreur lors de la sauvegarde: {e}")
    
    def detect_faces(self, frame: np.ndarray) -> List[Dict]:
        """
        Détecte les visages dans un frame
        
        Args:
            frame: Image BGR (format OpenCV)
        
        Returns:
            Liste de dictionnaires contenant les informations des visages détectés
        """
        # Convertir BGR en RGB (MediaPipe utilise RGB)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Détecter les visages
        results = self.face_detection.process(rgb_frame)
        
        self.detected_faces = []
        
        if results.detections:
            h, w, _ = frame.shape
            
            for detection in results.detections:
                # Extraire la bounding box
                bbox = detection.location_data.relative_bounding_box
                
                # Convertir en coordonnées pixels
                x = int(bbox.xmin * w)
                y = int(bbox.ymin * h)
                width = int(bbox.width * w)
                height = int(bbox.height * h)
                
                # S'assurer que les coordonnées sont dans les limites
                x = max(0, x)
                y = max(0, y)
                x2 = min(w, x + width)
                y2 = min(h, y + height)
                
                # Extraire la région du visage
                face_region = frame[y:y2, x:x2]
                
                # Calculer un encodage simple (moyenne des couleurs par région)
                # Dans un système réel, on utiliserait un réseau de neurones
                face_encoding = self._create_simple_encoding(face_region)
                
                # Essayer de reconnaître le visage
                name = self._recognize_face(face_encoding)
                
                # Score de confiance
                confidence = detection.score[0]
                
                face_info = {
                    "bbox": {
                        "x": x,
                        "y": y,
                        "width": width,
                        "height": height
                    },
                    "confidence": float(confidence),
                    "name": name,
                    "encoding": face_encoding
                }
                
                self.detected_faces.append(face_info)
        
        return self.detected_faces
    
    def _create_simple_encoding(self, face_region: np.ndarray) -> np.ndarray:
        """
        Crée un encodage simple du visage
        Version simplifiée - dans la réalité, on utiliserait un réseau de neurones
        
        Args:
            face_region: Image du visage
        
        Returns:
            Vecteur d'encodage
        """
        if face_region.size == 0:
            return np.zeros(128)  # Vecteur vide si pas de visage
        
        # Redimensionner à une taille fixe
        face_resized = cv2.resize(face_region, (64, 64))
        
        # Convertir en niveaux de gris
        gray = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)
        
        # Normaliser
        normalized = gray.flatten().astype(np.float32) / 255.0
        
        # Réduire la dimensionnalité (simple moyenne par blocs)
        encoding = []
        block_size = 32  # 64x64 / 32 = 128 valeurs
        
        for i in range(0, len(normalized), block_size):
            block = normalized[i:i+block_size]
            encoding.append(np.mean(block))
        
        return np.array(encoding)
    
    def _recognize_face(self, encoding: np.ndarray) -> Optional[str]:
        """
        Compare l'encodage avec les visages connus
        
        Args:
            encoding: Vecteur d'encodage du visage
        
        Returns:
            Nom de la personne reconnue, ou None si inconnue
        """
        if not self.known_faces:
            return None
        
        # Calculer la distance avec chaque visage connu
        min_distance = float('inf')
        recognized_name = None
        threshold = 0.15  # Seuil de reconnaissance
        
        for name, known_encoding in self.known_faces.items():
            # Distance euclidienne
            distance = np.linalg.norm(encoding - known_encoding)
            
            if distance < min_distance:
                min_distance = distance
                recognized_name = name
        
        # Retourner le nom seulement si la distance est sous le seuil
        if min_distance < threshold:
            return recognized_name
        
        return None
    
    def register_face(self, name: str, image: np.ndarray) -> bool:
        """
        Enregistre un nouveau visage dans la base de données
        
        Args:
            name: Nom de la personne
            image: Image contenant le visage
        
        Returns:
            True si l'enregistrement a réussi, False sinon
        """
        # Détecter le visage dans l'image
        faces = self.detect_faces(image)
        
        if not faces:
            print(f"❌ Aucun visage détecté pour {name}")
            return False
        
        # Prendre le premier visage détecté
        face = faces[0]
        encoding = face["encoding"]
        
        # Enregistrer dans la base de données
        self.known_faces[name] = encoding
        
        # Sauvegarder sur le disque
        self._save_known_faces()
        
        # Sauvegarder aussi l'image
        image_path = os.path.join(self.face_database_path, f"{name}.jpg")
        cv2.imwrite(image_path, image)
        
        print(f"✅ Visage de {name} enregistré")
        return True
    
    def get_detected_faces(self) -> List[Dict]:
        """
        Retourne la liste des visages détectés dans le dernier frame
        """
        return self.detected_faces
    
    def draw_faces(self, frame: np.ndarray, faces: List[Dict] = None) -> np.ndarray:
        """
        Dessine les visages détectés sur le frame
        
        Args:
            frame: Image sur laquelle dessiner
            faces: Liste des visages (utilise self.detected_faces si None)
        
        Returns:
            Frame avec les visages dessinés
        """
        if faces is None:
            faces = self.detected_faces
        
        for face in faces:
            bbox = face["bbox"]
            x, y = bbox["x"], bbox["y"]
            w, h = bbox["width"], bbox["height"]
            
            # Couleur selon si le visage est reconnu
            color = (0, 255, 0) if face["name"] else (0, 165, 255)  # Vert si reconnu, orange sinon
            
            # Dessiner le rectangle
            cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
            
            # Texte à afficher
            if face["name"]:
                label = f"{face['name']} ({face['confidence']:.2f})"
            else:
                label = f"Inconnu ({face['confidence']:.2f})"
            
            # Fond pour le texte
            (text_w, text_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            cv2.rectangle(frame, (x, y - text_h - 10), (x + text_w, y), color, -1)
            
            # Texte
            cv2.putText(frame, label, (x, y - 5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        return frame
    
    def get_registered_faces(self) -> List[str]:
        """
        Retourne la liste des noms des visages enregistrés
        """
        return list(self.known_faces.keys())
    
    def delete_face(self, name: str) -> bool:
        """
        Supprime un visage de la base de données
        
        Args:
            name: Nom de la personne à supprimer
        
        Returns:
            True si la suppression a réussi, False sinon
        """
        if name in self.known_faces:
            del self.known_faces[name]
            self._save_known_faces()
            
            # Supprimer aussi l'image
            image_path = os.path.join(self.face_database_path, f"{name}.jpg")
            if os.path.exists(image_path):
                os.remove(image_path)
            
            print(f"🗑️ Visage de {name} supprimé")
            return True
        
        return False