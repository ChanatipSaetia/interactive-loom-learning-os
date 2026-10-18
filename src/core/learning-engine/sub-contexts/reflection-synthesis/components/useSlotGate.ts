import { useCallback, useEffect, useRef, useState } from 'react'

export type SlotMark = 'ok' | 'off'
export type SlotPhase = 'placing' | 'checking' | 'fixing' | 'done'

const SHOW_WRONG = 650
const FIX = 1000

/**
 * The tap-to-place mechanic shared by Present mode's reflection gates: tap an item into the next empty
 * slot (or back out), then Check; wrong items are marked, then everything glides to the right slot.
 * `capture` (from useFlip) is called before every move so the moves animate.
 */
export function useSlotGate({ items, solution, solved, capture, onChecked }: {
  /** Item ids in the order they start in the pool. */
  items: string[]
  /** The right item id for each slot. */
  solution: string[]
  /** The gate is already solved: show the solution. */
  solved: boolean
  capture: (feel?: 'spring' | 'glide') => void
  /** Called once with whether the first check was right. */
  onChecked: (correct: boolean) => void
}) {
  const [slots, setSlots] = useState<Array<string | null>>(() => solution.map(() => null))
  const [marks, setMarks] = useState<Record<string, SlotMark>>({})
  const [phase, setPhase] = useState<SlotPhase>('placing')
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const shown = solved && phase !== 'fixing' && phase !== 'checking' ? solution : slots
  const done = solved || phase === 'done'
  const pool = items.filter((id) => !shown.includes(id))
  const full = shown.every(Boolean)

  const place = useCallback((id: string) => {
    if (done || phase !== 'placing') return
    const at = slots.indexOf(id)
    capture('spring')
    if (at >= 0) {
      setSlots((s) => s.map((x) => (x === id ? null : x)))
      return
    }
    const empty = slots.indexOf(null)
    if (empty < 0) return
    setSlots((s) => s.map((x, i) => (i === empty ? id : x)))
  }, [done, phase, slots, capture])

  const check = useCallback(() => {
    if (done || phase !== 'placing' || !full) return false
    const next: Record<string, SlotMark> = {}
    slots.forEach((id, i) => { if (id) next[id] = id === solution[i] ? 'ok' : 'off' })
    setMarks(next)
    const correct = Object.values(next).every((m) => m === 'ok')
    onChecked(correct)
    if (correct) {
      setPhase('done')
      return true
    }
    setPhase('checking')
    timers.current.push(window.setTimeout(() => {
      capture('glide')
      setSlots(solution)
      setPhase('fixing')
      timers.current.push(window.setTimeout(() => {
        setMarks(Object.fromEntries(solution.map((id) => [id, 'ok' as const])))
        setPhase('done')
      }, FIX))
    }, SHOW_WRONG))
    return false
  }, [done, phase, full, slots, solution, capture, onChecked])

  const markOf = (id: string): SlotMark | undefined => (solved && phase === 'placing' ? (solution.includes(id) ? 'ok' : undefined) : marks[id])

  return { slots: shown, pool, full, phase, done, place, check, markOf }
}

/** Items in a starting order that is not already the answer. */
export function startingOrder(ids: string[], solution: string[]): string[] {
  if (ids.length > 1 && ids.every((id, i) => id === solution[i])) return [...ids.slice(1), ids[0]]
  return ids
}
