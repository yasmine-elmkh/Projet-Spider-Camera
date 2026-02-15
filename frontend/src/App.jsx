import React, { useState, useEffect } from 'react'
import { Camera, Activity, Users, Settings, Video } from 'lucide-react'

// Import des composants
import VideoStream from './components/VideoStream'
import CameraControl from './components/CameraControl'
import PersonTracker from './components/PersonTracker'
import Dashboard from './components/Dashboard'
import StudioLayout from './components/StudioLayout'
import SettingsPanel from './components/SettingsPanel'

// Import des services
import { connectWebSocket, disconnectWebSocket } from './services/websocket'
import api from './services/api'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [cameraStatus, setCameraStatus] = useState({
    active: false,
    mode: 'manual',
    position: { x: 0, y: 2.5, z: 0 },
    detected_persons: 0
  })
  const [detectionData, setDetectionData] = useState({
    persons: [],
    faces: [],
    speaking_person: null
  })
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    console.log('🚀 Application démarrée')

    // Connecter WebSocket data
    try {
      connectWebSocket('data', (data) => {
        console.log('📊 Données reçues:', data)
        if (data && data.persons) {
          setDetectionData({
            persons: data.persons || [],
            faces: data.faces || [],
            speaking_person: data.speaking_person
          })
        }
      })
      setIsConnected(true)
    } catch (error) {
      console.error('❌ Erreur WebSocket:', error)
      setIsConnected(false)
    }

    fetchCameraStatus()

    return () => {
      disconnectWebSocket()
    }
  }, [])

  const fetchCameraStatus = async () => {
    try {
      const response = await api.get('/camera/status')
      console.log('📹 Status:', response.data)
      setCameraStatus(response.data)
      setIsConnected(true)
    } catch (error) {
      console.error('❌ Erreur status:', error)
      setIsConnected(false)
    }
  }

  const handleStartCamera = async () => {
    try {
      console.log('▶️ Démarrage caméra...')
      const response = await api.post('/camera/start')
      console.log('✅ Réponse:', response.data)
      await fetchCameraStatus()
    } catch (error) {
      console.error('❌ Erreur démarrage:', error)
      alert('Erreur: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleStopCamera = async () => {
    try {
      console.log('⏹️ Arrêt caméra...')
      await api.post('/camera/stop')
      await fetchCameraStatus()
    } catch (error) {
      console.error('❌ Erreur arrêt:', error)
    }
  }

  const handleModeChange = async (mode) => {
    try {
      console.log('🔄 Changement mode:', mode)
      await api.post(`/camera/mode/${mode}`)
      await fetchCameraStatus()
    } catch (error) {
      console.error('❌ Erreur mode:', error)
    }
  }

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: Activity },
    { id: 'live', name: 'Live View', icon: Video },
    { id: 'control', name: 'Contrôle', icon: Camera },
    { id: 'tracking', name: 'Suivi', icon: Users },
    { id: 'settings', name: 'Paramètres', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Camera className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-xl font-bold text-white">Spider Camera</h1>
                <p className="text-xs text-gray-400">Studio Control</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={isConnected ? 'w-2 h-2 bg-green-500 rounded-full animate-pulse' : 'w-2 h-2 bg-red-500 rounded-full'} />
                <span className="text-sm text-gray-300">
                  {isConnected ? 'Connecté' : 'Déconnecté'}
                </span>
              </div>

              {cameraStatus.active ? (
                <button onClick={handleStopCamera} className="btn-danger btn-sm">
                  Arrêter
                </button>
              ) : (
                <button onClick={handleStartCamera} className="btn-success btn-sm">
                  Démarrer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    console.log('📍 Navigation vers:', tab.id)
                    setActiveTab(tab.id)
                  }}
                  className={`
                    flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm
                    ${isActive
                      ? 'border-blue-500 text-blue-500'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            cameraStatus={cameraStatus}
            detectionData={detectionData}
            onStartCamera={handleStartCamera}
            onStopCamera={handleStopCamera}
          />
        )}

        {activeTab === 'live' && (
          <div className="space-y-6">
            <VideoStream isActive={cameraStatus.active} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <StudioLayout
                  cameraPosition={cameraStatus.position || { x: 0, y: 2.5, z: 0 }}
                  persons={detectionData.persons || []}
                />
              </div>
              <div>
                <PersonTracker persons={detectionData.persons || []} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'control' && (
          <CameraControl
            status={cameraStatus}
            onModeChange={handleModeChange}
            onPositionChange={fetchCameraStatus}
          />
        )}

        {activeTab === 'tracking' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PersonTracker persons={detectionData.persons || []} detailed />
            <div className="card">
              <h3 className="card-header">Visages</h3>
              <div className="space-y-4">
                {detectionData.faces && detectionData.faces.length > 0 ? (
                  detectionData.faces.map((face, index) => (
                    <div key={index} className="p-4 bg-gray-700 rounded-lg">
                      <p className="font-medium">{face.name || 'Inconnu'}</p>
                      <p className="text-sm text-gray-400">
                        {(face.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8">Aucun visage</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && <SettingsPanel />}
      </main>
    </div>
  )
}

export default App