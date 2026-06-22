'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type ViewMode = 'normal' | 'traffic' | 'heatmap' | 'inventory' | 'analytics'
export type DayNightMode = 'day' | 'night'

interface ViewModeContextType {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  dayNight: DayNightMode
  setDayNight: (mode: DayNightMode) => void
}

const ViewModeContext = createContext<ViewModeContextType>({
  viewMode: 'normal',
  setViewMode: () => {},
  dayNight: 'day',
  setDayNight: () => {},
})

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>('normal')
  const [dayNight, setDayNight] = useState<DayNightMode>('day')

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, dayNight, setDayNight }}>
      {children}
    </ViewModeContext.Provider>
  )
}

export function useViewModeContext() {
  return useContext(ViewModeContext)
}
