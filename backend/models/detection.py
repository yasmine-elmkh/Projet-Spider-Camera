"""
Modèles de détection
Classes et fonctions pour la détection d'objets, personnes et visages
"""

import cv2
import numpy as np
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


class DetectionType(Enum):
    """
    Types de détections possibles
    """
    PERSON = "person"
    FACE = "face"
    OBJECT = "object"
    GESTURE = "gesture"


@dataclass
class BoundingBox:
    """
    Représente une bounding box rectangulaire
    """
    x1: int  # Coordonnée x du coin supérieur gauche
    y1: int  # Coordonnée y du coin supérieur gauche
    x2: int  # Coordonnée x du coin inférieur droit
    y2: int  # Coordonnée y du coin inférieur droit
    
    @property
    def width(self) -> int:
        """Largeur de la bounding box"""
        return self.x2 - self.x1
    
    @property
    def height(self) -> int:
        """Hauteur de la bounding box"""
        return self.y2 - self.y1
    
    @property
    def area(self) -> int:
        """Surface de la bounding box"""
        return self.width * self.height
    
    @property
    def center(self) -> Tuple[int, int]:
        """Centre de la bounding box (x, y)"""
        return (
            (self.x1 + self.x2) // 2,
            (self.y1 + self.y2) // 2
        )
    
    def to_dict(self) -> Dict:
        """Convertit en dictionnaire"""
        return {
            "x1": self.x1,
            "y1": self.y1,
            "x2": self.x2,
            "y2": self.y2,
            "width": self.width,
            "height": self.height,
            "area": self.area,
            "center": {
                "x": self.center[0],
                "y": self.center[1]
            }
        }
    
    def iou(self, other: 'BoundingBox') -> float:
        """
        Calcule l'Intersection over Union (IoU) avec une autre bounding box
        
        Args:
            other: Autre bounding box
            
        Returns:
            Valeur IoU entre 0 et 1
        """
        # Calculer l'intersection
        x1_inter = max(self.x1, other.x1)
        y1_inter = max(self.y1, other.y1)
        x2_inter = min(self.x2, other.x2)
        y2_inter = min(self.y2, other.y2)
        
        # Vérifier si il y a intersection
        if x2_inter < x1_inter or y2_inter < y1_inter:
            return 0.0
        
        # Calculer l'aire de l'intersection
        intersection_area = (x2_inter - x1_inter) * (y2_inter - y1_inter)
        
        # Calculer l'aire de l'union
        union_area = self.area + other.area - intersection_area
        
        # Éviter la division par zéro
        if union_area == 0:
            return 0.0
        
        return intersection_area / union_area
    
    def contains_point(self, x: int, y: int) -> bool:
        """
        Vérifie si un point est à l'intérieur de la bounding box
        
        Args:
            x: Coordonnée x du point
            y: Coordonnée y du point
            
        Returns:
            True si le point est à l'intérieur
        """
        return self.x1 <= x <= self.x2 and self.y1 <= y <= self.y2


@dataclass
class Detection:
    """
    Représente une détection (personne, visage, objet)
    """
    detection_id: int
    detection_type: DetectionType
    bbox: BoundingBox
    confidence: float
    class_name: str
    timestamp: float
    
    # Attributs optionnels
    features: Optional[np.ndarray] = None  # Vecteur de features pour le tracking
    label: Optional[str] = None  # Label personnalisé (ex: nom d'une personne)
    metadata: Optional[Dict] = None  # Métadonnées supplémentaires
    
    def to_dict(self) -> Dict:
        """
        Convertit la détection en dictionnaire
        
        Returns:
            Dictionnaire représentant la détection
        """
        return {
            "id": self.detection_id,
            "type": self.detection_type.value,
            "bbox": self.bbox.to_dict(),
            "confidence": float(self.confidence),
            "class_name": self.class_name,
            "label": self.label,
            "timestamp": self.timestamp,
            "metadata": self.metadata or {}
        }
    
    def draw(self, image: np.ndarray, color: Tuple[int, int, int] = (0, 255, 0), 
             thickness: int = 2, show_label: bool = True) -> np.ndarray:
        """
        Dessine la détection sur une image
        
        Args:
            image: Image sur laquelle dessiner
            color: Couleur BGR de la bounding box
            thickness: Épaisseur du trait
            show_label: Afficher le label ou non
            
        Returns:
            Image avec la détection dessinée
        """
        # Dessiner la bounding box
        cv2.rectangle(
            image,
            (self.bbox.x1, self.bbox.y1),
            (self.bbox.x2, self.bbox.y2),
            color,
            thickness
        )
        
        if show_label:
            # Préparer le texte
            label_text = self.label if self.label else self.class_name
            label_text = f"{label_text} {self.confidence:.2f}"
            
            # Calculer la taille du texte
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.6
            font_thickness = 2
            (text_width, text_height), baseline = cv2.getTextSize(
                label_text, font, font_scale, font_thickness
            )
            
            # Dessiner le fond du label
            cv2.rectangle(
                image,
                (self.bbox.x1, self.bbox.y1 - text_height - baseline - 5),
                (self.bbox.x1 + text_width, self.bbox.y1),
                color,
                -1
            )
            
            # Dessiner le texte
            cv2.putText(
                image,
                label_text,
                (self.bbox.x1, self.bbox.y1 - 5),
                font,
                font_scale,
                (255, 255, 255),
                font_thickness
            )
        
        # Dessiner le point central
        center_x, center_y = self.bbox.center
        cv2.circle(image, (center_x, center_y), 5, color, -1)
        
        return image


