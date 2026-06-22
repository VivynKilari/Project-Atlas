'use client'

import { useMemo } from 'react'
import * as THREE from 'three'

// Industrial tree with lush green foliage
function IndustrialTree({ position, scale = 1, variant = 0 }: { 
  position: [number, number, number]
  scale?: number
  variant?: number
}) {
  const trunkColor = '#5C4A32'
  const foliageColors = [
    ['#2D5A1B', '#3A7A22', '#4A9A2A'],
    ['#1E6B2A', '#2E8B35', '#3EAB45'],
    ['#264D1A', '#366A28', '#469A38'],
  ]
  const colors = foliageColors[variant % foliageColors.length]

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.28, 2.4, 8]} />
        <meshStandardMaterial color={trunkColor} roughness={0.95} />
      </mesh>
      {/* Lower branch */}
      <mesh position={[0, 2.8, 0]} castShadow>
        <coneGeometry args={[2.2, 2.5, 8]} />
        <meshStandardMaterial color={colors[0]} roughness={0.85} />
      </mesh>
      {/* Middle layer */}
      <mesh position={[0, 4.0, 0]} castShadow>
        <coneGeometry args={[1.7, 2.0, 8]} />
        <meshStandardMaterial color={colors[1]} roughness={0.85} />
      </mesh>
      {/* Top */}
      <mesh position={[0, 5.1, 0]} castShadow>
        <coneGeometry args={[1.1, 1.8, 8]} />
        <meshStandardMaterial color={colors[2]} roughness={0.8} />
      </mesh>
    </group>
  )
}

// Parked vehicle (simple box car)
function ParkedCar({ position, rotation = 0, color = '#334155' }: {
  position: [number, number, number]
  rotation?: number
  color?: string
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Body */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.8, 0.7, 4]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.95, -0.4]} castShadow>
        <boxGeometry args={[1.6, 0.55, 2.2]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Windshield */}
      <mesh position={[0, 0.9, 0.72]}>
        <planeGeometry args={[1.5, 0.45]} />
        <meshPhysicalMaterial color="#87CEEB" transparent opacity={0.6} roughness={0.1} />
      </mesh>
      {/* Wheels */}
      {[[-0.92, -1.3], [0.92, -1.3], [-0.92, 1.3], [0.92, 1.3]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.22, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.2, 12]} />
          <meshStandardMaterial color="#1F2937" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

// Parking space markings
function ParkingLot({ position, rows = 2, cols = 5 }: {
  position: [number, number, number]
  rows?: number
  cols?: number
}) {
  const spaceW = 3.2
  const spaceD = 6

  const carColors = ['#1E3A5F', '#334155', '#4A5568', '#2D4A6F', '#1A2E4A', '#3B4E6A', '#243B55']

  return (
    <group position={position}>
      {/* Asphalt base */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[cols * spaceW + 1, rows * spaceD + 2]} />
        <meshStandardMaterial color="#374151" roughness={0.95} />
      </mesh>
      
      {/* Parking space lines */}
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: cols + 1 }).map((_, col) => {
          const x = col * spaceW - (cols * spaceW) / 2
          const z = row * spaceD - (rows * spaceD) / 2 + spaceD / 2
          return (
            <mesh key={`line-${row}-${col}`} position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.1, spaceD]} />
              <meshStandardMaterial color="#FFFFFF" />
            </mesh>
          )
        })
      )}

      {/* Parked cars */}
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: cols }).map((_, col) => {
          const seed = row * cols + col
          if (seed % 5 === 3) return null // Some empty spaces
          const x = (col - (cols - 1) / 2) * spaceW
          const z = (row - (rows - 1) / 2) * spaceD
          return (
            <ParkedCar
              key={`car-${row}-${col}`}
              position={[x, 0, z]}
              color={carColors[seed % carColors.length]}
            />
          )
        })
      )}
    </group>
  )
}

