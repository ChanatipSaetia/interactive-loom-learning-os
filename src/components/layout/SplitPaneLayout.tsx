import { useState, useCallback, useRef, type ReactNode, useEffect } from 'react'

interface SplitPaneLayoutProps {
  leftPanel: ReactNode
  rightPanel: ReactNode
  initialSplitRatio?: number
  minLeftWidth?: number
  minRightWidth?: number
}

export function SplitPaneLayout({
  leftPanel,
  rightPanel,
  initialSplitRatio = 0.45,
  minLeftWidth = 280,
  minRightWidth = 280,
}: SplitPaneLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [splitRatio, setSplitRatio] = useState(initialSplitRatio)
  const isDragging = useRef(false)

  const startDrag = useCallback(
    (clientX: number) => {
      isDragging.current = true
      const startX = clientX

      const onMove = (moveX: number) => {
        if (!isDragging.current || !containerRef.current) return
        const delta = moveX - startX
        const containerWidth = containerRef.current.getBoundingClientRect().width
        const deltaRatio = delta / containerWidth
        const newRatio = Math.max(
          minLeftWidth / containerWidth,
          Math.min(1 - minRightWidth / containerWidth, splitRatio + deltaRatio)
        )
        setSplitRatio(newRatio)
      }

      const onUp = () => {
        isDragging.current = false
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      const handleMouseMove = (e: MouseEvent) => onMove(e.clientX)
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', onUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [splitRatio, minLeftWidth, minRightWidth]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      startDrag(e.clientX)
    },
    [startDrag]
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        startDrag(e.touches[0].clientX)
      }
    },
    [startDrag]
  )

  // Clean up on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', () => {})
      document.removeEventListener('mouseup', () => {})
    }
  }, [])

  return (
    <div className="split-pane-layout" ref={containerRef} data-testid="split-pane-layout">
      <div
        className="split-pane-left"
        style={{ width: `${splitRatio * 100}%` }}
        data-testid="split-pane-left"
      >
        {leftPanel}
      </div>
      <div
        className="split-pane-divider"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        data-testid="split-pane-divider"
        role="separator"
        aria-orientation="vertical"
        tabIndex={0}
      />
      <div
        className="split-pane-right"
        style={{ width: `${(1 - splitRatio) * 100}%` }}
        data-testid="split-pane-right"
      >
        {rightPanel}
      </div>
    </div>
  )
}
