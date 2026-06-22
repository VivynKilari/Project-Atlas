'use client'

import { useState, useEffect } from 'react'
import { useWarehouseInventory } from '@/lib/warehouse-inventory'

interface BuildingDetailPanelProps {
  warehouseId: string
  onClose: () => void
  onOpenLayout?: () => void
}

function MetricRow({ label, value, unit, color = '#0EA5E9', barPct }: {
  label: string
  value: string | number
  unit?: string
  color?: string
  barPct?: number
}) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: barPct !== undefined ? '3px' : 0 }}>
        <span style={{ color: '#94A3B8', fontSize: '11px' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
          <span style={{ color: '#F1F5F9', fontSize: '15px', fontWeight: 700, fontFamily: 'monospace' }}>{value}</span>
          {unit && <span style={{ color: '#475569', fontSize: '10px' }}>{unit}</span>}
        </div>
      </div>
      {barPct !== undefined && (
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '3px', height: '4px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(barPct, 100)}%`,
            background: barPct >= 90 ? '#EF4444' : barPct >= 75 ? '#F59E0B' : color,
            borderRadius: '3px',
            transition: 'width 0.8s ease',
            boxShadow: barPct >= 90 ? '0 0 5px #EF4444' : undefined,
          }} />
        </div>
      )}
    </div>
  )
}

function HealthBadge({ status }: { status: 'healthy' | 'warning' | 'critical' }) {
  const map = {
    healthy: { color: '#10B981', label: 'Healthy', bg: 'rgba(16,185,129,0.12)' },
    warning: { color: '#F59E0B', label: 'Warning', bg: 'rgba(245,158,11,0.12)' },
    critical: { color: '#EF4444', label: 'Critical', bg: 'rgba(239,68,68,0.12)' },
  }
  const s = map[status]
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: s.bg, border: `1px solid ${s.color}40`,
      borderRadius: '5px', padding: '3px 8px',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color, boxShadow: `0 0 4px ${s.color}`, display: 'inline-block' }} />
      <span style={{ color: s.color, fontSize: '11px', fontWeight: 700 }}>{s.label}</span>
    </div>
  )
}

// Simulated live metrics that tick over time
function useBuildingMetrics(warehouseId: string) {
  const { getWarehouseStats, getShelvesByWarehouse } = useWarehouseInventory()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 4000)
    return () => clearInterval(iv)
  }, [])

  const stats = getWarehouseStats(warehouseId)
  const shelves = getShelvesByWarehouse(warehouseId)
  const totalPackages = shelves.reduce((s, sh) => s + sh.packages.length, 0)

  const isA = warehouseId === 'warehouse-1'

  return {
    name: isA ? 'Cargo Hub A' : 'Cargo Hub B',
    code: isA ? 'NRT-A1' : 'NRT-A2',
    location: isA ? 'Terminal West' : 'Terminal East',
    storageUtilization: isA ? 74 + (tick % 4) : 85 + (tick % 3),
    storageUsed: isA ? `${(18.5 + tick * 0.01).toFixed(1)}k` : `${(21.2 + tick * 0.01).toFixed(1)}k`,
    storageTotal: '25.0k',
    inboundShipments: isA ? 45 + (tick % 5) : 38 + (tick % 4),
    outboundShipments: isA ? 32 + (tick % 3) : 28 + (tick % 3),
    activeVehicles: isA ? 4 + (tick % 2) : 3 + (tick % 2),
    energyUsage: isA ? 152 + (tick % 8) : 138 + (tick % 6),
    temperature: isA ? `${22 + (tick % 2)}°C` : `${21 + (tick % 2)}°C`,
    humidity: isA ? `${48 + (tick % 4)}%` : `${50 + (tick % 3)}%`,
    throughput: isA ? 580 + tick * 2 : 640 + tick * 2,
    systemHealth: isA ? ('healthy' as const) : ('healthy' as const),
    totalPackagesLive: totalPackages,
    docksBusy: isA ? 3 : 2,
    docksTotal: 4,
    efficiency: isA ? 89 + (tick % 3) : 92 + (tick % 2),
    uptime: 99.7,
  }
}

