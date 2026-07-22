import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { OKFBundled, OKFBundledSection } from '../okf/types'

export interface EditorContextValue {
  editMode: boolean
  activeSectionIndex: number | null
  activeSection: OKFBundledSection | null
  bundle: OKFBundled | null
  setEditMode: (mode: boolean) => void
  setActiveSectionIndex: (index: number | null) => void
  toggleEdit: (index?: number | null) => void
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function EditorProvider({ children, bundle }: { children: ReactNode; bundle?: OKFBundled | null | undefined }) {
  const resolvedBundle = bundle ?? null
  const [editMode, setEditModeState] = useState(false)
  const [activeSectionIndex, setActiveSectionIndexState] = useState<number | null>(null)

  const activeSection =
    activeSectionIndex !== null && resolvedBundle && activeSectionIndex < resolvedBundle.length
      ? resolvedBundle[activeSectionIndex]
      : null

  const setEditMode = useCallback((mode: boolean) => {
    setEditModeState(mode)
    if (!mode) {
      setActiveSectionIndexState(null)
    }
  }, [])

  const setActiveSectionIndex = useCallback((index: number | null) => {
    setActiveSectionIndexState(index)
  }, [])

  const toggleEdit = useCallback((index?: number | null) => {
    if (editMode) {
      setEditModeState(false)
      setActiveSectionIndexState(null)
    } else {
      setActiveSectionIndexState(index ?? null)
      setEditModeState(true)
    }
  }, [editMode])

  return (
    <EditorContext.Provider
      value={{
        editMode,
        activeSectionIndex,
        activeSection,
        bundle: resolvedBundle,
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
