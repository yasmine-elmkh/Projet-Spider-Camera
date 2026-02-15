/**
 * Hook personnalisé pour gérer la caméra
 * Centralise la logique de contrôle de la caméra
 */

import { useState, useEffect, useCallback } from 'react'
import { cameraAPI } from '../services/api'

export const useCamera = () => {
  // États
  const [status, setStatus] = useState({
    active: false,
    mode: 'manual',
    position: { x: 0, y: 2.5, z: 0 },
    detected_persons: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Récupère le statut de la caméra
   */
  const fetchStatus = useCallback(async () => {
    try {
      const response = await cameraAPI.getStatus()
      setStatus(response.data)
      setError(null)
    } catch (err) {
      setError('Impossible de récupérer le statut de la caméra')
      console.error(err)
    }
  }, [])

  /**
   * Démarre la caméra
   */
  const start = useCallback(async () => {
    setLoading(true)
    try {
      await cameraAPI.start()
      await fetchStatus()
      setError(null)
    } catch (err) {
      setError('Impossible de démarrer la caméra')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [fetchStatus])

  /**
   * Arrête la caméra
   */
  const stop = useCallback(async () => {
    setLoading(true)
    try {
      await cameraAPI.stop()
      await fetchStatus()
      setError(null)
    } catch (err) {
      setError('Impossible d\'arrêter la caméra')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [fetchStatus])

  /**
   * Change le mode de la caméra
   */
  const setMode = useCallback(async (mode) => {
    setLoading(true)
    try {
      await cameraAPI.setMode(mode)
      await fetchStatus()
      setError(null)
    } catch (err) {
      setError(`Impossible de changer vers le mode ${mode}`)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [fetchStatus])

  /**
   * Déplace la caméra
   */
  const setPosition = useCallback(async (x, y, z) => {
    setLoading(true)
    try {
      await cameraAPI.setPosition(x, y, z)
      await fetchStatus()
      setError(null)
    } catch (err) {
      setError('Impossible de déplacer la caméra')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [fetchStatus])

  /**
   * Applique un preset
   */
  const applyPreset = useCallback(async (presetName) => {
    setLoading(true)
    try {
      await cameraAPI.applyPreset(presetName)
      await fetchStatus()
      setError(null)
    } catch (err) {
      setError(`Impossible d'appliquer le preset ${presetName}`)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [fetchStatus])

  // Récupérer le statut initial
  useEffect(() => {
    fetchStatus()
    
    // Mettre à jour le statut régulièrement
    const interval = setInterval(fetchStatus, 5000) // Toutes les 5 secondes
    
    return () => clearInterval(interval)
  }, [fetchStatus])

  return {
    status,
    loading,
    error,
    start,
    stop,
    setMode,
    setPosition,
    applyPreset,
    refresh: fetchStatus,
  }
}

export default useCamera