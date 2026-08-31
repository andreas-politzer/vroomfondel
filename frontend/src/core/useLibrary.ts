import { useCallback, useEffect, useState } from 'react'
import { onLibraryChanged } from './libraryEvents'

export interface LibraryDocument {
  id: string
  filename: string
  size: number
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
}

const API_BASE = 'http://localhost:8000'

export function useLibrary(projectId: string | undefined) {
  const [data, setData] = useState<LibraryData>({ unsorted: [], collections: [] })
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

  // Reagiert auf Änderungen von außerhalb (z. B. neuer Upload in MaterialCard)
  useEffect(() => {
    return onLibraryChanged(refresh)
  }, [refresh])

  const createCollection = useCallback(
    async (name: string) => {
      if (!projectId) return
      await fetch(`${API_BASE}/projects/${projectId}/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parent_collection_id: null }),
      })
      refresh()
    },
    [projectId, refresh],
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

  return { ...data, loading, refresh, createCollection, assignDocument }
}