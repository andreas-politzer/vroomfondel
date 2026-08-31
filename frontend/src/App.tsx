import { useRef, useState } from 'react'
import { GlassFilterDefs } from './gui/canvas/GlassFilterDefs'
import { AmbientLight } from './gui/canvas/AmbientLight'
import { EntryGate } from './gui/canvas/EntryGate'
import { JarvisCard } from './gui/jarvis/JarvisCard'
import { FaintModule } from './gui/modules/FaintModule'
import { MaterialCard } from './gui/modules/MaterialCard'
import { LibraryCard } from './gui/modules/LibraryCard'
import { UnsortedCard } from './gui/modules/UnsortedCard'
import { DepotCard } from './gui/modules/DepotCard'
import { ProjectProvider } from './core/ProjectContext'
import { useModuleLocations, type ModuleId } from './core/moduleLocation'
import type { ModulePosition } from './core/types'

export default function App() {
  const [entered, setEntered] = useState(false)
  const [unsortedDetached, setUnsortedDetached] = useState(false)
  const [detachPosition, setDetachPosition] = useState<ModulePosition>({ x: 640, y: 500 })
  const libraryRef = useRef<HTMLDivElement>(null)
  const depotRef = useRef<HTMLDivElement>(null)

  const { locations, moveToDepot, moveToCanvas } = useModuleLocations()

  const handleDetach = (startPosition: ModulePosition) => {
    setDetachPosition(startPosition)
    setUnsortedDetached(true)
  }

  const checkDropOnDepot = (id: ModuleId, ownBounds: DOMRect | undefined) => {
    const depotBounds = depotRef.current?.getBoundingClientRect()
    if (!ownBounds || !depotBounds) return
    const overlaps =
      ownBounds.left < depotBounds.right &&
      ownBounds.right > depotBounds.left &&
      ownBounds.top < depotBounds.bottom &&
      ownBounds.bottom > depotBounds.top
    if (overlaps) {
      moveToDepot(id)
      // Bibliothek wandert ins Depot: falls "Unsortiert" gerade als eigene Kachel
      // draußen ist, wird sie automatisch mit zurückgeholt (wie ChatGPT/Andy besprochen).
      if (id === 'bibliothek' && unsortedDetached) {
        setUnsortedDetached(false)
      }
    }
  }

  return (
    <ProjectProvider>
      <div className="relative h-screen w-screen bg-canvas overflow-hidden">
        <GlassFilterDefs />
        <AmbientLight />
        {!entered && <EntryGate onEnter={() => setEntered(true)} />}

        <div className="absolute top-8 left-10 font-body text-xs tracking-[0.3em] text-white uppercase z-10">
          Project Vroomfondel
        </div>

        {locations.marvin.place === 'canvas' && (
          <JarvisCard
            entered={entered}
            startPosition={locations.marvin.position}
            onDragEnd={(bounds) => checkDropOnDepot('marvin', bounds)}
          />
        )}

        {locations.eingang.place === 'canvas' && (
          <MaterialCard
            startPosition={locations.eingang.position}
            onDragEnd={(bounds) => checkDropOnDepot('eingang', bounds)}
          />
        )}

        {locations.bibliothek.place === 'canvas' && (
          <LibraryCard
            startPosition={locations.bibliothek.position}
            unsortedDetached={unsortedDetached}
            onDetachUnsorted={handleDetach}
            libraryRef={libraryRef}
            onDragEnd={(bounds) => checkDropOnDepot('bibliothek', bounds)}
          />
        )}
        {unsortedDetached && (
          <UnsortedCard startPosition={detachPosition} onReattach={() => setUnsortedDetached(false)} libraryRef={libraryRef} />
        )}

        {locations.analysis.place === 'canvas' && (
          <FaintModule
            title="Analysis"
            startPosition={locations.analysis.position}
            onDragEnd={(bounds) => checkDropOnDepot('analysis', bounds)}
          />
        )}

        <DepotCard locations={locations} onPullOut={(id, position) => moveToCanvas(id, position)} depotRef={depotRef} />
      </div>
    </ProjectProvider>
  )
}