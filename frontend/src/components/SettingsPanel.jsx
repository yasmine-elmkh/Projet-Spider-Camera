/**
 * Composant SettingsPanel - Panneau de paramètres
 * Permet de configurer le système, la détection, la reconnaissance faciale, etc.
 */

import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  Camera, 
  Eye, 
  Users, 
  Sliders,
  Upload,
  Trash2,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { detectionAPI, facesAPI } from '../services/api'

const SettingsPanel = () => {
  // États
  const [activeSection, setActiveSection] = useState('detection')
  const [detectionSettings, setDetectionSettings] = useState({
    personThreshold: 0.5,
    faceThreshold: 0.5,
  })
  const [faceRecognitionEnabled, setFaceRecognitionEnabled] = useState(true)
  const [registeredFaces, setRegisteredFaces] = useState([])
  const [newFaceName, setNewFaceName] = useState('')
  const [newFaceImage, setNewFaceImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  // Charger les données au montage
  useEffect(() => {
    loadRegisteredFaces()
  }, [])

  /**
   * Charge la liste des visages enregistrés
   */
  const loadRegisteredFaces = async () => {
    try {
      const response = await facesAPI.list()
      setRegisteredFaces(response.data.faces || [])
    } catch (error) {
      console.error('Erreur chargement visages:', error)
    }
  }

  /**
   * Applique les paramètres de détection
   */
  const handleApplyDetectionSettings = async () => {
    setLoading(true)
    try {
      await detectionAPI.setSensitivity(
        detectionSettings.personThreshold,
        detectionSettings.faceThreshold
      )
      showMessage('success', 'Paramètres de détection appliqués avec succès')
    } catch (error) {
      showMessage('error', 'Erreur lors de l\'application des paramètres')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Réinitialise les paramètres par défaut
   */
  const handleResetDetectionSettings = () => {
    setDetectionSettings({
      personThreshold: 0.5,
      faceThreshold: 0.5,
    })
    showMessage('info', 'Paramètres réinitialisés aux valeurs par défaut')
  }

  /**
   * Gère le changement d'image pour l'enregistrement de visage
   */
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setNewFaceImage(file)
    }
  }

  /**
   * Enregistre un nouveau visage
   */
  const handleRegisterFace = async () => {
    if (!newFaceName || !newFaceImage) {
      showMessage('error', 'Veuillez remplir le nom et sélectionner une image')
      return
    }

    setLoading(true)
    try {
      await facesAPI.register(newFaceName, newFaceImage)
      showMessage('success', `Visage de ${newFaceName} enregistré avec succès`)
      
      // Réinitialiser le formulaire
      setNewFaceName('')
      setNewFaceImage(null)
      
      // Recharger la liste
      await loadRegisteredFaces()
    } catch (error) {
      showMessage('error', 'Erreur lors de l\'enregistrement du visage')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Supprime un visage enregistré
   */
  const handleDeleteFace = async (name) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le visage de ${name} ?`)) {
      return
    }

    setLoading(true)
    try {
      await facesAPI.delete(name)
      showMessage('success', `Visage de ${name} supprimé`)
      await loadRegisteredFaces()
    } catch (error) {
      showMessage('error', 'Erreur lors de la suppression')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Toggle reconnaissance faciale
   */
  const handleToggleFaceRecognition = async (enabled) => {
    setLoading(true)
    try {
      await facesAPI.toggleRecognition(enabled)
      setFaceRecognitionEnabled(enabled)
      showMessage('success', `Reconnaissance faciale ${enabled ? 'activée' : 'désactivée'}`)
    } catch (error) {
      showMessage('error', 'Erreur lors du changement')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Affiche un message
   */
  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  // Sections du panneau
  const sections = [
    { id: 'detection', name: 'Détection', icon: Eye },
    { id: 'faces', name: 'Visages', icon: Users },
    { id: 'camera', name: 'Caméra', icon: Camera },
    { id: 'advanced', name: 'Avancé', icon: Sliders },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="flex items-center space-x-3">
          <Settings className="w-8 h-8 text-white" />
          <div>
            <h2 className="text-2xl font-bold text-white">Paramètres</h2>
            <p className="text-purple-100">Configuration du système Spider Camera</p>
          </div>
        </div>
      </div>

      {/* Message de notification */}
      {message && (
        <div className={`
          card border-2 
          ${message.type === 'success' ? 'bg-green-900 bg-opacity-20 border-green-600' : ''}
          ${message.type === 'error' ? 'bg-red-900 bg-opacity-20 border-red-600' : ''}
          ${message.type === 'info' ? 'bg-blue-900 bg-opacity-20 border-blue-600' : ''}
        `}>
          <div className="flex items-center space-x-3">
            {message.type === 'success' && <CheckCircle className="w-6 h-6 text-green-500" />}
            {message.type === 'error' && <AlertCircle className="w-6 h-6 text-red-500" />}
            {message.type === 'info' && <AlertCircle className="w-6 h-6 text-blue-500" />}
            <p className="text-white">{message.text}</p>
          </div>
        </div>
      )}

      {/* Navigation sections */}
      <div className="card">
        <div className="flex space-x-2 overflow-x-auto">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap
                  transition-colors duration-200
                  ${activeSection === section.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{section.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Section Détection */}
      {activeSection === 'detection' && (
        <div className="card">
          <h3 className="card-header">Paramètres de Détection</h3>
          
          <div className="space-y-6">
            {/* Seuil détection personnes */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Seuil de Confiance - Détection de Personnes
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={detectionSettings.personThreshold}
                  onChange={(e) => setDetectionSettings({
                    ...detectionSettings,
                    personThreshold: parseFloat(e.target.value)
                  })}
                  className="flex-1"
                />
                <span className="text-lg font-bold w-16 text-center">
                  {(detectionSettings.personThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Niveau minimum de confiance pour détecter une personne. 
                Plus élevé = moins de faux positifs mais peut manquer des détections.
              </p>
            </div>

            {/* Seuil détection visages */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Seuil de Confiance - Détection de Visages
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={detectionSettings.faceThreshold}
                  onChange={(e) => setDetectionSettings({
                    ...detectionSettings,
                    faceThreshold: parseFloat(e.target.value)
                  })}
                  className="flex-1"
                />
                <span className="text-lg font-bold w-16 text-center">
                  {(detectionSettings.faceThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Niveau minimum de confiance pour détecter un visage.
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center space-x-3 pt-4 border-t border-gray-700">
              <button
                onClick={handleApplyDetectionSettings}
                disabled={loading}
                className="btn-primary"
              >
                <Save className="w-4 h-4 mr-2" />
                Appliquer
              </button>
              <button
                onClick={handleResetDetectionSettings}
                disabled={loading}
                className="btn-secondary"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section Visages */}
      {activeSection === 'faces' && (
        <div className="space-y-6">
          {/* Toggle reconnaissance faciale */}
          <div className="card">
            <h3 className="card-header">Reconnaissance Faciale</h3>
            
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-white">Activer la reconnaissance faciale</p>
                <p className="text-sm text-gray-400">
                  Identifie automatiquement les personnes enregistrées
                </p>
              </div>
              <button
                onClick={() => handleToggleFaceRecognition(!faceRecognitionEnabled)}
                disabled={loading}
                className={`
                  relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                  ${faceRecognitionEnabled ? 'bg-blue-600' : 'bg-gray-600'}
                `}
              >
                <span
                  className={`
                    inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                    ${faceRecognitionEnabled ? 'translate-x-7' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          </div>

          {/* Enregistrer un nouveau visage */}
          <div className="card">
            <h3 className="card-header">Enregistrer un Nouveau Visage</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom de la personne
                </label>
                <input
                  type="text"
                  value={newFaceName}
                  onChange={(e) => setNewFaceName(e.target.value)}
                  placeholder="Ex: Jean Dupont"
                  className="input"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Photo du visage
                </label>
                <div className="flex items-center space-x-3">
                  <label className="btn-secondary cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Choisir une image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                  {newFaceImage && (
                    <span className="text-sm text-gray-400">
                      {newFaceImage.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Utilisez une photo claire du visage, de face, bien éclairée
                </p>
              </div>

              <button
                onClick={handleRegisterFace}
                disabled={loading || !newFaceName || !newFaceImage}
                className="btn-primary w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Enregistrement...' : 'Enregistrer le Visage'}
              </button>
            </div>
          </div>

          {/* Liste des visages enregistrés */}
          <div className="card">
            <h3 className="card-header">
              Visages Enregistrés ({registeredFaces.length})
            </h3>
            
            {registeredFaces.length > 0 ? (
              <div className="space-y-2">
                {registeredFaces.map((name, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium text-white">{name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteFace(name)}
                      disabled={loading}
                      className="btn-danger btn-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8">
                Aucun visage enregistré. Enregistrez des visages pour activer la reconnaissance.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Section Caméra */}
      {activeSection === 'camera' && (
        <div className="card">
          <h3 className="card-header">Paramètres Caméra</h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">Résolution</p>
              <p className="text-lg font-bold text-white">1280 x 720</p>
            </div>

            <div className="p-4 bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">FPS Cible</p>
              <p className="text-lg font-bold text-white">30 FPS</p>
            </div>

            <div className="p-4 bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">Format Vidéo</p>
              <p className="text-lg font-bold text-white">MJPEG</p>
            </div>

            <div className="p-4 bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>💡 Note:</strong> Les paramètres de caméra sont optimisés automatiquement. 
                Des options avancées seront disponibles dans une prochaine version.
              </p>
            </div>
          </div>
        </div>
      )}

    
        {/* Section Avancé */}
        {activeSection === 'advanced' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4">Paramètres Système</h3>
              
              <div className="space-y-4">
                {/* Mode Performance */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mode Performance
                  </label>
                  <select className="input">
                    <option>Qualité Maximale (Recommandé)</option>
                    <option>Équilibré</option>
                    <option>Performance Maximale</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-2">
                    Ajuste la qualité vidéo et la fréquence de détection
                  </p>
                </div>

                {/* FPS Cible */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    FPS Cible
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="15"
                      max="60"
                      step="5"
                      defaultValue={30}
                      className="flex-1"
                    />
                    <span className="text-lg font-bold w-16 text-center text-white">30</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Fréquence d'images par seconde (15-60 FPS)
                  </p>
                </div>

                {/* Qualité JPEG */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Qualité Compression JPEG
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="50"
                      max="100"
                      step="5"
                      defaultValue={85}
                      className="flex-1"
                    />
                    <span className="text-lg font-bold w-16 text-center text-white">85%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Plus élevé = meilleure qualité mais plus de bande passante
                  </p>
                </div>

                {/* Logging */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Niveau de Logging
                  </label>
                  <select className="input">
                    <option>Info (Recommandé)</option>
                    <option>Debug (Détaillé)</option>
                    <option>Warning (Minimal)</option>
                    <option>Error (Erreurs uniquement)</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-2">
                    Contrôle la verbosité des logs système
                  </p>
                </div>

                {/* Auto-restart */}
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-white">Redémarrage Automatique</p>
                    <p className="text-sm text-gray-400">
                      Redémarre la détection en cas d'erreur
                    </p>
                  </div>
                  <button className="relative inline-flex h-8 w-14 items-center rounded-full bg-blue-600">
                    <span className="inline-block h-6 w-6 transform rounded-full bg-white transition-transform translate-x-7" />
                  </button>
                </div>

                {/* Statistiques détaillées */}
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-white">Statistiques Détaillées</p>
                    <p className="text-sm text-gray-400">
                      Enregistre des métriques de performance avancées
                    </p>
                  </div>
                  <button className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-600">
                    <span className="inline-block h-6 w-6 transform rounded-full bg-white transition-transform translate-x-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Calibration Studio */}
            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4">Calibration Studio</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Largeur (m)
                    </label>
                    <input type="number" step="0.1" defaultValue={10} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Profondeur (m)
                    </label>
                    <input type="number" step="0.1" defaultValue={10} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Hauteur (m)
                    </label>
                    <input type="number" step="0.1" defaultValue={4} className="input" />
                  </div>
                </div>

                <button className="btn-primary w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer Calibration
                </button>
              </div>
            </div>

            {/* Actions système */}
            <div className="card border-2 border-yellow-700">
              <h3 className="text-lg font-bold text-yellow-500 mb-4">Zone Dangereuse</h3>
              
              <div className="space-y-3">
                <button className="btn-secondary w-full">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Réinitialiser Configuration
                </button>
                
                <button className="btn-secondary w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Effacer Historique
                </button>
                
                <button className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Réinitialisation Complète
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  )
}

export default SettingsPanel