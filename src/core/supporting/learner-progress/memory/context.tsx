/**
 * Records what the learner meets and answers into the event log. Pages wrap
 * their topic in a provider with a storage adapter; sections report through
 * `SectionRenderer`'s `onEvent`, Present through the section it shows.
 */
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { learnerEventOf, stampEvent, type LearnerEvent, type NewLearnerEvent } from './events'
import type { LearnerMemoryPort } from './port'
import { loadProgress } from '../storage'

export interface LearnerMemoryValue {
  record: (event: NewLearnerEvent) => void
  port: LearnerMemoryPort
  device: string
}

const LearnerMemoryContext = createContext<LearnerMemoryValue | null>(null)

export function LearnerMemoryProvider({ port, device, onError, children }: {
  port: LearnerMemoryPort
  device: string
  /** Called when an event could not be stored. */
  onError?: (error: unknown) => void
  children: ReactNode
}) {
  const record = useCallback((event: NewLearnerEvent) => {
    port.append([stampEvent(event, device)]).catch((e) => onError?.(e))
  }, [port, device, onError])
  const value = useMemo(() => ({ record, port, device }), [record, port, device])
  return <LearnerMemoryContext.Provider value={value}>{children}</LearnerMemoryContext.Provider>
}

export function useLearnerMemory(): LearnerMemoryValue | null {
  return useContext(LearnerMemoryContext)
}

/** `onEvent` for a section's component: its events, kept when they matter. Undefined without a provider. */
export function useSectionEventRecorder(topic: string, section: string): ((event: { type: string; [key: string]: unknown }) => void) | undefined {
  const memory = useLearnerMemory()
  return useMemo(() => {
    if (!memory) return undefined
    return (event) => {
      const learnerEvent = learnerEventOf(topic, section, event)
      if (learnerEvent) memory.record(learnerEvent)
    }
  }, [memory, topic, section])
}

const MIGRATED_KEY = 'loom-memory-migrated'

/**
 * The old progress store (`loom:progress:v1`) as events, once (decision 151):
 * a viewed section becomes `seen`, a completed one `completed`.
 */
export function progressAsEvents(device: string, now = new Date()): LearnerEvent[] {
  const out: LearnerEvent[] = []
  for (const [topic, sections] of Object.entries(loadProgress())) {
    for (const [section, progress] of Object.entries(sections)) {
      const item = `sections/${section}.oui`
      if (progress.viewed) out.push(stampEvent({ topic, item, kind: 'seen' }, device, now))
      if (progress.completed) out.push(stampEvent({ topic, item, kind: 'completed' }, device, now))
    }
  }
  return out
}

/** Imports the old progress store into `port` the first time this browser runs it. */
export async function migrateProgressOnce(port: LearnerMemoryPort, device: string): Promise<void> {
  try {
    if (localStorage.getItem(MIGRATED_KEY)) return
    await port.append(progressAsEvents(device))
    localStorage.setItem(MIGRATED_KEY, new Date().toISOString())
  } catch {
    /* storage blocked: try again next time */
  }
}
