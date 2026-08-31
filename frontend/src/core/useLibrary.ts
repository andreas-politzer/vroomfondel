import { useCallback, useEffect, useState } from 'react'
import { onLibraryChanged } from './libraryEvents'

export interface LibraryDocument {
  id: string
  filename: string
  size: number
  collection_ids?: string[]
}

export interface LibraryCollection {
  id: string
  name: string
  parent_collection_id: string | null
  document_count: number
}

interface LibraryData {
  unsorted: LibraryDocument[]
  collections: LibraryCollection[]
  documents: LibraryDocument[]
}

const API_BASE = 'http://localhost:8000'

export function useLibrary(projectId: string | undefined) {
  const [data, setData] = useState<LibraryData>({ unsorted: [], collections: [], documents: [] })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    if (!projectId) return
    setLoading(true)
    fetch(`${API_BASE}/projects/${projectId}/library`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    return onLibraryChanged(refresh)
  }, [refresh])

  const createCollection = useCallback(
    async (name: string, parentId: string | null) => {
      if (!projectId) return
      await fetch(`${API_BASE}/projects/${projectId}/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parent_collection_id: parentId }),
      })
      refresh()
    },
    [projectId, refresh],
  )

  const renameCollection = useCallback(
    async (id: string, name: string) => {
      await fetch(`${API_BASE}/collections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      refresh()
    },
    [refresh],
  )

  const deleteCollection = useCallback(
    async (id: string) => {
      await fetch(`${API_BASE}/collections/${id}`, { method: 'DELETE' })
      refresh()
    },
    [refresh],
  )

  const assignDocument = useCallback(
    async (documentId: string, collectionId: string) => {
      await fetch(`${API_BASE}/documents/${documentId}/collections/${collectionId}`, {
        method: 'POST',
      })
      refresh()
    },
    [refresh],
  )

  // Entfernt NUR die Zuordnung zu genau dieser einen Sammlung — Dokument bleibt
  // erhalten, fällt automatisch zurück nach Unsortiert, falls keine Zuordnung übrig bleibt.
  const removeFromCollection = useCallback(
    async (documentId: string, collectionId: string) => {
      await fetch(`${API_BASE}/documents/${documentId}/collections/${collectionId}`, {
        method: 'DELETE',
      })
      refresh()
    },
    [refresh],
  )

  // Echte, endgültige Löschung — Datei verschwindet komplett aus dem System.
  const deleteDocument = useCallback(
    async (documentId: string) => {
      if (!projectId) return
      await fetch(`${API_BASE}/projects/${projectId}/documents/${documentId}`, {
        method: 'DELETE',
      })
      refresh()
    },
    [projectId, refresh],
  )

  return {
    ...data,
    loading,
    refresh,
    createCollection,
    renameCollection,
    deleteCollection,
    assignDocument,
    removeFromCollection,
    deleteDocument,
  }
}