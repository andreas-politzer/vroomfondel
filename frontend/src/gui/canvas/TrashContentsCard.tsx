import { useState } from 'react'
import { DraggableGlass } from './DraggableGlass'
import { useTrash } from '../../core/useTrash'

function RestoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v0a5 5 0 01-5 5H9M3 10l4-4M3 10l4 4" />
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

const CARD_SIZE = { width: 340, height: 340 }

function calculateSafePosition(): { x: number; y: number } {
  const margin = 40
  const x = Math.max(margin, (window.innerWidth - CARD_SIZE.width) / 2)
  const y = Math.max(margin, (window.innerHeight - CARD_SIZE.height) / 2)
  return { x, y }
}

export function TrashContentsCard({
  projectId,
  onClose,
}: {
  projectId: string | undefined
  onClose: () => void
}) {
  const { items, restore, deleteForever } = useTrash(projectId)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [position] = useState(calculateSafePosition)

  return (
    <DraggableGlass
      initialPosition={position}
      initialSize={CARD_SIZE}
      title="Papierkorb"
      className="rounded-3xl"
      onClose={onClose}
    >
      <div className="px-6 pb-6 flex-1 overflow-y-auto space-y-2">
        {items.length === 0 && <span className="text-xs font-body text-white/40">Papierkorb ist leer</span>}
        {items.map((entry) => (
          <div key={entry.trash_entry_id} className="bg-white/5 rounded-lg px-2 py-1">
            {confirmId === entry.trash_entry_id ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-body text-white/80 truncate">Endgültig löschen?</span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => {
                      deleteForever(entry.trash_entry_id)
                      setConfirmId(null)
                    }}
                    className="text-[10px] font-body text-red-300 hover:text-red-200 px-2 py-0.5 rounded bg-red-400/10"
                  >
                    Löschen
                  </button>
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => setConfirmId(null)}
                    className="text-[10px] font-body text-white/70 hover:text-white px-2 py-0.5 rounded bg-white/10"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="flex-1 text-xs font-body text-white/90 truncate">{entry.filename}</span>
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => restore(entry.trash_entry_id)}
                    title="Wiederherstellen"
                    className="text-white/70 hover:text-white shrink-0"
                  >
                    <RestoreIcon />
                  </button>
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => setConfirmId(entry.trash_entry_id)}
                    title="Endgültig löschen"
                    className="text-white/70 hover:text-red-300 shrink-0"
                  >
                    <TrashIcon />
                  </button>
                </div>
                <span className="text-[9px] font-body text-white/40">
                  {entry.source_collection_name ? `aus "${entry.source_collection_name}"` : 'aus Unsortiert'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </DraggableGlass>
  )
}