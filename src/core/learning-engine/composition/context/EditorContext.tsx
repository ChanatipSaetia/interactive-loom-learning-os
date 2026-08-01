import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { OKFBundled, OKFBundledSection } from '../../composition/okf/types'

export interface EditorContextValue {
  editMode: boolean
  activeSectionIndex: number | null
  activeSection: OKFBundledSection | null
  bundle: OKFBundled | null
  setEditMode: (mode: boolean) => void
  setActiveSectionIndex: (index: number | null) => void
  toggleEdit: (index?: number | null) => void
  setBundle: (bundle: OKFBundled | null) => void
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function EditorProvider({ children, bundle }: { children: ReactNode; bundle?: OKFBundled | null | undefined }) {
  const [internalBundle, setInternalBundle] = useState<OKFBundled | null>(bundle ?? null)
  const [editMode, setEditModeState] = useState(false)
  const [activeSectionIndex, setActiveSectionIndexState] = useState<number | null>(null)

  const resolvedBundle = bundle !== undefined ? (bundle ?? null) : internalBundle

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

  const setBundle = useCallback((b: OKFBundled | null) => {
    setInternalBundle(b)
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
        setBundle,
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

export function useEditorSafe() {
  return useContext(EditorContext)
}
