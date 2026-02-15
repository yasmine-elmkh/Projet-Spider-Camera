"""
Service de contrôle de la caméra spider
Gère les mouvements, positions et modes automatiques
"""

import numpy as np
from typing import Dict, Tuple, List
import time
import math

class CameraController:
    def __init__(self):
        """
        Initialise le contrôleur de caméra
        """
        # Position actuelle de la caméra (x, y, z) en mètres
        # x: gauche-droite, y: hauteur, z: avant-arrière
        self.current_position = {"x": 0.0, "y": 2.5, "z": 0.0}
        
        # Position cible (pour transitions fluides)
        self.target_position = {"x": 0.0, "y": 2.5, "z": 0.0}
        
        # Orientation de la caméra (angles en degrés)
        self.current_orientation = {"pan": 0.0, "tilt": 0.0, "roll": 0.0}
        
        # Mode actuel: manual, speaker, group, wide
        self.mode = "manual"
        
        # Dimensions du studio (en mètres)
        self.studio_bounds = {
            "x_min": -5.0, "x_max": 5.0,
            "y_min": 1.0, "y_max": 4.0,
            "z_min": -5.0, "z_max": 5.0
        }
        
        # Vitesse de déplacement (m/s)
        self.movement_speed = 0.5
        
        # Historique des mouvements
        self.movement_count = 0
        self.position_history = []
        
        # Timestamp du dernier mouvement
        self.last_move_time = time.time()
        
        print("✅ CameraController initialisé")
    
    def set_mode(self, mode: str):
        """
        Change le mode de fonctionnement de la caméra
        
        Args:
            mode: 'manual', 'speaker', 'group', ou 'wide'
        """
        valid_modes = ["manual", "speaker", "group", "wide"]
        if mode in valid_modes:
            self.mode = mode
            print(f"📹 Mode changé vers: {mode}")
            
            # Appliquer le preset de position selon le mode
            if mode == "wide":
                self.move_to_position(0.0, 3.0, -4.0)
            elif mode == "group":
                self.move_to_position(0.0, 2.5, -2.5)
    
    def move_to_position(self, x: float, y: float, z: float):
        """
        Déplace la caméra vers une position spécifique
        Avec vérification des limites du studio
        
        Args:
            x: Position horizontale (gauche-droite)
            y: Hauteur
            z: Profondeur (avant-arrière)
        """
        # Vérifier que la position est dans les limites du studio
        x = np.clip(x, self.studio_bounds["x_min"], self.studio_bounds["x_max"])
        y = np.clip(y, self.studio_bounds["y_min"], self.studio_bounds["y_max"])
        z = np.clip(z, self.studio_bounds["z_min"], self.studio_bounds["z_max"])
        
        # Définir la position cible
        self.target_position = {"x": x, "y": y, "z": z}
        
        # Pour la simulation, on déplace instantanément
        # Dans un vrai système, il y aurait une transition fluide
        self.current_position = self.target_position.copy()
        
        # Mettre à jour les statistiques
        self.movement_count += 1
        self.last_move_time = time.time()
        self.position_history.append({
            "position": self.current_position.copy(),
            "timestamp": self.last_move_time
        })
        
        print(f"📍 Caméra déplacée vers: x={x:.2f}, y={y:.2f}, z={z:.2f}")
    
    def get_current_position(self) -> Dict[str, float]:
        """
        Retourne la position actuelle de la caméra
        """
        return self.current_position.copy()
    
    def calculate_optimal_position(self, persons: List[Dict]) -> Tuple[float, float, float]:
        """
        Calcule la position optimale de la caméra selon les personnes détectées
        
        Args:
            persons: Liste des personnes détectées avec leurs positions
        
        Returns:
            Tuple (x, y, z) de la position optimale
        """
        if not persons:
            # Si aucune personne, revenir au centre
            return (0.0, 2.5, -3.0)
        
        if self.mode == "speaker":
            # Mode speaker: centrer sur la personne qui parle (la plus au centre)
            # On simule en prenant la première personne
            person = persons[0]
            # Convertir la position dans le frame en position dans le studio
            # (ceci est une simulation, dans la réalité il faudrait une calibration)
            x = (person["center"]["x"] - 640) / 640 * 3  # Normaliser
            return (x, 2.5, -2.0)
        
        elif self.mode == "group":
            # Mode group: cadrer toutes les personnes
            # Calculer le centre de gravité
            avg_x = sum(p["center"]["x"] for p in persons) / len(persons)
            x = (avg_x - 640) / 640 * 3
            
            # Distance selon le nombre de personnes
            z = -2.0 - (len(persons) * 0.3)
            z = max(z, -4.0)  # Limiter la distance
            
            return (x, 2.5, z)
        
        elif self.mode == "wide":
            # Mode wide: plan large fixe
            return (0.0, 3.0, -4.0)
        
        else:  # manual
            # En mode manuel, garder la position actuelle
            return (self.current_position["x"], 
                   self.current_position["y"], 
                   self.current_position["z"])
    
    def update_for_persons(self, persons: List[Dict]):
        """
        Met à jour la position de la caméra selon les personnes détectées
        (utilisé en mode automatique)
        
        Args:
            persons: Liste des personnes détectées
        """
        if self.mode != "manual":
            # Calculer la position optimale
            x, y, z = self.calculate_optimal_position(persons)
            
            # Déplacer la caméra (avec un seuil pour éviter trop de micro-mouvements)
            current_x = self.current_position["x"]
            current_z = self.current_position["z"]
            
            # Ne bouger que si le changement est significatif (> 10cm)
            if abs(x - current_x) > 0.1 or abs(z - current_z) > 0.1:
                self.move_to_position(x, y, z)
    
    def get_movement_count(self) -> int:
        """
        Retourne le nombre de mouvements effectués
        """
        return self.movement_count
    
    def get_cable_lengths(self) -> Dict[str, float]:
        """
        Calcule les longueurs des câbles pour la position actuelle
        (simulation d'une vraie caméra spider avec 4 câbles)
        
        Returns:
            Dictionnaire avec les longueurs des 4 câbles
        """
        # Points d'ancrage des câbles (coins du studio au plafond)
        anchors = {
            "cable_1": {"x": -5.0, "y": 4.0, "z": -5.0},  # Coin arrière-gauche
            "cable_2": {"x": 5.0, "y": 4.0, "z": -5.0},   # Coin arrière-droit
            "cable_3": {"x": 5.0, "y": 4.0, "z": 5.0},    # Coin avant-droit
            "cable_4": {"x": -5.0, "y": 4.0, "z": 5.0}    # Coin avant-gauche
        }
        
        cable_lengths = {}
        
        # Calculer la distance entre chaque ancrage et la caméra
        for cable_name, anchor in anchors.items():
            dx = self.current_position["x"] - anchor["x"]
            dy = self.current_position["y"] - anchor["y"]
            dz = self.current_position["z"] - anchor["z"]
            
            # Distance euclidienne (théorème de Pythagore en 3D)
            length = math.sqrt(dx**2 + dy**2 + dz**2)
            cable_lengths[cable_name] = round(length, 2)
        
        return cable_lengths
    
    def get_camera_info(self) -> Dict:
        """
        Retourne toutes les informations sur la caméra
        """
        return {
            "position": self.current_position,
            "orientation": self.current_orientation,
            "mode": self.mode,
            "cable_lengths": self.get_cable_lengths(),
            "movement_count": self.movement_count,
            "last_move": self.last_move_time
        }