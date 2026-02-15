import React, { useState } from 'react'
import { Camera, Move, Mic, Users, Maximize2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../services/api'

const CameraControl = ({ status, onModeChange, onPositionChange }) => {
  const [manualPosition, setManualPosition] = useState({
    x: status?.position?.x || 0,
    y: status?.position?.y || 2.5,
    z: status?.position?.z || 0
  })

  const modes = [
    {
      id: 'manual',
      name: 'Manuel',
      icon: Move,
      description: 'Contrôle manuel complet'
    },
    {
      id: 'speaker',
      name: 'Orateur',
      icon: Mic,
      description: 'Suit la personne qui parle'
    },
    {
      id: 'group',
      name: 'Groupe',
      icon: Users,
      description: 'Cadre toutes les personnes'
    },
    {
      id: 'wide',
      name: 'Large',
      icon: Maximize2,
      description: 'Plan large du studio'
    }
  ]

  const presets = [
    { name: 'Plan Large', position: { x: 0, y: 3.0, z: -4.0 } },
    { name: 'Plan Moyen', position: { x: 0, y: 2.5, z: -2.5 } },
    { name: 'Gros Plan', position: { x: 0, y: 2.0, z: -1.5 } },
    { name: 'Vue Dessus', position: { x: 0, y: 3.8, z: 0 } }
  ]

  const moveCamera = async (axis, direction) => {
    const step = 0.5
    const newPosition = { ...manualPosition }
    
    if (axis === 'x') {
      newPosition.x += direction * step
    } else if (axis === 'y') {
      newPosition.y += direction * step
    } else if (axis === 'z') {
      newPosition.z += direction * step
    }

    // Appliquer les limites
    newPosition.x = Math.max(-5, Math.min(5, newPosition.x))
    newPosition.y = Math.max(1, Math.min(4, newPosition.y))
    newPosition.z = Math.max(-5, Math.min(5, newPosition.z))

    try {
      await api.post(`/camera/position?x=${newPosition.x}&y=${newPosition.y}&z=${newPosition.z}`)
      setManualPosition(newPosition)
      onPositionChange()
    } catch (error) {
      console.error('Erreur déplacement:', error)
    }
  }

  const applyManualPosition = async () => {
    try {
      await api.post(`/camera/position?x=${manualPosition.x}&y=${manualPosition.y}&z=${manualPosition.z}`)
      onPositionChange()
    } catch (error) {
      console.error('Erreur application position:', error)
    }
  }

  const handlePresetClick = async (preset) => {
    try {
      await api.post(`/camera/position?x=${preset.position.x}&y=${preset.position.y}&z=${preset.position.z}`)
      setManualPosition(preset.position)
      onPositionChange()
    } catch (error) {
      console.error('Erreur preset:', error)
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
            const isActive = status?.mode === mode.id

            return (
              <button
                key={mode.id}
                onClick={() => onModeChange(mode.id)}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${isActive
                    ? 'border-blue-500 bg-blue-500 bg-opacity-20'
                    : 'border-gray-600 hover:border-gray-500'
                  }
                `}
              >
                <Icon className={`w-8 h-8 mx-auto mb-2 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                <h4 className="font-semibold text-white mb-1">{mode.name}</h4>
                <p className="text-sm text-gray-400">{mode.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Contrôles directionnels (seulement en mode manuel) */}
      {status?.mode === 'manual' && (
        <div className="card">
          <h3 className="card-header">Contrôles Directionnels</h3>
          
          <div className="grid grid-cols-3 gap-6">
            {/* Contrôle Hauteur (Y) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3 text-center">
                Hauteur (Y)
              </label>
              <div className="flex flex-col items-center space-y-2">
                <button
                  onClick={() => moveCamera('y', 1)}
                  className="btn-primary p-3"
                >
                  <ChevronUp className="w-6 h-6" />
                </button>
                <div className="text-2xl font-bold text-white py-2">
                  {manualPosition.y.toFixed(1)}m
                </div>
                <button
                  onClick={() => moveCamera('y', -1)}
                  className="btn-primary p-3"
                >
                  <ChevronDown className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Contrôle Horizontal (X) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3 text-center">
                Horizontal (X)
              </label>
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => moveCamera('x', -1)}
                  className="btn-primary p-3"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="text-2xl font-bold text-white px-4">
                  {manualPosition.x.toFixed(1)}m
                </div>
                <button
                  onClick={() => moveCamera('x', 1)}
                  className="btn-primary p-3"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Contrôle Profondeur (Z) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3 text-center">
                Profondeur (Z)
              </label>
              <div className="flex flex-col items-center space-y-2">
                <button
                  onClick={() => moveCamera('z', 1)}
                  className="btn-primary p-3"
                >
                  <ChevronUp className="w-6 h-6" />
                </button>
                <div className="text-2xl font-bold text-white py-2">
                  {manualPosition.z.toFixed(1)}m
                </div>
                <button
                  onClick={() => moveCamera('z', -1)}
                  className="btn-primary p-3"
                >
                  <ChevronDown className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Position manuelle */}
      {status?.mode === 'manual' && (
        <div className="card">
          <h3 className="card-header">Position Manuelle</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Position X (Gauche/Droite)
              </label>
              <input
                type="number"
                step="0.1"
                min="-5"
                max="5"
                value={manualPosition.x}
                onChange={(e) => setManualPosition({ ...manualPosition, x: parseFloat(e.target.value) })}
                className="input"
              />
              <p className="text-xs text-gray-400 mt-1">Limite: -5m à +5m</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Position Y (Hauteur)
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="4"
                value={manualPosition.y}
                onChange={(e) => setManualPosition({ ...manualPosition, y: parseFloat(e.target.value) })}
                className="input"
              />
              <p className="text-xs text-gray-400 mt-1">Limite: 1m à 4m</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Position Z (Avant/Arrière)
              </label>
              <input
                type="number"
                step="0.1"
                min="-5"
                max="5"
                value={manualPosition.z}
                onChange={(e) => setManualPosition({ ...manualPosition, z: parseFloat(e.target.value) })}
                className="input"
              />
              <p className="text-xs text-gray-400 mt-1">Limite: -5m à +5m</p>
            </div>
          </div>

          <button onClick={applyManualPosition} className="btn-primary w-full mt-4">
            Appliquer la Position
          </button>
        </div>
      )}

      {/* Positions prédéfinies */}
      <div className="card">
        <h3 className="card-header">Positions Prédéfinies</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {presets.map((preset, index) => (
            <button
              key={index}
              onClick={() => handlePresetClick(preset)}
              className="btn-secondary"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Position actuelle */}
      <div className="card">
        <h3 className="card-header">Position Actuelle</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">X</p>
            <p className="text-2xl font-bold text-blue-400">
              {status?.position?.x?.toFixed(2) || '0.00'}m
            </p>
          </div>
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Y</p>
            <p className="text-2xl font-bold text-green-400">
              {status?.position?.y?.toFixed(2) || '0.00'}m
            </p>
          </div>
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Z</p>
            <p className="text-2xl font-bold text-purple-400">
              {status?.position?.z?.toFixed(2) || '0.00'}m
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CameraControl