import { useCallback } from 'react'

interface DynamicSchemaFormProps {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

function renderPrimitiveField(
  key: string,
  value: unknown,
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
          <textarea
            className="visual-form-textarea"
            value={value}
            onChange={(e) => onChange(key, e.target.value)}
            rows={Math.max(2, Math.min(value.split('\n').length, 6))}
            data-testid={`form-field-${key}`}
          />
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

  return (
    <div className="visual-form-field" key={key}>
      <label className="visual-form-label">
        <span className="visual-form-key">{key}</span>
        <span className="visual-form-value">{String(value)}</span>
      </label>
    </div>
  )
}

function renderArrayField(
  key: string,
  value: unknown[],
  onChange: (key: string, value: unknown[]) => void
): JSX.Element {
  if (value.length === 0) {
    return (
      <div className="visual-form-field" key={key}>
        <span className="visual-form-key">{key}</span>
        <span className="visual-form-empty">[] (empty array)</span>
      </div>
    )
  }

  const first = value[0]
  const isPrimitive =
    typeof first === 'string' ||
    typeof first === 'number' ||
    typeof first === 'boolean'

  if (isPrimitive) {
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

  if (typeof first === 'object' && first !== null) {
    const objArray = value as Record<string, unknown>[]
    return (
      <div className="visual-form-field visual-form-field--array" key={key}>
        <span className="visual-form-key">{key}</span>
        <div className="visual-form-object-list">
          {objArray.map((item, i) => (
            <div className="visual-form-card" key={i}>
              <div className="visual-form-card-header">
                <span className="card-header-title">Item #{i + 1}</span>
              </div>
              <div className="visual-form-card-body">
                <DynamicSchemaForm
                  data={item}
                  onChange={(updated) => {
                    const updatedArr = [...objArray]
                    updatedArr[i] = updated
                    onChange(key, updatedArr as unknown[])
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="visual-form-field" key={key}>
      <span className="visual-form-key">{key}</span>
      <span className="visual-form-value">{JSON.stringify(value)}</span>
    </div>
  )
}

export function DynamicSchemaForm({ data, onChange }: DynamicSchemaFormProps) {
  const handleFieldChange = useCallback(
    (key: string, value: unknown) => {
      onChange({ ...data, [key]: value })
    },
    [data, onChange]
  )

  const entries = Object.entries(data)

  return (
    <div className="visual-form" data-testid="dynamic-schema-form">
      {entries.map(([key, value]) => {
        if (Array.isArray(value)) {
          return renderArrayField(key, value, handleFieldChange)
        }

        if (typeof value === 'object' && value !== null) {
          return (
            <div className="visual-form-field" key={key}>
              <div className="visual-form-card">
                <div className="visual-form-card-header">
                  <span className="card-header-title">{key}</span>
                </div>
                <div className="visual-form-card-body">
                  <DynamicSchemaForm
                    data={value as Record<string, unknown>}
                    onChange={(updated) => handleFieldChange(key, updated)}
                  />
                </div>
              </div>
            </div>
          )
        }

        return renderPrimitiveField(key, value, handleFieldChange)
      })}
    </div>
  )
}

