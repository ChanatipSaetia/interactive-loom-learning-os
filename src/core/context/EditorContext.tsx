import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export interface EditorContextValue {
  editMode: boolean
  activeSectionIndex: number | null
  setEditMode: (mode: boolean) => void
  setActiveSectionIndex: (index: number | null) => void
  toggleEdit: (index?: number | null) => void
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function EditorProvider({ children }: { children: ReactNode }) {
  const [editMode, setEditModeState] = useState(false)
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(null)

  const setEditMode = useCallback((mode: boolean) => {
    setEditModeState(mode)
    if (!mode) {
      setActiveSectionIndex(null)
    }
  }, [])

  const toggleEdit = useCallback((index?: number | null) => {
    if (editMode) {
      setEditModeState(false)
      setActiveSectionIndex(null)
    } else {
      setActiveSectionIndex(index ?? null)
      setEditModeState(true)
    }
  }, [editMode])

  return (
    <EditorContext.Provider
      value={{
        editMode,
        activeSectionIndex,
        setEditMode,
        setActiveSectionIndex,
        toggleEdit,
      }}
    >
      {children}
    </EditorContext.Provider>
  )
}

export function useEditor() {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('useEditor must be used inside an <EditorProvider>')
  }
  return context
}
