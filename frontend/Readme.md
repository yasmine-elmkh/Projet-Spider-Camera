# Frontend – Spider Camera

## Objectif :
 Fournir l’interface utilisateur pour visualiser le flux vidéo, contrôler la caméra
 spider, suivre les intervenants et afficher un tableau de bord interactif.

## Composants principaux


### App.jsx
 - Gère l’état global de l’application (caméra, détection, connexion WebSocket)
 - Établit la connexion WebSocket pour recevoir les données temps réel
 - Coordonne les appels API vers le backend
 - Passe les props aux composants enfants
 - Point central pour la communication entre backend et frontend

### Dashboard.jsx
 - Affiche le statut de la caméra (position, mode)
 - Nombre de personnes détectées et visages reconnus
 - FPS moyen et autres statistiques en temps réel
 - Contient graphiques avec Recharts pour visualiser performance et évolution du nombre de personnes
 - Sections : Header, StatCards, Graphiques, Infos

### VideoStream.jsx
 - Affiche le flux vidéo en temps réel via WebSocket
 - Transforme les frames JPEG reçues en images HTML
 - Calcule le FPS en temps réel pour affichage sur le dashboard
 - Peut inclure overlay de bounding box pour personnes et visages

### StudioLayout.jsx
 - Visualisation 3D du studio et de la caméra spider
 - Affiche les personnes détectées avec repères 3D
 - Utilise Three.js avec @react-three/fiber et @react-three/drei
 - Contrôles interactifs avec OrbitControls
 - Permet de simuler les mouvements de caméra dans le studio

### PersonTracker.jsx
 - Liste des participants détectés et des visages reconnus
 - Affichage compact ou détaillé
 - Informations : Bounding box, confiance, taille, coordonnées
 - Permet de vérifier qui est suivi par le système

### CameraControl.jsx
 - Permet le contrôle manuel de la caméra
 - Modifie les coordonnées X, Y, Z et les presets
 - Sélection des modes automatiques : manual, speaker, group, wide

### SettingsPanel.jsx
 - Gestion des paramètres de détection, reconnaissance faciale et caméra
 - Sliders pour sensibilité, toggles pour activer/désactiver certaines fonctions
 - Formulaire pour enregistrer de nouveaux visages ou ajuster paramètres avancés

## Instructions pour lancer le frontend
 1. Installer les dépendances
    npm install
 2. Lancer le serveur frontend
   npm start