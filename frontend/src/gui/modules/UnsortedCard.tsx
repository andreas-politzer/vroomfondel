import { useRef } from 'react'
import { DraggableGlass } from '../canvas/DraggableGlass'
import { useLibrary } from '../../core/useLibrary'
import { useProject } from '../../core/ProjectContext'
import type { ModulePosition } from '../../core/types'

export function UnsortedCard({
  startPosition,
  onReattach,
  libraryRef,
}: {
  startPosition: ModulePosition
  onReattach: () => void
  libraryRef: React.RefObject<HTMLDivElement>
}) {
  const { project } = useProject()
  const { unsorted } = useLibrary(project?.id)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleDragEnd = (ownBounds: DOMRect | undefined) => {
    const cardBounds = ownBounds
    const libBounds = libraryRef.current?.getBoundingClientRect()
    if (!cardBounds || !libBounds) return

    const overlaps =
      cardBounds.left < libBounds.right &&
      cardBounds.right > libBounds.left &&
      cardBounds.top < libBounds.bottom &&
      cardBounds.bottom > libBounds.top

    if (overlaps) onReattach()
  }

  return (
    <DraggableGlass
      initialPosition={startPosition}
      initialSize={{ width: 260, height: 280 }}
      title="Unsortiert"
      className="rounded-3xl"
      onDragEnd={handleDragEnd}
      onClose={onReattach}
      containerRef={containerRef}
    >
      <div className="px-6 pb-6 flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-2">
          {unsorted.map((doc) => (
            <div
              key={doc.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/document-id', doc.id)}
              className="text-xs font-body text-white/90 truncate cursor-grab active:cursor-grabbing bg-white/5 rounded-lg px-2 py-1"
            >
              {doc.filename}
            </div>
          ))}
          {unsorted.length === 0 && (
            <span className="text-xs font-body text-white/40">Keine unsortierten Dokumente</span>
          )}
        </div>
      </div>
    </DraggableGlass>
  )
}