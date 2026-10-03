/**
 * Standardized Section Result Contract
 *
 * Exposes a uniform, strongly-typed interface for external bounded contexts
 * (e.g. Gamification Campaign, Learner Progress Tracking) to consume live
 * evaluation outcomes from any interactive section component.
 */

export type SectionCompletionStatus = 'in_progress' | 'completed' | 'failed'

export interface SectionResultContract<TPayload = unknown> {
  sectionId: string
  sectionType: string
  status: SectionCompletionStatus
  score?: number // Normalized score (0 - 100)
  accuracy?: number // Fractional accuracy (0.0 - 1.0)
  completedAt?: number
  payload: TPayload
}

export interface SectionResultProps<TPayload = unknown, TEvent extends { type: string } = { type: string; [key: string]: unknown }> {
  onResultChange?: (result: SectionResultContract<TPayload>) => void
  onEvent?: (event: TEvent) => void
}
