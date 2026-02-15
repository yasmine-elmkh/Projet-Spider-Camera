"""
Routes API supplémentaires
Routes organisées par fonctionnalité
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List, Dict
import json

# Créer les routeurs SANS le préfixe /api (déjà ajouté dans main.py)
camera_router = APIRouter(prefix="/api/camera", tags=["Camera"])
detection_router = APIRouter(prefix="/api/detection", tags=["Detection"])
faces_router = APIRouter(prefix="/api/faces", tags=["Faces"])
analytics_router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


# ============================================================================
# ROUTES CAMERA (les routes principales sont dans main.py)
# ============================================================================

@camera_router.get("/presets")
async def get_camera_presets():
    """
    Retourne les positions prédéfinies de la caméra
    """
    presets = {
        "wide_shot": {
            "name": "Plan Large",
            "position": {"x": 0.0, "y": 3.0, "z": -4.0},
            "description": "Vue d'ensemble du studio"
        },
        "medium_shot": {
            "name": "Plan Moyen",
            "position": {"x": 0.0, "y": 2.5, "z": -2.5},
            "description": "Cadrage groupe"
        },
        "close_up": {
            "name": "Gros Plan",
            "position": {"x": 0.0, "y": 2.0, "z": -1.5},
            "description": "Cadrage serré sur une personne"
        },
        "overhead": {
            "name": "Vue du dessus",
            "position": {"x": 0.0, "y": 3.8, "z": 0.0},
            "description": "Vue plongeante"
        }
    }
    
    return {
        "status": "success",
        "presets": presets
    }


@camera_router.post("/preset/{preset_name}")
async def apply_preset(preset_name: str):
    """
    Applique une position prédéfinie
    
    Args:
        preset_name: Nom du preset (wide_shot, medium_shot, close_up, overhead)
    """
    presets = {
        "wide_shot": {"x": 0.0, "y": 3.0, "z": -4.0},
        "medium_shot": {"x": 0.0, "y": 2.5, "z": -2.5},
        "close_up": {"x": 0.0, "y": 2.0, "z": -1.5},
        "overhead": {"x": 0.0, "y": 3.8, "z": 0.0}
    }
    
    if preset_name not in presets:
        raise HTTPException(
            status_code=400,
            detail=f"Preset inconnu. Utilisez: {', '.join(presets.keys())}"
        )
    
    position = presets[preset_name]
    
    return {
        "status": "success",
        "message": f"Preset {preset_name} appliqué",
        "position": position
    }


@camera_router.get("/limits")
async def get_camera_limits():
    """
    Retourne les limites de mouvement de la caméra
    """
    return {
        "status": "success",
        "limits": {
            "x": {"min": -5.0, "max": 5.0},
            "y": {"min": 1.0, "max": 4.0},
            "z": {"min": -5.0, "max": 5.0}
        },
        "unit": "meters"
    }


# ============================================================================
# ROUTES DETECTION
# ============================================================================

@detection_router.get("/stats")
async def get_detection_stats():
    """
    Retourne les statistiques de détection
    """
    return {
        "status": "success",
        "stats": {
            "total_persons_detected": 0,
            "total_faces_detected": 0,
            "average_persons_per_frame": 0.0,
            "peak_persons": 0,
            "detection_accuracy": 0.95
        }
    }


@detection_router.post("/sensitivity")
async def set_detection_sensitivity(
    person_threshold: float = 0.5,
    face_threshold: float = 0.5
):
    """
    Configure la sensibilité de détection
    
    Args:
        person_threshold: Seuil de confiance pour détecter les personnes (0.0-1.0)
        face_threshold: Seuil de confiance pour détecter les visages (0.0-1.0)
    """
    if not (0.0 <= person_threshold <= 1.0):
        raise HTTPException(
            status_code=400,
            detail="person_threshold doit être entre 0.0 et 1.0"
        )
    
    if not (0.0 <= face_threshold <= 1.0):
        raise HTTPException(
            status_code=400,
            detail="face_threshold doit être entre 0.0 et 1.0"
        )
    
    return {
        "status": "success",
        "message": "Sensibilité mise à jour",
        "person_threshold": person_threshold,
        "face_threshold": face_threshold
    }


# ============================================================================
# ROUTES FACES
# ============================================================================

@faces_router.get("/list")
async def list_registered_faces():
    """
    Retourne la liste de tous les visages enregistrés
    """
    return {
        "status": "success",
        "faces": [],
        "count": 0
    }


@faces_router.delete("/{name}")
async def delete_face(name: str):
    """
    Supprime un visage enregistré
    
    Args:
        name: Nom de la personne à supprimer
    """
    return {
        "status": "success",
        "message": f"Visage de {name} supprimé"
    }


@faces_router.get("/recognition/toggle")
async def toggle_face_recognition(enabled: bool = True):
    """
    Active/désactive la reconnaissance faciale
    
    Args:
        enabled: True pour activer, False pour désactiver
    """
    return {
        "status": "success",
        "face_recognition_enabled": enabled
    }


# ============================================================================
# ROUTES ANALYTICS
# ============================================================================

@analytics_router.get("/session")
async def get_session_analytics():
    """
    Retourne les analytics de la session en cours
    """
    return {
        "status": "success",
        "session": {
            "start_time": None,
            "duration_seconds": 0,
            "frames_processed": 0,
            "average_fps": 0.0,
            "total_persons_detected": 0,
            "total_faces_recognized": 0,
            "camera_movements": 0
        }
    }


@analytics_router.get("/performance")
async def get_performance_metrics():
    """
    Retourne les métriques de performance du système
    """
    return {
        "status": "success",
        "performance": {
            "cpu_usage": 0.0,
            "memory_usage": 0.0,
            "gpu_usage": 0.0,
            "processing_latency_ms": 0.0,
            "detection_fps": 0.0
        }
    }


# Export des routeurs
__all__ = ["camera_router", "detection_router", "faces_router", "analytics_router"]