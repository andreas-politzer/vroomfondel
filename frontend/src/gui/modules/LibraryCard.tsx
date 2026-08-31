import { useState } from 'react'
import { DraggableGlass } from '../canvas/DraggableGlass'
import { GlassPane } from '../canvas/GlassPane'
import { useLibrary } from '../../core/useLibrary'
import { useProject } from '../../core/ProjectContext'
import type { ModulePosition } from '../../core/types'

const WOBBLE_THRESHOLD_PX = 40
const PREVIEW_SIZE = { width: 260, height: 280 }

export function LibraryCard({
  startPosition,
  unsortedDetached,
  onDetachUnsorted,
  libraryRef,
  onDragEnd,
}: {
  startPosition: ModulePosition
  unsortedDetached: boolean
  onDetachUnsorted: (finalPosition: ModulePosition) => void
  libraryRef: React.RefObject<HTMLDivElement>
  onDragEnd: (bounds: DOMRect | undefined) => void
}) {
  const { project } = useProject()
  const { unsorted, collections, createCollection, assignDocument } = useLibrary(project?.id)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [dragOverCollection, setDragOverCollection] = useState<string | null>(null)
  const [isWobbling, setIsWobbling] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [previewPos, setPreviewPos] = useState<ModulePosition | null>(null)

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault()
    const name = newCollectionName.trim()
    if (!name) return
    createCollection(name)
    setNewCollectionName('')
  }

  const handleDrop = (e: React.DragEvent, collectionId: string) => {
    e.preventDefault()
    setDragOverCollection(null)
    const documentId = e.dataTransfer.getData('text/document-id')
    if (documentId) assignDocument(documentId, collectionId)
  }

  const handleGripPointerDown = (e: React.PointerEvent) => {
    setDragStart({ x: e.clientX, y: e.clientY })
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handleGripPointerMove = (e: React.PointerEvent) => {
    if (!dragStart) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < WOBBLE_THRESHOLD_PX) {
      setIsWobbling(distance > 4)
      setPreviewPos(null)
    } else {
      setIsWobbling(false)
      setPreviewPos({ x: e.clientX - 130, y: e.clientY - 20 })
    }
  }

  const handleGripPointerUp = () => {
    if (previewPos) {
      const libBounds = libraryRef.current?.getBoundingClientRect()
      const previewBounds = {
        left: previewPos.x,
        right: previewPos.x + PREVIEW_SIZE.width,
        top: previewPos.y,
        bottom: previewPos.y + PREVIEW_SIZE.height,
      }
      const overlaps =
        libBounds &&
        previewBounds.left < libBounds.right &&
        previewBounds.right > libBounds.left &&
        previewBounds.top < libBounds.bottom &&
        previewBounds.bottom > libBounds.top

      if (!overlaps) {
        onDetachUnsorted(previewPos)
      }
    }
    setDragStart(null)
    setIsWobbling(false)
    setPreviewPos(null)
  }

  return (
    <>
      <DraggableGlass
        containerRef={libraryRef}
        initialPosition={startPosition}
        initialSize={{ width: 460, height: 400 }}
        title="Bibliothek"
        className="rounded-3xl"
        collapsible
        defaultOpen={false}
        onDragEnd={onDragEnd}
      >
        <div className="px-6 pb-6 flex-1 flex gap-4 overflow-hidden">
          {!unsortedDetached && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <span className="text-[10px] font-body text-white/50 uppercase tracking-widest mb-2">Unsortiert</span>

              <div
                className={`flex-1 flex flex-col overflow-hidden rounded-xl border border-white/20 ${
                  isWobbling ? 'wobble' : ''
                }`}
              >
                <div
                  onPointerDown={handleGripPointerDown}
                  onPointerMove={handleGripPointerMove}
                  onPointerUp={handleGripPointerUp}
                  className="h-3 flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0"
                >
                  <div className="w-6 h-0.5 rounded-full bg-white/30" />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 px-2 pb-2">
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
            </div>
          )}

          <div className="flex-1 flex flex-col overflow-hidden">
            <span className="text-[10px] font-body text-white/50 uppercase tracking-widest mb-2">Sammlungen</span>

            <div className="flex-1 overflow-y-auto space-y-2">
              {collections.map((col) => (
                <div
                  key={col.id}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOverCollection(col.id)
                  }}
                  onDragLeave={() => setDragOverCollection(null)}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className={`text-xs font-body text-white/90 rounded-lg px-2 py-2 border transition-colors ${
                    dragOverCollection === col.id ? 'border-white/80 bg-white/10' : 'border-white/20'
                  }`}
                >
                  📁 {col.name} <span className="text-white/40">({col.document_count})</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleCreateCollection} className="mt-2">
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
                placeholder="+ Sammlung"
                className="w-full bg-white/10 border border-white/30 rounded-lg px-2 py-1 text-xs text-white placeholder-white/40 font-body focus:outline-none focus:border-white/70 cursor-text"
              />
            </form>
          </div>
        </div>
      </DraggableGlass>

      {previewPos && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: previewPos.x, top: previewPos.y, width: PREVIEW_SIZE.width, height: PREVIEW_SIZE.height }}
        >
          <GlassPane className="rounded-3xl opacity-80">
            <div className="px-10 pt-9 pb-2">
              <span className="font-body text-xs tracking-widest text-white uppercase">Unsortiert</span>
            </div>
            <div className="px-6 pb-6 text-xs font-body text-white/70">{unsorted.length} Dokumente</div>
          </GlassPane>
        </div>
      )}
    </>
  )
}