import { useState, useCallback } from 'react'
import type { ModulePosition } from './types'

export type ModuleId = 'marvin' | 'eingang' | 'bibliothek' | 'analysis' | 'muelleimer'
export type Location = { place: 'canvas'; position: ModulePosition } | { place: 'depot' }

const INITIAL_POSITIONS: Record<ModuleId, ModulePosition> = {
  marvin: { x: 220, y: 180 },
  eingang: { x: 980, y: 140 },
  bibliothek: { x: 640, y: 140 },
  analysis: { x: 1020, y: 460 },
  muelleimer: { x: 1020, y: 640 },
}

// Marvin startet auf dem Canvas, alle anderen im Depot — wie besprochen.
const INITIAL_LOCATIONS: Record<ModuleId, Location> = {
  marvin: { place: 'canvas', position: INITIAL_POSITIONS.marvin },
  eingang: { place: 'depot' },
  bibliothek: { place: 'depot' },
  analysis: { place: 'depot' },
  muelleimer: { place: 'depot' },
}

export function useModuleLocations() {
  const [locations, setLocations] = useState<Record<ModuleId, Location>>(INITIAL_LOCATIONS)

  const moveToDepot = useCallback((id: ModuleId) => {
    setLocations((prev) => ({ ...prev, [id]: { place: 'depot' } }))
  }, [])

  const moveToCanvas = useCallback((id: ModuleId, position: ModulePosition) => {
    setLocations((prev) => ({ ...prev, [id]: { place: 'canvas', position } }))
  }, [])

  return { locations, moveToDepot, moveToCanvas }
}