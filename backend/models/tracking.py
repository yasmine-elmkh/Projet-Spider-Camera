"""
Modèles de tracking
Classes pour le suivi d'objets entre les frames
"""

import numpy as np
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field
from collections import deque
import time
from .detection import Detection, BoundingBox, PersonDetection


class TrackState:
    """
    États possibles d'un track
    """
    TENTATIVE = "tentative"    # Track en cours de confirmation
    CONFIRMED = "confirmed"    # Track confirmé
    DELETED = "deleted"        # Track supprimé


@dataclass
class Track:
    """
    Représente un track (suivi) d'un objet à travers plusieurs frames
    """
    track_id: int
    initial_detection: Detection
    state: str = TrackState.TENTATIVE
    
    # Historique des détections
    detections: List[Detection] = field(default_factory=list)
    
    # Position et mouvement
    positions: deque = field(default_factory=lambda: deque(maxlen=30))
    velocities: deque = field(default_factory=lambda: deque(maxlen=10))
    
    # Compteurs
    hits: int = 0              # Nombre de fois où le track a été mis à jour
    age: int = 0               # Nombre de frames depuis la création
    time_since_update: int = 0 # Nombre de frames depuis la dernière mise à jour
    
    # Timestamps
    created_at: float = field(default_factory=time.time)
    last_updated_at: float = field(default_factory=time.time)
    
    # Paramètres
    max_age: int = 30          # Nombre max de frames sans détection avant suppression
    min_hits: int = 3          # Nombre min de hits pour confirmer le track
    
    def __post_init__(self):
        """Initialisation après création"""
        self.detections.append(self.initial_detection)
        self.positions.append(self.initial_detection.bbox.center)
    
    def update(self, detection: Detection):
        """
        Met à jour le track avec une nouvelle détection
        
        Args:
            detection: Nouvelle détection associée au track
        """
        self.detections.append(detection)
        self.hits += 1
        self.time_since_update = 0
        self.last_updated_at = time.time()
        
        # Mettre à jour la position
        new_position = detection.bbox.center
        
        # Calculer la vélocité si on a une position précédente
        if len(self.positions) > 0:
            prev_position = self.positions[-1]
            velocity = (
                new_position[0] - prev_position[0],
                new_position[1] - prev_position[1]
            )
            self.velocities.append(velocity)
        
        self.positions.append(new_position)
        
        # Confirmer le track si assez de hits
        if self.state == TrackState.TENTATIVE and self.hits >= self.min_hits:
            self.state = TrackState.CONFIRMED
    
    def predict_position(self) -> Tuple[int, int]:
        """
        Prédit la prochaine position basée sur la vélocité
        
        Returns:
            Position prédite (x, y)
        """
        if len(self.positions) == 0:
            return (0, 0)
        
        current_pos = self.positions[-1]
        
        # Si on a des vélocités, utiliser la moyenne
        if len(self.velocities) > 0:
            avg_velocity = (
                sum(v[0] for v in self.velocities) / len(self.velocities),
                sum(v[1] for v in self.velocities) / len(self.velocities)
            )
            predicted_x = int(current_pos[0] + avg_velocity[0])
            predicted_y = int(current_pos[1] + avg_velocity[1])
            return (predicted_x, predicted_y)
        
        return current_pos
    
    def mark_missed(self):
        """
        Marque le track comme raté (pas de détection dans ce frame)
        """
        self.time_since_update += 1
        
        # Supprimer le track si trop ancien
        if self.time_since_update > self.max_age:
            self.state = TrackState.DELETED
    
    def increment_age(self):
        """Incrémente l'âge du track"""
        self.age += 1
    
    def is_confirmed(self) -> bool:
        """Vérifie si le track est confirmé"""
        return self.state == TrackState.CONFIRMED
    
    def is_deleted(self) -> bool:
        """Vérifie si le track est supprimé"""
        return self.state == TrackState.DELETED
    
    def is_tentative(self) -> bool:
        """Vérifie si le track est tentative"""
        return self.state == TrackState.TENTATIVE
    
    def get_latest_detection(self) -> Optional[Detection]:
        """Retourne la dernière détection"""
        return self.detections[-1] if self.detections else None
    
    def get_trajectory(self) -> List[Tuple[int, int]]:
        """
        Retourne la trajectoire du track
        
        Returns:
            Liste des positions (x, y)
        """
        return list(self.positions)
    
    def get_average_velocity(self) -> Tuple[float, float]:
        """
        Calcule la vélocité moyenne
        
        Returns:
            Vélocité moyenne (vx, vy)
        """
        if len(self.velocities) == 0:
            return (0.0, 0.0)
        
        avg_vx = sum(v[0] for v in self.velocities) / len(self.velocities)
        avg_vy = sum(v[1] for v in self.velocities) / len(self.velocities)
        
        return (avg_vx, avg_vy)
    
    def get_speed(self) -> float:
        """
        Calcule la vitesse (magnitude de la vélocité)
        
        Returns:
            Vitesse en pixels/frame
        """
        vx, vy = self.get_average_velocity()
        return np.sqrt(vx**2 + vy**2)
    
    def get_duration(self) -> float:
        """
        Retourne la durée du track en secondes
        
        Returns:
            Durée en secondes
        """
        return time.time() - self.created_at
    
    def to_dict(self) -> Dict:
        """
        Convertit le track en dictionnaire
        
        Returns:
            Dictionnaire représentant le track
        """
        latest_detection = self.get_latest_detection()
        
        return {
            "track_id": self.track_id,
            "state": self.state,
            "hits": self.hits,
            "age": self.age,
            "time_since_update": self.time_since_update,
            "duration": self.get_duration(),
            "speed": self.get_speed(),
            "trajectory_length": len(self.positions),
            "latest_detection": latest_detection.to_dict() if latest_detection else None,
            "predicted_position": self.predict_position()
        }


