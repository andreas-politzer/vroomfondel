import { useCallback, useEffect, useState } from 'react'
import { onLibraryChanged, notifyLibraryChanged } from './libraryEvents'

export interface TrashedDocument {
  trash_entry_id: string
  document_id: string
  filename: string
  size: number
  source_collection_name: string | null
}

const API_BASE = 'http://localhost:8000'

export function useTrash(projectId: string | undefined) {
  const [items, setItems] = useState<TrashedDocument[]>([])

  const refresh = useCallback(() => {
    if (!projectId) return
    fetch(`${API_BASE}/projects/${projectId}/trash`)
      .then((res) => res.json())
      .then(setItems)
  }, [projectId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    return onLibraryChanged(refresh)
  }, [refresh])

  const restore = useCallback(async (trashEntryId: string) => {
    await fetch(`${API_BASE}/trash/${trashEntryId}/restore`, { method: 'POST' })
    notifyLibraryChanged()
  }, [])

  const deleteForever = useCallback(async (trashEntryId: string) => {
    await fetch(`${API_BASE}/trash/${trashEntryId}`, { method: 'DELETE' })
    notifyLibraryChanged()
  }, [])

  return { items, refresh, restore, deleteForever }
}