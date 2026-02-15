/**
 * Composant pour afficher les personnes détectées
 * Montre les informations de détection et de tracking
 */

import React, { useState } from 'react'
import { Users, User, Target, Activity, Eye } from 'lucide-react'

const PersonTracker = ({ persons, detailed = false }) => {
  const [selectedPerson, setSelectedPerson] = useState(null)

  /**
   * Calcule la couleur selon la confiance
   */
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-500'
    if (confidence >= 0.6) return 'text-yellow-500'
    return 'text-red-500'
  }

  /**
   * Calcule la taille relative d'une personne
   */
  const getPersonSize = (person) => {
    const area = person.area || 0
    if (area > 100000) return 'Grande'
    if (area > 50000) return 'Moyenne'
    return 'Petite'
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Users className="w-6 h-6 text-purple-500" />
          <h3 className="card-header mb-0">Suivi des Personnes</h3>
        </div>
        <div className="badge-info">
          {persons.length} {persons.length === 1 ? 'personne' : 'personnes'}
        </div>
      </div>

      {/* Liste des personnes */}
      {persons && persons.length > 0 ? (
        <div className="space-y-3">
          {persons.map((person) => (
            <div
              key={person.id}
              onClick={() => setSelectedPerson(selectedPerson === person.id ? null : person.id)}
              className={`
                p-4 rounded-lg border-2 cursor-pointer transition-all
                ${selectedPerson === person.id
                  ? 'border-purple-500 bg-purple-500 bg-opacity-10'
                  : 'border-gray-600 hover:border-gray-500'
                }
              `}
            >
              {/* Vue compacte */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-500 bg-opacity-20 p-2 rounded-full">
                    <User className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">
                      Personne {person.id}
                    </h4>
                    <p className="text-sm text-gray-400">
                      Confiance: 
                      <span className={`ml-1 font-medium ${getConfidenceColor(person.confidence)}`}>
                        {(person.confidence * 100).toFixed(1)}%
                      </span>
                    </p>
                  </div>
                </div>

                {/* Position */}
                <div className="text-right">
                  <p className="text-xs text-gray-400">Position</p>
                  <p className="text-sm font-mono text-white">
                    ({person.center.x}, {person.center.y})
                  </p>
                </div>
              </div>

              {/* Détails étendus (si sélectionné et mode détaillé) */}
              {detailed && selectedPerson === person.id && (
                <div className="mt-4 pt-4 border-t border-gray-600 space-y-3">
                  {/* Bounding Box */}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-4 h-4 text-gray-400" />
                      <p className="text-sm font-medium text-gray-300">Bounding Box</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-gray-700 p-2 rounded">
                        <span className="text-gray-400">x1:</span> {person.bbox.x1}
                      </div>
                      <div className="bg-gray-700 p-2 rounded">
                        <span className="text-gray-400">y1:</span> {person.bbox.y1}
                      </div>
                      <div className="bg-gray-700 p-2 rounded">
                        <span className="text-gray-400">x2:</span> {person.bbox.x2}
                      </div>
                      <div className="bg-gray-700 p-2 rounded">
                        <span className="text-gray-400">y2:</span> {person.bbox.y2}
                      </div>
                    </div>
                  </div>

                  {/* Taille */}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Activity className="w-4 h-4 text-gray-400" />
                      <p className="text-sm font-medium text-gray-300">Informations</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-700 p-2 rounded">
                        <p className="text-xs text-gray-400">Taille</p>
                        <p className="text-sm font-medium">{getPersonSize(person)}</p>
                      </div>
                      <div className="bg-gray-700 p-2 rounded">
                        <p className="text-xs text-gray-400">Surface</p>
                        <p className="text-sm font-medium">{Math.round(person.area || 0)} px²</p>
                      </div>
                    </div>
                  </div>

                  {/* Barre de confiance */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400">Niveau de confiance</span>
                      <span className={getConfidenceColor(person.confidence)}>
                        {(person.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          person.confidence >= 0.8 ? 'bg-green-500' :
                          person.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${person.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Message si aucune personne */
        <div className="text-center py-12">
          <Eye className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" />
          <p className="text-gray-400 text-lg font-medium">Aucune personne détectée</p>
          <p className="text-gray-500 text-sm mt-2">
            Les personnes apparaîtront ici une fois détectées
          </p>
        </div>
      )}

      {/* Statistiques */}
      {persons && persons.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-400">Total</p>
              <p className="text-2xl font-bold text-white">{persons.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Confiance Moy.</p>
              <p className="text-2xl font-bold text-white">
                {persons.length > 0
                  ? (persons.reduce((acc, p) => acc + p.confidence, 0) / persons.length * 100).toFixed(0)
                  : 0
                }%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Tracking</p>
              <p className="text-2xl font-bold text-green-500">Actif</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PersonTracker