class Tracker:
    """
    Tracker principal pour gérer tous les tracks
    """
    def __init__(self, max_age: int = 30, min_hits: int = 3, iou_threshold: float = 0.3):
        """
        Initialise le tracker
        
        Args:
            max_age: Nombre max de frames sans mise à jour avant suppression
            min_hits: Nombre min de détections pour confirmer un track
            iou_threshold: Seuil IoU pour associer détection et track
        """
        self.max_age = max_age
        self.min_hits = min_hits
        self.iou_threshold = iou_threshold
        
        self.tracks: List[Track] = []
        self.next_track_id: int = 0
        self.frame_count: int = 0
    
    def update(self, detections: List[Detection]) -> List[Track]:
        """
        Met à jour le tracker avec de nouvelles détections
        
        Args:
            detections: Liste des détections du frame actuel
            
        Returns:
            Liste des tracks actifs (confirmés)
        """
        self.frame_count += 1
        
        # Associer les détections aux tracks existants
        matched_tracks, unmatched_detections = self._associate_detections_to_tracks(detections)
        
        # Mettre à jour les tracks matchés
        for track_idx, detection in matched_tracks:
            self.tracks[track_idx].update(detection)
        
        # Marquer les tracks non matchés comme ratés
        unmatched_track_indices = set(range(len(self.tracks))) - set(idx for idx, _ in matched_tracks)
        for idx in unmatched_track_indices:
            self.tracks[idx].mark_missed()
        
        # Créer de nouveaux tracks pour les détections non matchées
        for detection in unmatched_detections:
            new_track = Track(
                track_id=self.next_track_id,
                initial_detection=detection,
                max_age=self.max_age,
                min_hits=self.min_hits
            )
            self.tracks.append(new_track)
            self.next_track_id += 1
        
        # Incrémenter l'âge de tous les tracks
        for track in self.tracks:
            track.increment_age()
        
        # Supprimer les tracks marqués comme deleted
        self.tracks = [t for t in self.tracks if not t.is_deleted()]
        
        # Retourner uniquement les tracks confirmés
        return [t for t in self.tracks if t.is_confirmed()]
    
    def _associate_detections_to_tracks(self, detections: List[Detection]) -> Tuple[List[Tuple[int, Detection]], List[Detection]]:
        """
        Associe les détections aux tracks existants en utilisant l'IoU
        
        Args:
            detections: Liste des détections à associer
            
        Returns:
            Tuple (matched_tracks, unmatched_detections)
            - matched_tracks: Liste de (track_index, detection)
            - unmatched_detections: Liste des détections non associées
        """
        if len(self.tracks) == 0:
            return [], detections
        
        if len(detections) == 0:
            return [], []
        
        # Matrice IoU entre tracks et détections
        iou_matrix = np.zeros((len(self.tracks), len(detections)))
        
        for t_idx, track in enumerate(self.tracks):
            last_detection = track.get_latest_detection()
            if last_detection is None:
                continue
            
            for d_idx, detection in enumerate(detections):
                iou_matrix[t_idx, d_idx] = last_detection.bbox.iou(detection.bbox)
        
        # Association gloutonne (greedy matching)
        matched_tracks = []
        matched_detection_indices = set()
        
        # Trier les paires par IoU décroissant
        track_det_pairs = []
        for t_idx in range(len(self.tracks)):
            for d_idx in range(len(detections)):
                if iou_matrix[t_idx, d_idx] >= self.iou_threshold:
                    track_det_pairs.append((t_idx, d_idx, iou_matrix[t_idx, d_idx]))
        
        track_det_pairs.sort(key=lambda x: x[2], reverse=True)
        
        matched_track_indices = set()
        
        for t_idx, d_idx, _ in track_det_pairs:
            if t_idx not in matched_track_indices and d_idx not in matched_detection_indices:
                matched_tracks.append((t_idx, detections[d_idx]))
                matched_track_indices.add(t_idx)
                matched_detection_indices.add(d_idx)
        
        # Détections non matchées
        unmatched_detections = [
            detections[i] for i in range(len(detections)) 
            if i not in matched_detection_indices
        ]
        
        return matched_tracks, unmatched_detections
    
    def get_all_tracks(self) -> List[Track]:
        """Retourne tous les tracks (confirmés et tentatives)"""
        return self.tracks
    
    def get_confirmed_tracks(self) -> List[Track]:
        """Retourne uniquement les tracks confirmés"""
        return [t for t in self.tracks if t.is_confirmed()]
    
    def get_track_by_id(self, track_id: int) -> Optional[Track]:
        """
        Récupère un track par son ID
        
        Args:
            track_id: ID du track
            
        Returns:
            Track correspondant ou None
        """
        for track in self.tracks:
            if track.track_id == track_id:
                return track
        return None
    
    def get_tracks_count(self) -> Dict[str, int]:
        """
        Retourne le nombre de tracks par état
        
        Returns:
            Dictionnaire avec le compte par état
        """
        counts = {
            TrackState.TENTATIVE: 0,
            TrackState.CONFIRMED: 0,
            TrackState.DELETED: 0
        }
        
        for track in self.tracks:
            counts[track.state] += 1
        
        return counts
    
    def reset(self):
        """Réinitialise le tracker"""
        self.tracks = []
        self.next_track_id = 0
        self.frame_count = 0
    
    def to_dict(self) -> Dict:
        """Convertit le tracker en dictionnaire"""
        return {
            "frame_count": self.frame_count,
            "total_tracks": len(self.tracks),
            "confirmed_tracks": len(self.get_confirmed_tracks()),
            "tracks_count": self.get_tracks_count(),
            "tracks": [t.to_dict() for t in self.get_confirmed_tracks()]
        }


class PersonTracker(Tracker):
    """
    Tracker spécialisé pour le suivi de personnes
    """
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.person_attributes: Dict[int, Dict] = {}  # Attributs par track_id
    
    def update(self, detections: List[PersonDetection]) -> List[Track]:
        """
        Met à jour avec des détections de personnes
        
        Args:
            detections: Liste de PersonDetection
            
        Returns:
            Liste des tracks de personnes confirmés
        """
        return super().update(detections)
    
    def set_person_attribute(self, track_id: int, attribute: str, value):
        """
        Définit un attribut pour une personne trackée
        
        Args:
            track_id: ID du track
            attribute: Nom de l'attribut
            value: Valeur de l'attribut
        """
        if track_id not in self.person_attributes:
            self.person_attributes[track_id] = {}
        
        self.person_attributes[track_id][attribute] = value
    
    def get_person_attribute(self, track_id: int, attribute: str):
        """
        Récupère un attribut d'une personne
        
        Args:
            track_id: ID du track
            attribute: Nom de l'attribut
            
        Returns:
            Valeur de l'attribut ou None
        """
        return self.person_attributes.get(track_id, {}).get(attribute)
    
    def identify_speaker(self) -> Optional[int]:
        """
        Identifie la personne qui parle
        Basé sur les attributs is_speaking
        
        Returns:
            track_id de la personne qui parle, ou None
        """
        for track_id, attributes in self.person_attributes.items():
            if attributes.get('is_speaking', False):
                return track_id
        return None


print("✅ Module tracking.py chargé")