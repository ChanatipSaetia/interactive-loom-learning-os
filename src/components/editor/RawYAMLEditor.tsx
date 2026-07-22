import { useCallback } from 'react'
import type { ValidationError } from '../../core/okf/validate'

interface RawYAMLEditorProps {
  text: string
  errors: ValidationError[]
  onChange: (text: string) => void
}

function ErrorBanner({ errors }: { errors: ValidationError[] }) {
  if (errors.length === 0) return null

  const hasSyntaxError = errors.some((e) => e.kind === 'syntax')
  const hasSchemaError = errors.some((e) => e.kind === 'schema')

  return (
    <div className="yaml-validation-banner" data-testid="yaml-validation-banner" role="alert">
      {hasSyntaxError && (
        <div className="yaml-error-group" data-testid="yaml-syntax-error-group">
          <div className="yaml-error-group-title">YAML Syntax Error</div>
          {errors.filter((e) => e.kind === 'syntax').map((err, i) => (
            <div key={i} className="yaml-error-item" data-testid="yaml-syntax-error-item">
              {(err as Extract<ValidationError, { kind: 'syntax' }>).line != null && (
                <span className="yaml-error-line" data-testid="yaml-error-line">
                  Line {(err as Extract<ValidationError, { kind: 'syntax' }>).line}
                </span>
              )}
              <span className="yaml-error-message">{err.message}</span>
            </div>
          ))}
        </div>
      )}
      {hasSchemaError && (
        <div className="yaml-error-group" data-testid="yaml-schema-error-group">
          <div className="yaml-error-group-title">Schema Validation Error</div>
          {errors.filter((e) => e.kind === 'schema').map((err, i) => (
            <div key={i} className="yaml-error-item" data-testid="yaml-schema-error-item">
              <span className="yaml-error-field" data-testid="yaml-error-field">
                {(err as Extract<ValidationError, { kind: 'schema' }>).field}
              </span>
              <span className="yaml-error-message">
                {(err as Extract<ValidationError, { kind: 'schema' }>).message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function RawYAMLEditor({ text, errors, onChange }: RawYAMLEditorProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  return (
    <div className="raw-yaml-editor" data-testid="raw-yaml-editor">
      <ErrorBanner errors={errors} />
      <textarea
        className="raw-yaml-textarea"
        value={text}
        onChange={handleChange}
        spellCheck={false}
        data-testid="raw-yaml-textarea"
        placeholder="Enter section YAML data..."
      />
    </div>
  )
}
