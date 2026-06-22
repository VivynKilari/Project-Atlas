'use client'

import { useState, useEffect } from 'react'
import { useViewModeContext, ViewMode, DayNightMode } from '@/lib/contexts/view-mode-context'

// ─────────────────────────────────────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────────────────────────────────────
interface KPICardProps {
  label: string
  value: string | number
  unit?: string
  delta?: string
  deltaPositive?: boolean
  color: string
  icon: React.ReactNode
}

function KPICard({ label, value, unit, delta, deltaPositive, color, icon }: KPICardProps) {
  return (
    <div style={{
      background: 'rgba(10, 18, 38, 0.92)',
      border: `1px solid ${color}40`,
      borderRadius: '10px',
      padding: '10px 14px',
      minWidth: '108px',
      backdropFilter: 'blur(14px)',
      boxShadow: `0 0 14px ${color}18, inset 0 1px 0 rgba(255,255,255,0.04)`,
      position: 'relative',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
        <span style={{ color, opacity: 0.9 }}>{icon}</span>
        <span style={{ color: '#64748B', fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
        <span style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>{value}</span>
        {unit && <span style={{ color: '#475569', fontSize: '11px' }}>{unit}</span>}
      </div>
      {delta && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
          <span style={{ color: deltaPositive ? '#10B981' : '#F59E0B', fontSize: '10px', fontWeight: 600 }}>
            {deltaPositive ? '▲' : '▼'} {delta}
          </span>
          <span style={{ color: '#334155', fontSize: '10px' }}>vs prev</span>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Indicator
// ─────────────────────────────────────────────────────────────────────────────
function StatusIndicator({ label, status, detail }: { label: string; status: 'running' | 'warning' | 'fault'; detail?: string }) {
  const colors = { running: '#10B981', warning: '#F59E0B', fault: '#EF4444' }
  const labels = { running: 'ONLINE', warning: 'WARN', fault: 'FAULT' }
  const c = colors[status]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '6px 10px',
      background: 'rgba(10, 18, 38, 0.8)',
      border: `1px solid ${c}22`,
      borderRadius: '6px',
      backdropFilter: 'blur(8px)',
    }}>
      <span style={{
        width: '7px', height: '7px', borderRadius: '50%',
        background: c, boxShadow: `0 0 5px ${c}`,
        flexShrink: 0,
        animation: status === 'running' ? 'dtPulse 2.4s infinite' : 'none',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ color: '#CBD5E1', fontSize: '11px', fontWeight: 600, display: 'block' }}>{label}</span>
        {detail && <span style={{ color: '#475569', fontSize: '9px' }}>{detail}</span>}
      </div>
      <span style={{ color: c, fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', flexShrink: 0 }}>{labels[status]}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Zone Utilization Bar
// ─────────────────────────────────────────────────────────────────────────────
function ZoneBar({ label, pct, color, capacity }: { label: string; pct: number; color: string; capacity?: string }) {
  const isHigh = pct >= 85
  const barColor = pct >= 90 ? '#EF4444' : pct >= 75 ? '#F59E0B' : color
  return (
    <div style={{ marginBottom: '7px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
        <span style={{ color: '#94A3B8', fontSize: '10px' }}>{label}</span>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {capacity && <span style={{ color: '#475569', fontSize: '9px' }}>{capacity}</span>}
          <span style={{ color: barColor, fontSize: '11px', fontWeight: 700 }}>{pct}%</span>
        </div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '3px', height: '5px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: barColor,
          borderRadius: '3px', boxShadow: isHigh ? `0 0 6px ${barColor}` : 'none',
          transition: 'width 0.8s ease, background 0.4s ease',
        }} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics Panel (for Analytics view mode)
// ─────────────────────────────────────────────────────────────────────────────
function AnalyticsPanel({ tick }: { tick: number }) {
  const kpis = [
    { label: 'OEE Score', value: (87 + tick % 4).toFixed(1), unit: '%', color: '#0EA5E9', trend: '+2.1%', up: true },
    { label: 'Throughput', value: (1240 + tick * 3).toString(), unit: 'pkg/h', color: '#10B981', trend: '+4.3%', up: true },
    { label: 'Cycle Time', value: (18 - tick % 3).toFixed(0), unit: 'min', color: '#F59E0B', trend: '-0.8%', up: true },
    { label: 'Defect Rate', value: (1.2 - (tick % 2) * 0.1).toFixed(1), unit: '%', color: '#EF4444', trend: '-0.3%', up: true },
    { label: 'Availability', value: (98 + tick % 2).toFixed(0), unit: '%', color: '#8B5CF6', trend: '+0.5%', up: true },
    { label: 'Energy/Unit', value: (2.4 - (tick % 3) * 0.05).toFixed(2), unit: 'kWh', color: '#06B6D4', trend: '-1.2%', up: true },
  ]

  const trends = [
    { h: 62 }, { h: 74 }, { h: 58 }, { h: 81 }, { h: 70 }, { h: 88 }, { h: 76 }, { h: 91 }, { h: 84 }, { h: 87 + tick % 4 },
  ]

  return (
    <div style={{
      position: 'absolute', top: '72px', right: '16px',
      width: '260px', zIndex: 25,
      background: 'rgba(8, 15, 32, 0.96)',
      border: '1px solid rgba(14,165,233,0.3)',
      borderRadius: '12px',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 5px #10B981', animation: 'dtPulse 2s infinite' }} />
        <span style={{ color: '#94A3B8', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Operational Analytics</span>
      </div>
      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.04)' }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ padding: '10px 12px', background: 'rgba(8, 15, 32, 0.9)' }}>
            <div style={{ color: '#475569', fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '3px' }}>{k.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: '2px' }}>
              <span style={{ color: '#F1F5F9', fontSize: '19px', fontWeight: 700, fontFamily: 'monospace' }}>{k.value}</span>
              <span style={{ color: '#475569', fontSize: '10px' }}>{k.unit}</span>
            </div>
            <span style={{ color: k.up ? '#10B981' : '#EF4444', fontSize: '9px', fontWeight: 600 }}>{k.up ? '▲' : '▼'} {k.trend}</span>
          </div>
        ))}
      </div>
      {/* Trend Sparkline */}
      <div style={{ padding: '10px 14px 12px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ color: '#475569', fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>OEE Trend — Last 10 Cycles</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '36px' }}>
          {trends.map((t, i) => (
            <div key={i} style={{ flex: 1, background: i === trends.length - 1 ? '#0EA5E9' : 'rgba(14,165,233,0.35)', borderRadius: '2px 2px 0 0', height: `${t.h}%`, transition: 'height 0.5s ease' }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ color: '#334155', fontSize: '9px' }}>-10 cycles</span>
          <span style={{ color: '#334155', fontSize: '9px' }}>Now</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Traffic Panel
// ─────────────────────────────────────────────────────────────────────────────
function TrafficPanel({ tick }: { tick: number }) {
  const routes = [
    { label: 'Main Entry Road', vehicles: 4 + (tick % 3), status: 'clear', flow: 72 },
    { label: 'Dock Access W1', vehicles: 2 + (tick % 2), status: 'busy', flow: 88 },
    { label: 'Dock Access W2', vehicles: 3 + (tick % 2), status: 'clear', flow: 60 },
    { label: 'AGV Corridor A', vehicles: 6 + (tick % 4), status: 'active', flow: 95 },
    { label: 'AGV Corridor B', vehicles: 5 + (tick % 3), status: 'active', flow: 80 },
    { label: 'Exit Road', vehicles: 1 + (tick % 2), status: 'clear', flow: 40 },
  ]

  const statusColor = { clear: '#10B981', busy: '#F59E0B', active: '#0EA5E9' }

  return (
    <div style={{
      position: 'absolute', top: '72px', right: '16px',
      width: '240px', zIndex: 25,
      background: 'rgba(8, 15, 32, 0.96)',
      border: '1px solid rgba(14,165,233,0.3)',
      borderRadius: '12px',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0EA5E9', boxShadow: '0 0 5px #0EA5E9', animation: 'dtPulse 1.8s infinite' }} />
        <span style={{ color: '#94A3B8', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Live Traffic Monitor</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        {routes.map((r) => {
          const sc = statusColor[r.status as keyof typeof statusColor]
          return (
            <div key={r.label} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <span style={{ color: '#CBD5E1', fontSize: '10px', fontWeight: 600 }}>{r.label}</span>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ color: '#94A3B8', fontSize: '9px' }}>{r.vehicles}v</span>
                  <span style={{ color: sc, fontSize: '9px', fontWeight: 700, background: `${sc}15`, padding: '1px 5px', borderRadius: '3px', textTransform: 'uppercase' }}>{r.status}</span>
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '3px', height: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${r.flow}%`, background: `linear-gradient(90deg, ${sc}, ${sc}aa)`, borderRadius: '3px', transition: 'width 0.6s ease', animation: r.status === 'active' ? 'trafficFlow 1.5s linear infinite' : 'none' }} />
              </div>
            </div>
          )
        })}
        <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(14,165,233,0.06)', borderRadius: '7px', border: '1px solid rgba(14,165,233,0.12)' }}>
          <div style={{ color: '#475569', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Total Active Vehicles</div>
          <div style={{ color: '#38BDF8', fontSize: '24px', fontWeight: 700, fontFamily: 'monospace' }}>
            {routes.reduce((s, r) => s + r.vehicles, 0)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Inventory Panel
// ─────────────────────────────────────────────────────────────────────────────
function InventoryPanel({ tick }: { tick: number }) {
  const zones = [
    { label: 'Cargo Hub A — Import Zone', used: 18500 - tick * 10, total: 25000, pct: 74 - (tick % 3), color: '#0EA5E9' },
    { label: 'Cargo Hub A — Cold Storage', used: 6200 + tick * 5, total: 8000, pct: 78 + (tick % 4), color: '#8B5CF6' },
    { label: 'Cargo Hub B — Export Zone', used: 21200 + tick * 8, total: 25000, pct: 85 + (tick % 3), color: '#10B981' },
    { label: 'Cargo Hub B — Inspection', used: 3400 - tick * 4, total: 8000, pct: 43 - (tick % 2), color: '#F59E0B' },
    { label: 'Transit Dock A', used: 8900 + tick * 6, total: 12000, pct: 74 + (tick % 3), color: '#06B6D4' },
    { label: 'Transit Dock B', used: 4300 + tick * 3, total: 12000, pct: 36 + (tick % 2), color: '#F97316' },
  ]

  const totalUnits = 3842 - tick
  const totalIn = 45 + (tick % 5)
  const totalOut = 32 + (tick % 4)

  return (
    <div style={{
      position: 'absolute', top: '72px', right: '16px',
      width: '260px', zIndex: 25,
      background: 'rgba(8, 15, 32, 0.96)',
      border: '1px solid rgba(14,165,233,0.3)',
      borderRadius: '12px',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 5px #F59E0B', animation: 'dtPulse 2.2s infinite' }} />
        <span style={{ color: '#94A3B8', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Inventory Status</span>
      </div>
      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {[
          { label: 'Total Units', value: totalUnits.toLocaleString(), color: '#F1F5F9' },
          { label: 'Inbound', value: `+${totalIn}`, color: '#10B981' },
          { label: 'Outbound', value: `-${totalOut}`, color: '#F59E0B' },
        ].map((s) => (
          <div key={s.label} style={{ padding: '8px', background: 'rgba(8,15,32,0.9)', textAlign: 'center' }}>
            <div style={{ color: '#475569', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            <div style={{ color: s.color, fontSize: '16px', fontWeight: 700, fontFamily: 'monospace', marginTop: '2px' }}>{s.value}</div>
          </div>
        ))}
      </div>
      {/* Zone breakdown */}
      <div style={{ padding: '10px 14px' }}>
        {zones.map((z) => (
          <ZoneBar key={z.label} label={z.label} pct={Math.min(z.pct, 100)} color={z.color} capacity={`${(z.used / 1000).toFixed(0)}k/${(z.total / 1000).toFixed(0)}k kg`} />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Heatmap Legend
// ─────────────────────────────────────────────────────────────────────────────
function HeatmapLegend() {
  return (
    <div style={{
      position: 'absolute', top: '72px', right: '16px',
      zIndex: 25,
      background: 'rgba(8, 15, 32, 0.96)',
      border: '1px solid rgba(14,165,233,0.25)',
      borderRadius: '12px',
      backdropFilter: 'blur(20px)',
      padding: '12px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      minWidth: '200px',
    }}>
      <div style={{ color: '#94A3B8', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Utilization Heatmap</div>
      {/* Color scale */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ height: '10px', borderRadius: '5px', background: 'linear-gradient(90deg, #10B981, #EAB308, #F97316, #EF4444)', marginBottom: '4px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {['Low', '25%', '50%', '75%', 'High'].map((l) => (
            <span key={l} style={{ color: '#475569', fontSize: '9px' }}>{l}</span>
          ))}
        </div>
      </div>
      {/* Zones */}
      {[
        { label: 'Cargo Hub A', intensity: 74, color: '#EAB308' },
        { label: 'Cargo Hub B', intensity: 85, color: '#F97316' },
        { label: 'Loading Docks', intensity: 92, color: '#EF4444' },
        { label: 'Parking / Roads', intensity: 45, color: '#10B981' },
        { label: 'Storage Yards', intensity: 60, color: '#84CC16' },
      ].map((z) => (
        <div key={z.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: z.color, boxShadow: `0 0 4px ${z.color}` }} />
            <span style={{ color: '#CBD5E1', fontSize: '10px' }}>{z.label}</span>
          </div>
          <span style={{ color: z.color, fontSize: '10px', fontWeight: 700 }}>{z.intensity}%</span>
        </div>
      ))}
      <div style={{ marginTop: '10px', padding: '7px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px' }}>
        <span style={{ color: '#FCA5A5', fontSize: '10px', fontWeight: 600 }}>Loading Docks at 92% capacity</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated counter hook
// ─────────────────────────────────────────────────────────────────────────────
function useAnimatedValue(target: number, duration = 1000) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setVal(Math.round(target * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return val
}

// ─────────────────────────────────────────────────────────────────────────────
// View Mode Tab Bar
// ─────────────────────────────────────────────────────────────────────────────
const VIEW_MODES: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'normal', label: 'Normal', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { id: 'traffic', label: 'Traffic', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> },
  { id: 'heatmap', label: 'Heatmap', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> },
  { id: 'inventory', label: 'Inventory', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg> },
  { id: 'analytics', label: 'Analytics', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
]

const MODE_ACCENT: Record<ViewMode, string> = {
  normal: '#0EA5E9',
  traffic: '#10B981',
  heatmap: '#F97316',
  inventory: '#F59E0B',
  analytics: '#8B5CF6',
}

// ─────────────────────────────────────────────────────────────────────────────
// Day/Night Toggle
// ─────────────────────────────────────────────────────────────────────────────
function DayNightToggle({ mode, onToggle }: { mode: DayNightMode; onToggle: () => void }) {
  const isDay = mode === 'day'
  return (
    <button
      onClick={onToggle}
      title={isDay ? 'Switch to Night Mode' : 'Switch to Day Mode'}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '5px 11px',
        background: isDay ? 'rgba(254,243,199,0.1)' : 'rgba(30,27,75,0.7)',
        border: isDay ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(99,102,241,0.4)',
        borderRadius: '8px',
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.3s ease',
      }}
    >
      {isDay ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#FCD34D" stroke="#FCD34D" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <span style={{ color: '#FCD34D', fontSize: '11px', fontWeight: 700 }}>Day</span>
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#818CF8" stroke="#818CF8" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          <span style={{ color: '#818CF8', fontSize: '11px', fontWeight: 700 }}>Night</span>
        </>
      )}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────────────────────
export function DigitalTwinDashboard({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const { viewMode, setViewMode, dayNight, setDayNight } = useViewModeContext()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 3500)
    return () => clearInterval(iv)
  }, [])

  const oee = 87 + (tick % 3)
  const output = 1240 + tick * 2
  const inventory = 3842 - tick
  const agvActive = 6 + (tick % 2)
  const energy = 284 + (tick % 5)
  const oeeAnimated = useAnimatedValue(oee)

  const accent = MODE_ACCENT[viewMode]

  return (
    <div className={className} style={{ pointerEvents: 'auto', ...style }}>
      <style>{`
        @keyframes dtPulse { 0%,100%{opacity:1}50%{opacity:0.35} }
        @keyframes trafficFlow { 0%{opacity:1}50%{opacity:0.6}100%{opacity:1} }
        @keyframes heatPulse { 0%,100%{opacity:0.7}50%{opacity:1} }
      `}</style>

      {/* ── TOP KPI BAR ── */}
      <div style={{
        position: 'absolute', top: '72px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '6px', zIndex: 20, pointerEvents: 'none',
        flexWrap: 'wrap', justifyContent: 'center',
      }}>
        <KPICard label="OEE" value={oeeAnimated} unit="%" delta="2.3%" deltaPositive color="#0EA5E9"
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>} />
        <KPICard label="Throughput" value={output} unit="pkg/h" delta="4.1%" deltaPositive color="#10B981"
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>} />
        <KPICard label="Inventory" value={inventory} unit="units" delta="0.8%" color="#F59E0B"
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>} />
        <KPICard label="AGVs Active" value={agvActive} delta="1" deltaPositive color="#8B5CF6"
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>} />
        <KPICard label="Energy" value={energy} unit="kWh" delta="1.2%" deltaPositive color="#06B6D4"
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>} />
      </div>

      {/* ── VIEW-MODE SPECIFIC RIGHT PANELS ── */}
      {viewMode === 'analytics' && <AnalyticsPanel tick={tick} />}
      {viewMode === 'traffic' && <TrafficPanel tick={tick} />}
      {viewMode === 'inventory' && <InventoryPanel tick={tick} />}
      {viewMode === 'heatmap' && <HeatmapLegend />}

      {/* ── SYSTEM STATUS PANEL — shown on normal/heatmap modes, left of truck panel zone ── */}
      {(viewMode === 'normal' || viewMode === 'heatmap') && (
        <div style={{
          position: 'absolute', top: '140px', right: '16px',
          display: 'flex', flexDirection: 'column', gap: '5px',
          zIndex: 20, minWidth: '210px',
        }}>
          <div style={{
            background: 'rgba(8, 15, 32, 0.95)',
            border: '1px solid rgba(14,165,233,0.3)',
            borderRadius: '9px', padding: '8px 12px',
            backdropFilter: 'blur(14px)',
            marginBottom: '2px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 5px #10B981', animation: 'dtPulse 2s infinite' }} />
                <span style={{ color: '#94A3B8', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>System Status</span>
              </div>
              <span style={{ color: '#10B981', fontSize: '9px', fontWeight: 600 }}>ALL SYSTEMS</span>
            </div>
          </div>
          <StatusIndicator label="Cargo Hub A" status="running" detail="78% capacity" />
          <StatusIndicator label="Cargo Hub B" status="running" detail="85% capacity" />
          <StatusIndicator label="AGV Network" status="running" detail={`${agvActive}/8 active`} />
          <StatusIndicator label="Conveyor Line 1" status="running" detail="Normal speed" />
          <StatusIndicator label="Gate Control" status="warning" detail="Queue: 3 trucks" />
          <StatusIndicator label="Cold Storage" status="running" detail="-2°C" />
          <StatusIndicator label="Power Grid" status="running" detail={`${energy} kWh`} />
        </div>
      )}

      {/* ── HEATMAP SCENE OVERLAY ── */}
      {viewMode === 'heatmap' && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5,
          background: [
            'radial-gradient(ellipse 28% 18% at 34% 52%, rgba(239,68,68,0.22) 0%, transparent 70%)',
            'radial-gradient(ellipse 24% 16% at 62% 52%, rgba(249,115,22,0.18) 0%, transparent 70%)',
            'radial-gradient(ellipse 32% 10% at 50% 60%, rgba(234,179,8,0.1) 0%, transparent 60%)',
            'radial-gradient(ellipse 16% 8% at 36% 58%, rgba(239,68,68,0.15) 0%, transparent 50%)',
          ].join(', '),
          animation: 'heatPulse 3s ease-in-out infinite',
        }} />
      )}

      {/* ── TRAFFIC SCENE OVERLAY ── */}
      {viewMode === 'traffic' && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5,
          background: [
            'radial-gradient(ellipse 20% 6% at 50% 56%, rgba(16,185,129,0.14) 0%, transparent 70%)',
            'radial-gradient(ellipse 12% 4% at 36% 56%, rgba(16,185,129,0.10) 0%, transparent 60%)',
            'radial-gradient(ellipse 12% 4% at 64% 56%, rgba(16,185,129,0.10) 0%, transparent 60%)',
          ].join(', '),
        }} />
      )}

      {/* ── INVENTORY SCENE OVERLAY ── */}
      {viewMode === 'inventory' && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5,
          background: [
            'radial-gradient(ellipse 22% 14% at 34% 50%, rgba(245,158,11,0.12) 0%, transparent 70%)',
            'radial-gradient(ellipse 22% 14% at 66% 50%, rgba(245,158,11,0.12) 0%, transparent 70%)',
          ].join(', '),
        }} />
      )}

      {/* ── BOTTOM LEFT: Zone Utilization ── */}
      <div style={{
        position: 'absolute', bottom: '52px', left: '16px',
        zIndex: 20,
        background: 'rgba(8, 15, 32, 0.92)',
        border: '1px solid rgba(14,165,233,0.2)',
        borderRadius: '10px',
        padding: '10px 14px',
        minWidth: '180px',
        maxWidth: '200px',
        backdropFilter: 'blur(14px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}>
        <div style={{ color: '#475569', fontSize: '9px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Zone Utilization
        </div>
        <ZoneBar label="Import Zone" pct={78 + (tick % 3)} color="#0EA5E9" />
        <ZoneBar label="Export Zone" pct={64 + (tick % 2)} color="#10B981" />
        <ZoneBar label="Cold Storage" pct={91 - (tick % 2)} color="#8B5CF6" />
        <ZoneBar label="Inspection" pct={43 + (tick % 3)} color="#F59E0B" />
        <ZoneBar label="Transit Docks" pct={72 + (tick % 4)} color="#06B6D4" />
      </div>

      {/* ── BOTTOM CENTER: View Mode Tabs + Day/Night ── */}
      <div style={{
        position: 'absolute', bottom: '52px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: '6px', zIndex: 20,
      }}>
        {/* View Mode Tabs */}
        <div style={{
          display: 'flex', gap: '3px',
          background: 'rgba(8, 15, 32, 0.92)',
          border: '1px solid rgba(14,165,233,0.2)',
          borderRadius: '12px', padding: '4px',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {VIEW_MODES.map(mode => {
            const isActive = viewMode === mode.id
            const modeAccent = MODE_ACCENT[mode.id]
            return (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '5px 12px', borderRadius: '8px',
                  fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em',
                  border: 'none', cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  background: isActive ? `linear-gradient(135deg, rgba(10,20,50,0.98), rgba(20,30,70,0.98))` : 'transparent',
                  color: isActive ? modeAccent : '#475569',
                  boxShadow: isActive ? `0 0 12px ${modeAccent}30, inset 0 0 0 1px ${modeAccent}40` : 'none',
                }}
              >
                <span style={{ color: isActive ? modeAccent : '#374151' }}>{mode.icon}</span>
                {mode.label}
              </button>
            )
          })}
        </div>
        {/* Day/Night Toggle */}
        <DayNightToggle mode={dayNight} onToggle={() => setDayNight(dayNight === 'day' ? 'night' : 'day')} />
      </div>
    </div>
  )
}