export function BuildingDetailPanel({ warehouseId, onClose, onOpenLayout }: BuildingDetailPanelProps) {
  const m = useBuildingMetrics(warehouseId)

  return (
    <div style={{
      position: 'absolute',
      left: '16px',
      top: '80px',
      width: '300px',
      maxHeight: 'calc(100vh - 120px)',
      overflowY: 'auto',
      zIndex: 25,
      background: 'rgba(8, 15, 32, 0.97)',
      border: '1px solid rgba(14,165,233,0.35)',
      borderRadius: '12px',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 40px rgba(0,0,0,0.65)',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0D1F40 0%, #122050 100%)',
        padding: '14px 16px',
        borderBottom: '1px solid rgba(14,165,233,0.2)',
        position: 'sticky', top: 0, zIndex: 2,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: '#475569', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '3px' }}>
              Digital Twin — Building Asset
            </div>
            <div style={{ color: '#F1F5F9', fontSize: '16px', fontWeight: 700, letterSpacing: '0.02em' }}>{m.name}</div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '5px', alignItems: 'center' }}>
              <span style={{ color: '#64748B', fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: '4px' }}>
                {m.code}
              </span>
              <span style={{ color: '#64748B', fontSize: '10px' }}>{m.location}</span>
              <HealthBadge status={m.systemHealth} />
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '4px 6px', color: '#64748B', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px' }}>

        {/* ── UTILIZATION ── */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ color: '#475569', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
            Storage
          </div>
          <MetricRow label="Storage Utilization" value={m.storageUtilization} unit="%" color="#0EA5E9" barPct={m.storageUtilization} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#334155', marginTop: '-4px', marginBottom: '8px' }}>
            <span>{m.storageUsed} kg used</span>
            <span>{m.storageTotal} kg capacity</span>
          </div>
          <MetricRow label="Total Packages" value={m.totalPackagesLive || '--'} unit="units" color="#8B5CF6" />
          <MetricRow label="Efficiency Score" value={m.efficiency} unit="%" color="#10B981" barPct={m.efficiency} />
        </div>

        {/* ── SHIPMENTS ── */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
          <div style={{ color: '#475569', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Shipments (Live)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { label: 'Inbound', value: m.inboundShipments, color: '#10B981', icon: '↓' },
              { label: 'Outbound', value: m.outboundShipments, color: '#F59E0B', icon: '↑' },
              { label: 'Throughput', value: `${m.throughput}`, unit: '/h', color: '#0EA5E9', icon: '⟳' },
              { label: 'Active AGVs', value: m.activeVehicles, color: '#8B5CF6', icon: '◈' },
            ].map((item) => (
              <div key={item.label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '8px 10px' }}>
                <div style={{ color: '#475569', fontSize: '9px', marginBottom: '3px' }}>{item.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                  <span style={{ color: item.color, fontSize: '20px', fontWeight: 700, fontFamily: 'monospace' }}>{item.value}</span>
                  {item.unit && <span style={{ color: '#334155', fontSize: '9px' }}>{item.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── DOCKS ── */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ color: '#475569', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Loading Docks</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: m.docksTotal }).map((_, i) => {
              const busy = i < m.docksBusy
              return (
                <div key={i} style={{
                  flex: 1, height: '28px', borderRadius: '5px',
                  background: busy ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${busy ? 'rgba(14,165,233,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: busy ? '#38BDF8' : '#334155' }}>
                    {busy ? 'ACTIVE' : 'FREE'}
                  </span>
                </div>
              )
            })}
          </div>
          <div style={{ color: '#334155', fontSize: '9px', marginTop: '4px', textAlign: 'right' }}>
            {m.docksBusy}/{m.docksTotal} docks active
          </div>
        </div>

        {/* ── ENVIRONMENT & ENERGY ── */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
          <div style={{ color: '#475569', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Environment & Energy</div>
          <MetricRow label="Energy Usage" value={m.energyUsage} unit="kWh" color="#06B6D4" barPct={(m.energyUsage / 200) * 100} />
          <MetricRow label="Temperature" value={m.temperature} color="#F97316" />
          <MetricRow label="Humidity" value={m.humidity} color="#8B5CF6" />
          <MetricRow label="System Uptime" value={m.uptime} unit="%" color="#10B981" />
        </div>

        {/* ── OPEN LAYOUT BUTTON ── */}
        {onOpenLayout && (
          <button
            onClick={onOpenLayout}
            style={{
              width: '100%',
              padding: '9px',
              background: 'linear-gradient(135deg, #0F2447, #1E40AF)',
              border: '1px solid rgba(14,165,233,0.4)',
              borderRadius: '8px',
              color: '#38BDF8',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              boxShadow: '0 0 14px rgba(14,165,233,0.18)',
              transition: 'box-shadow 0.2s ease',
            }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
            Open Full Inventory Layout
          </button>
        )}
      </div>
    </div>
  )
}
