import React, { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Box, Sphere, Cone, Text, Line } from '@react-three/drei'
import * as THREE from 'three'
import { Maximize2, Grid, RotateCcw } from 'lucide-react'

// Composant Caméra 3D
const CameraModel = ({ position }) => {
  const cameraRef = useRef()
  
  useFrame((state) => {
    if (cameraRef.current) {
      cameraRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  return (
    <group position={[position.x, position.y, position.z]} ref={cameraRef}>
      <Box args={[0.3, 0.2, 0.4]}>
        <meshStandardMaterial color="#2563eb" metalness={0.8} roughness={0.2} />
      </Box>
      <Cone args={[0.15, 0.3, 32]} position={[0, 0, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#1e40af" />
      </Cone>
      <Sphere args={[0.05]} position={[0, 0, 0.5]}>
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
      </Sphere>
      <Text position={[0, 0.4, 0]} fontSize={0.15} color="#ffffff">
        CAMERA
      </Text>
    </group>
  )
}

// Câbles spider
const SpiderCables = ({ cameraPosition }) => {
  const anchors = [
    [-5, 4, -5],
    [5, 4, -5],
    [5, 4, 5],
    [-5, 4, 5]
  ]

  return (
    <>
      {anchors.map((anchor, index) => (
        <React.Fragment key={index}>
          <Sphere args={[0.1]} position={anchor}>
            <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.5} />
          </Sphere>
          <Line
            points={[anchor, [cameraPosition.x, cameraPosition.y, cameraPosition.z]]}
            color="#8b5cf6"
            lineWidth={2}
          />
        </React.Fragment>
      ))}
    </>
  )
}

// Personne détectée
const PersonModel = ({ person, index }) => {
  const personRef = useRef()
  
  const x = ((person.center.x - 640) / 640) * 4
  const z = -2
  const y = 0.9
  
  useFrame((state) => {
    if (personRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.05
      personRef.current.scale.set(scale, scale, scale)
    }
  })

  return (
    <group position={[x, y, z]} ref={personRef}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 1.6, 16]} />
        <meshStandardMaterial 
          color="#10b981" 
          transparent 
          opacity={0.7}
          emissive="#10b981"
          emissiveIntensity={0.2}
        />
      </mesh>
      <Sphere args={[0.2]} position={[0, 1, 0]}>
        <meshStandardMaterial color="#059669" transparent opacity={0.8} />
      </Sphere>
      <mesh position={[0, -0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.4, 32]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.5} />
      </mesh>
      <Text position={[0, 2, 0]} fontSize={0.15} color="#ffffff" outlineWidth={0.01}>
        P{person.id}
      </Text>
      <Text position={[0, 1.7, 0]} fontSize={0.1} color="#10b981">
        {(person.confidence * 100).toFixed(0)}%
      </Text>
    </group>
  )
}

// Sol du studio
const StudioFloor = () => {
  return (
    <>
      <gridHelper args={[10, 10, '#4b5563', '#374151']} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#1f2937" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

// Murs
const StudioWalls = () => {
  return (
    <group>
      <mesh position={[0, 2, -5]} receiveShadow>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial color="#111827" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 4, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#0f172a" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// Axes
const CoordinateAxes = () => {
  return (
    <group>
      <Line points={[[0, 0, 0], [2, 0, 0]]} color="#ef4444" lineWidth={3} />
      <Text position={[2.3, 0, 0]} fontSize={0.2} color="#ef4444">X</Text>
      
      <Line points={[[0, 0, 0], [0, 2, 0]]} color="#10b981" lineWidth={3} />
      <Text position={[0, 2.3, 0]} fontSize={0.2} color="#10b981">Y</Text>
      
      <Line points={[[0, 0, 0], [0, 0, 2]]} color="#3b82f6" lineWidth={3} />
      <Text position={[0, 0, 2.3]} fontSize={0.2} color="#3b82f6">Z</Text>
    </group>
  )
}

// Composant principal
const StudioLayout = ({ cameraPosition = { x: 0, y: 2.5, z: 0 }, persons = [] }) => {
  const [showAxes, setShowAxes] = useState(true)
  const [autoRotate, setAutoRotate] = useState(false)
  const controlsRef = useRef()

  const resetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Maximize2 className="w-6 h-6 text-green-500" />
          <h3 className="text-xl font-bold">Vue 3D du Studio</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAxes(!showAxes)}
            className={`px-3 py-1.5 text-sm rounded-lg ${showAxes ? 'bg-blue-600' : 'bg-gray-700'}`}
            title="Axes"
          >
            <Grid className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1.5 text-sm rounded-lg ${autoRotate ? 'bg-blue-600' : 'bg-gray-700'}`}
            title="Auto-rotation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={resetView}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-700"
            title="Reset"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-gray-950 rounded-lg overflow-hidden" style={{ height: '500px' }}>
        <Canvas
          camera={{ position: [8, 6, 8], fov: 50 }}
          shadows
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
          <pointLight position={[-5, 5, -5]} intensity={0.3} color="#8b5cf6" />
          <pointLight position={[5, 5, 5]} intensity={0.3} color="#3b82f6" />

          <StudioFloor />
          <StudioWalls />
          
          {showAxes && <CoordinateAxes />}
          
          <SpiderCables cameraPosition={cameraPosition} />
          <CameraModel position={cameraPosition} />
          
          {persons && persons.map((person) => (
            <PersonModel key={person.id} person={person} index={person.id} />
          ))}

          <OrbitControls
            ref={controlsRef}
            autoRotate={autoRotate}
            autoRotateSpeed={2}
            minDistance={3}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2}
          />
        </Canvas>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-300">Caméra</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-300">Personnes</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-purple-500 rounded"></div>
          <span className="text-sm text-gray-300">Câbles</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-600 rounded"></div>
          <span className="text-sm text-gray-300">Studio</span>
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-700 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Position X</p>
            <p className="font-bold text-blue-400">{cameraPosition.x.toFixed(2)}m</p>
          </div>
          <div>
            <p className="text-gray-400">Position Y</p>
            <p className="font-bold text-green-400">{cameraPosition.y.toFixed(2)}m</p>
          </div>
          <div>
            <p className="text-gray-400">Position Z</p>
            <p className="font-bold text-purple-400">{cameraPosition.z.toFixed(2)}m</p>
          </div>
          <div>
            <p className="text-gray-400">Personnes</p>
            <p className="font-bold text-white">{persons.length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudioLayout