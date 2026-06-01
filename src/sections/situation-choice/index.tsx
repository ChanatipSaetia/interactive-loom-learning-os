import { useState, useCallback, type ComponentType } from 'react'
import { SectionRegistry } from '../../core/registry'
import './situation-choice.css'

export interface ChoiceOption {
  id: string
  label: string
  description: string
  pros: string[]
  cons: string[]
  whenToUse?: string
}

export interface RecommendationDetail {
  why: string
}

export interface SituationChoice {
  title: string
  situation: string
  recommended: string
  recommendationDetail: RecommendationDetail
  choices: ChoiceOption[]
}

export interface SituationChoiceSectionProps {
  title?: string
  situations: SituationChoice[]
}

function SituationItem({ situation, index }: { situation: SituationChoice; index: number }) {
  const recommendedIdx = situation.choices.findIndex((c) => c.id === situation.recommended)
  const [openIndex, setOpenIndex] = useState(recommendedIdx >= 0 ? recommendedIdx : 0)

  const handleToggle = useCallback(
    (idx: number) => {
      setOpenIndex((prev) => (prev === idx ? idx : idx))
    },
    [],
  )

  return (
    <div className="situation-choice-item" data-testid={`situation-choice-item-${index}`}>
      <h4 className="situation-choice-heading" data-testid={`situation-choice-heading-${index}`}>
        {situation.title}
      </h4>

      <div className="situation-banner" data-testid={`situation-banner-${index}`}>
        <p className="situation-text">{situation.situation}</p>
      </div>

      <div className="recommendation-banner" data-testid={`recommendation-banner-${index}`}>
        <p className="recommendation-text">{situation.recommendationDetail.why}</p>
      </div>

      <div className="situation-accordion" data-testid={`situation-accordion-${index}`}>
        {situation.choices.map((choice, idx) => {
          const isOpen = idx === openIndex
          const isRecommended = choice.id === situation.recommended

          return (
            <div
              key={choice.id}
              className={`situation-card${isOpen ? ' situation-card-open' : ''}${isRecommended ? ' situation-card-recommended' : ''}`}
              data-testid={`situation-card-${index}-${choice.id}`}
            >
              <button
                className="situation-card-trigger"
                onClick={() => handleToggle(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleToggle(idx)
                  }
                }}
                aria-expanded={isOpen}
                data-testid={`situation-card-trigger-${index}-${choice.id}`}
              >
                <span className="situation-card-label">{choice.label}</span>
                {isRecommended && (
                  <span className="situation-badge" data-testid={`situation-badge-${index}-${choice.id}`}>
                    Recommended
                  </span>
                )}
                <span className="situation-chevron" data-testid={`situation-chevron-${index}-${choice.id}`}>
                  {isOpen ? '▾' : '▸'}
                </span>
              </button>

              {isOpen && (
                <div className="situation-card-content" data-testid={`situation-card-content-${index}-${choice.id}`}>
                  <p className="situation-card-description">{choice.description}</p>

                  {choice.pros.length > 0 && (
                    <ul className="situation-pros" data-testid={`situation-pros-${index}-${choice.id}`}>
                      {choice.pros.map((pro, pidx) => (
                        <li key={pidx} className="situation-pro" data-testid={`situation-pro-${index}-${choice.id}-${pidx}`}>
                          <span className="situation-bullet situation-bullet-pro" data-testid={`situation-bullet-pro-${index}-${choice.id}-${pidx}`}>&#9652;</span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  )}

                  {choice.cons.length > 0 && (
                    <ul className="situation-cons" data-testid={`situation-cons-${index}-${choice.id}`}>
                      {choice.cons.map((con, cidx) => (
                        <li key={cidx} className="situation-con" data-testid={`situation-con-${index}-${choice.id}-${cidx}`}>
                          <span className="situation-bullet situation-bullet-con" data-testid={`situation-bullet-con-${index}-${choice.id}-${cidx}`}>&#9652;</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  )}

                  {choice.whenToUse && !isRecommended && (
                    <p className="situation-when-to-use" data-testid={`situation-when-to-use-${index}-${choice.id}`}>
                      {choice.whenToUse}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SituationChoiceSection({ title, situations }: SituationChoiceSectionProps) {
  return (
    <div className="situation-choice" data-testid="situation-choice">
      {title && <h3 className="situation-choice-title" data-testid="situation-choice-title">{title}</h3>}

      {situations.map((situation, idx) => (
        <SituationItem key={idx} situation={situation} index={idx} />
      ))}
    </div>
  )
}

SectionRegistry.register('situation-choice', SituationChoiceSection as ComponentType<unknown>)

export default SituationChoiceSection
