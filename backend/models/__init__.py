"""
Package models
Contient les modèles de données pour la détection et le tracking
"""

from .detection import (
    Detection,
    PersonDetection,
    FaceDetection,
    BoundingBox,
    DetectionType,
    DetectionResult,
    DetectionConfig,
    bbox_from_xyxy,
    bbox_from_xywh,
    bbox_from_center
)

from .tracking import (
    Track,
    TrackState,
    Tracker,
    PersonTracker
)

__all__ = [
    # Detection
    'Detection',
    'PersonDetection',
    'FaceDetection',
    'BoundingBox',
    'DetectionType',
    'DetectionResult',
    'DetectionConfig',
    'bbox_from_xyxy',
    'bbox_from_xywh',
    'bbox_from_center',
    
    # Tracking
    'Track',
    'TrackState',
    'Tracker',
    'PersonTracker',
]

print("✅ Package models initialisé")