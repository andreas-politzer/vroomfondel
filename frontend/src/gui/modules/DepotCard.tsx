import { DraggableGlass } from '../canvas/DraggableGlass'
import { DepotTile } from './DepotTile'
import type { ModuleId, Location } from '../../core/moduleLocation'
import type { ModulePosition } from '../../core/types'

const MODULE_LABELS: Record<ModuleId, string> = {
  marvin: 'Marvin',
  eingang: 'Eingang',
  bibliothek: 'Bibliothek',
  analysis: 'Analysis',
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

  return (
    <DraggableGlass
      containerRef={depotRef}
      initialPosition={{ x: 220, y: 620 }}
      initialSize={{ width: 460, height: 140 }}
      title="Fords Umhängetasche"
      className="rounded-3xl"
      collapsible
      defaultOpen={false}
    >
      <div className="px-6 pb-6 flex-1 flex flex-wrap items-start gap-3 overflow-y-auto">
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