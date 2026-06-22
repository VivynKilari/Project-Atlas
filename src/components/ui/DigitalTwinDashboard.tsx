'use client'

import { useState, useEffect, useCallback } from 'react'

type ViewMode = 'normal' | 'traffic' | 'heatmap' | 'inventory' | 'analytics'

interface KPICardProps {
  label: string
  value: string
  unit?: string
  delta?: string
  deltaPositive?: boolean
  color: string
  glowColor: string
  icon: React.ReactNode
}

function KPICard({ label, value, unit, delta, deltaPositive, color, glowColor, icon }: KPICardProps) {
  return (
    <div style={{
      background: 'rgba(10, 20, 40, 0.88)',
      border: `1px solid ${color}40`,
      borderRadius: '10px',
      padding: '10px 14px',
      minWidth: '110px',
      backdropFilter: 'blur(12px)',
      boxShadow: `0 0 12px ${glowColor}22, inset 0 1px 0 rgba(255,255,255,0.05)`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow accent line at top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <span style={{ color, opacity: 0.9, display: 'flex' }}>{icon}</span>
        <span style={{ color: '#94A3B8', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
        <span style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>
          {value}
        </span>
        {unit && <span style={{ color: '#64748B', fontSize: '11px' }}>{unit}</span>}
      </div>
      {delta && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}>
          <span style={{ 
            color: deltaPositive ? '#10B981' : '#F59E0B', 
            fontSize: '10px', 
            fontWeight: 600 
          }}>
            {deltaPositive ? '▲' : '▼'} {delta}
          </span>
          <span style={{ color: '#475569', fontSize: '10px' }}>vs yesterday</span>
        </div>
      )}
    </div>
  )
}

function StatusIndicator({ label, status }: { label: string; status: 'running' | 'warning' | 'fault' }) {
  const colors = {
    running: '#10B981',
    warning: '#F59E0B',
    fault: '#EF4444',
  }
  const labels = {
    running: 'RUNNING',
    warning: 'WARNING',
    fault: 'FAULT',
  }
  const c = colors[status]
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '5px 10px',
      background: 'rgba(10, 20, 40, 0.85)',
      border: `1px solid ${c}30`,
      borderRadius: '6px',
      backdropFilter: 'blur(8px)',
    }}>
      <span style={{
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: c,
        boxShadow: `0 0 6px ${c}`,
        flexShrink: 0,
        animation: status === 'running' ? 'pulse 2s infinite' : 'none',
      }} />
      <span style={{ color: '#CBD5E1', fontSize: '11px', fontWeight: 600 }}>{label}</span>
      <span style={{ 
        color: c, 
        fontSize: '10px', 
        fontWeight: 700, 
        letterSpacing: '0.08em',
        marginLeft: 'auto',
        paddingLeft: '8px',
      }}>{labels[status]}</span>
    </div>
  )
}

const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'traffic', label: 'Traffic' },
  { id: 'heatmap', label: 'Heatmap' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'analytics', label: 'Analytics' },
]

