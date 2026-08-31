export interface ModulePosition {
  x: number
  y: number
}

// Mirrors the conceptual Canvas-Datenmodell in Architecture_Contract.md —
// position ist implementiert, size/type/content/state/connections folgen später.
export interface CanvasModule {
  id: string
  position: ModulePosition
}