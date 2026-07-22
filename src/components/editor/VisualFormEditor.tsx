import { useCallback } from 'react'
import type { OKFSectionData } from '../../core/okf/types'

interface VisualFormEditorProps {
  data: OKFSectionData
  onChange: (data: OKFSectionData) => void
}

function renderFormField(
  key: string,
  value: unknown,
  depth: number,
  onChange: (key: string, value: unknown) => void
): JSX.Element {
  if (value === null || value === undefined) {
    return (
      <div className="visual-form-field" key={key}>
        <label className="visual-form-label">
          <span className="visual-form-key">{key}</span>
          <input
            className="visual-form-input"
            type="text"
            value=""
            placeholder="(empty)"
            onChange={(e) => onChange(key, e.target.value || null)}
            data-testid={`form-field-${key}`}
          />
        </label>
      </div>
    )
  }

  if (typeof value === 'string') {
    return (
      <div className="visual-form-field" key={key}>
        <label className="visual-form-label">
          <span className="visual-form-key">{key}</span>
          {depth > 0 || key === 'paragraphs' || key === 'items' ? (
            <textarea
              className="visual-form-textarea"
              value={value}
              onChange={(e) => onChange(key, e.target.value)}
              rows={Math.max(2, Math.min(value.split('\n').length, 6))}
              data-testid={`form-field-${key}`}
            />
          ) : (
            <input
              className="visual-form-input"
              type="text"
              value={value}
              onChange={(e) => onChange(key, e.target.value)}
              data-testid={`form-field-${key}`}
            />
          )}
        </label>
      </div>
    )
  }

  if (typeof value === 'number') {
    return (
      <div className="visual-form-field" key={key}>
        <label className="visual-form-label">
          <span className="visual-form-key">{key}</span>
          <input
            className="visual-form-input"
            type="number"
            value={value}
            onChange={(e) => onChange(key, parseFloat(e.target.value) || 0)}
            data-testid={`form-field-${key}`}
          />
        </label>
      </div>
    )
  }

  if (typeof value === 'boolean') {
    return (
      <div className="visual-form-field visual-form-field--bool" key={key}>
        <label className="visual-form-label">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(key, e.target.checked)}
            data-testid={`form-field-${key}`}
          />
          <span className="visual-form-key">{key}</span>
        </label>
      </div>
    )
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <div className="visual-form-field" key={key}>
          <span className="visual-form-key">{key}</span>
          <span className="visual-form-empty">[] (empty array)</span>
        </div>
      )
    }

    if (typeof value[0] === 'string' || typeof value[0] === 'number' || typeof value[0] === 'boolean') {
      return (
        <div className="visual-form-field visual-form-field--array" key={key}>
          <label className="visual-form-label">
            <span className="visual-form-key">{key}</span>
            <div className="visual-form-string-list">
              {value.map((item, i) => (
                <input
                  key={i}
                  className="visual-form-input"
                  type="text"
                  value={String(item)}
                  onChange={(e) => {
                    const updated = [...value]
                    updated[i] = e.target.value
                    onChange(key, updated)
                  }}
                  data-testid={`form-field-${key}-${i}`}
                />
              ))}
            </div>
          </label>
        </div>
      )
    }

    if (typeof value[0] === 'object' && value[0] !== null) {
      return (
        <div className="visual-form-field visual-form-field--array" key={key}>
          <span className="visual-form-key">{key}</span>
          <div className="visual-form-object-list">
            {value.map((item: Record<string, unknown>, i: number) => (
              <fieldset className="visual-form-nested" key={i}>
                <legend>#{i + 1}</legend>
                {Object.entries(item).map(([k, v]) =>
                  renderFormField(k, v, depth + 1, (nestedKey, nestedValue) => {
                    const updated = [...value]
                    updated[i] = { ...item, [nestedKey]: nestedValue }
                    onChange(key, updated)
                  })
                )}
              </fieldset>
            ))}
          </div>
        </div>
      )
    }
  }

  if (typeof value === 'object') {
    return (
      <div className="visual-form-field" key={key}>
        <fieldset className="visual-form-nested">
          <legend>{key}</legend>
          {Object.entries(value as Record<string, unknown>).map(([k, v]) =>
            renderFormField(k, v, depth + 1, onChange)
          )}
        </fieldset>
      </div>
    )
  }

  return (
    <div className="visual-form-field" key={key}>
      <label className="visual-form-label">
        <span className="visual-form-key">{key}</span>
        <span className="visual-form-value">{String(value)}</span>
      </label>
    </div>
  )
}

export function VisualFormEditor({ data, onChange }: VisualFormEditorProps) {
  const handleFieldChange = useCallback(
    (key: string, value: unknown) => {
      onChange({ ...data, [key]: value })
    },
    [data, onChange]
  )

  const entries = Object.entries(data)

  return (
    <div className="visual-form" data-testid="visual-form-editor">
      {entries.map(([key, value]) => renderFormField(key, value, 0, handleFieldChange))}
    </div>
  )
}
