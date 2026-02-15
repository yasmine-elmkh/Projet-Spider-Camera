/**
 * Service API pour communiquer avec le backend FastAPI
 * Gère toutes les requêtes HTTP
 */

import axios from 'axios'

// Configuration de base de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Créer une instance axios avec configuration par défaut
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000, // 10 secondes
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur pour les requêtes (pour logger ou ajouter des headers)
api.interceptors.request.use(
  (config) => {
    console.log(`📤 ${config.method.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('❌ Erreur de requête:', error)
    return Promise.reject(error)
  }
)

// Intercepteur pour les réponses (pour gérer les erreurs globalement)
api.interceptors.response.use(
  (response) => {
    console.log(`📥 Réponse de ${response.config.url}:`, response.status)
    return response
  },
  (error) => {
    if (error.response) {
      // Le serveur a répondu avec un code d'erreur
      console.error(`❌ Erreur ${error.response.status}:`, error.response.data)
    } else if (error.request) {
      // La requête a été envoyée mais pas de réponse
      console.error('❌ Pas de réponse du serveur')
    } else {
      // Erreur lors de la configuration de la requête
      console.error('❌ Erreur:', error.message)
    }
    return Promise.reject(error)
  }
)

/**
 * Services API organisés par fonctionnalité
 */

// ============================================================================
// CAMERA
// ============================================================================

export const cameraAPI = {
  /**
   * Démarre la caméra
   */
  start: () => api.post('/camera/start'),

  /**
   * Arrête la caméra
   */
  stop: () => api.post('/camera/stop'),

  /**
   * Récupère le statut de la caméra
   */
  getStatus: () => api.get('/camera/status'),

  /**
   * Change le mode de la caméra
   * @param {string} mode - manual, speaker, group, wide
   */
  setMode: (mode) => api.post(`/camera/mode/${mode}`),

  /**
   * Déplace la caméra à une position
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {number} z - Position Z
   */
  setPosition: (x, y, z) => api.post('/camera/position', null, {
    params: { x, y, z }
  }),

  /**
   * Récupère les presets de caméra
   */
  getPresets: () => api.get('/camera/presets'),

  /**
   * Applique un preset
   * @param {string} presetName - Nom du preset
   */
  applyPreset: (presetName) => api.post(`/camera/preset/${presetName}`),

  /**
   * Récupère les limites de mouvement
   */
  getLimits: () => api.get('/camera/limits'),
}

// ============================================================================
// DETECTION
// ============================================================================

export const detectionAPI = {
  /**
   * Récupère les personnes détectées
   */
  getPersons: () => api.get('/detection/persons'),

  /**
   * Récupère les visages détectés
   */
  getFaces: () => api.get('/detection/faces'),

  /**
   * Récupère les statistiques de détection
   */
  getStats: () => api.get('/detection/stats'),

  /**
   * Configure la sensibilité de détection
   * @param {number} personThreshold - Seuil pour personnes (0-1)
   * @param {number} faceThreshold - Seuil pour visages (0-1)
   */
  setSensitivity: (personThreshold, faceThreshold) => 
    api.post('/detection/sensitivity', null, {
      params: { person_threshold: personThreshold, face_threshold: faceThreshold }
    }),
}

// ============================================================================
// FACES
// ============================================================================

export const facesAPI = {
  /**
   * Liste tous les visages enregistrés
   */
  list: () => api.get('/faces/list'),

  /**
   * Enregistre un nouveau visage
   * @param {string} name - Nom de la personne
   * @param {File} imageFile - Fichier image
   */
  register: (name, imageFile) => {
    const formData = new FormData()
    formData.append('image', imageFile)
    
    return api.post(`/faces/register?name=${encodeURIComponent(name)}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  /**
   * Supprime un visage enregistré
   * @param {string} name - Nom de la personne
   */
  delete: (name) => api.delete(`/faces/${name}`),

  /**
   * Active/désactive la reconnaissance faciale
   * @param {boolean} enabled - True pour activer
   */
  toggleRecognition: (enabled) => 
    api.get('/faces/recognition/toggle', {
      params: { enabled }
    }),
}

// ============================================================================
// ANALYTICS
// ============================================================================

export const analyticsAPI = {
  /**
   * Récupère les analytics généraux
   */
  get: () => api.get('/analytics'),

  /**
   * Récupère les analytics de la session
   */
  getSession: () => api.get('/analytics/session'),

  /**
   * Récupère les métriques de performance
   */
  getPerformance: () => api.get('/analytics/performance'),

  /**
   * Exporte les analytics
   * @param {string} format - json ou csv
   */
  export: (format = 'json') => 
    api.get('/analytics/export', {
      params: { format }
    }),
}

// Export par défaut de l'instance axios pour requêtes personnalisées
export default api