// Road with lane markings
function Road({ position, width, length, rotation = 0, hasCrossWalk = false }: {
  position: [number, number, number]
  width: number
  length: number
  rotation?: number
  hasCrossWalk?: boolean
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color="#3A3A3A" roughness={0.95} />
      </mesh>
      {/* Road edges */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-width / 2 + 0.2, 0.02, 0]}>
        <planeGeometry args={[0.25, length]} />
        <meshStandardMaterial color="#F8F8F8" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2 - 0.2, 0.02, 0]}>
        <planeGeometry args={[0.25, length]} />
        <meshStandardMaterial color="#F8F8F8" />
      </mesh>
      {/* Center dashed line */}
      {Array.from({ length: Math.floor(length / 5) }).map((_, i) => (
        <mesh key={i} position={[0, 0.025, (i - Math.floor(length / 10)) * 5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.18, 2.5]} />
          <meshStandardMaterial color="#F8F8F8" />
        </mesh>
      ))}
      {/* Crosswalk stripes */}
      {hasCrossWalk && Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`cw-${i}`} position={[0, 0.025, (i - 3.5) * 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width - 1, 0.7]} />
          <meshStandardMaterial color="#F0F0F0" />
        </mesh>
      ))}
    </group>
  )
}

// Grass field
function GrassField({ position, width, depth, color = '#4A7C3A' }: {
  position: [number, number, number]
  width: number
  depth: number
  color?: string
}) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color={color} roughness={0.98} />
    </mesh>
  )
}

// Concrete apron around warehouses
function ConcreteApron({ position, width, depth }: {
  position: [number, number, number]
  width: number
  depth: number
}) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color="#C0C8D0" roughness={0.9} metalness={0.05} />
    </mesh>
  )
}