class PersonDetection(Detection):
    """
    Détection spécifique pour une personne
    Hérite de Detection et ajoute des attributs spécifiques
    """
    def __init__(self, detection_id: int, bbox: BoundingBox, confidence: float, 
                 timestamp: float, **kwargs):
        super().__init__(
            detection_id=detection_id,
            detection_type=DetectionType.PERSON,
            bbox=bbox,
            confidence=confidence,
            class_name="person",
            timestamp=timestamp,
            **kwargs
        )
        
        # Attributs spécifiques aux personnes
        self.is_speaking: bool = False
        self.pose_landmarks: Optional[List] = None
        self.activity: Optional[str] = None  # standing, sitting, walking, etc.
    
    def estimate_distance(self, focal_length: float = 600, real_height: float = 1.7) -> float:
        """
        Estime la distance de la personne par rapport à la caméra
        Basé sur la taille de la bounding box
        
        Args:
            focal_length: Longueur focale de la caméra en pixels
            real_height: Hauteur réelle moyenne d'une personne en mètres
            
        Returns:
            Distance estimée en mètres
        """
        # Distance = (hauteur_réelle * focal_length) / hauteur_pixels
        pixel_height = self.bbox.height
        if pixel_height == 0:
            return 0.0
        
        distance = (real_height * focal_length) / pixel_height
        return distance
    
    def to_dict(self) -> Dict:
        """Convertit en dictionnaire avec infos spécifiques personne"""
        base_dict = super().to_dict()
        base_dict.update({
            "is_speaking": self.is_speaking,
            "activity": self.activity
        })
        return base_dict


class FaceDetection(Detection):
    """
    Détection spécifique pour un visage
    """
    def __init__(self, detection_id: int, bbox: BoundingBox, confidence: float,
                 timestamp: float, **kwargs):
        super().__init__(
            detection_id=detection_id,
            detection_type=DetectionType.FACE,
            bbox=bbox,
            confidence=confidence,
            class_name="face",
            timestamp=timestamp,
            **kwargs
        )
        
        # Attributs spécifiques aux visages
        self.face_encoding: Optional[np.ndarray] = None
        self.recognized_name: Optional[str] = None
        self.recognition_confidence: float = 0.0
        self.landmarks: Optional[List] = None  # Points de repère du visage
        self.emotion: Optional[str] = None  # happy, sad, neutral, etc.
        self.age_estimate: Optional[int] = None
        self.gender_estimate: Optional[str] = None
    
    def is_recognized(self) -> bool:
        """Vérifie si le visage a été reconnu"""
        return self.recognized_name is not None
    
    def to_dict(self) -> Dict:
        """Convertit en dictionnaire avec infos spécifiques visage"""
        base_dict = super().to_dict()
        base_dict.update({
            "recognized_name": self.recognized_name,
            "recognition_confidence": self.recognition_confidence,
            "emotion": self.emotion,
            "age_estimate": self.age_estimate,
            "gender_estimate": self.gender_estimate
        })
        return base_dict


