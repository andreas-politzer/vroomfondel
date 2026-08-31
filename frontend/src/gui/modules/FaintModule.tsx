import { useRef } from 'react'
import { DraggableGlass } from '../canvas/DraggableGlass'
import type { ModulePosition } from '../../core/types'

export function FaintModule({
  title,
  startPosition,
  onDragEnd,
}: {
  title: string
  startPosition: ModulePosition
  onDragEnd: (bounds: DOMRect | undefined) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <DraggableGlass
      initialPosition={startPosition}
      initialSize={{ width: 208, height: 120 }}
      title={title}
      className="rounded-3xl"
      collapsible
      defaultOpen={false}
      onDragEnd={onDragEnd}
      containerRef={containerRef}
    >
      <div />
    </DraggableGlass>
  )
}