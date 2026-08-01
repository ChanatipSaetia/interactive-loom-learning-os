// Validation Types & Diagnostics Helper

export interface ValidationContext {
  file?: string
  topicId?: string
  sectionName?: string
}

export interface ValidationDiagnostic {
  tier: 1 | 2 | 3
  file?: string
  field?: string
  line?: number
  column?: number
  message: string
  fixHint?: string
}

export interface ValidationResult<T = unknown> {
  status: 'valid' | 'warning' | 'error'
  payload: T
  diagnostics: ValidationDiagnostic[]
}

export function contextToDiagnostic(context?: ValidationContext): Partial<ValidationDiagnostic> {
  if (!context) return {}
  return {
    file: context.file,
  }
}
