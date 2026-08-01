import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export interface HUDContextValue {
  isOpen: boolean
  title: string
  body: string
  openHUD: (title: string, body: string) => void
  closeHUD: () => void
}

const HUDContext = createContext<HUDContextValue | null>(null)

export function HUDProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const openHUD = useCallback((newTitle: string, newBody: string) => {
    setTitle(newTitle)
    setBody(newBody)
    setIsOpen(true)
  }, [])

  const closeHUD = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <HUDContext.Provider value={{ isOpen, title, body, openHUD, closeHUD }}>
      {children}
    </HUDContext.Provider>
  )
}

export function useHUD() {
  const context = useContext(HUDContext)
  if (!context) {
    throw new Error('useHUD must be used inside a <HUDProvider>')
  }
  return context
}
