/**
 * Composant Dashboard - Vue d'ensemble du système
 * Affiche les statistiques, le statut et les graphiques
 */

import React, { useState, useEffect } from 'react'
import { 
  Camera, 
  Activity, 
  Users, 
  Zap, 
  TrendingUp,
  Clock,
  Video,
  Target
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { analyticsAPI } from '../services/api'

const Dashboard = ({ cameraStatus, detectionData, onStartCamera, onStopCamera }) => {
  const [analytics, setAnalytics] = useState(null)
  const [performanceData, setPerformanceData] = useState([])

  // Charger les analytics au montage
  useEffect(() => {
    loadAnalytics()
    
    // Rafraîchir toutes les 5 secondes
    const interval = setInterval(loadAnalytics, 5000)
    return () => clearInterval(interval)
  }, [])

  /**
   * Charge les analytics depuis l'API
   */
  const loadAnalytics = async () => {
    try {
      const response = await analyticsAPI.get()
      setAnalytics(response.data)
      
      // Simuler des données de performance pour le graphique
      // Dans un vrai système, ces données viendraient de l'API
      setPerformanceData(prev => {
        const newData = {
          time: new Date().toLocaleTimeString(),
          fps: response.data.fps || 0,
          persons: detectionData.persons?.length || 0,
          cpu: Math.random() * 100
        }
        
        return [...prev.slice(-20), newData] // Garder les 20 derniers points
      })
    } catch (error) {
      console.error('Erreur chargement analytics:', error)
    }
  }

  // Cartes de statistiques
  const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <Icon className={`w-5 h-5 text-${color}-500`} />
            <p className="text-sm text-gray-400">{title}</p>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-400">{subtitle}</p>
          )}
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-${trend > 0 ? 'green' : 'red'}-500 text-sm`}>
            <TrendingUp className="w-4 h-4" />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header avec actions rapides */}
      <div className="card bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Tableau de Bord Spider Camera
            </h2>
            <p className="text-blue-100">
              Système de caméra intelligente pour studio talk
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {cameraStatus.active ? (
              <>
                <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white font-medium">En Direct</span>
                </div>
                <button onClick={onStopCamera} className="btn-danger">
                  Arrêter
                </button>
              </>
            ) : (
              <button onClick={onStartCamera} className="btn-success btn-lg">
                <Video className="w-5 h-5 mr-2" />
                Démarrer la Caméra
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Camera}
          title="Statut Caméra"
          value={cameraStatus.active ? 'Active' : 'Inactive'}
          subtitle={cameraStatus.active ? `Mode: ${cameraStatus.mode}` : 'Démarrez la caméra'}
          color={cameraStatus.active ? 'green' : 'red'}
        />
        
        <StatCard
          icon={Users}
          title="Personnes Détectées"
          value={detectionData.persons?.length || 0}
          subtitle="En temps réel"
          color="blue"
        />
        
        <StatCard
          icon={Target}
          title="Visages Reconnus"
          value={detectionData.faces?.length || 0}
          subtitle="Reconnaissance active"
          color="purple"
        />
        
        <StatCard
          icon={Zap}
          title="FPS Moyen"
          value={analytics?.fps?.toFixed(1) || '0.0'}
          subtitle="Images par seconde"
          color="yellow"
          trend={5}
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique Performance */}
        <div className="card">
          <h3 className="card-header">Performance en Temps Réel</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9CA3AF"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="fps" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={false}
                name="FPS"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Graphique Détections */}
        <div className="card">
          <h3 className="card-header">Nombre de Personnes</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9CA3AF"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="persons" 
                stroke="#8B5CF6" 
                fill="#8B5CF6"
                fillOpacity={0.3}
                name="Personnes"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Informations détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Position Caméra */}
        <div className="card">
          <h3 className="card-header">Position Caméra</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
              <span className="text-gray-300">X (Horizontal)</span>
              <span className="font-mono font-bold">{cameraStatus.position?.x?.toFixed(2) || '0.00'}m</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
              <span className="text-gray-300">Y (Hauteur)</span>
              <span className="font-mono font-bold">{cameraStatus.position?.y?.toFixed(2) || '0.00'}m</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
              <span className="text-gray-300">Z (Profondeur)</span>
              <span className="font-mono font-bold">{cameraStatus.position?.z?.toFixed(2) || '0.00'}m</span>
            </div>
          </div>
        </div>

        {/* Statistiques Session */}
        <div className="card">
          <h3 className="card-header">Session Actuelle</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">Durée</span>
              </div>
              <span className="font-bold">
                {analytics?.uptime ? Math.floor(analytics.uptime / 60) : 0} min
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">Total Détections</span>
              </div>
              <span className="font-bold">{analytics?.total_persons_detected || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">Mouvements</span>
              </div>
              <span className="font-bold">{analytics?.camera_movements || 0}</span>
            </div>
          </div>
        </div>

        {/* Mode et État */}
        <div className="card">
          <h3 className="card-header">État du Système</h3>
          <div className="space-y-3">
            <div className="p-3 bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Mode Actuel</p>
              <p className="text-lg font-bold text-white capitalize">{cameraStatus.mode}</p>
            </div>
            <div className="p-3 bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Détection</p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-lg font-bold text-green-500">Active</p>
              </div>
            </div>
            <div className="p-3 bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Reconnaissance Faciale</p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-lg font-bold text-green-500">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alertes et Notifications */}
      {!cameraStatus.active && (
        <div className="card bg-yellow-900 bg-opacity-20 border-2 border-yellow-600">
          <div className="flex items-start space-x-3">
            <Activity className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-yellow-500 mb-1">Caméra Inactive</h4>
              <p className="text-gray-300 text-sm">
                La caméra n'est pas démarrée. Cliquez sur "Démarrer la Caméra" pour commencer 
                la détection et le suivi des personnes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard