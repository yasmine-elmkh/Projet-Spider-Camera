# Spider Camera– Applications en Studio Talk

## 📌 Contexte

Dans les studios de production audiovisuelle modernes (talk-shows, émissions en direct, webinaires), le contrôle manuel des caméras nécessite 
un opérateur dédié. Cela entraîne plusieurs problèmes :

- Augmentation des coûts de production (salaires, formation)
- Limitation de la réactivité lors de scènes dynamiques avec plusieurs intervenants
- Réduction de la qualité du cadrage lors de mouvements rapides
- Complexité de gestion de plusieurs angles simultanés

## 🎯 Problématique

Comment automatiser le cadrage d’une caméra dans un studio avec plusieurs intervenants et différentes situations, tout en conservant :

- Un suivi précis de la personne qui parle
- Des transitions fluides entre plans larges et plans serrés
- La possibilité de contrôle manuel si nécessaire

## 💡 Solution proposée

Le projet **Spider Camera** propose un système intelligent combinant :

- Détection automatique de personnes et reconnaissance faciale
- Suivi temps réel de la personne qui parle
- Contrôle 3D d’une caméra spider motorisée
- Tableau de bord interactif pour gérer modes automatiques et manuels
- Visualisation 3D du studio et des participants
- Architecture modulaire pour faciliter les améliorations futures

---

## 🏗️ Structure du projet

Le projet est divisé en deux parties principales :

1. **Frontend** – interface utilisateur, visualisation, contrôle
2. **Backend** – traitement vidéo, détection, suivi, reconnaissance faciale

Pour comprendre en détail chaque composant, voir :

- `frontend/README.md`
- `backend/README.md`

---

## ⚡ Instructions générales pour lancer le projet

1. **Cloner le projet :**
```bash
git clone https://github.com/yasmine-elmkh/Projet-Spider-Camera.git
cd spider-camera
Installer les dépendances pour le backend :

cd backend
pip install -r requirements.txt
Installer les dépendances pour le frontend :

cd frontend
npm install

Lancer le backend :
uvicorn main:app --reload

Lancer le frontend :
npm ren dev
