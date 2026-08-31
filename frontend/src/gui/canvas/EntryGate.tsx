export function EntryGate({ onEnter }: { onEnter: () => void }) {
  return (
    <button
      onClick={onEnter}
      className="absolute inset-0 z-20 flex items-center justify-center bg-canvas font-body text-sm tracking-widest text-muted uppercase hover:text-ink transition-colors"
    >
      Arbeitsraum betreten
    </button>
  )
}