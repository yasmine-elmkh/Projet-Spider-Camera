# Backend – Spider Camera
# Objectif :
 Traiter la vidéo, effectuer la détection, le suivi et la reconnaissance faciale, contrôler la caméra et exposer les données via API/WebSocket.

## Composants principaux

### main.py
 - Point d’entrée du backend
 - Initialise le serveur FastAPI
 - Déclare toutes les routes API et WebSocket
 - Gère les connexions multiples pour la diffusion des flux vidéo et données de tracking

### camera_controller.py
 - Interface avec la caméra motorisée spider
 - Implémente les mouvements automatiques et les presets
 - Reçoit les commandes depuis le frontend via API/WebSocket
 - Calcule les positions X, Y, Z et ajuste le mouvement pour un cadrage fluide

### detector.py
 - Détecte les personnes dans le flux vidéo
 - Calcule les bounding boxes et probabilités de détection
 - Optimisé pour traitement temps réel

### face_recognition.py
 - Reconnaissance faciale des participants
 - Gestion de l’enregistrement des visages
 - Identification en temps réel des intervenants
 - Renvoie les informations de confiance et de position pour affichage frontend

### tracker.py
 - Maintient l’ID unique de chaque personne d’une frame à l’autre
 - Gère le suivi multi-personnes
 - Permet de garder la cohérence même lorsque des personnes se croisent

### utils.py
 - Fonctions utilitaires
 - Traitement d’image, conversion, logs, calcul FPS
 - Gestion des erreurs et messages pour le frontend

### config.py
 - Contient les paramètres du projet
 - FPS, seuils de détection, ports API/WebSocket, presets caméra
 - Paramètres de tuning pour détection et reconnaissance faciale

## Instructions pour lancer le backend

 1. Installer les dépendances
    pip install -r requirements.txt
 2. Lancer le serveur backend
    uvicorn main:app --reload
 3. Le backend est accessible sur http://localhost:8000 par défaut
 4. Les WebSockets sont utilisés pour envoyer les frames vidéo et informations temps réel au frontend
