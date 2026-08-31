import { useState } from 'react'
import { DraggableGlass } from '../canvas/DraggableGlass'
import { GlassPane } from '../canvas/GlassPane'
import { useLibrary } from '../../core/useLibrary'
import { useProject } from '../../core/ProjectContext'
import type { ModulePosition } from '../../core/types'

const WOBBLE_THRESHOLD_PX = 40
const PREVIEW_SIZE = { width: 260, height: 280 }

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.5-9.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 8.5-8.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 0v12a1 1 0 001 1h6a1 1 0 001-1V7" />
    </svg>
  )
}

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
  const {
    unsorted,
    collections,
    documents,
    createCollection,
    renameCollection,
    deleteCollection,
    assignDocument,
    removeFromCollection,
    deleteDocument,
  } = useLibrary(project?.id)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [dragOverCollection, setDragOverCollection] = useState<string | null>(null)
  const [isWobbling, setIsWobbling] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [previewPos, setPreviewPos] = useState<ModulePosition | null>(null)

  const [openCollectionId, setOpenCollectionId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteDocConfirmId, setDeleteDocConfirmId] = useState<string | null>(null)

  const [deleteStep, setDeleteStep] = useState(1)

  const openCollection = collections.find((c) => c.id === openCollectionId) ?? null
  const childCollections = collections.filter((c) => c.parent_collection_id === openCollectionId)
  const documentsHere = documents.filter((d) => (d.collection_ids ?? []).includes(openCollectionId ?? ''))

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault()
    const name = newCollectionName.trim()
    if (!name) return
    createCollection(name, openCollectionId)
    setNewCollectionName('')
  }

  const handleDrop = (e: React.DragEvent, collectionId: string) => {
    e.preventDefault()
    setDragOverCollection(null)
    const documentId = e.dataTransfer.getData('text/document-id')
    if (documentId) assignDocument(documentId, collectionId)
  }

  const startRename = (id: string, currentName: string) => {
    setRenamingId(id)
    setRenameValue(currentName)
  }

  const confirmRename = (e: React.FormEvent) => {
    e.preventDefault()
    if (renamingId && renameValue.trim()) renameCollection(renamingId, renameValue.trim())
    setRenamingId(null)
  }

  const confirmDeleteCollection = (id: string) => {
    deleteCollection(id)
    setDeleteConfirmId(null)
    if (openCollectionId === id) setOpenCollectionId(null)
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
          {!openCollectionId && !unsortedDetached && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <span className="text-[10px] font-body text-white/50 uppercase tracking-widest mb-2">Unsortiert</span>

              <div
                className={`flex-1 flex flex-col overflow-hidden rounded-xl border border-white/20 transition-opacity ${
                  isWobbling ? 'wobble' : ''
                }`}
                style={{ opacity: previewPos ? 0 : 1 }}
              >
                <div
                  onPointerDown={(e) => {
                    setDragStart({ x: e.clientX, y: e.clientY })
                    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                  }}
                  onPointerMove={(e) => {
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
                  }}
                  onPointerUp={() => {
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
                      if (!overlaps) onDetachUnsorted(previewPos)
                    }
                    setDragStart(null)
                    setIsWobbling(false)
                    setPreviewPos(null)
                  }}
                  className="h-8 flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0 hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-1 rounded-full bg-white/40" />
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 px-2 pb-2">
                  {unsorted.map((doc) => (
                    <div key={doc.id}>
                      {deleteDocConfirmId === doc.id ? (
                        <div className="flex items-center justify-between gap-2 bg-white/5 rounded-lg px-2 py-1">
                          <span className="text-[10px] font-body text-white/80 truncate">Endgültig löschen?</span>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={() => {
                                deleteDocument(doc.id)
                                setDeleteDocConfirmId(null)
                              }}
                              className="text-[10px] font-body text-red-300 hover:text-red-200 px-2 py-0.5 rounded bg-red-400/10"
                            >
                              Löschen
                            </button>
                            <button
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={() => setDeleteDocConfirmId(null)}
                              className="text-[10px] font-body text-white/70 hover:text-white px-2 py-0.5 rounded bg-white/10"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-1 bg-white/5 rounded-lg px-2 py-1">
                          <span
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/document-id', doc.id)
                              e.dataTransfer.setData('text/source-collection-id', '')
                            }}
                            className="flex-1 text-xs font-body text-white/90 truncate cursor-grab active:cursor-grabbing"
                          >
                            {doc.filename}
                          </span>
                          <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => setDeleteDocConfirmId(doc.id)}
                            title="Endgültig löschen"
                            className="text-white/50 hover:text-red-300 shrink-0"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      )}
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
            {openCollectionId ? (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setOpenCollectionId(openCollection?.parent_collection_id ?? null)}
                className="text-[10px] font-body text-white/50 hover:text-white/90 uppercase tracking-widest mb-2 text-left"
              >
                ← {openCollection?.name ?? 'Sammlungen'}
              </button>
            ) : (
              <span className="text-[10px] font-body text-white/50 uppercase tracking-widest mb-2">Sammlungen</span>
            )}

            <div className="flex-1 overflow-y-auto space-y-1">
              {childCollections.map((col) => (
                <div
                  key={col.id}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOverCollection(col.id)
                  }}
                  onDragLeave={() => setDragOverCollection(null)}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className={`rounded-lg border transition-colors ${
                    dragOverCollection === col.id ? 'border-white/80 bg-white/10' : 'border-white/20'
                  }`}
                >
                  {renamingId === col.id ? (
                    <form onSubmit={confirmRename} className="px-2 py-1">
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={confirmRename}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="w-full bg-transparent text-xs text-white font-body focus:outline-none"
                      />
                    </form>
                  ) : deleteConfirmId === col.id ? (
                    <div className="px-2 py-2">
                      {deleteStep === 1 ? (
                        <>
                          <p className="text-[10px] font-body text-white/80 mb-1">
                            "{col.name}" wirklich löschen? Enthaltene Dokumente werden nicht gelöscht, fallen aber zurück
                            nach Unsortiert. Unter-Sammlungen rutschen eine Ebene höher.
                          </p>
                          <div className="flex gap-1">
                            <button
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={() => setDeleteStep(2)}
                              className="text-[10px] font-body text-red-300 hover:text-red-200 px-2 py-1 rounded bg-red-400/10"
                            >
                              Weiter
                            </button>
                            <button
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={() => {
                                setDeleteConfirmId(null)
                                setDeleteStep(1)
                              }}
                              className="text-[10px] font-body text-white/70 hover:text-white px-2 py-1 rounded bg-white/10"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </>
                  ) : (
      <>
        <p className="text-[10px] font-body text-red-200 mb-1 font-medium">
          Letzte Bestätigung: "{col.name}" wird unwiderruflich gelöscht. Bist du sicher?
        </p>
        <div className="flex gap-1">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              confirmDeleteCollection(col.id)
              setDeleteStep(1)
            }}
            className="text-[10px] font-body text-white bg-red-500/80 hover:bg-red-500 px-2 py-1 rounded"
          >
            Ja, endgültig löschen
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              setDeleteConfirmId(null)
              setDeleteStep(1)
            }}
            className="text-[10px] font-body text-white/70 hover:text-white px-2 py-1 rounded bg-white/10"
          >
            Abbrechen
          </button>
        </div>
      </>
    )}
  </div>
) : (
                    <div className="flex items-center justify-between px-2 py-2 gap-1">
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => setOpenCollectionId(col.id)}
                        className="flex-1 text-left text-xs font-body text-white/90 truncate"
                      >
                        📁 {col.name} <span className="text-white/40">({col.document_count})</span>
                      </button>
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => startRename(col.id, col.name)}
                        className="text-white/70 hover:text-white shrink-0"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => setDeleteConfirmId(col.id)}
                        className="text-white/70 hover:text-red-300 shrink-0"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {openCollectionId &&
                documentsHere.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-1 bg-white/5 rounded-lg px-2 py-1"
                  >
                    <span
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/document-id', doc.id)
                        e.dataTransfer.setData('text/source-collection-id', openCollectionId ?? '')
                      }}
                      className="flex-1 text-xs font-body text-white/90 truncate cursor-grab active:cursor-grabbing"
                    >
                      {doc.filename}
                    </span>
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => removeFromCollection(doc.id, openCollectionId)}
                      title="Aus Ansicht entfernen"
                      className="text-white/50 hover:text-white/90 shrink-0"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}

              {openCollectionId && childCollections.length === 0 && documentsHere.length === 0 && (
                <span className="text-xs font-body text-white/40">Leer</span>
              )}
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