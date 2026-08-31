import { createPortal } from 'react-dom'
import { GlassPane } from '../canvas/GlassPane'
import { useDetach } from '../../core/useDetach'
import type { ModuleId } from '../../core/moduleLocation'
import type { ModulePosition } from '../../core/types'

const TILE_SIZE = { width: 96, height: 56 }

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
  const { isWobbling, previewPos, gripHandlers } = useDetach(
    (finalPosition) => onPullOut(id, finalPosition),
    TILE_SIZE,
    depotRef,
  )

  return (
    <>
      <div
        onPointerDown={gripHandlers.onGripPointerDown}
        onPointerMove={gripHandlers.onGripPointerMove}
        onPointerUp={gripHandlers.onGripPointerUp}
        className={`cursor-grab active:cursor-grabbing select-none touch-none transition-opacity ${
          isWobbling ? 'wobble' : ''
        }`}
        style={{ width: TILE_SIZE.width, height: TILE_SIZE.height, opacity: previewPos ? 0 : 1 }}
      >
        <GlassPane className="w-full h-full rounded-2xl">
          <div className="flex-1 flex items-center justify-center px-2">
            <span className="font-body text-[10px] tracking-widest text-white uppercase text-center">{label}</span>
          </div>
        </GlassPane>
      </div>

      {previewPos &&
        createPortal(
          <div
            className="fixed z-50 pointer-events-none"
            style={{ left: previewPos.x, top: previewPos.y, width: TILE_SIZE.width, height: TILE_SIZE.height }}
          >
            <GlassPane className="w-full h-full rounded-2xl opacity-80">
              <div className="flex-1 flex items-center justify-center px-2">
                <span className="font-body text-[10px] tracking-widest text-white uppercase text-center">{label}</span>
              </div>
            </GlassPane>
          </div>,
          document.body,
        )}
    </>
  )
}