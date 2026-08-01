export interface QuizOptionSelected {
  type: 'QuizOptionSelected'
  /** ID of the question being answered. */
  questionId: string
  /** ID of the selected choice. */
  choiceId: string
  /** Whether the selected choice was correct. */
  isCorrect: boolean
  /** Timestamp of the selection. */
  timestamp: number
}

export interface QuizCompleted {
  type: 'QuizCompleted'
  /** Total number of questions in the quiz. */
  totalQuestions: number
  /** Number of correctly answered questions. */
  correctCount: number
  /** Score percentage (0-100). */
  score: number
  /** Timestamp of completion. */
  timestamp: number
}

export interface FlashcardFlipped {
  type: 'FlashcardFlipped'
  /** ID of the flipped flashcard term. */
  termId: string
  /** Index of the term within the deck. */
  termIndex: number
  /** Whether the card was flipped to front or back. */
  isFront: boolean
  /** Timestamp of the flip. */
  timestamp: number
}

export interface ConceptMapMatched {
  type: 'ConceptMapMatched'
  /** ID of the source node in the matched edge. */
  fromNodeId: string
  /** ID of the target node in the matched edge. */
  toNodeId: string
  /** Label of the matched edge (if any). */
  edgeLabel?: string
  /** Timestamp of the match. */
  timestamp: number
}

export type PracticeAssessmentEvents =
  | QuizOptionSelected
  | QuizCompleted
  | FlashcardFlipped
  | ConceptMapMatched
