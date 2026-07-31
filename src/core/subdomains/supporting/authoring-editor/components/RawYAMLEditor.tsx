import { useCallback } from 'react'
import type { ValidationError } from '../../../../okf/validate'

interface RawYAMLEditorProps {
  text: string
  errors: ValidationError[]
  onChange: (text: string) => void
}

function ErrorBanner({ errors }: { errors: ValidationError[] }) {
  if (errors.length === 0) return null

  const hasSyntaxError = errors.some((e) => e.kind === 'syntax')
  const hasSchemaError = errors.some((e) => e.kind === 'schema')
  const hasSemanticError = errors.some((e) => e.kind === 'semantic')

  return (
    <div className="yaml-validation-banner" data-testid="yaml-validation-banner" role="alert">
      {hasSyntaxError && (
        <div className="yaml-error-group" data-testid="yaml-syntax-error-group">
          <div className="yaml-error-group-title">YAML Syntax Error</div>
          {errors.filter((e) => e.kind === 'syntax').map((err, i) => {
            const syntaxErr = err as Extract<ValidationError, { kind: 'syntax' }>
            return (
              <div key={i} className="yaml-error-item" data-testid="yaml-syntax-error-item">
                {syntaxErr.line != null && (
                  <span className="yaml-error-line" data-testid="yaml-error-line">
                    Line {syntaxErr.line}
                  </span>
                )}
                <span className="yaml-error-message">{syntaxErr.message}</span>
                {syntaxErr.snippet && (
                  <span className="yaml-error-snippet" data-testid="yaml-error-snippet">
                    {syntaxErr.snippet}
                  </span>
                )}
                {(syntaxErr as unknown as { fixHint?: string }).fixHint && (
                  <span className="yaml-error-hint" data-testid="yaml-error-hint">
                    {(syntaxErr as unknown as { fixHint?: string }).fixHint}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
      {hasSchemaError && (
        <div className="yaml-error-group" data-testid="yaml-schema-error-group">
          <div className="yaml-error-group-title">Schema Validation Error</div>
          {errors.filter((e) => e.kind === 'schema').map((err, i) => {
            const schemaErr = err as Extract<ValidationError, { kind: 'schema' }>
            return (
              <div key={i} className="yaml-error-item" data-testid="yaml-schema-error-item">
                <span className="yaml-error-field" data-testid="yaml-error-field">
                  {schemaErr.field}
                </span>
                <span className="yaml-error-message">
                  {schemaErr.message}
                </span>
                {(schemaErr as unknown as { fixHint?: string }).fixHint && (
                  <span className="yaml-error-hint" data-testid="yaml-error-hint">
                    {(schemaErr as unknown as { fixHint?: string }).fixHint}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
      {hasSemanticError && (
        <div className="yaml-error-group" data-testid="yaml-semantic-error-group">
          <div className="yaml-error-group-title">Semantic Reference Error</div>
          {errors.filter((e) => e.kind === 'semantic').map((err, i) => (
            <div key={i} className="yaml-error-item" data-testid="yaml-semantic-error-item">
              <span className="yaml-error-field" data-testid="yaml-error-field">
                {(err as Extract<ValidationError, { kind: 'semantic' }>).field}
              </span>
              <span className="yaml-error-message">
                {(err as Extract<ValidationError, { kind: 'semantic' }>).message}
              </span>
              {(err as Extract<ValidationError, { kind: 'semantic' }>).fixHint && (
                <span className="yaml-error-hint" data-testid="yaml-error-hint">
                  {(err as Extract<ValidationError, { kind: 'semantic' }>).fixHint}
                </span>
              )}
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
