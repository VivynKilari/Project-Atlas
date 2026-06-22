'use client'

import { useRef, useMemo, useState } from 'react'
import * as THREE from 'three'
import { ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useSelection, useWarehouseLayout } from './warehouse-scene'
import { useWarehouseInventory, TrackedPackage, WarehouseShelf } from '@/lib/warehouse-inventory'
import type { CargoItem } from '@/lib/types'

// Colors - Industrial Digital Twin Palette
const NAVY_BLUE = '#0F2447'
const ANA_BLUE = '#00467F'
const ELECTRIC_BLUE = '#0EA5E9'
const RACK_BLUE = '#1E40AF'
const RACK_YELLOW = '#F59E0B'
const METAL_COLOR = '#64748B'
const STEEL_LIGHT = '#94A3B8'
const PALLET_WOOD = '#8B7355'
const FRAME_COLOR = '#CBD5E1'
const WALL_COLOR = '#E8ECEF'
const ROOF_PANEL = '#D0D8E0'
const HIGHLIGHT_COLOR = '#38BDF8'
const SELECTED_COLOR = '#0EA5E9'
const STATUS_GREEN = '#10B981'
const STATUS_AMBER = '#F59E0B'

// Seeded random for consistent values
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Convert TrackedPackage to CargoItem format for display
function toCargoItem(pkg: TrackedPackage): CargoItem {
  return {
    id: pkg.id,
    description: pkg.description,
    weight: pkg.weight,
    dimensions: pkg.dimensions,
    destination: pkg.destination,
    origin: pkg.origin,
    priority: pkg.priority,
    handler: pkg.shelfId ? `Shelf ${pkg.shelfRow !== undefined ? pkg.shelfRow + 1 : '?'}-${pkg.shelfLevel !== undefined ? pkg.shelfLevel + 1 : '?'}` : 'Unassigned',
    trackingNumber: pkg.trackingNumber,
  }
}

// Wooden pallet
function Pallet({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[-0.35, 0, 0.35].map((x, i) => (
        <mesh key={`top-${i}`} position={[x, 0.08, 0]}>
          <boxGeometry args={[0.15, 0.02, 0.8]} />
          <meshStandardMaterial color={PALLET_WOOD} roughness={0.9} />
        </mesh>
      ))}
      {[-0.3, 0, 0.3].map((z, i) => (
        <mesh key={`cross-${i}`} position={[0, 0.05, z]}>
          <boxGeometry args={[0.8, 0.03, 0.1]} />
          <meshStandardMaterial color={PALLET_WOOD} roughness={0.9} />
        </mesh>
      ))}
      {[[-0.3, -0.3], [0.3, -0.3], [0, 0]].map(([x, z], i) => (
        <mesh key={`block-${i}`} position={[x, 0.035, z]}>
          <boxGeometry args={[0.1, 0.05, 0.1]} />
          <meshStandardMaterial color={PALLET_WOOD} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

// Clickable box for individual packages
function ClickableBox({ 
  position, 
  size, 
  color,
  packageData,
}: { 
  position: [number, number, number]
  size: [number, number, number]
  color: string
  packageData: TrackedPackage
}) {
  const { setSelected, selected } = useSelection()
  const [isHovered, setIsHovered] = useState(false)
  const isSelected = selected?.type === 'cargo' && selected?.id === packageData.id

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    setSelected({
      type: 'cargo',
      id: packageData.id,
      position,
      data: toCargoItem(packageData),
    })
  }

  return (
    <group position={position}>
      <mesh 
        onClick={handleClick} 
        castShadow
        onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true) }}
        onPointerOut={() => setIsHovered(false)}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      
      {/* Highlight outline */}
      {(isHovered || isSelected) && (
        <mesh scale={[1.1, 1.1, 1.1]}>
          <boxGeometry args={size} />
          <meshBasicMaterial 
            color={isSelected ? SELECTED_COLOR : HIGHLIGHT_COLOR} 
            transparent 
            opacity={isSelected ? 0.4 : 0.25}
            wireframe
          />
        </mesh>
      )}
      
      {isHovered && !isSelected && (
        <Html position={[0, size[1] / 2 + 0.5, 0]} center distanceFactor={30}>
          <div className="bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none shadow-lg">
            Click for details
          </div>
        </Html>
      )}
    </group>
  )
}

