'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, Sky } from '@react-three/drei'
import { Suspense, useState, createContext, useContext } from 'react'
import * as THREE from 'three'
import { Ground } from './ground'
import { Warehouse } from './warehouse'
import { AnimatedTruck } from './animated-truck'
import { ULDTransporter } from './uld-transporter'
import { AGVFleet } from './agv-fleet'
import { InfoPanel } from '@/components/ui/info-panel'
import type { SelectedObject } from '@/lib/types'

// Context for selected object state
type SelectionContextType = {
  selected: SelectedObject | null
  setSelected: (obj: SelectedObject | null) => void
}

export const SelectionContext = createContext<SelectionContextType>({
  selected: null,
  setSelected: () => {},
})

export function useSelection() {
  return useContext(SelectionContext)
}

// Context for opening warehouse layout directly
type WarehouseLayoutContextType = {
  openWarehouseLayout: (warehouseId: string) => void
}

export const WarehouseLayoutContext = createContext<WarehouseLayoutContextType>({
  openWarehouseLayout: () => {},
})

export function useWarehouseLayout() {
  return useContext(WarehouseLayoutContext)
}

// Animated light pole
function LightPole({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 4, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 8, 8]} />
        <meshStandardMaterial color="#4B5563" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Arm */}
      <mesh position={[0.8, 8.2, 0]} rotation={[0, 0, -Math.PI / 10]}>
        <cylinderGeometry args={[0.04, 0.04, 1.8, 8]} />
        <meshStandardMaterial color="#4B5563" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Light fixture */}
      <mesh position={[1.5, 8.1, 0]}>
        <boxGeometry args={[0.5, 0.15, 0.3]} />
        <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Glow */}
      <mesh position={[1.5, 7.98, 0]}>
        <planeGeometry args={[0.4, 0.22]} />
        <meshStandardMaterial color="#FEF3C7" emissive="#FEF3C7" emissiveIntensity={2} />
      </mesh>
      <pointLight position={[1.5, 7.8, 0]} intensity={30} distance={20} color="#FFF8DC" />
    </group>
  )
}

function Scene() {
  // Warehouse dimensions
  const warehouseDepth = 35
  
  // Door positions
  const frontDoorZ = warehouseDepth / 2
  const backDoorZ = -warehouseDepth / 2
  
  return (
    <>
      {/* HDR Sky */}
      <Sky
        distance={450000}
        sunPosition={[100, 30, -50]}
        inclination={0.52}
        azimuth={0.25}
        turbidity={6}
        rayleigh={0.6}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      {/* Warm directional sunlight with long shadows */}
      <directionalLight
        position={[80, 60, 40]}
        intensity={2.2}
        color="#FFF5E0"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-far={300}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-bias={-0.0005}
      />
      {/* Fill light from opposite side */}
      <directionalLight position={[-60, 40, -40]} intensity={0.6} color="#C8D8F0" />
      {/* Soft ambient sky light */}
      <ambientLight intensity={0.5} color="#D0E8F8" />
      {/* Hemisphere light for sky/ground bounce */}
      <hemisphereLight args={['#87CEEB', '#4A7C3A', 0.7]} />

      {/* Street lights for atmosphere */}
      <LightPole position={[-40, 0, 25]} />
      <LightPole position={[40, 0, 25]} />
      <LightPole position={[-40, 0, -25]} />
      <LightPole position={[40, 0, -25]} />
      <LightPole position={[0, 0, 50]} />
      <LightPole position={[0, 0, -50]} />

      {/* Ground with grass, roads, parking */}
      <Ground />

      {/* Warehouses */}
      <Warehouse position={[-22, 0, 0]} warehouseId="warehouse-1" />
      <Warehouse position={[22, 0, 0]} warehouseId="warehouse-2" />

      {/* Incoming trucks - front doors */}
      <AnimatedTruck xPosition={-22} doorZ={frontDoorZ} delay={0} warehouseId="warehouse-1" />
      <AnimatedTruck xPosition={22} doorZ={frontDoorZ} delay={12} warehouseId="warehouse-2" />

      {/* Outgoing ULD transporters - back doors */}
      <ULDTransporter xPosition={-22} doorZ={backDoorZ} delay={8} warehouseId="warehouse-1" />
      <ULDTransporter xPosition={22} doorZ={backDoorZ} delay={20} warehouseId="warehouse-2" />

      {/* AGV Fleet - autonomous vehicles */}
      <AGVFleet />

      {/* Contact shadows for grounding */}
      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={0.4}
        scale={250}
        blur={2}
        far={120}
        color="#2D4A22"
      />

      {/* HDR environment for realistic reflections */}
      <Environment preset="sunset" environmentIntensity={0.4} />
    </>
  )
}

export function WarehouseScene({ onOpenWarehouseLayout }: { onOpenWarehouseLayout?: (warehouseId: string) => void }) {
  const [selected, setSelected] = useState<SelectedObject | null>(null)

  const handlePointerMissed = () => {
    setSelected(null)
  }
  
  const openWarehouseLayout = (warehouseId: string) => {
    if (onOpenWarehouseLayout) {
      onOpenWarehouseLayout(warehouseId)
    }
  }

  return (
    <WarehouseLayoutContext.Provider value={{ openWarehouseLayout }}>
      <SelectionContext.Provider value={{ selected, setSelected }}>
        <Canvas
          shadows="soft"
          camera={{ position: [65, 38, 75], fov: 48 }}
          onPointerMissed={handlePointerMissed}
          gl={{ 
            antialias: true, 
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
          }}
          style={{ background: '#87CEEB' }}
        >
          <fog attach="fog" args={['#C8DFF5', 150, 380]} />
          
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={18}
            maxDistance={200}
            maxPolarAngle={Math.PI / 2.15}
            dampingFactor={0.06}
            enableDamping={true}
            zoomSpeed={0.8}
            rotateSpeed={0.6}
            panSpeed={0.8}
            target={[0, 2, 0]}
          />
        </Canvas>
        
        {/* Info Panel Overlay - only for non-warehouse items */}
        {selected && selected.type !== 'warehouse' && (
          <InfoPanel selected={selected} onClose={() => setSelected(null)} />
        )}
      </SelectionContext.Provider>
    </WarehouseLayoutContext.Provider>
  )
}
