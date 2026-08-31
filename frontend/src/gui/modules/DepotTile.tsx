import { createPortal } from 'react-dom'
import { GlassPane } from '../canvas/GlassPane'
import { TrashCanIcon } from '../canvas/TrashCanIcon'
import { useDetach } from '../../core/useDetach'
import type { ModuleId } from '../../core/moduleLocation'
import type { ModulePosition } from '../../core/types'

export const TILE_SIZE = { width: 96, height: 56 }
const TRASH_TILE_SIZE = { width: 72, height: 72 }

function TileContent({ id, label }: { id: ModuleId; label: string }) {
  return (
    <div className="flex-1 flex items-center justify-center px-2">
      <span className="font-body text-[10px] tracking-widest text-white uppercase text-center">{label}</span>
    </div>
  )
}

export function DepotTile({
  id,
  label,
  depotRef,
  onPullOut,
}: {
  id: ModuleId
  label: string
  depotRef: React.RefObject<HTMLDivElement>
  onPullOut: (id: ModuleId, position: ModulePosition) => void
}) {
  const size = id === 'muelleimer' ? TRASH_TILE_SIZE : TILE_SIZE
  const { isWobbling, previewPos, gripHandlers } = useDetach(
    (finalPosition) => onPullOut(id, finalPosition),
    size,
    depotRef,
  )

  if (id === 'muelleimer') {
    return (
      <>
        <div
          onPointerDown={gripHandlers.onGripPointerDown}
          onPointerMove={gripHandlers.onGripPointerMove}
          onPointerUp={gripHandlers.onGripPointerUp}
          className={`cursor-grab active:cursor-grabbing select-none touch-none transition-opacity ${
            isWobbling ? 'wobble' : ''
          }`}
          style={{ width: size.width, height: size.height, opacity: previewPos ? 0 : 1 }}
        >
          <TrashCanIcon size={size.width} />
        </div>

        {previewPos &&
          createPortal(
            <div
              className="fixed z-50 pointer-events-none"
              style={{ left: previewPos.x, top: previewPos.y, width: size.width, height: size.height }}
            >
              <TrashCanIcon size={size.width} />
            </div>,
            document.body,
          )}
      </>
    )
  }

  return (
    <>
      <div
        onPointerDown={gripHandlers.onGripPointerDown}
        onPointerMove={gripHandlers.onGripPointerMove}
        onPointerUp={gripHandlers.onGripPointerUp}
        className={`cursor-grab active:cursor-grabbing select-none touch-none transition-opacity ${
          isWobbling ? 'wobble' : ''
        }`}
        style={{ width: size.width, height: size.height, opacity: previewPos ? 0 : 1 }}
      >
        <GlassPane className="w-full h-full rounded-2xl">
          <TileContent id={id} label={label} />
        </GlassPane>
      </div>

      {previewPos &&
        createPortal(
          <div
            className="fixed z-50 pointer-events-none"
            style={{ left: previewPos.x, top: previewPos.y, width: size.width, height: size.height }}
          >
            <GlassPane className="w-full h-full rounded-2xl opacity-80">
              <TileContent id={id} label={label} />
            </GlassPane>
          </div>,
          document.body,
        )}
    </>
  )
}