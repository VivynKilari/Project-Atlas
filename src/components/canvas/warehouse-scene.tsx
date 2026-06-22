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
import { useViewModeContext } from '@/lib/contexts/view-mode-context'
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

// Light pole — enhanced for night mode
function LightPole({ position, isNight = false }: { position: [number, number, number]; isNight?: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 4, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 8, 8]} />
        <meshStandardMaterial color="#4B5563" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.8, 8.2, 0]} rotation={[0, 0, -Math.PI / 10]}>
        <cylinderGeometry args={[0.04, 0.04, 1.8, 8]} />
        <meshStandardMaterial color="#4B5563" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[1.5, 8.1, 0]}>
        <boxGeometry args={[0.5, 0.15, 0.3]} />
        <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[1.5, 7.98, 0]}>
        <planeGeometry args={[0.4, 0.22]} />
        <meshStandardMaterial
          color="#FEF3C7"
          emissive="#FEF3C7"
          emissiveIntensity={isNight ? 6 : 2}
        />
      </mesh>
      <pointLight
        position={[1.5, 7.8, 0]}
        intensity={isNight ? 120 : 30}
        distance={isNight ? 35 : 20}
        color="#FFF8DC"
      />
    </group>
  )
}

function Scene() {
  const { viewMode, dayNight } = useViewModeContext()
  const isNight = dayNight === 'night'

  // Warehouse dimensions
  const warehouseDepth = 35
  const frontDoorZ = warehouseDepth / 2
  const backDoorZ = -warehouseDepth / 2

  // Tint overlays for view modes applied via point lights
  const heatmapTint = viewMode === 'heatmap'
  const trafficTint = viewMode === 'traffic'
  const inventoryTint = viewMode === 'inventory'

  return (
    <>
      {/* ── SKY ── */}
      {isNight ? (
        <color attach="background" args={['#020810']} />
      ) : (
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
      )}

      {/* ── LIGHTING DAY ── */}
      {!isNight && (
        <>
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
          <directionalLight position={[-60, 40, -40]} intensity={0.6} color="#C8D8F0" />
          <ambientLight intensity={0.5} color="#D0E8F8" />
          <hemisphereLight args={['#87CEEB', '#4A7C3A', 0.7]} />
        </>
      )}

      {/* ── LIGHTING NIGHT ── */}
      {isNight && (
        <>
          <ambientLight intensity={0.08} color="#1A2050" />
          <hemisphereLight args={['#0A1035', '#050810', 0.15]} />
          {/* Moon-like cool dim directional */}
          <directionalLight position={[-40, 60, -30]} intensity={0.25} color="#8090C8" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-far={250} shadow-camera-left={-100} shadow-camera-right={100} shadow-camera-top={100} shadow-camera-bottom={-100} shadow-bias={-0.001} />
          {/* Building interior warm glow */}
          <pointLight position={[-22, 5, 0]} intensity={80} distance={40} color="#FFF5C8" />
          <pointLight position={[22, 5, 0]} intensity={80} distance={40} color="#FFF5C8" />
          {/* Loading dock flood lights */}
          <pointLight position={[-22, 12, 20]} intensity={120} distance={35} color="#FFF8E0" />
          <pointLight position={[22, 12, 20]} intensity={120} distance={35} color="#FFF8E0" />
          <pointLight position={[-22, 12, -20]} intensity={100} distance={30} color="#FFF8E0" />
          <pointLight position={[22, 12, -20]} intensity={100} distance={30} color="#FFF8E0" />
          {/* Road lighting */}
          <pointLight position={[0, 12, 42]} intensity={60} distance={30} color="#FFE0A0" />
          <pointLight position={[0, 12, -42]} intensity={60} distance={30} color="#FFE0A0" />
          {/* AGV path lights */}
          <pointLight position={[-15, 3, 0]} intensity={20} distance={18} color="#38BDF8" />
          <pointLight position={[15, 3, 0]} intensity={20} distance={18} color="#38BDF8" />
        </>
      )}

      {/* ── VIEW MODE ACCENT LIGHTS ── */}
      {heatmapTint && (
        <>
          <pointLight position={[-22, 12, 0]} intensity={60} distance={50} color="#EF4444" />
          <pointLight position={[22, 12, 0]} intensity={40} distance={40} color="#F97316" />
          <pointLight position={[0, 8, 25]} intensity={30} distance={40} color="#EAB308" />
        </>
      )}
      {trafficTint && (
        <>
          <pointLight position={[0, 4, 42]} intensity={50} distance={35} color="#10B981" />
          <pointLight position={[0, 4, -42]} intensity={50} distance={35} color="#10B981" />
          <pointLight position={[-22, 4, 20]} intensity={30} distance={25} color="#38BDF8" />
          <pointLight position={[22, 4, 20]} intensity={30} distance={25} color="#38BDF8" />
        </>
      )}
      {inventoryTint && (
        <>
          <pointLight position={[-22, 8, 0]} intensity={50} distance={40} color="#F59E0B" />
          <pointLight position={[22, 8, 0]} intensity={50} distance={40} color="#F59E0B" />
        </>
      )}

      {/* ── STREET LIGHTS ── */}
      <LightPole position={[-40, 0, 25]} isNight={isNight} />
      <LightPole position={[40, 0, 25]} isNight={isNight} />
      <LightPole position={[-40, 0, -25]} isNight={isNight} />
      <LightPole position={[40, 0, -25]} isNight={isNight} />
      <LightPole position={[0, 0, 50]} isNight={isNight} />
      <LightPole position={[0, 0, -50]} isNight={isNight} />

      {/* Ground */}
      <Ground />

      {/* Warehouses */}
      <Warehouse position={[-22, 0, 0]} warehouseId="warehouse-1" />
      <Warehouse position={[22, 0, 0]} warehouseId="warehouse-2" />

      {/* Incoming trucks */}
      <AnimatedTruck xPosition={-22} doorZ={frontDoorZ} delay={0} warehouseId="warehouse-1" />
      <AnimatedTruck xPosition={22} doorZ={frontDoorZ} delay={12} warehouseId="warehouse-2" />

      {/* Outgoing ULD transporters */}
      <ULDTransporter xPosition={-22} doorZ={backDoorZ} delay={8} warehouseId="warehouse-1" />
      <ULDTransporter xPosition={22} doorZ={backDoorZ} delay={20} warehouseId="warehouse-2" />

      {/* AGV Fleet */}
      <AGVFleet />

      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={isNight ? 0.6 : 0.4}
        scale={250}
        blur={2}
        far={120}
        color={isNight ? '#000820' : '#2D4A22'}
      />

      <Environment preset={isNight ? 'night' : 'sunset'} environmentIntensity={isNight ? 0.05 : 0.4} />

      {isNight && <fog attach="fog" args={['#020810', 80, 280]} />}
      {!isNight && <fog attach="fog" args={['#C8DFF5', 150, 380]} />}
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
