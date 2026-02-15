/**
 * Composant pour afficher le stream vidéo en temps réel
 * Utilise WebSocket pour recevoir les frames
 */

import React, { useEffect, useRef, useState } from 'react'
import { Camera, AlertCircle, Wifi, WifiOff, Loader } from 'lucide-react'

const VideoStream = ({ isActive }) => {
  const imgRef = useRef(null)
  const wsRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [frameCount, setFrameCount] = useState(0)
  const [fps, setFps] = useState(0)
  const [error, setError] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const lastFrameTime = useRef(Date.now())
  const fpsInterval = useRef(null)

  useEffect(() => {
  console.log("VideoStream mounted - isActive:", isActive)

  if (!isActive) {

      // Fermer la connexion si la caméra est inactive
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      setIsConnected(false)
      setError("Caméra arrêtée")
      setFrameCount(0)
      setFps(0)
      return
    }

    // Démarrer la connexion WebSocket
    connectWebSocket()

    // Cleanup
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (fpsInterval.current) {
        clearInterval(fpsInterval.current)
      }
    }
  }, [isActive])

  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('WebSocket déjà connecté')
      return
    }

    setIsConnecting(true)
    setError(null)

    const wsUrl = 'ws://localhost:8000/ws/video'
    console.log('📹 Connexion au stream vidéo:', wsUrl)

    try {
      const ws = new WebSocket(wsUrl)
      ws.binaryType = 'arraybuffer'

      ws.onopen = () => {
        console.log('✅ WebSocket vidéo connecté')
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)

        // Calculer FPS toutes les secondes
        fpsInterval.current = setInterval(() => {
          const now = Date.now()
          const elapsed = (now - lastFrameTime.current) / 1000
          if (elapsed > 0) {
            setFps(Math.round(frameCount / elapsed))
          }
        }, 1000)
      }

      ws.onmessage = (event) => {
        try {
          // Créer un blob depuis les données binaires
          const blob = new Blob([event.data], { type: 'image/jpeg' })
          const imageUrl = URL.createObjectURL(blob)

          // Afficher l'image
          if (imgRef.current) {
            // Libérer l'ancienne URL
            if (imgRef.current.src && imgRef.current.src.startsWith('blob:')) {
              URL.revokeObjectURL(imgRef.current.src)
            }
            
            imgRef.current.src = imageUrl
            setFrameCount(prev => prev + 1)
            lastFrameTime.current = Date.now()
          }
        } catch (err) {
          console.error('Erreur traitement frame:', err)
        }
      }

      ws.onerror = (error) => {
        console.error('❌ Erreur WebSocket vidéo:', error)
        setError('Erreur de connexion au stream vidéo')
        setIsConnected(false)
        setIsConnecting(false)
      }

      ws.onclose = () => {
        console.log('🔌 WebSocket vidéo fermé')
        setIsConnected(false)
        setIsConnecting(false)
        
        // Réessayer de se connecter après 2 secondes si la caméra est active
        if (isActive) {
          setTimeout(() => {
            console.log('🔄 Tentative de reconnexion...')
            connectWebSocket()
          }, 2000)
        }
      }

      wsRef.current = ws
    } catch (err) {
      console.error('Erreur création WebSocket:', err)
      setError(err.message)
      setIsConnecting(false)
    }
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Camera className="w-6 h-6 text-blue-500" />
          <h2 className="card-header mb-0">Stream Vidéo en Direct</h2>
        </div>
        
        {/* Indicateurs de statut */}
        <div className="flex items-center space-x-4">
          {/* Connexion */}
          <div className="flex items-center space-x-2">
            {isConnecting ? (
              <>
                <Loader className="w-4 h-4 text-yellow-500 animate-spin" />
                <span className="text-sm text-yellow-500">Connexion...</span>
              </>
            ) : isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">Connecté</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-500">Déconnecté</span>
              </>
            )}
          </div>
          
          {/* FPS */}
          {isConnected && (
            <>
              <div className="badge-info">
                {fps} FPS
              </div>
              <div className="text-sm text-gray-400">
                Frames: {frameCount}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Zone vidéo */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
        {/* Image du stream */}
        <img
          ref={imgRef}
          alt="Video Stream"
          className={`w-full h-full object-contain ${isConnected ? 'block' : 'hidden'}`}
          style={{ maxHeight: '600px' }}
        />
        
        {/* Overlay LIVE */}
        {isConnected && (
          <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600 bg-opacity-90 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">LIVE</span>
          </div>
        )}
        
        {/* Messages d'état */}
        {!isConnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            {error ? (
              <>
                <AlertCircle className="w-16 h-16 mb-4 text-red-500" />
                <p className="text-lg font-medium text-red-500">Erreur</p>
                <p className="text-sm mt-2 text-center px-4">{error}</p>
                {isActive && (
                  <button
                    onClick={connectWebSocket}
                    className="btn-primary mt-4"
                  >
                    Réessayer
                  </button>
                )}
              </>
            ) : isConnecting ? (
              <>
                <Loader className="w-16 h-16 mb-4 animate-spin text-blue-500" />
                <p className="text-lg font-medium">Connexion au stream...</p>
                <p className="text-sm mt-2">Veuillez patienter</p>
              </>
            ) : !isActive ? (
              <>
                <Camera className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Caméra arrêtée</p>
                <p className="text-sm mt-2">Démarrez la caméra pour voir le stream</p>
              </>
            ) : (
              <>
                <Wifi className="w-16 h-16 mb-4 animate-pulse" />
                <p className="text-lg font-medium">En attente du stream...</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Informations supplémentaires */}
      {isConnected && (
        <div className="mt-4 p-4 bg-gray-700 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Résolution</p>
              <p className="font-medium">
                {imgRef.current?.naturalWidth || 0} x {imgRef.current?.naturalHeight || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-400">FPS Actuel</p>
              <p className="font-medium">{fps}</p>
            </div>
            <div>
              <p className="text-gray-400">Total Frames</p>
              <p className="font-medium">{frameCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Debug info */}
      <div className="mt-4 p-3 bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg">
        <p className="text-sm text-blue-300">
          <strong>💡 Debug:</strong> WebSocket URL: ws://localhost:8000/ws/video
          {isActive && ' | Caméra active'}
          {isConnected && ' | Stream connecté'}
        </p>
      </div>
    </div>
  )
}

export default VideoStream