// Animated counter hook
function useAnimatedValue(target: number, duration = 1200) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const from = 0
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setVal(Math.round(from + (target - from) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return val
}

export function DigitalTwinDashboard({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const [viewMode, setViewMode] = useState<ViewMode>('normal')
  const [tick, setTick] = useState(0)

  // Slowly drift metrics to feel live
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 4000)
    return () => clearInterval(interval)
  }, [])

  const oee = 87 + (tick % 3)
  const output = 1240 + tick * 2
  const inventory = 3842 - tick
  const activeVehicles = 6 + (tick % 2)
  const energy = 284 + (tick % 5)

  const oeeVal = useAnimatedValue(oee, 1000)

  return (
    <div className={className} style={{ pointerEvents: 'auto', ...style }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>

      {/* === TOP KPI BAR === */}
      <div style={{
        position: 'absolute',
        top: '72px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px',
        zIndex: 20,
        pointerEvents: 'none',
      }}>
        <KPICard
          label="OEE"
          value={`${oeeVal}`}
          unit="%"
          delta="2.3%"
          deltaPositive={true}
          color="#0EA5E9"
          glowColor="#0EA5E9"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
        />
        <KPICard
          label="Output"
          value={`${output}`}
          unit="pkg/h"
          delta="4.1%"
          deltaPositive={true}
          color="#10B981"
          glowColor="#10B981"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
        />
        <KPICard
          label="Inventory"
          value={`${inventory}`}
          unit="units"
          delta="0.8%"
          deltaPositive={false}
          color="#F59E0B"
          glowColor="#F59E0B"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>}
        />
        <KPICard
          label="AGVs Active"
          value={`${activeVehicles}`}
          unit=""
          delta="1"
          deltaPositive={true}
          color="#8B5CF6"
          glowColor="#8B5CF6"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>}
        />
        <KPICard
          label="Energy"
          value={`${energy}`}
          unit="kWh"
          delta="1.2%"
          deltaPositive={true}
          color="#06B6D4"
          glowColor="#06B6D4"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
        />
      </div>

      {/* === STATUS PANEL (right side) === */}
      <div style={{
        position: 'absolute',
        top: '140px',
        right: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        zIndex: 20,
        minWidth: '200px',
      }}>
        {/* Panel header */}
        <div style={{
          background: 'rgba(10, 20, 40, 0.92)',
          border: '1px solid rgba(14,165,233,0.3)',
          borderRadius: '8px',
          padding: '8px 12px',
          backdropFilter: 'blur(12px)',
          marginBottom: '2px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '8px', height: '8px', borderRadius: '50%', 
              background: '#10B981', boxShadow: '0 0 6px #10B981',
              animation: 'pulse 2s infinite',
            }} />
            <span style={{ color: '#94A3B8', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              System Status
            </span>
          </div>
        </div>

        <StatusIndicator label="Cargo Hub A" status="running" />
        <StatusIndicator label="Cargo Hub B" status="running" />
        <StatusIndicator label="AGV Network" status="running" />
        <StatusIndicator label="Conveyor Line 1" status="running" />
        <StatusIndicator label="Gate Control" status="warning" />
        <StatusIndicator label="Cold Storage" status="running" />
      </div>

      {/* === VIEW MODE TOGGLES (bottom center) === */}
      <div style={{
        position: 'absolute',
        bottom: '52px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '4px',
        zIndex: 20,
        background: 'rgba(10, 20, 40, 0.9)',
        border: '1px solid rgba(14,165,233,0.25)',
        borderRadius: '12px',
        padding: '5px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}>
        {VIEW_MODES.map(mode => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: viewMode === mode.id
                ? 'linear-gradient(135deg, #0F2447, #1E40AF)'
                : 'transparent',
              color: viewMode === mode.id ? '#38BDF8' : '#64748B',
              boxShadow: viewMode === mode.id ? '0 0 10px rgba(14,165,233,0.3)' : 'none',
            }}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* === HEATMAP OVERLAY (when heatmap mode) === */}
      {viewMode === 'heatmap' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 5,
          background: 'radial-gradient(ellipse 30% 20% at 35% 52%, rgba(239,68,68,0.15) 0%, transparent 70%), radial-gradient(ellipse 25% 18% at 62% 52%, rgba(249,115,22,0.12) 0%, transparent 70%), radial-gradient(ellipse 15% 12% at 50% 55%, rgba(234,179,8,0.08) 0%, transparent 60%)',
        }} />
      )}

      {/* === TRAFFIC OVERLAY (when traffic mode) === */}
      {viewMode === 'traffic' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 5,
          background: 'radial-gradient(ellipse 20% 8% at 50% 54%, rgba(16,185,129,0.12) 0%, transparent 70%)',
        }} />
      )}

      {/* === BOTTOM LEFT: Utilization mini bars === */}
      <div style={{
        position: 'absolute',
        bottom: '52px',
        left: '16px',
        zIndex: 20,
        background: 'rgba(10, 20, 40, 0.88)',
        border: '1px solid rgba(14,165,233,0.2)',
        borderRadius: '10px',
        padding: '10px 14px',
        minWidth: '170px',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ color: '#64748B', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Zone Utilization
        </div>
        {[
          { label: 'Import Zone', pct: 78, color: '#0EA5E9' },
          { label: 'Export Zone', pct: 64, color: '#10B981' },
          { label: 'Cold Storage', pct: 91, color: '#8B5CF6' },
          { label: 'Inspection', pct: 43, color: '#F59E0B' },
        ].map(({ label, pct, color }) => (
          <div key={label} style={{ marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ color: '#94A3B8', fontSize: '10px' }}>{label}</span>
              <span style={{ color, fontSize: '10px', fontWeight: 700 }}>{pct}%</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '3px', height: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: color,
                borderRadius: '3px',
                boxShadow: `0 0 4px ${color}`,
                transition: 'width 0.8s ease',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
