import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface Project {
  id: string
  name: string
}

interface ProjectContextValue {
  project: Project | null
  loading: boolean
  error: string | null
}

const ProjectContext = createContext<ProjectContextValue>({
  project: null,
  loading: true,
  error: null,
})

export function useProject() {
  return useContext(ProjectContext)
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('http://localhost:8000/projects/current')
      .then((res) => {
        if (!res.ok) throw new Error(`Backend antwortete mit Status ${res.status}`)
        return res.json()
      })
      .then((data: Project) => setProject(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return <ProjectContext.Provider value={{ project, loading, error }}>{children}</ProjectContext.Provider>
}