// Industrial rack with packages from inventory
function IndustrialRack({ 
  position, 
  shelfData,
  warehousePosition,
}: { 
  position: [number, number, number]
  shelfData: WarehouseShelf
  warehousePosition: [number, number, number]
}) {
  const { setSelected } = useSelection()
  
  const rackWidth = 2.8
  const rackDepth = 1.0
  const rackHeight = 5
  const numLevels = 3
  const levelHeight = rackHeight / numLevels
  
  const handleShelfClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    
    // Convert to the expected Shelf format for info panel
    const shelfInfo = {
      id: shelfData.id,
      warehouseId: shelfData.warehouseId,
      position: { row: shelfData.row, level: shelfData.level },
      itemCount: shelfData.packages.length,
      maxWeight: shelfData.maxWeight,
      currentWeight: shelfData.currentWeight,
      items: shelfData.packages.map(toCargoItem),
    }
    
    setSelected({
      type: 'shelf',
      id: shelfData.id,
      position: [
        warehousePosition[0] + position[0],
        warehousePosition[1] + position[1],
        warehousePosition[2] + position[2],
      ],
      data: shelfInfo,
    })
  }

  // Generate box configs based on actual packages in this shelf
  const boxConfigs = useMemo(() => {
    const configs: Array<{
      level: number
      palletX: number
      boxOffset: [number, number, number]
      size: [number, number, number]
      color: string
      packageIndex: number
    }> = []
    
    const colors = ['#C4A574', '#B8956A', '#D4B584', '#CAA070', '#BFA068']
    
    // Distribute packages across levels
    shelfData.packages.forEach((pkg, idx) => {
      const level = idx % numLevels
      const palletSide = Math.floor(idx / numLevels) % 2 === 0 ? -0.5 : 0.5
      const stackPosition = Math.floor(idx / (numLevels * 2))
      
      const seed = pkg.id.charCodeAt(0) + pkg.id.charCodeAt(1) * 100
      
      configs.push({
        level,
        palletX: palletSide,
        boxOffset: [stackPosition * 0.3, 0.22 + stackPosition * 0.4, 0],
        size: [
          0.45 + seededRandom(seed) * 0.2,
          0.3 + seededRandom(seed + 1) * 0.15,
          0.45 + seededRandom(seed + 2) * 0.2,
        ],
        color: colors[idx % colors.length],
        packageIndex: idx,
      })
    })
    
    return configs
  }, [shelfData.packages, numLevels])

  return (
    <group position={position}>
      {/* Uprights */}
      {[[-rackWidth/2, -rackDepth/2], [rackWidth/2, -rackDepth/2], [-rackWidth/2, rackDepth/2], [rackWidth/2, rackDepth/2]].map(([x, z], i) => (
        <mesh key={`upright-${i}`} position={[x, rackHeight/2, z]} onClick={handleShelfClick}>
          <boxGeometry args={[0.08, rackHeight, 0.08]} />
          <meshStandardMaterial color={RACK_BLUE} metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
      
      {/* Horizontal beams */}
      {Array.from({ length: numLevels + 1 }).map((_, level) => {
        const y = level * levelHeight + 0.05
        return (
          <group key={`level-${level}`}>
            <mesh position={[0, y, -rackDepth/2]} onClick={handleShelfClick}>
              <boxGeometry args={[rackWidth, 0.1, 0.05]} />
              <meshStandardMaterial color={RACK_YELLOW} metalness={0.3} roughness={0.6} />
            </mesh>
            <mesh position={[0, y, rackDepth/2]} onClick={handleShelfClick}>
              <boxGeometry args={[rackWidth, 0.1, 0.05]} />
              <meshStandardMaterial color={RACK_YELLOW} metalness={0.3} roughness={0.6} />
            </mesh>
          </group>
        )
      })}
      
      {/* Shelf surfaces */}
      {Array.from({ length: numLevels }).map((_, level) => (
        <mesh key={`surface-${level}`} position={[0, level * levelHeight + 0.12, 0]} onClick={handleShelfClick}>
          <boxGeometry args={[rackWidth - 0.2, 0.03, rackDepth - 0.1]} />
          <meshStandardMaterial color="#6B7280" metalness={0.5} roughness={0.7} />
        </mesh>
      ))}
      
      {/* Pallets on each level */}
      {Array.from({ length: numLevels }).map((_, level) => (
        <group key={`pallets-${level}`}>
          <Pallet position={[-0.5, level * levelHeight + 0.12, 0]} />
          <Pallet position={[0.5, level * levelHeight + 0.12, 0]} />
        </group>
      ))}
      
      {/* Packages from inventory */}
      {boxConfigs.map((config, idx) => {
        const pkg = shelfData.packages[config.packageIndex]
        if (!pkg) return null
        
        const boxPos: [number, number, number] = [
          config.palletX + config.boxOffset[0],
          config.level * levelHeight + 0.12 + config.boxOffset[1] + config.size[1] / 2,
          config.boxOffset[2],
        ]
        
        return (
          <ClickableBox
            key={`box-${pkg.id}`}
            position={boxPos}
            size={config.size}
            color={config.color}
            packageData={pkg}
          />
        )
      })}
      
      {/* Empty shelf indicator */}
      {shelfData.packages.length === 0 && (
        <mesh position={[0, 0.5, 0]} onClick={handleShelfClick}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      )}
    </group>
  )
}

// Interior shelving using inventory data
function InteriorShelving({ warehouseId, warehousePosition }: { warehouseId: string; warehousePosition: [number, number, number] }) {
  const { getShelvesByWarehouse } = useWarehouseInventory()
  
  const shelves = getShelvesByWarehouse(warehouseId)
  
  // Rack positions in warehouse - 6 racks
  const rackPositions: [number, number, number][] = [
    [-5, 0, -8], [-5, 0, 0], [-5, 0, 8],
    [5, 0, -8], [5, 0, 0], [5, 0, 8],
  ]
  
  // Map shelves to rack positions (combine multiple shelves per rack)
  const rackShelves = useMemo(() => {
    // Group shelves by row (each row is a rack)
    const grouped: WarehouseShelf[][] = []
    for (let i = 0; i < 6; i++) {
      grouped.push(shelves.filter(s => s.row === i))
    }
    return grouped
  }, [shelves])

  return (
    <group>
      {rackPositions.map((pos, index) => {
        // Combine all packages from shelves in this rack row
        const rackShelvesForRow = rackShelves[index] || []
        const combinedShelf: WarehouseShelf = {
          id: `${warehouseId}-rack-${index}`,
          warehouseId,
          row: index,
          level: 0,
          packages: rackShelvesForRow.flatMap(s => s.packages),
          maxWeight: rackShelvesForRow.reduce((sum, s) => sum + s.maxWeight, 0),
          currentWeight: rackShelvesForRow.reduce((sum, s) => sum + s.currentWeight, 0),
        }
        
        return (
          <IndustrialRack
            key={`rack-${index}`}
            position={pos}
            shelfData={combinedShelf}
            warehousePosition={warehousePosition}
          />
        )
      })}
    </group>
  )
}

// Glass panel with frame
function GlassPanel({ 
  position, 
  width, 
  height, 
  rotation = [0, 0, 0] 
}: { 
  position: [number, number, number]
  width: number
  height: number
  rotation?: [number, number, number]
}) {
  const panelRows = Math.floor(height / 2)
  const panelCols = Math.floor(width / 3)
  
  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      {Array.from({ length: panelRows }).map((_, row) => 
        Array.from({ length: panelCols }).map((_, col) => {
          const x = (col - (panelCols - 1) / 2) * 3
          const y = (row - (panelRows - 1) / 2) * 2
          return (
            <mesh key={`pane-${row}-${col}`} position={[x, y, 0]}>
              <planeGeometry args={[2.8, 1.8]} />
              <meshPhysicalMaterial
                color="#FFFFFF"
                transparent
                opacity={0.15}
                transmission={0.8}
                roughness={0.1}
                metalness={0}
                side={THREE.DoubleSide}
              />
            </mesh>
          )
        })
      )}
      
      {Array.from({ length: panelRows + 1 }).map((_, i) => {
        const y = (i - panelRows / 2) * 2
        return (
          <mesh key={`h-frame-${i}`} position={[0, y, 0.01]}>
            <boxGeometry args={[width, 0.08, 0.04]} />
            <meshStandardMaterial color={FRAME_COLOR} metalness={0.3} roughness={0.7} />
          </mesh>
        )
      })}
      
      {Array.from({ length: panelCols + 1 }).map((_, i) => {
        const x = (i - panelCols / 2) * 3
        return (
          <mesh key={`v-frame-${i}`} position={[x, 0, 0.01]}>
            <boxGeometry args={[0.08, height, 0.04]} />
            <meshStandardMaterial color={FRAME_COLOR} metalness={0.3} roughness={0.7} />
          </mesh>
        )
      })}
    </group>
  )
}

// Glass wall
function GlassWall({ 
  position, 
  width, 
  height, 
  isVertical = false 
}: { 
  position: [number, number, number]
  width: number
  height: number
  isVertical?: boolean
}) {
  return (
    <GlassPanel
      position={[position[0], position[1], position[2]]}
      width={width}
      height={height}
      rotation={isVertical ? [0, Math.PI / 2, 0] : [0, 0, 0]}
    />
  )
}

// Roll-up door
function RollUpDoor({ position, width = 6, height = 5 }: { position: [number, number, number]; width?: number; height?: number }) {
  return (
    <group position={position}>
      <mesh position={[-width/2 - 0.1, height/2, 0]}>
        <boxGeometry args={[0.2, height, 0.3]} />
        <meshStandardMaterial color={ANA_BLUE} metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[width/2 + 0.1, height/2, 0]}>
        <boxGeometry args={[0.2, height, 0.3]} />
        <meshStandardMaterial color={ANA_BLUE} metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[0, height + 0.1, 0]}>
        <boxGeometry args={[width + 0.4, 0.2, 0.3]} />
        <meshStandardMaterial color={ANA_BLUE} metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[0, height - 0.3, 0.1]}>
        <boxGeometry args={[width - 0.2, 0.5, 0.2]} />
        <meshStandardMaterial color="#E5E7EB" metalness={0.2} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.01, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width + 1, 1]} />
        <meshStandardMaterial color="#FCD34D" />
      </mesh>
    </group>
  )
}

