/**
 * Service WebSocket pour la communication en temps réel
 * Gère les connexions WebSocket pour le streaming vidéo et les données
 */

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

// Stockage des connexions WebSocket
let videoSocket = null
let dataSocket = null

// Callbacks
const callbacks = {
  video: [],
  data: [],
  error: [],
  close: [],
}

/**
 * Connecte au WebSocket
 * @param {string} type - 'video' ou 'data'
 * @param {Function} onMessage - Callback pour les messages reçus
 */
export const connectWebSocket = (type, onMessage) => {
  const wsUrl = `${WS_BASE_URL}/ws/${type}`
  let socket

  if (type === 'video') {
    videoSocket = new WebSocket(wsUrl)
    socket = videoSocket
    socket.binaryType = 'arraybuffer'
  } else if (type === 'data') {
    dataSocket = new WebSocket(wsUrl)
    socket = dataSocket
  }

  socket.onopen = () => {
    console.log(`✅ WebSocket ${type} connecté`)
  }

  socket.onmessage = (event) => {
    if (type === 'video') {
      const blob = new Blob([event.data], { type: 'image/jpeg' })
      const imageUrl = URL.createObjectURL(blob)
      onMessage(imageUrl)
    } else if (type === 'data') {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (error) {
        console.error('❌ Erreur parsing JSON:', error)
      }
    }
  }

  socket.onerror = (error) => {
    console.error(`❌ WebSocket ${type} erreur:`, error)
    callbacks.error.forEach(cb => cb(error))
  }

  socket.onclose = () => {
    console.log(`🔌 WebSocket ${type} déconnecté`)
    callbacks.close.forEach(cb => cb(type))
  }

  return socket
}

/**
 * Démarre la caméra côté backend
 */
export const startCamera = () => {
  if (!dataSocket || dataSocket.readyState !== WebSocket.OPEN) {
    console.error('❌ WebSocket data non connecté')
    return false
  }
  console.log('🎬 Demande démarrage caméra...')
  dataSocket.send(JSON.stringify({ action: 'start_camera' }))
  return true
}

/**
 * Arrête la caméra côté backend
 */
export const stopCamera = () => {
  if (!dataSocket || dataSocket.readyState !== WebSocket.OPEN) {
    console.error('❌ WebSocket data non connecté')
    return false
  }
  console.log('⏹️ Demande arrêt caméra...')
  dataSocket.send(JSON.stringify({ action: 'stop_camera' }))
  return true
}

/**
 * Déconnexion
 */
export const disconnectWebSocket = (type) => {
  if (!type || type === 'video') {
    if (videoSocket) {
      videoSocket.close()
      videoSocket = null
    }
  }
  if (!type || type === 'data') {
    if (dataSocket) {
      dataSocket.close()
      dataSocket = null
    }
  }
}

/**
 * Vérifie si connecté
 */
export const isConnected = (type) => {
  const socket = type === 'video' ? videoSocket : dataSocket
  return socket && socket.readyState === WebSocket.OPEN
}

/**
 * Reconnexion automatique
 */
export const autoReconnect = (type, onMessage, maxRetries = 5) => {
  let retries = 0
  const connect = () => {
    const socket = connectWebSocket(type, onMessage)
    socket.onclose = () => {
      if (retries < maxRetries) {
        retries++
        console.log(`🔄 Reconnexion ${retries}/${maxRetries}...`)
        setTimeout(connect, 2000 * retries)
      } else console.error('❌ Max retries reached')
    }
    socket.onopen = () => { retries = 0 }
  }
  connect()
}



export default {
  connectWebSocket,
  disconnectWebSocket,
  startCamera,
  stopCamera,
  isConnected,
  autoReconnect,
}