'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Single AGV vehicle model
function AGVVehicle({ color = '#1E40AF' }: { color?: string }) {
  return (
    <group>
      {/* Main platform body */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[1.2, 0.28, 1.6]} />
        <meshStandardMaterial color={color} metalness={0.65} roughness={0.3} />
      </mesh>
      {/* Top sensor dome */}
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.2, 12]} />
        <meshStandardMaterial color="#1F2937" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Spinning LIDAR beacon */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.12, 8]} />
        <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={1.5} />
      </mesh>
      {/* Front bumper light strip */}
      <mesh position={[0, 0.18, 0.82]}>
        <boxGeometry args={[1.0, 0.06, 0.04]} />
        <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={1.8} />
      </mesh>
      {/* Side status lights */}
      <mesh position={[0.62, 0.18, 0]}>
        <boxGeometry args={[0.04, 0.06, 1.2]} />
        <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={1.5} />
      </mesh>
      {/* Wheels x4 */}
      {[[-0.55, -0.65], [0.55, -0.65], [-0.55, 0.65], [0.55, 0.65]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.08, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.12, 10]} />
          <meshStandardMaterial color="#111827" roughness={0.9} />
        </mesh>
      ))}
      {/* Cargo plate on top */}
      <mesh position={[0, 0.33, 0]}>
        <boxGeometry args={[1.0, 0.05, 1.4]} />
        <meshStandardMaterial color="#374151" metalness={0.4} roughness={0.6} />
      </mesh>
    </group>
  )
}

// AGV carrying a small pallet/cargo
function AGVWithCargo({ color = '#1E40AF', cargoColor = '#C4A574' }: { 
  color?: string 
  cargoColor?: string
}) {
  return (
    <group>
      <AGVVehicle color={color} />
      {/* Pallet */}
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.8, 0.05, 1.1]} />
        <meshStandardMaterial color="#8B7355" roughness={0.95} />
      </mesh>
      {/* Cargo box */}
      <mesh position={[0, 0.58, 0]} castShadow>
        <boxGeometry args={[0.7, 0.28, 0.9]} />
        <meshStandardMaterial color={cargoColor} roughness={0.85} />
      </mesh>
    </group>
  )
}

// Route definitions for each AGV (looped waypoints in world space)
type Waypoint = { x: number; z: number }

const AGV_ROUTES: { waypoints: Waypoint[]; color: string; hasCargo: boolean; delay: number }[] = [
  // AGV 1: circles between W1 front and back
  {
    waypoints: [
      { x: -22, z: 16 },
      { x: -15, z: 10 },
      { x: -15, z: -10 },
      { x: -22, z: -16 },
      { x: -29, z: -10 },
      { x: -29, z: 10 },
    ],
    color: '#1D4ED8',
    hasCargo: true,
    delay: 0,
  },
  // AGV 2: W2 perimeter
  {
    waypoints: [
      { x: 22, z: 16 },
      { x: 15, z: 8 },
      { x: 15, z: -8 },
      { x: 22, z: -16 },
      { x: 29, z: -8 },
      { x: 29, z: 8 },
    ],
    color: '#0F766E',
    hasCargo: false,
    delay: 8,
  },
  // AGV 3: cross-compound shuttle (W1 to W2 front road)
  {
    waypoints: [
      { x: -14, z: 20 },
      { x: -4, z: 20 },
      { x: 4, z: 20 },
      { x: 14, z: 20 },
      { x: 14, z: 14 },
      { x: 4, z: 12 },
      { x: -4, z: 12 },
      { x: -14, z: 14 },
    ],
    color: '#1D4ED8',
    hasCargo: true,
    delay: 4,
  },
  // AGV 4: back road shuttle
  {
    waypoints: [
      { x: -14, z: -20 },
      { x: -4, z: -20 },
      { x: 4, z: -20 },
      { x: 14, z: -20 },
      { x: 14, z: -14 },
      { x: -14, z: -14 },
    ],
    color: '#7C3AED',
    hasCargo: false,
    delay: 12,
  },
  // AGV 5: small tight loop near W1 loading dock
  {
    waypoints: [
      { x: -22, z: 12 },
      { x: -18, z: 8 },
      { x: -22, z: 4 },
      { x: -26, z: 8 },
    ],
    color: '#0F766E',
    hasCargo: true,
    delay: 2,
  },
  // AGV 6: W2 interior-style path
  {
    waypoints: [
      { x: 22, z: 12 },
      { x: 26, z: 6 },
      { x: 22, z: 0 },
      { x: 18, z: 6 },
    ],
    color: '#9333EA',
    hasCargo: false,
    delay: 6,
  },
]

// Single animated AGV following waypoints
function AnimatedAGV({ 
  waypoints, 
  color, 
  hasCargo, 
  delay,
  speed = 4.5,
}: { 
  waypoints: Waypoint[]
  color: string
  hasCargo: boolean
  delay: number
  speed?: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const timeRef = useRef(-delay)
  const currentSegRef = useRef(0)
  const segProgressRef = useRef(0)

  // Precompute segment lengths and total path length
  const segments = useMemo(() => {
    return waypoints.map((wp, i) => {
      const next = waypoints[(i + 1) % waypoints.length]
      const dx = next.x - wp.x
      const dz = next.z - wp.z
      return { 
        length: Math.sqrt(dx * dx + dz * dz),
        dx, 
        dz,
      }
    })
  }, [waypoints])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    timeRef.current += delta

    if (timeRef.current < 0) {
      groupRef.current.visible = false
      return
    }
    groupRef.current.visible = true

    // Advance along path by speed*delta
    let remaining = speed * delta
    while (remaining > 0) {
      const seg = segments[currentSegRef.current]
      const distLeft = seg.length * (1 - segProgressRef.current)
      if (remaining >= distLeft) {
        remaining -= distLeft
        currentSegRef.current = (currentSegRef.current + 1) % segments.length
        segProgressRef.current = 0
      } else {
        segProgressRef.current += remaining / seg.length
        remaining = 0
      }
    }

    // Interpolate position
    const segIdx = currentSegRef.current
    const t = segProgressRef.current
    const from = waypoints[segIdx]
    const seg = segments[segIdx]
    const x = from.x + seg.dx * t
    const z = from.z + seg.dz * t

    groupRef.current.position.x = x
    groupRef.current.position.y = 0
    groupRef.current.position.z = z

    // Face direction of travel
    const angle = Math.atan2(seg.dx, seg.dz)
    groupRef.current.rotation.y = angle
  })

  return (
    <group ref={groupRef}>
      {hasCargo ? (
        <AGVWithCargo color={color} cargoColor="#C4A574" />
      ) : (
        <AGVVehicle color={color} />
      )}
    </group>
  )
}

export function AGVFleet() {
  return (
    <group>
      {AGV_ROUTES.map((route, i) => (
        <AnimatedAGV
          key={i}
          waypoints={route.waypoints}
          color={route.color}
          hasCargo={route.hasCargo}
          delay={route.delay}
          speed={3.5 + i * 0.3}
        />
      ))}
    </group>
  )
}
