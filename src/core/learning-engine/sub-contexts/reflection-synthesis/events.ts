export interface ReflectionAnswered {
  type: 'ReflectionAnswered'
  /** ID of the reflection challenge. */
  challengeId: string
  /** Index of the challenge within the sequence or template. */
  challengeIndex: number
  /** Total number of steps / slots in this challenge. */
  stepCount?: number
  /** Whether the answer was correct. */
  isCorrect: boolean
  /** Timestamp of the answer. */
  timestamp: number
}

export interface ReflectionCompleted {
  type: 'ReflectionCompleted'
  /** Section type: reflection-sequence or reflection-template. */
  sectionType: string
  /** Total number of challenges in the section. */
  totalChallenges: number
  /** Number of correctly answered challenges. */
  correctCount: number
  /** Timestamp of completion. */
  timestamp: number
}

export type ReflectionSynthesisEvents = ReflectionAnswered | ReflectionCompleted
