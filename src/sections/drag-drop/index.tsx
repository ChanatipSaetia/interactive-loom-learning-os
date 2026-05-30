import { useState, useCallback, useMemo, useRef, type ComponentType } from 'react'
import { SectionRegistry } from '../../core/registry'

export interface DragItem {
  id: string
  label: string
  correctZone: string
}

export interface DropZone {
  id: string
  label: string
}

export interface DragDropProps {
  title?: string
  items: DragItem[]
  zones: DropZone[]
}

type Placement = Record<string, string | null>

function DragDrop({ title, items, zones }: DragDropProps) {
  const [placement, setPlacement] = useState<Placement>(() => {
    const initial: Placement = {}
    items.forEach((item) => {
      initial[item.id] = null
    })
    return initial
  })
  const [hoverZone, setHoverZone] = useState<string | null>(null)
  const [validated, setValidated] = useState(false)
  const dragItemIdRef = useRef<string | null>(null)

  const zoneItems = useMemo(() => {
    const map: Record<string, string[]> = {}
    zones.forEach((z) => {
      map[z.id] = []
    })
    items.forEach((item) => {
      const z = placement[item.id]
      if (z && map[z]) {
        map[z].push(item.id)
      }
    })
    return map
  }, [items, zones, placement])

  const unplacedItems = useMemo(() => {
    return items.filter((item) => !placement[item.id])
  }, [items, placement])

  const isCorrect = useCallback(
    (itemId: string) => {
      const item = items.find((i) => i.id === itemId)
      if (!item) return false
      return placement[itemId] === item.correctZone
    },
    [items, placement]
  )

  const handleDragStart = useCallback((itemId: string) => {
    dragItemIdRef.current = itemId
  }, [])

  const handleDragEnd = useCallback(() => {
    dragItemIdRef.current = null
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, zoneId: string) => {
    e.preventDefault()
    setHoverZone(zoneId)
  }, [])

  const handleDragLeave = useCallback(() => {
    setHoverZone(null)
  }, [])

  const handleDrop = useCallback(
    (zoneId: string) => {
      const itemId = dragItemIdRef.current
      if (!itemId) {
        setHoverZone(null)
        return
      }
      setPlacement((prev) => ({ ...prev, [itemId]: zoneId }))
      setValidated(false)
      setHoverZone(null)
      dragItemIdRef.current = null
    },
    []
  )

  const handleValidate = useCallback(() => {
    setValidated(true)
  }, [])

  const handleReset = useCallback(() => {
    const initial: Placement = {}
    items.forEach((item) => {
      initial[item.id] = null
    })
    setPlacement(initial)
    setValidated(false)
    setHoverZone(null)
  }, [items])

  const allPlaced = unplacedItems.length === 0
  const allCorrect = items.every((item) => isCorrect(item.id))

  return (
    <div className="drag-drop" data-testid="drag-drop">
      {title && <h3 className="drag-drop-title">{title}</h3>}

      <div className="drag-drop-zones" data-testid="drag-drop-zones">
        {zones.map((zone) => {
          const itemsInZone = zoneItems[zone.id] || []
          const isHovered = hoverZone === zone.id
          return (
            <div
              key={zone.id}
              className={`drag-drop-zone${isHovered ? ' drag-drop-zone-hovered' : ''}`}
              data-testid={`zone-${zone.id}`}
              onDragOver={(e) => handleDragOver(e, zone.id)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(zone.id)}
            >
              <div className="drag-drop-zone-label">{zone.label}</div>
              <div className="drag-drop-zone-items">
                {itemsInZone.map((itemId) => {
                  const item = items.find((i) => i.id === itemId)
                  if (!item) return null
                  const correct = validated && isCorrect(itemId)
                  const incorrect = validated && !isCorrect(itemId)
                  return (
                    <div
                      key={itemId}
                      className={`drag-drop-item drag-drop-item-placed${correct ? ' drag-drop-item-correct' : ''}${incorrect ? ' drag-drop-item-incorrect' : ''}`}
                      draggable
                      onDragStart={() => handleDragStart(itemId)}
                      onDragEnd={handleDragEnd}
                      data-testid={`dropped-${itemId}`}
                    >
                      {item.label}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="drag-drop-tray" data-testid="drag-drop-tray">
        {unplacedItems.map((item) => (
          <div
            key={item.id}
            className="drag-drop-item"
            draggable
            onDragStart={() => handleDragStart(item.id)}
            onDragEnd={handleDragEnd}
            data-testid={`item-${item.id}`}
          >
            {item.label}
          </div>
        ))}
      </div>

      <div className="drag-drop-controls" data-testid="drag-drop-controls">
        <button
          className="drag-drop-btn drag-drop-btn-validate"
          onClick={handleValidate}
          disabled={!allPlaced || validated}
          data-testid="drag-drop-validate"
          aria-label="Validate answer"
        >
          Validate
        </button>
        <button
          className="drag-drop-btn drag-drop-btn-reset"
          onClick={handleReset}
          data-testid="drag-drop-reset"
          aria-label="Reset exercise"
        >
          Reset
        </button>
      </div>

      {validated && (
        <div
          className={`drag-drop-feedback${allCorrect ? ' drag-drop-feedback-correct' : ''}`}
          data-testid="drag-drop-feedback"
        >
          {allCorrect ? 'All correct!' : 'Some items are in the wrong zone. Try again.'}
        </div>
      )}
    </div>
  )
}

SectionRegistry.register('drag-drop', DragDrop as ComponentType<unknown>)

export default DragDrop
