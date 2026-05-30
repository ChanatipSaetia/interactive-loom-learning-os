import { useState, useCallback, type ComponentType } from 'react'
import { SectionRegistry } from '../../core/registry'
import './choice.css'

export interface ChoiceOption {
  id: string
  label: string
  description: string
  pros: string[]
  cons: string[]
}

export interface ChoiceProps {
  title?: string
  options: ChoiceOption[]
}

function Choice({ title, options }: ChoiceProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleSelect = useCallback((optionId: string) => {
    setSelectedId((prev) => (prev === optionId ? null : optionId))
  }, [])

  const selectedOption = options.find((o) => o.id === selectedId) || null

  return (
    <div className="choice" data-testid="choice">
      {title && <h3 className="choice-title">{title}</h3>}

      <div className="choice-options" data-testid="choice-options">
        {options.map((option) => {
          const isSelected = option.id === selectedId
          return (
            <div
              key={option.id}
              className={`choice-card${isSelected ? ' choice-card-selected' : ''}`}
              data-testid={`choice-card-${option.id}`}
            >
              <div
                className="choice-card-header"
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(option.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Space') {
                    e.preventDefault()
                    handleSelect(option.id)
                  }
                }}
                aria-pressed={isSelected}
                data-testid={`choice-select-${option.id}`}
              >
                <div className="choice-card-indicator">
                  {isSelected ? (
                    <span className="choice-icon choice-icon-checked" data-testid={`choice-checked-${option.id}`}>&#10003;</span>
                  ) : (
                    <span className="choice-icon choice-icon-unchecked" data-testid={`choice-unchecked-${option.id}`}>&#9675;</span>
                  )}
                </div>
                <div className="choice-card-label">{option.label}</div>
              </div>

              <p className="choice-card-description">{option.description}</p>

              <div className="choice-card-details">
                <div className="choice-pros" data-testid={`choice-pros-${option.id}`}>
                  <h4 className="choice-pros-title">Pros</h4>
                  <ul className="choice-list">
                    {option.pros.map((pro, idx) => (
                      <li key={idx} className="choice-list-item choice-list-pro" data-testid={`choice-pro-${option.id}-${idx}`}>
                        <span className="choice-bullet choice-bullet-pro" data-testid={`choice-bullet-pro-${option.id}-${idx}`}>&#9652;</span>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="choice-cons" data-testid={`choice-cons-${option.id}`}>
                  <h4 className="choice-cons-title">Cons</h4>
                  <ul className="choice-list">
                    {option.cons.map((con, idx) => (
                      <li key={idx} className="choice-list-item choice-list-con" data-testid={`choice-con-${option.id}-${idx}`}>
                        <span className="choice-bullet choice-bullet-con" data-testid={`choice-bullet-con-${option.id}-${idx}`}>&#9652;</span>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {isSelected && selectedOption && (
                <div className="choice-selected-details" data-testid={`choice-selected-details-${option.id}`}>
                  <p className="choice-selected-text">{selectedOption.description}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

SectionRegistry.register('choice', Choice as ComponentType<unknown>)

export default Choice
