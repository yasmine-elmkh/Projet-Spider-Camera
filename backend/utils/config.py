"""
Configuration globale de l'application
Constantes et paramètres
"""

import os
from pathlib import Path

# Chemins de base
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
FACES_DIR = DATA_DIR / "faces"

# Créer les dossiers nécessaires
for directory in [DATA_DIR, MODELS_DIR, FACES_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Configuration de la caméra
CAMERA_CONFIG = {
    "default_camera_id": 0,
    "frame_width": 1280,
    "frame_height": 720,
    "fps": 30,
}

# Configuration du studio (dimensions en mètres)
STUDIO_CONFIG = {
    "width": 10.0,   # 10 mètres de largeur
    "depth": 10.0,   # 10 mètres de profondeur
    "height": 4.0,   # 4 mètres de hauteur
    "default_camera_height": 2.5,
}

# Configuration de détection
DETECTION_CONFIG = {
    "person_confidence_threshold": 0.5,
    "face_confidence_threshold": 0.5,
    "face_recognition_threshold": 0.15,
    "max_persons": 10,
    "max_faces": 10,
}

# Configuration des modes de caméra
CAMERA_MODES = {
    "manual": {
        "description": "Contrôle manuel de la caméra",
        "auto_tracking": False,
    },
    "speaker": {
        "description": "Suit automatiquement la personne qui parle",
        "auto_tracking": True,
        "default_position": {"x": 0.0, "y": 2.5, "z": -2.0},
    },
    "group": {
        "description": "Cadre toutes les personnes présentes",
        "auto_tracking": True,
        "default_position": {"x": 0.0, "y": 2.5, "z": -2.5},
    },
    "wide": {
        "description": "Plan large fixe du studio",
        "auto_tracking": False,
        "default_position": {"x": 0.0, "y": 3.0, "z": -4.0},
    },
}

# Configuration WebSocket
WEBSOCKET_CONFIG = {
    "video_fps": 30,
    "data_update_rate": 10,  # Hz
    "reconnect_delay": 1.0,  # secondes
}

# Configuration API
API_CONFIG = {
    "title": "Spider Camera API",
    "description": "API pour le contrôle intelligent de caméra spider en studio",
    "version": "1.0.0",
    "host": "0.0.0.0",
    "port": 8000,
}

# URLs CORS autorisées
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

print("✅ Configuration chargée")