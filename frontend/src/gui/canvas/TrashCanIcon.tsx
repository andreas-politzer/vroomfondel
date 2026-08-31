export function TrashCanIcon({ size, active = false }: { size: number; active?: boolean }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`drop-shadow-lg transition-colors ${active ? 'text-red-300' : 'text-white/85'}`}
    >
      <rect x="10" y="6" width="44" height="8" rx="2" fill="currentColor" opacity="0.9" />
      <rect x="26" y="2" width="12" height="6" rx="2" fill="currentColor" opacity="0.9" />
      <path
        d="M14 16 L18 58 a4 4 0 004 4h20 a4 4 0 004-4 L50 16 Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line x1="26" y1="24" x2="27" y2="52" stroke="currentColor" strokeWidth="2" opacity="0.7" />
      <line x1="32" y1="24" x2="32" y2="52" stroke="currentColor" strokeWidth="2" opacity="0.7" />
      <line x1="38" y1="24" x2="37" y2="52" stroke="currentColor" strokeWidth="2" opacity="0.7" />
    </svg>
  )
}