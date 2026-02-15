/**
 * Composant de contrôle de la caméra
 * Permet de changer le mode, la position et les paramètres
 */

import React, { useState, useEffect } from 'react'
import { 
  Camera, 
  Move, 
  Maximize2, 
  Users, 
  Mic, 
  Grid,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cameraAPI } from '../services/api'

const CameraControl = ({ status, onModeChange, onPositionChange }) => {
  // États locaux
  const [position, setPosition] = useState({ x: 0, y: 2.5, z: 0 })
  const [presets, setPresets] = useState({})
  const [limits, setLimits] = useState(null)
  const [loading, setLoading] = useState(false)

  // Modes disponibles
  const modes = [
    { 
      id: 'manual', 
      name: 'Manuel', 
      icon: Move, 
      description: 'Contrôle manuel de la caméra',
      color: 'blue'
    },
    { 
      id: 'speaker', 
      name: 'Orateur', 
      icon: Mic, 
      description: 'Suit automatiquement la personne qui parle',
      color: 'green'
    },
    { 
      id: 'group', 
      name: 'Groupe', 
      icon: Users, 
      description: 'Cadre toutes les personnes présentes',
      color: 'purple'
    },
    { 
      id: 'wide', 
      name: 'Large', 
      icon: Maximize2, 
      description: 'Plan large fixe du studio',
      color: 'orange'
    },
  ]

  // Charger les presets et limites au montage
  useEffect(() => {
    loadPresets()
    loadLimits()
  }, [])

  // Mettre à jour la position locale quand le status change
  useEffect(() => {
    if (status.position) {
      setPosition(status.position)
    }
  }, [status])

  /**
   * Charge les presets depuis l'API
   */
  const loadPresets = async () => {
    try {
      const response = await cameraAPI.getPresets()
      setPresets(response.data.presets)
    } catch (error) {
      console.error('Erreur chargement presets:', error)
    }
  }

  /**
   * Charge les limites de mouvement
   */
  const loadLimits = async () => {
    try {
      const response = await cameraAPI.getLimits()
      setLimits(response.data.limits)
    } catch (error) {
      console.error('Erreur chargement limites:', error)
    }
  }

  /**
   * Applique un preset
   */
  const handlePresetClick = async (presetName) => {
    setLoading(true)
    try {
      await cameraAPI.applyPreset(presetName)
      onPositionChange()
    } catch (error) {
      console.error('Erreur application preset:', error)
      alert('Erreur lors de l\'application du preset')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Déplace la caméra avec les contrôles directionnels
   */
  const moveCamera = async (axis, direction) => {
    const step = 0.5 // Pas de déplacement en mètres
    const newPosition = { ...position }

    // Calculer la nouvelle position
    if (axis === 'x') {
      newPosition.x += direction * step
    } else if (axis === 'y') {
      newPosition.y += direction * step
    } else if (axis === 'z') {
      newPosition.z += direction * step
    }

    // Vérifier les limites si disponibles
    if (limits) {
      newPosition.x = Math.max(limits.x.min, Math.min(limits.x.max, newPosition.x))
      newPosition.y = Math.max(limits.y.min, Math.min(limits.y.max, newPosition.y))
      newPosition.z = Math.max(limits.z.min, Math.min(limits.z.max, newPosition.z))
    }

    // Appliquer la nouvelle position
    setPosition(newPosition)
    
    try {
      await cameraAPI.setPosition(newPosition.x, newPosition.y, newPosition.z)
      onPositionChange()
    } catch (error) {
      console.error('Erreur déplacement caméra:', error)
    }
  }

  /**
   * Met à jour une position via input
   */
  const handlePositionInputChange = (axis, value) => {
    const newPosition = { ...position, [axis]: parseFloat(value) || 0 }
    setPosition(newPosition)
  }

  /**
   * Applique la position des inputs
   */
  const applyManualPosition = async () => {
    setLoading(true)
    try {
      await cameraAPI.setPosition(position.x, position.y, position.z)
      onPositionChange()
    } catch (error) {
      console.error('Erreur application position:', error)
      alert('Erreur lors du déplacement de la caméra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Sélection du mode */}
      <div className="card">
        <h3 className="card-header">Mode de Caméra</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modes.map((mode) => {
            const Icon = mode.icon
            const isActive = status.mode === mode.id
            
            return (
              <button
                key={mode.id}
                onClick={() => onModeChange(mode.id)}
                disabled={loading}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200
                  ${isActive
                    ? `border-${mode.color}-500 bg-${mode.color}-500 bg-opacity-10`
                    : 'border-gray-600 hover:border-gray-500'
                  }
                  ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <Icon 
                    className={`w-8 h-8 ${isActive ? `text-${mode.color}-500` : 'text-gray-400'}`}
                  />
                  <div>
                    <h4 className="font-semibold text-white">{mode.name}</h4>
                    <p className="text-xs text-gray-400 mt-1">{mode.description}</p>
                  </div>
                  {isActive && (
                    <span className="badge-success">Actif</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Contrôles de position (en mode manuel) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contrôles directionnels */}
        <div className="card">
          <h3 className="card-header">Contrôles Directionnels</h3>
          
          {status.mode === 'manual' ? (
            <div className="space-y-6">
              {/* Contrôle Hauteur (Y) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Hauteur (Y)
                </label>
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => moveCamera('y', -1)}
                    className="btn-secondary p-4"
                    disabled={loading}
                  >
                    <ChevronDown className="w-6 h-6" />
                  </button>
                  <span className="text-2xl font-bold w-24 text-center">
                    {position.y.toFixed(1)}m
                  </span>
                  <button
                    onClick={() => moveCamera('y', 1)}
                    className="btn-secondary p-4"
                    disabled={loading}
                  >
                    <ChevronUp className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Contrôle Horizontal (X) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Gauche/Droite (X)
                </label>
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => moveCamera('x', -1)}
                    className="btn-secondary p-4"
                    disabled={loading}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <span className="text-2xl font-bold w-24 text-center">
                    {position.x.toFixed(1)}m
                  </span>
                  <button
                    onClick={() => moveCamera('x', 1)}
                    className="btn-secondary p-4"
                    disabled={loading}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Contrôle Profondeur (Z) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Avant/Arrière (Z)
                </label>
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => moveCamera('z', 1)}
                    className="btn-secondary p-4"
                    disabled={loading}
                  >
                    <ChevronUp className="w-6 h-6" />
                  </button>
                  <span className="text-2xl font-bold w-24 text-center">
                    {position.z.toFixed(1)}m
                  </span>
                  <button
                    onClick={() => moveCamera('z', -1)}
                    className="btn-secondary p-4"
                    disabled={loading}
                  >
                    <ChevronDown className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Grid className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Les contrôles directionnels sont disponibles</p>
              <p className="text-sm">uniquement en mode Manuel</p>
            </div>
          )}
        </div>

        {/* Position manuelle */}
        <div className="card">
          <h3 className="card-header">Position Manuelle</h3>
          
          <div className="space-y-4">
            {/* Input X */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Position X (gauche/droite)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.1"
                  value={position.x}
                  onChange={(e) => handlePositionInputChange('x', e.target.value)}
                  className="input"
                  disabled={loading || status.mode !== 'manual'}
                />
                <span className="text-gray-400">m</span>
              </div>
              {limits && (
                <p className="text-xs text-gray-500 mt-1">
                  Limite: {limits.x.min}m à {limits.x.max}m
                </p>
              )}
            </div>

            {/* Input Y */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Position Y (hauteur)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.1"
                  value={position.y}
                  onChange={(e) => handlePositionInputChange('y', e.target.value)}
                  className="input"
                  disabled={loading || status.mode !== 'manual'}
                />
                <span className="text-gray-400">m</span>
              </div>
              {limits && (
                <p className="text-xs text-gray-500 mt-1">
                  Limite: {limits.y.min}m à {limits.y.max}m
                </p>
              )}
            </div>

            {/* Input Z */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Position Z (profondeur)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.1"
                  value={position.z}
                  onChange={(e) => handlePositionInputChange('z', e.target.value)}
                  className="input"
                  disabled={loading || status.mode !== 'manual'}
                />
                <span className="text-gray-400">m</span>
              </div>
              {limits && (
                <p className="text-xs text-gray-500 mt-1">
                  Limite: {limits.z.min}m à {limits.z.max}m
                </p>
              )}
            </div>

            {/* Bouton appliquer */}
            <button
              onClick={applyManualPosition}
              disabled={loading || status.mode !== 'manual'}
              className="btn-primary w-full"
            >
              {loading ? 'Application...' : 'Appliquer la Position'}
            </button>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="card">
        <h3 className="card-header">Positions Prédéfinies (Presets)</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(presets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => handlePresetClick(key)}
              disabled={loading}
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
            >
              <h4 className="font-semibold text-white mb-1">{preset.name}</h4>
              <p className="text-xs text-gray-400 mb-2">{preset.description}</p>
              <div className="text-xs text-gray-500">
                <div>X: {preset.position.x}m</div>
                <div>Y: {preset.position.y}m</div>
                <div>Z: {preset.position.z}m</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Position actuelle */}
      <div className="card bg-gradient-to-r from-blue-900 to-purple-900">
        <h3 className="card-header">Position Actuelle de la Caméra</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-gray-300 text-sm mb-1">X (Horizontal)</p>
            <p className="text-3xl font-bold text-white">{status.position.x.toFixed(2)}m</p>
          </div>
          <div className="text-center">
            <p className="text-gray-300 text-sm mb-1">Y (Hauteur)</p>
            <p className="text-3xl font-bold text-white">{status.position.y.toFixed(2)}m</p>
          </div>
          <div className="text-center">
            <p className="text-gray-300 text-sm mb-1">Z (Profondeur)</p>
            <p className="text-3xl font-bold text-white">{status.position.z.toFixed(2)}m</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CameraControl