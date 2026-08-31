import { DraggableGlass } from '../canvas/DraggableGlass'
import { DepotTile, TILE_SIZE } from './DepotTile'
import type { ModuleId, Location } from '../../core/moduleLocation'
import type { ModulePosition } from '../../core/types'

const MODULE_LABELS: Record<ModuleId, string> = {
  marvin: 'Marvin',
  eingang: 'Eingang',
  bibliothek: 'Bibliothek',
  analysis: 'Analysis',
  muelleimer: 'Löschen',
}

const GAP = 12 // Abstand zwischen den Kacheln, in px
const PADDING = 24 // Innenabstand der Karte
const HEADER_HEIGHT = 68 // Höhe des Drag-Kopfs, siehe DraggableGlass
const TILES_PER_ROW = 4 // wie viele Kacheln nebeneinander passen, bevor eine neue Zeile beginnt

function calculateMinSize(moduleCount: number) {
  if (moduleCount === 0) {
    return { width: 320, height: 140 } // Mindestgröße für den "Leer"-Hinweistext
  }
  const columns = Math.min(moduleCount, TILES_PER_ROW)
  const rows = Math.ceil(moduleCount / TILES_PER_ROW)

  const width = columns * TILE_SIZE.width + (columns - 1) * GAP + PADDING * 2
  const height = rows * TILE_SIZE.height + (rows - 1) * GAP + PADDING * 2 + HEADER_HEIGHT

  return { width, height }
}

export function DepotCard({
  locations,
  onPullOut,
  depotRef,
}: {
  locations: Record<ModuleId, Location>
  onPullOut: (id: ModuleId, position: ModulePosition) => void
  depotRef: React.RefObject<HTMLDivElement>
}) {
  const modulesInDepot = (Object.keys(locations) as ModuleId[]).filter((id) => locations[id].place === 'depot')
  const minSize = calculateMinSize(modulesInDepot.length)

  return (
    <DraggableGlass
      containerRef={depotRef}
      initialPosition={{ x: 180, y: 580 }}
      initialSize={minSize}
      title="Fords Umhängetasche"
      className="rounded-3xl"
      collapsible
      defaultOpen={false}
    >
      <div className="px-6 pb-6 flex-1 flex flex-wrap items-start content-start gap-3 overflow-visible">
        {modulesInDepot.length === 0 && (
          <span className="text-xs font-body text-white/40">Leer — alle Module sind auf dem Canvas</span>
        )}
        {modulesInDepot.map((id) => (
          <DepotTile key={id} id={id} label={MODULE_LABELS[id]} depotRef={depotRef} onPullOut={onPullOut} />
        ))}
      </div>
    </DraggableGlass>
  )
}