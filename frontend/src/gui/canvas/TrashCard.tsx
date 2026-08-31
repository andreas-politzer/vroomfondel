import { useRef, useState } from 'react'
import { useDraggable } from '../../core/useDraggable'
import { TrashCanIcon } from './TrashCanIcon'

const ICON_SIZE = 72
const DOUBLE_CLICK_DELAY_MS = 300

export function TrashCard({
  startPosition,
  onMoveToTrash,
  onDragEnd,
  onOpenContents,
}: {
  startPosition: { x: number; y: number }
  onMoveToTrash: (documentId: string, sourceCollectionId?: string) => void
  onDragEnd: (bounds: DOMRect | undefined) => void
  onOpenContents: () => void
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { position, dragHandlers } = useDraggable(startPosition, onDragEnd)
  const lastClickRef = useRef<number>(0)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const documentId = e.dataTransfer.getData('text/document-id')
    const sourceCollectionId = e.dataTransfer.getData('text/source-collection-id')
    if (documentId) onMoveToTrash(documentId, sourceCollectionId || undefined)
  }

  const handleClick = () => {
    const now = Date.now()
    if (now - lastClickRef.current < DOUBLE_CLICK_DELAY_MS) {
      onOpenContents()
    }
    lastClickRef.current = now
  }

  return (
    <div
      ref={containerRef}
      className="absolute top-0 left-0 cursor-grab active:cursor-grabbing touch-none select-none"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      onPointerDown={dragHandlers.onPointerDown}
      onPointerMove={dragHandlers.onPointerMove}
      onPointerUp={(e) => dragHandlers.onPointerUp(e, containerRef.current?.getBoundingClientRect())}
      onClick={handleClick}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <TrashCanIcon size={ICON_SIZE} active={isDragOver} />
    </div>
  )
}