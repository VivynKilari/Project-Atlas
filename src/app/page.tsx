'use client'

import dynamic from 'next/dynamic'
import { Suspense, useState, useEffect } from 'react'
import { CargoMenu } from '@/components/ui/cargo-menu'
import { WarehouseLayoutPanel } from '@/components/ui/warehouse-layout'
import { TourGuide, TourButton } from '@/components/ui/tour-guide'
import { DigitalTwinDashboard } from '@/components/ui/DigitalTwinDashboard'
import { WarehouseInventoryProvider } from '@/lib/warehouse-inventory'
import { warehouses } from '@/lib/mock-data'

const WarehouseScene = dynamic(
  () => import('@/components/canvas/warehouse-scene').then(mod => ({ default: mod.WarehouseScene })),
  { ssr: false }
)

function LiveClock() {
  const [time, setTime] = useState<Date | null>(null)
  
  useEffect(() => {
    setTime(new Date())
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  
  if (!time) return null
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }
  
  return (
    <div className="text-right">
      <p style={{ color: '#64748B', fontSize: '10px' }}>{formatDate(time)}</p>
      <p style={{ color: '#38BDF8', fontSize: '16px', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em' }}>
        {formatTime(time)}
      </p>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div style={{ 
      width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0A1226',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'inline-block', width: '48px', height: '48px',
          border: '3px solid rgba(14,165,233,0.2)',
          borderTop: '3px solid #0EA5E9',
          borderRadius: '50%',
          animation: 'spin 0.9s linear infinite',
          marginBottom: '16px',
        }} />
        <p style={{ color: '#64748B', fontWeight: 600, fontSize: '14px', letterSpacing: '0.06em' }}>
          Initializing Digital Twin Platform...
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function Home() {
  const [showCargoMenu, setShowCargoMenu] = useState(false)
  const [activeWarehouseLayout, setActiveWarehouseLayout] = useState<string | null>(null)
  const [showTour, setShowTour] = useState(false)
  
  const activeWarehouse = activeWarehouseLayout 
    ? warehouses.find(w => w.id === activeWarehouseLayout) 
    : null
  
  return (
    <WarehouseInventoryProvider>
      <main className="relative w-full h-screen overflow-hidden">
        <header style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
          background: 'rgba(10, 18, 38, 0.94)',
          borderBottom: '1px solid rgba(14,165,233,0.2)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            {/* Logo + Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #0F2447, #1E40AF)',
                border: '1px solid rgba(14,165,233,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 12px rgba(14,165,233,0.25)',
              }}>
                <svg width="20" height="20" fill="none" stroke="#38BDF8" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <div style={{ color: '#F1F5F9', fontWeight: 700, fontSize: '15px', letterSpacing: '0.01em' }}>
                  Digital Twin Platform
                </div>
                <div style={{ color: '#475569', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Industry 4.0 — Cargo Operations
                </div>
              </div>
            </div>

            {/* Center controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <TourButton onClick={() => setShowTour(true)} />

              <div id="warehouse-buttons" style={{ 
                display: 'flex', alignItems: 'center',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', padding: '4px',
              }}>
                {(['warehouse-1', 'warehouse-2'] as const).map((id, i) => (
                  <button
                    key={id}
                    id={i === 0 ? 'warehouse-buttons' : undefined}
                    onClick={() => setActiveWarehouseLayout(id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '7px',
                      padding: '6px 14px', borderRadius: '7px',
                      background: activeWarehouseLayout === id ? 'linear-gradient(135deg, #0F2447, #1E40AF)' : 'transparent',
                      border: activeWarehouseLayout === id ? '1px solid rgba(14,165,233,0.4)' : '1px solid transparent',
                      color: activeWarehouseLayout === id ? '#38BDF8' : '#64748B',
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Hub {i === 0 ? 'A' : 'B'}
                  </button>
                ))}
              </div>

              <button
                id="cargo-tracking-btn"
                onClick={() => setShowCargoMenu(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '7px 16px',
                  background: 'linear-gradient(135deg, #0F2447, #1E40AF)',
                  border: '1px solid rgba(14,165,233,0.5)',
                  borderRadius: '10px',
                  color: '#38BDF8', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  boxShadow: '0 0 14px rgba(14,165,233,0.2)',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Cargo Tracking
              </button>
            </div>

            {/* Right: Clock + Live status */}
            <div id="live-status" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
              <LiveClock />
              <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#475569', fontSize: '10px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Live Status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end', marginTop: '2px' }}>
                  <span style={{ 
                    display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', 
                    background: '#10B981', boxShadow: '0 0 5px #10B981',
                  }} />
                  <span style={{ color: '#10B981', fontSize: '12px', fontWeight: 700 }}>Operational</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <Suspense fallback={<LoadingFallback />}>
          <div className="canvas-container">
            <WarehouseScene onOpenWarehouseLayout={setActiveWarehouseLayout} />
          </div>
        </Suspense>

        {/* Industry 4.0 Dashboard Overlay */}
        <DigitalTwinDashboard style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 } as React.CSSProperties} />

        <div style={{
          position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 10, marginLeft: '0',
        }}>
          {/* spacer - the view mode buttons are rendered inside DigitalTwinDashboard */}
        </div>
        
        <CargoMenu isOpen={showCargoMenu} onClose={() => setShowCargoMenu(false)} />
        
        {activeWarehouse && (
          <WarehouseLayoutPanel 
            data={activeWarehouse} 
            onClose={() => setActiveWarehouseLayout(null)} 
          />
        )}
        
        <TourGuide isOpen={showTour} onClose={() => setShowTour(false)} />
      </main>
    </WarehouseInventoryProvider>
  )
}