export function Ground() {
  return (
    <group>
      {/* === MAIN LARGE GRASS AREAS === */}
      {/* Far background */}
      <GrassField position={[0, -0.01, -150]} width={500} depth={200} color="#3D6B2E" />
      <GrassField position={[0, -0.01, 150]} width={500} depth={200} color="#3A6828" />
      {/* Left side grass */}
      <GrassField position={[-100, -0.01, 0]} width={120} depth={300} color="#4A7C3A" />
      {/* Right side grass */}
      <GrassField position={[100, -0.01, 0]} width={120} depth={300} color="#4A7C3A" />
      {/* Center between warehouses — narrower strip */}
      <GrassField position={[0, -0.005, 0]} width={20} depth={26} color="#5A8C45" />
      {/* Front area grass */}
      <GrassField position={[0, -0.005, 62]} width={80} depth={50} color="#4E8038" />
      {/* Back area grass */}
      <GrassField position={[0, -0.005, -62]} width={80} depth={50} color="#4E8038" />

      {/* === CONCRETE APRONS === */}
      {/* Central warehouse platform */}
      <ConcreteApron position={[-22, 0.005, 0]} width={22} depth={42} />
      <ConcreteApron position={[22, 0.005, 0]} width={22} depth={42} />
      {/* Connecting apron between warehouses */}
      <ConcreteApron position={[0, 0.005, 0]} width={10} depth={44} />

      {/* === MAIN ROADS === */}
      {/* Front horizontal main road */}
      <Road position={[0, 0, 42]} width={12} length={120} />
      {/* Back horizontal main road */}
      <Road position={[0, 0, -42]} width={12} length={120} />
      {/* Left vertical connector */}
      <Road position={[-22, 0, 30]} width={9} length={28} rotation={0} hasCrossWalk />
      <Road position={[22, 0, 30]} width={9} length={28} rotation={0} hasCrossWalk />
      {/* Left back connector */}
      <Road position={[-22, 0, -30]} width={9} length={28} />
      <Road position={[22, 0, -30]} width={9} length={28} />

      {/* === LOADING ZONES (yellow striped) === */}
      {/* Front loading zones */}
      <group>
        {/* W1 front */}
        <mesh position={[-22, 0.03, 22]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[16, 7]} />
          <meshStandardMaterial color="#3A3A3A" roughness={0.95} />
        </mesh>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={`lz1-${i}`} position={[-22, 0.04, 19.5 + i * 1.2]} rotation={[-Math.PI / 2, Math.PI / 4, 0]}>
            <planeGeometry args={[12, 0.35]} />
            <meshStandardMaterial color="#F59E0B" transparent opacity={0.8} />
          </mesh>
        ))}
        {/* W2 front */}
        <mesh position={[22, 0.03, 22]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[16, 7]} />
          <meshStandardMaterial color="#3A3A3A" roughness={0.95} />
        </mesh>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={`lz2-${i}`} position={[22, 0.04, 19.5 + i * 1.2]} rotation={[-Math.PI / 2, Math.PI / 4, 0]}>
            <planeGeometry args={[12, 0.35]} />
            <meshStandardMaterial color="#F59E0B" transparent opacity={0.8} />
          </mesh>
        ))}
      </group>

      {/* Back loading zones */}
      <group>
        {/* W1 back */}
        <mesh position={[-22, 0.03, -22]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[16, 7]} />
          <meshStandardMaterial color="#3A3A3A" roughness={0.95} />
        </mesh>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={`lz3-${i}`} position={[-22, 0.04, -24.5 + i * 1.2]} rotation={[-Math.PI / 2, Math.PI / 4, 0]}>
            <planeGeometry args={[12, 0.35]} />
            <meshStandardMaterial color="#F59E0B" transparent opacity={0.8} />
          </mesh>
        ))}
        {/* W2 back */}
        <mesh position={[22, 0.03, -22]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[16, 7]} />
          <meshStandardMaterial color="#3A3A3A" roughness={0.95} />
        </mesh>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={`lz4-${i}`} position={[22, 0.04, -24.5 + i * 1.2]} rotation={[-Math.PI / 2, Math.PI / 4, 0]}>
            <planeGeometry args={[12, 0.35]} />
            <meshStandardMaterial color="#F59E0B" transparent opacity={0.8} />
          </mesh>
        ))}
      </group>

      {/* === PARKING LOTS === */}
      <ParkingLot position={[-55, 0, 30]} rows={2} cols={5} />
      <ParkingLot position={[55, 0, 30]} rows={2} cols={5} />
      <ParkingLot position={[-55, 0, -30]} rows={2} cols={4} />

      {/* === TREES - Left perimeter === */}
      <IndustrialTree position={[-70, 0, -55]} scale={1.8} variant={0} />
      <IndustrialTree position={[-65, 0, -40]} scale={2.0} variant={1} />
      <IndustrialTree position={[-72, 0, -20]} scale={1.6} variant={2} />
      <IndustrialTree position={[-68, 0, 5]} scale={1.9} variant={0} />
      <IndustrialTree position={[-74, 0, 30]} scale={1.7} variant={1} />
      <IndustrialTree position={[-66, 0, 50]} scale={2.1} variant={2} />
      <IndustrialTree position={[-75, 0, 65]} scale={1.8} variant={0} />
      
      {/* Trees between parking and road */}
      <IndustrialTree position={[-44, 0, 15]} scale={1.2} variant={1} />
      <IndustrialTree position={[-44, 0, 45]} scale={1.3} variant={2} />
      <IndustrialTree position={[44, 0, 15]} scale={1.2} variant={0} />
      <IndustrialTree position={[44, 0, 45]} scale={1.3} variant={1} />

      {/* === TREES - Right perimeter === */}
      <IndustrialTree position={[70, 0, -55]} scale={1.9} variant={2} />
      <IndustrialTree position={[66, 0, -35]} scale={1.7} variant={0} />
      <IndustrialTree position={[73, 0, -12]} scale={2.0} variant={1} />
      <IndustrialTree position={[69, 0, 12]} scale={1.8} variant={2} />
      <IndustrialTree position={[75, 0, 38]} scale={1.6} variant={0} />
      <IndustrialTree position={[67, 0, 60]} scale={2.1} variant={1} />

      {/* === TREES - Far back === */}
      <IndustrialTree position={[-50, 0, -80]} scale={2.5} variant={0} />
      <IndustrialTree position={[-25, 0, -85]} scale={2.2} variant={1} />
      <IndustrialTree position={[0, 0, -82]} scale={2.0} variant={2} />
      <IndustrialTree position={[25, 0, -85]} scale={2.3} variant={0} />
      <IndustrialTree position={[50, 0, -80]} scale={2.4} variant={1} />
      <IndustrialTree position={[-50, 0, 80]} scale={2.3} variant={2} />
      <IndustrialTree position={[50, 0, 80]} scale={2.2} variant={0} />

      {/* === TREES - Front grass patches === */}
      <IndustrialTree position={[-38, 0, 55]} scale={1.5} variant={1} />
      <IndustrialTree position={[38, 0, 55]} scale={1.6} variant={2} />
      <IndustrialTree position={[-8, 0, 60]} scale={1.4} variant={0} />
      <IndustrialTree position={[8, 0, 60]} scale={1.4} variant={1} />
    </group>
  )
}
