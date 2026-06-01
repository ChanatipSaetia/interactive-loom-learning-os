import { useState, useCallback, useEffect, useRef, type ComponentType } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Check, X } from 'lucide-react'
import { animate, type JSAnimation } from 'animejs'
import { SectionRegistry } from '../../core/registry'
import { useAnimation } from '../../core/hooks/useAnimation'
import './situation-choice.css'

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

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

function AccordionContent({
  isOpen,
  choiceId,
  index,
  children,
  reducedMotion,
}: {
  isOpen: boolean
  choiceId: string
  index: number
  children: React.ReactNode
  reducedMotion: boolean
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<JSAnimation | null>(null)

  const getHeight = useCallback(() => {
    return innerRef.current?.scrollHeight ?? 0
  }, [])

  useEffect(() => {
    if (!isOpen) {
      if (animRef.current) {
        animRef.current.cancel()
      }
      const el = contentRef.current
      if (!el) return
      const currentHeight = el.scrollHeight
      if (currentHeight === 0) {
        el.style.height = '0px'
        el.style.overflow = 'hidden'
        return
      }
      animRef.current = animate(
        el,
        { height: [currentHeight, 0], duration: reducedMotion ? 0 : 250, ease: 'easeInOutQuad', autoplay: true }
      )
      animRef.current.onComplete = () => {
        el.style.overflow = 'hidden'
      }
      return () => {
        animRef.current?.cancel()
      }
    }

    const el = contentRef.current
    if (!el) return
    el.style.height = 'auto'
    const targetHeight = getHeight()
    el.style.height = '0px'

    if (reducedMotion) {
      el.style.height = 'auto'
      return
    }

    animRef.current = animate(
      el,
      { height: [0, targetHeight], duration: 300, ease: 'easeOutQuad', autoplay: true }
    )
    animRef.current.onComplete = () => {
      el.style.height = 'auto'
    }
    return () => {
      animRef.current?.cancel()
    }
  }, [isOpen, reducedMotion, getHeight])

  return (
    <div
      ref={contentRef}
      className="situation-card-content-wrapper"
      data-testid={`situation-card-content-wrapper-${index}-${choiceId}`}
    >
      <div
        ref={innerRef}
        className="situation-card-content"
        data-testid={`situation-card-content-${index}-${choiceId}`}
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
      >
        {children}
      </div>
    </div>
  )
}

function SituationItem({
  situation,
  index,
  openIndex,
  onToggle,
  compareOpen,
  onCompareToggle,
  reducedMotion,
}: {
  situation: SituationChoice
  index: number
  openIndex: number
  onToggle: (idx: number) => void
  compareOpen: boolean
  onCompareToggle: () => void
  reducedMotion: boolean
}) {
  const itemRef = useRef<HTMLDivElement>(null)
  const recBannerRef = useRef<HTMLDivElement>(null)
  const recCardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())

  useAnimation(
    (tl) => {
      if (reducedMotion) return

      const item = itemRef.current
      if (item) {
        tl.add(item, { opacity: [0, 1], translateY: [20, 0], duration: 400, ease: 'easeOut' })
      }

      const recBanner = recBannerRef.current
      if (recBanner) {
        tl.add(recBanner, { opacity: [0, 1], translateY: [12, 0], duration: 350, ease: 'easeOut' }, '-=200')
      }

      const recId = situation.recommended
      const recCard = recCardRefs.current.get(recId)
      if (recCard) {
        tl.add(recCard, { opacity: [0, 1], translateX: [-16, 0], duration: 350, ease: 'easeOut' }, '-=250')
      }
    },
    { autoplay: true }
  )

  const setRecCardRef = useCallback((choiceId: string) => (el: HTMLDivElement | null) => {
    recCardRefs.current.set(choiceId, el)
  }, [])

  return (
    <div
      ref={itemRef}
      className="situation-choice-item"
      data-testid={`situation-choice-item-${index}`}
      style={{ opacity: 0, transform: 'translateY(20px)' }}
    >
      <h4 className="situation-choice-heading" data-testid={`situation-choice-heading-${index}`}>
        {situation.title}
      </h4>

      <div className="situation-banner" data-testid={`situation-banner-${index}`}>
        <p className="situation-text">{situation.situation}</p>
      </div>

      <div
        ref={recBannerRef}
        className="recommendation-banner"
        data-testid={`recommendation-banner-${index}`}
        style={{ opacity: 0, transform: 'translateY(12px)' }}
      >
        <p className="recommendation-text">{situation.recommendationDetail.why}</p>
      </div>

      <Dialog.Root open={compareOpen} onOpenChange={onCompareToggle}>
        <Dialog.Trigger asChild>
          <button
            className="compare-all-button"
            data-testid={`compare-all-button-${index}`}
          >
            Compare All
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay
            className="compare-overlay"
            data-testid={`compare-overlay-${index}`}
            onClick={onCompareToggle}
          />
          <Dialog.Content className="compare-dialog" data-testid={`compare-dialog-${index}`}>
            <Dialog.Title className="compare-dialog-title" data-testid={`compare-dialog-title-${index}`}>
              Compare All Options
            </Dialog.Title>
            <Dialog.Description className="compare-dialog-description">
              Side-by-side comparison of all choices for this situation.
            </Dialog.Description>
            <Dialog.Close
              className="compare-dialog-close"
              data-testid={`compare-dialog-close-${index}`}
            >
              ✕
            </Dialog.Close>

            <div className="compare-why" data-testid={`compare-why-${index}`}>
              {situation.recommendationDetail.why}
            </div>

            <div className="compare-grid" data-testid={`compare-grid-${index}`}>
              {situation.choices.map((choice) => {
                const isRecommended = choice.id === situation.recommended
                return (
                  <div
                    key={choice.id}
                    className={`compare-card${isRecommended ? ' compare-card-recommended' : ''}`}
                    data-testid={`compare-card-${index}-${choice.id}`}
                  >
                    <div className="compare-card-header">
                      <span className="compare-card-label" data-testid={`compare-card-label-${index}-${choice.id}`}>
                        {choice.label}
                      </span>
                      {isRecommended && (
                        <span className="compare-badge" data-testid={`compare-badge-${index}-${choice.id}`}>
                          Recommended
                        </span>
                      )}
                    </div>

                    {choice.pros.length > 0 && (
                      <ul className="compare-pros" data-testid={`compare-pros-${index}-${choice.id}`}>
                        {choice.pros.map((pro, pidx) => (
                          <li key={pidx} className="compare-pro" data-testid={`compare-pro-${index}-${choice.id}-${pidx}`}>
                            <Check className="compare-icon compare-icon-pro" data-testid={`compare-icon-pro-${index}-${choice.id}-${pidx}`} />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    )}

                    {choice.cons.length > 0 && (
                      <ul className="compare-cons" data-testid={`compare-cons-${index}-${choice.id}`}>
                        {choice.cons.map((con, cidx) => (
                          <li key={cidx} className="compare-con" data-testid={`compare-con-${index}-${choice.id}-${cidx}`}>
                            <X className="compare-icon compare-icon-con" data-testid={`compare-icon-con-${index}-${choice.id}-${cidx}`} />
                            {con}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="situation-accordion" data-testid={`situation-accordion-${index}`}>
        {situation.choices.map((choice, idx) => {
          const isOpen = idx === openIndex
          const isRecommended = choice.id === situation.recommended

          const cardRef = isRecommended ? setRecCardRef(choice.id) : undefined

          return (
            <div
              key={choice.id}
              ref={cardRef}
              className={`situation-card${isOpen ? ' situation-card-open' : ''}${isRecommended ? ' situation-card-recommended' : ''}`}
              data-testid={`situation-card-${index}-${choice.id}`}
              style={isRecommended ? { opacity: 0, transform: 'translateX(-16px)' } : undefined}
            >
              <button
                className="situation-card-trigger"
                onClick={() => onToggle(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onToggle(idx)
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

              <AccordionContent
                isOpen={isOpen}
                choiceId={choice.id}
                index={index}
                reducedMotion={reducedMotion}
              >
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
              </AccordionContent>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SituationChoiceSection({ title, situations }: SituationChoiceSectionProps) {
  const [currentSituationIdx, setCurrentSituationIdx] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [reducedMotion] = useState(prefersReducedMotion())
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const currentSituation = situations[currentSituationIdx]

  const recommendedIdx = currentSituation.choices.findIndex((c) => c.id === currentSituation.recommended)
  const [openIndex, setOpenIndex] = useState(recommendedIdx >= 0 ? recommendedIdx : 0)
  const [compareOpen, setCompareOpen] = useState(false)

  useEffect(() => {
    const recIdx = currentSituation.choices.findIndex((c) => c.id === currentSituation.recommended)
    setOpenIndex(recIdx >= 0 ? recIdx : 0)
  }, [currentSituationIdx, currentSituation])

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const handleToggle = useCallback(
    (idx: number) => {
      setOpenIndex((prev) => (prev === idx ? idx : idx))
    },
    [],
  )

  const handleSituationChange = useCallback((idx: number) => {
    setCurrentSituationIdx(idx)
    setDropdownOpen(false)
  }, [])

  const handleCompareToggle = useCallback(() => {
    setCompareOpen((prev) => !prev)
  }, [])

  return (
    <div className="situation-choice" data-testid="situation-choice">
      {title && <h3 className="situation-choice-title" data-testid="situation-choice-title">{title}</h3>}

      {situations.length > 1 && (
        <div className="situation-selector">
          <label htmlFor="situation-select" className="situation-label">Situation:</label>
          <div className="situation-dropdown" ref={dropdownRef} data-testid="situation-dropdown">
            <button
              id="situation-select"
              className="situation-select"
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              data-testid="situation-select"
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
            >
              {currentSituation.title}
            </button>
            {dropdownOpen && (
              <ul className="situation-options" role="listbox">
                {situations.map((s, idx) => (
                  <li
                    key={idx}
                    className={`situation-option${idx === currentSituationIdx ? ' situation-option-active' : ''}`}
                    role="option"
                    aria-selected={idx === currentSituationIdx}
                    onClick={() => handleSituationChange(idx)}
                  >
                    {s.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <SituationItem
        situation={currentSituation}
        index={currentSituationIdx}
        openIndex={openIndex}
        onToggle={handleToggle}
        compareOpen={compareOpen}
        onCompareToggle={handleCompareToggle}
        reducedMotion={reducedMotion}
      />
    </div>
  )
}

SectionRegistry.register('situation-choice', SituationChoiceSection as ComponentType<unknown>)

export default SituationChoiceSection