export function Warehouse({ position, warehouseId }: { position: [number, number, number]; warehouseId: string }) {
  const groupRef = useRef<THREE.Group>(null)
  const { selected } = useSelection()
  const { openWarehouseLayout } = useWarehouseLayout()
  const { getWarehouseStats } = useWarehouseInventory()
  const [isHovered, setIsHovered] = useState(false)
  
  const stats = getWarehouseStats(warehouseId)
  const isSelected = selected?.type === 'warehouse' && selected?.id === warehouseId
  
  const width = 18
  const height = 8
  const depth = 35
  
  const handleWarehouseClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    // Open the warehouse layout directly
    openWarehouseLayout(warehouseId)
  }
  
  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setIsHovered(true)
    document.body.style.cursor = 'pointer'
  }
  
  const handlePointerOut = () => {
    setIsHovered(false)
    document.body.style.cursor = 'auto'
  }

  // Suppress unused variable warning
  void stats

  const warehouseLabel = warehouseId === 'warehouse-1' ? 'CARGO HUB A' : 'CARGO HUB B'

  return (
    <group ref={groupRef} position={position}>
      {/* Polished concrete floor */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={handleWarehouseClick}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#C8CCCF" roughness={0.7} metalness={0.08} />
      </mesh>
      
      {/* Floor grid lines */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`floor-h-${i}`} position={[0, 0.06, (i - 3.5) * 4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width - 1, 0.04]} />
          <meshBasicMaterial color="#B8BEC3" />
        </mesh>
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`floor-v-${i}`} position={[(i - 2.5) * 3, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.04, depth - 2]} />
          <meshBasicMaterial color="#B8BEC3" />
        </mesh>
      ))}
      
      {/* Yellow safety aisle stripe */}
      <mesh position={[0, 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, depth - 4]} />
        <meshStandardMaterial color="#F8F8F4" roughness={0.8} />
      </mesh>
      {[-1.4, 1.4].map((x, i) => (
        <mesh key={`aisle-${i}`} position={[x, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.1, depth - 4]} />
          <meshStandardMaterial color="#F59E0B" />
        </mesh>
      ))}

      {/* === STRUCTURAL WALLS (solid metal panels) === */}
      {/* Left wall */}
      <mesh position={[-width/2 + 0.1, height/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.25, height, depth]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Right wall */}
      <mesh position={[width/2 - 0.1, height/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.25, height, depth]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Horizontal wall cladding stripes */}
      {Array.from({ length: 4 }).map((_, i) => (
        <group key={`cladding-${i}`}>
          <mesh position={[-width/2 + 0.12, 1.5 + i * 1.8, 0]}>
            <boxGeometry args={[0.04, 0.12, depth - 0.5]} />
            <meshStandardMaterial color={METAL_COLOR} metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[width/2 - 0.12, 1.5 + i * 1.8, 0]}>
            <boxGeometry args={[0.04, 0.12, depth - 0.5]} />
            <meshStandardMaterial color={METAL_COLOR} metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* === PREMIUM GLASS WALLS (with visible frames) === */}
      <GlassWall position={[-width/2, height/2, 0]} width={depth} height={height} isVertical={true} />
      <GlassWall position={[width/2, height/2, 0]} width={depth} height={height} isVertical={true} />
      
      {/* Front wall glass sections */}
      <GlassPanel position={[-width/2 + 2, height/2, depth/2]} width={4} height={height} />
      <GlassPanel position={[width/2 - 2, height/2, depth/2]} width={4} height={height} />
      <GlassPanel position={[0, height - 1, depth/2]} width={10} height={2} />
      
      {/* Back wall glass sections */}
      <GlassPanel position={[-width/2 + 2, height/2, -depth/2]} width={4} height={height} />
      <GlassPanel position={[width/2 - 2, height/2, -depth/2]} width={4} height={height} />
      <GlassPanel position={[0, height - 1, -depth/2]} width={10} height={2} />
      
      {/* === STRUCTURAL COLUMNS (H-beam style) === */}
      {Array.from({ length: 5 }).map((_, i) => {
        const z = (i - 2) * 8
        return (
          <group key={`cols-${i}`}>
            {/* Left column */}
            <mesh position={[-width/2 + 0.2, height/2, z]} castShadow>
              <boxGeometry args={[0.4, height, 0.4]} />
              <meshStandardMaterial color={NAVY_BLUE} metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Column flange detail */}
            <mesh position={[-width/2 + 0.2, height/2, z]}>
              <boxGeometry args={[0.6, height, 0.12]} />
              <meshStandardMaterial color={NAVY_BLUE} metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Right column */}
            <mesh position={[width/2 - 0.2, height/2, z]} castShadow>
              <boxGeometry args={[0.4, height, 0.4]} />
              <meshStandardMaterial color={NAVY_BLUE} metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[width/2 - 0.2, height/2, z]}>
              <boxGeometry args={[0.6, height, 0.12]} />
              <meshStandardMaterial color={NAVY_BLUE} metalness={0.6} roughness={0.4} />
            </mesh>
          </group>
        )
      })}

      {/* === LOADING DOCKS (elevated dock levelers) === */}
      {/* Front dock bumpers */}
      {[-4, 4].map((x, i) => (
        <group key={`fdock-${i}`} position={[x, 0, depth/2 + 0.3]}>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[5.5, 1, 0.4]} />
            <meshStandardMaterial color="#374151" roughness={0.9} />
          </mesh>
          {/* Dock edge rubber bumpers */}
          {[-2, -1, 0, 1, 2].map((bx, bi) => (
            <mesh key={bi} position={[bx, 0.5, 0.22]}>
              <boxGeometry args={[0.6, 0.8, 0.12]} />
              <meshStandardMaterial color="#1F2937" roughness={0.95} />
            </mesh>
          ))}
        </group>
      ))}

      {/* === ROLL-UP DOORS === */}
      <RollUpDoor position={[-4, 0, depth/2]} width={5} height={5.5} />
      <RollUpDoor position={[4, 0, depth/2]} width={5} height={5.5} />
      
      <group rotation={[0, Math.PI, 0]}>
        <RollUpDoor position={[-4, 0, depth/2]} width={5} height={5.5} />
        <RollUpDoor position={[4, 0, depth/2]} width={5} height={5.5} />
      </group>
      
      {/* === PREMIUM ROOF (metal panel with ridges) === */}
      <mesh position={[0, height + 0.15, 0]} castShadow onClick={handleWarehouseClick}>
        <boxGeometry args={[width + 0.8, 0.35, depth + 0.8]} />
        <meshStandardMaterial color={ROOF_PANEL} roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Roof ridge lines */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`ridge-${i}`} position={[(i - 2.5) * 3, height + 0.35, 0]}>
          <boxGeometry args={[0.12, 0.1, depth + 0.8]} />
          <meshStandardMaterial color={STEEL_LIGHT} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      
      {/* === ROOF FASCIA (navy blue accent stripe) === */}
      {[[0, depth/2 + 0.42, width + 0.8, 0.2], [0, -depth/2 - 0.42, width + 0.8, 0.2], 
        [-width/2 - 0.42, 0, 0.2, depth + 0.8], [width/2 + 0.42, 0, 0.2, depth + 0.8]].map(([x, z, w, d], i) => (
        <mesh key={`fascia-${i}`} position={[x, height + 0.32, z]}>
          <boxGeometry args={[w, 0.4, d]} />
          <meshStandardMaterial color={NAVY_BLUE} metalness={0.4} roughness={0.5} />
        </mesh>
      ))}

      {/* === ROOFTOP EQUIPMENT === */}
      {/* HVAC units */}
      {[-5, 5].map((x, i) => (
        <group key={`hvac-${i}`} position={[x, height + 0.6, 0]}>
          <mesh>
            <boxGeometry args={[3, 1.2, 2]} />
            <meshStandardMaterial color="#9CA3AF" metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.6, 0.6, 0.3, 12]} />
            <meshStandardMaterial color="#6B7280" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Fan grill */}
          <mesh position={[0, 0.86, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.05, 12]} />
            <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {/* Antenna/sensor mast */}
      <mesh position={[0, height + 1.4, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 1.8, 6]} />
        <meshStandardMaterial color="#4B5563" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, height + 2.4, 0]}>
        <boxGeometry args={[0.6, 0.06, 0.06]} />
        <meshStandardMaterial color={ELECTRIC_BLUE} emissive={ELECTRIC_BLUE} emissiveIntensity={0.8} metalness={0.8} />
      </mesh>

      {/* === STATUS INDICATOR LIGHT === */}
      <mesh position={[width/2 - 0.5, height - 0.8, depth/2 - 0.5]}>
        <sphereGeometry args={[0.18, 10, 10]} />
        <meshStandardMaterial
          color={STATUS_GREEN}
          emissive={STATUS_GREEN}
          emissiveIntensity={2.5}
        />
      </mesh>
      <pointLight
        position={[width/2 - 0.5, height - 0.8, depth/2 - 0.5]}
        intensity={8}
        distance={6}
        color={STATUS_GREEN}
      />

      {/* === COMPANY SIGN === */}
      <mesh position={[0, height + 0.3, depth/2 + 0.25]}>
        <boxGeometry args={[8, 1.1, 0.15]} />
        <meshStandardMaterial color={NAVY_BLUE} metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Sign accent stripe */}
      <mesh position={[0, height + 0.3, depth/2 + 0.33]}>
        <boxGeometry args={[8, 0.12, 0.02]} />
        <meshStandardMaterial color={ELECTRIC_BLUE} emissive={ELECTRIC_BLUE} emissiveIntensity={1.2} />
      </mesh>

      {/* === FLOATING BUILDING LABEL === */}
      <Html position={[0, height + 3.2, 0]} center distanceFactor={60} occlude={false}>
        <div style={{
          background: 'rgba(15,36,71,0.92)',
          border: '1px solid rgba(14,165,233,0.6)',
          borderRadius: '8px',
          padding: '6px 14px',
          color: 'white',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          whiteSpace: 'nowrap',
          boxShadow: '0 0 16px rgba(14,165,233,0.3)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ 
            display: 'inline-block', 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: STATUS_GREEN,
            boxShadow: `0 0 6px ${STATUS_GREEN}`,
            flexShrink: 0,
          }} />
          {warehouseLabel}
        </div>
      </Html>
      
      {/* Interior racking with inventory packages */}
      <InteriorShelving warehouseId={warehouseId} warehousePosition={position} />
      
      {/* Click/hover detection */}
      <mesh 
        position={[0, height/2, 0]} 
        onClick={handleWarehouseClick} 
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        visible={false}
      >
        <boxGeometry args={[width, height, depth]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {/* Warehouse highlight outline */}
      {(isHovered || isSelected) && (
        <group position={[0, height/2, 0]}>
          {/* Bottom edge */}
          <mesh position={[0, -height/2 + 0.1, 0]}>
            <boxGeometry args={[width + 0.5, 0.2, depth + 0.5]} />
            <meshBasicMaterial 
              color={isSelected ? SELECTED_COLOR : HIGHLIGHT_COLOR} 
              transparent 
              opacity={isSelected ? 0.6 : 0.4}
            />
          </mesh>
          
          {/* Vertical corner edges */}
          {[
            [-width/2 - 0.15, -depth/2 - 0.15],
            [width/2 + 0.15, -depth/2 - 0.15],
            [-width/2 - 0.15, depth/2 + 0.15],
            [width/2 + 0.15, depth/2 + 0.15],
          ].map(([x, z], i) => (
            <mesh key={`corner-${i}`} position={[x, 0, z]}>
              <boxGeometry args={[0.3, height, 0.3]} />
              <meshBasicMaterial 
                color={isSelected ? SELECTED_COLOR : HIGHLIGHT_COLOR} 
                transparent 
                opacity={isSelected ? 0.6 : 0.4}
              />
            </mesh>
          ))}
          
          {/* Top edges */}
          <mesh position={[0, height/2 - 0.1, -depth/2 - 0.15]}>
            <boxGeometry args={[width + 0.5, 0.2, 0.3]} />
            <meshBasicMaterial 
              color={isSelected ? SELECTED_COLOR : HIGHLIGHT_COLOR} 
              transparent 
              opacity={isSelected ? 0.6 : 0.4}
            />
          </mesh>
          <mesh position={[0, height/2 - 0.1, depth/2 + 0.15]}>
            <boxGeometry args={[width + 0.5, 0.2, 0.3]} />
            <meshBasicMaterial 
              color={isSelected ? SELECTED_COLOR : HIGHLIGHT_COLOR} 
              transparent 
              opacity={isSelected ? 0.6 : 0.4}
            />
          </mesh>
          <mesh position={[-width/2 - 0.15, height/2 - 0.1, 0]}>
            <boxGeometry args={[0.3, 0.2, depth + 0.5]} />
            <meshBasicMaterial 
              color={isSelected ? SELECTED_COLOR : HIGHLIGHT_COLOR} 
              transparent 
              opacity={isSelected ? 0.6 : 0.4}
            />
          </mesh>
          <mesh position={[width/2 + 0.15, height/2 - 0.1, 0]}>
            <boxGeometry args={[0.3, 0.2, depth + 0.5]} />
            <meshBasicMaterial 
              color={isSelected ? SELECTED_COLOR : HIGHLIGHT_COLOR} 
              transparent 
              opacity={isSelected ? 0.6 : 0.4}
            />
          </mesh>
        </group>
      )}
      
      {/* Hover tooltip */}
      {isHovered && (
        <Html position={[0, height + 2, 0]} center distanceFactor={50}>
          <div className="bg-ana-blue text-white px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap text-sm font-medium pointer-events-none">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Click to view layout
            </span>
          </div>
        </Html>
      )}
    </group>
  )
}