class DetectionResult:
    """
    Résultat d'une détection contenant toutes les détections d'un frame
    """
    def __init__(self, frame_id: int, timestamp: float):
        self.frame_id = frame_id
        self.timestamp = timestamp
        self.detections: List[Detection] = []
        self.frame_shape: Optional[Tuple[int, int, int]] = None
    
    def add_detection(self, detection: Detection):
        """Ajoute une détection au résultat"""
        self.detections.append(detection)
    
    def get_persons(self) -> List[PersonDetection]:
        """Retourne uniquement les détections de personnes"""
        return [d for d in self.detections if isinstance(d, PersonDetection)]
    
    def get_faces(self) -> List[FaceDetection]:
        """Retourne uniquement les détections de visages"""
        return [d for d in self.detections if isinstance(d, FaceDetection)]
    
    def filter_by_confidence(self, min_confidence: float) -> List[Detection]:
        """
        Filtre les détections par niveau de confiance
        
        Args:
            min_confidence: Confiance minimum (0-1)
            
        Returns:
            Liste des détections filtrées
        """
        return [d for d in self.detections if d.confidence >= min_confidence]
    
    def non_max_suppression(self, iou_threshold: float = 0.5) -> List[Detection]:
        """
        Applique la suppression non-maximale pour éliminer les détections redondantes
        
        Args:
            iou_threshold: Seuil IoU pour considérer deux boxes comme redondantes
            
        Returns:
            Liste des détections après NMS
        """
        if not self.detections:
            return []
        
        # Trier par confiance décroissante
        sorted_detections = sorted(self.detections, key=lambda x: x.confidence, reverse=True)
        
        keep = []
        
        while sorted_detections:
            # Garder la détection avec la plus haute confiance
            current = sorted_detections.pop(0)
            keep.append(current)
            
            # Filtrer les détections qui se chevauchent trop
            sorted_detections = [
                d for d in sorted_detections
                if current.bbox.iou(d.bbox) < iou_threshold
            ]
        
        return keep
    
    def to_dict(self) -> Dict:
        """Convertit le résultat en dictionnaire"""
        return {
            "frame_id": self.frame_id,
            "timestamp": self.timestamp,
            "total_detections": len(self.detections),
            "persons": len(self.get_persons()),
            "faces": len(self.get_faces()),
            "detections": [d.to_dict() for d in self.detections]
        }
    
    def draw_all(self, image: np.ndarray) -> np.ndarray:
        """
        Dessine toutes les détections sur l'image
        
        Args:
            image: Image sur laquelle dessiner
            
        Returns:
            Image avec toutes les détections dessinées
        """
        result_image = image.copy()
        
        # Couleurs par type
        colors = {
            DetectionType.PERSON: (0, 255, 0),   # Vert
            DetectionType.FACE: (255, 165, 0),   # Orange
            DetectionType.OBJECT: (255, 0, 0),   # Rouge
            DetectionType.GESTURE: (0, 255, 255) # Cyan
        }
        
        for detection in self.detections:
            color = colors.get(detection.detection_type, (255, 255, 255))
            result_image = detection.draw(result_image, color=color)
        
        # Ajouter des informations sur le frame
        info_text = f"Frame: {self.frame_id} | Detections: {len(self.detections)}"
        cv2.putText(
            result_image,
            info_text,
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2
        )
        
        return result_image


class DetectionConfig:
    """
    Configuration pour les paramètres de détection
    """
    def __init__(self):
        # Seuils de confiance
        self.person_confidence_threshold: float = 0.5
        self.face_confidence_threshold: float = 0.5
        
        # NMS (Non-Maximum Suppression)
        self.nms_iou_threshold: float = 0.5
        
        # Paramètres de traitement
        self.max_detections: int = 10
        self.input_size: Tuple[int, int] = (640, 640)
        
        # Options d'affichage
        self.draw_boxes: bool = True
        self.draw_labels: bool = True
        self.draw_confidence: bool = True
    
    def to_dict(self) -> Dict:
        """Convertit la configuration en dictionnaire"""
        return {
            "person_confidence_threshold": self.person_confidence_threshold,
            "face_confidence_threshold": self.face_confidence_threshold,
            "nms_iou_threshold": self.nms_iou_threshold,
            "max_detections": self.max_detections,
            "input_size": self.input_size,
            "draw_boxes": self.draw_boxes,
            "draw_labels": self.draw_labels,
            "draw_confidence": self.draw_confidence
        }
    
    @classmethod
    def from_dict(cls, config_dict: Dict) -> 'DetectionConfig':
        """Crée une configuration depuis un dictionnaire"""
        config = cls()
        for key, value in config_dict.items():
            if hasattr(config, key):
                setattr(config, key, value)
        return config


# Fonctions utilitaires

def calculate_iou(box1: BoundingBox, box2: BoundingBox) -> float:
    """
    Calcule l'Intersection over Union entre deux bounding boxes
    
    Args:
        box1: Première bounding box
        box2: Deuxième bounding box
        
    Returns:
        Valeur IoU entre 0 et 1
    """
    return box1.iou(box2)


def bbox_from_xyxy(x1: int, y1: int, x2: int, y2: int) -> BoundingBox:
    """
    Crée une BoundingBox à partir de coordonnées x1, y1, x2, y2
    """
    return BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2)


def bbox_from_xywh(x: int, y: int, w: int, h: int) -> BoundingBox:
    """
    Crée une BoundingBox à partir de x, y, largeur, hauteur
    """
    return BoundingBox(x1=x, y1=y, x2=x+w, y2=y+h)


def bbox_from_center(center_x: int, center_y: int, width: int, height: int) -> BoundingBox:
    """
    Crée une BoundingBox à partir du centre et des dimensions
    """
    x1 = center_x - width // 2
    y1 = center_y - height // 2
    x2 = x1 + width
    y2 = y1 + height
    return BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2)


print("✅ Module detection.py chargé")