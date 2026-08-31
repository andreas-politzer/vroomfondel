import { useState, useCallback, useRef } from 'react'
import { DraggableGlass } from '../canvas/DraggableGlass'
import { useProject } from '../../core/ProjectContext'
import { notifyLibraryChanged } from '../../core/libraryEvents'
import type { ModulePosition } from '../../core/types'

interface FileEntry {
  key: string
  file: File
  status: 'staged' | 'uploading' | 'uploaded' | 'error'
}

const CLEAR_DELAY_MS = 1200

async function uploadFile(projectId: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch(`http://localhost:8000/projects/${projectId}/documents`, {
    method: 'POST',
    body: formData,
  })
  if (!response.ok) throw new Error(`Upload fehlgeschlagen (Status ${response.status})`)
  return response.json()
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/90 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/60 hover:text-white/90 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 0v12a1 1 0 001 1h6a1 1 0 001-1V7" />
    </svg>
  )
}

export function MaterialCard({
  startPosition,
  onDragEnd,
}: {
  startPosition: ModulePosition
  onDragEnd: (bounds: DOMRect | undefined) => void
}) {
  const { project, loading: projectLoading } = useProject()
  const [files, setFiles] = useState<FileEntry[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const addFiles = useCallback((fileList: FileList) => {
    const newEntries: FileEntry[] = Array.from(fileList).map((file) => ({
      key: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      status: 'staged',
    }))
    setFiles((prev) => [...prev, ...newEntries])
  }, [])

  const removeStaged = (key: string) => {
    setFiles((prev) => prev.filter((f) => f.key !== key))
  }

  const uploadStaged = async () => {
    if (!project) return
    const toUpload = files.filter((f) => f.status === 'staged')

    for (const entry of toUpload) {
      setFiles((prev) => prev.map((f) => (f.key === entry.key ? { ...f, status: 'uploading' } : f)))
      try {
        await uploadFile(project.id, entry.file)
        setFiles((prev) => prev.map((f) => (f.key === entry.key ? { ...f, status: 'uploaded' } : f)))
        notifyLibraryChanged()
        setTimeout(() => {
          setFiles((prev) => prev.filter((f) => f.key !== entry.key))
        }, CLEAR_DELAY_MS)
      } catch {
        setFiles((prev) => prev.map((f) => (f.key === entry.key ? { ...f, status: 'error' } : f)))
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) addFiles(e.target.files)
    e.target.value = ''
  }

  const hasStaged = files.some((f) => f.status === 'staged')
  const isUploading = files.some((f) => f.status === 'uploading')

  return (
    <DraggableGlass
      initialPosition={startPosition}
      initialSize={{ width: 320, height: 360 }}
      title="Eingang"
      className="rounded-3xl"
      collapsible
      defaultOpen={false}
      onDragEnd={onDragEnd}
      containerRef={containerRef}
    >
      <div className="px-6 pb-6 flex-1 flex flex-col overflow-hidden">
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onPointerDown={(e) => e.stopPropagation()}
          className={`shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 cursor-pointer transition-colors ${
            isDragOver ? 'border-white/80 bg-white/10' : 'border-white/30 hover:border-white/50'
          }`}
        >
          <span className="font-body text-xs text-white/80 text-center">
            Dateien hierher ziehen
            <br />
            oder auswählen
          </span>
          <input type="file" multiple className="hidden" onChange={handleFileInput} disabled={projectLoading} />
        </label>

        <div className="mt-4 flex-1 overflow-y-auto space-y-2">
          {files.map((f) => (
            <div key={f.key} className="flex items-center justify-between gap-2 text-xs font-body">
              <span className="text-white/90 truncate">{f.file.name}</span>
              {f.status === 'staged' && (
                <button onPointerDown={(e) => e.stopPropagation()} onClick={() => removeStaged(f.key)}>
                  <TrashIcon />
                </button>
              )}
              {f.status === 'uploading' && <span className="shrink-0 text-white/50">Lädt…</span>}
              {f.status === 'uploaded' && <CheckIcon />}
              {f.status === 'error' && <span className="shrink-0 text-white/50">Fehler</span>}
            </div>
          ))}
        </div>

        {hasStaged && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={uploadStaged}
            disabled={isUploading}
            className="mt-3 shrink-0 rounded-xl border border-white/40 bg-white/10 hover:border-white/70 py-2 text-xs font-body text-white/90 uppercase tracking-widest disabled:opacity-50"
          >
            Jetzt hochladen
          </button>
        )}
      </div>
    </DraggableGlass>
  )
}