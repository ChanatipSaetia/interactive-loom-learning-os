import { useState, useCallback, useEffect, useRef, type ComponentType } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { animate } from 'animejs'
import { SectionRegistry } from '../../core/registry'
import './taxonomy-browser.css'

export interface TaxonomyCategory {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: ComponentType<any>
  title: string
  subtitle: string
  description: string
  details: string
  analogy: string
  primaryFocus: string
  inScope: string[]
  outOfScope: string[]
  color: string
}

export interface TaxonomyBrowserSectionProps {
  title?: string
  categories: TaxonomyCategory[]
}

const colorAccentMap: Record<string, string> = {
  blue: 'var(--ctp-blue)',
  peach: 'var(--ctp-peach)',
  pink: 'var(--ctp-pink)',
  mauve: 'var(--ctp-mauve)',
  green: 'var(--ctp-green)',
  teal: 'var(--ctp-teal)',
  sky: 'var(--ctp-sky)',
  lavender: 'var(--ctp-lavender)',
  yellow: 'var(--ctp-yellow)',
  red: 'var(--ctp-red)',
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const springEasing = 'cubic-bezier(0.34, 1.56, 0.64, 1)'

function TaxonomyModal({
  category,
  open,
  onOpenChange,
}: {
  category: TaxonomyCategory
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const Icon = category.icon
  const accent = colorAccentMap[category.color] ?? 'var(--ctp-blue)'
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const [reducedMotion] = useState(prefersReducedMotion())

  useEffect(() => {
    if (!open || !dialogRef.current) return
    const el = dialogRef.current
    el.style.opacity = '0'
    el.style.transform = 'translate(-50%, -50%) scale(0.85)'
    const anim = animate(
      el,
      {
        opacity: [0, 1],
        transform: [
          { value: 'translate(-50%, -50%) scale(0.85)' },
          { value: 'translate(-50%, -50%) scale(1.03)' },
          { value: 'translate(-50%, -50%) scale(0.97)' },
          { value: 'translate(-50%, -50%) scale(1)' },
        ],
        duration: reducedMotion ? 0 : 500,
        easing: springEasing,
      }
    )
    return () => {
      anim.cancel()
    }
  }, [open, reducedMotion])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="taxonomy-overlay"
          data-testid="taxonomy-overlay"
          onClick={() => onOpenChange(false)}
        />
        <Dialog.Content
          ref={dialogRef}
          className="taxonomy-dialog"
          data-testid="taxonomy-dialog"
        >
          <Dialog.Title className="taxonomy-dialog-title-sr" style={{ display: 'none' }}>
            {category.title} Details
          </Dialog.Title>
          <Dialog.Description className="taxonomy-dialog-desc-sr" style={{ display: 'none' }}>
            Detailed information about {category.title}
          </Dialog.Description>

          <Dialog.Close
            className="taxonomy-dialog-close"
            data-testid="taxonomy-dialog-close"
          >
            ✕
          </Dialog.Close>

          <div className="taxonomy-modal-scroll">
            {/* Header */}
            <div className="taxonomy-modal-header">
              <div className="taxonomy-modal-icon" style={{ color: accent }}>
                <Icon size={32} strokeWidth={1.5} />
              </div>
              {category.subtitle && (
                <p className="taxonomy-modal-subtitle" style={{ color: accent }}>
                  {category.subtitle}
                </p>
              )}
              <h2 className="taxonomy-modal-title" style={{ color: accent }}>
                {category.title}
              </h2>
            </div>

            {/* Overview */}
            <div className="taxonomy-modal-section" data-testid="taxonomy-modal-overview">
              <h3 className="taxonomy-modal-section-title">Overview</h3>
              <p className="taxonomy-modal-text">{category.description}</p>
            </div>

            {/* Deep Dive */}
            <div className="taxonomy-modal-section taxonomy-modal-deepdive" data-testid="taxonomy-modal-deepdive">
              <h3 className="taxonomy-modal-section-title">Deep Dive</h3>
              <div className="taxonomy-modal-elevated">
                <p className="taxonomy-modal-text">{category.details}</p>
              </div>
            </div>

            {/* Scope & Boundaries */}
            <div className="taxonomy-modal-section" data-testid="taxonomy-modal-scope">
              <h3 className="taxonomy-modal-section-title">Scope & Boundaries</h3>

              {category.analogy && (
                <blockquote className="taxonomy-modal-analogy" data-testid="taxonomy-modal-analogy">
                  {category.analogy}
                </blockquote>
              )}

              {category.primaryFocus && (
                <div className="taxonomy-modal-focus" data-testid="taxonomy-modal-primary-focus">
                  <span className="taxonomy-modal-focus-label">Primary Focus</span>
                  <span className="taxonomy-modal-focus-text">{category.primaryFocus}</span>
                </div>
              )}

              <div className="taxonomy-modal-scope-grid">
                {category.inScope.length > 0 && (
                  <div className="taxonomy-modal-scope-col" data-testid="taxonomy-modal-in-scope">
                    <h4 className="taxonomy-modal-scope-col-title taxonomy-modal-scope-col-title--in">
                      In Scope
                    </h4>
                    <ul className="taxonomy-modal-scope-list">
                      {category.inScope.map((item, i) => (
                        <li key={i} className="taxonomy-modal-scope-item" data-testid={`taxonomy-modal-in-scope-${i}`}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {category.outOfScope.length > 0 && (
                  <div className="taxonomy-modal-scope-col" data-testid="taxonomy-modal-out-of-scope">
                    <h4 className="taxonomy-modal-scope-col-title taxonomy-modal-scope-col-title--out">
                      Out of Scope
                    </h4>
                    <ul className="taxonomy-modal-scope-list">
                      {category.outOfScope.map((item, i) => (
                        <li key={i} className="taxonomy-modal-scope-item" data-testid={`taxonomy-modal-out-of-scope-${i}`}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function TaxonomyBrowserSection({ title, categories }: TaxonomyBrowserSectionProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const cardRefs = useRef<HTMLDivElement[]>([])
  const [reducedMotion] = useState(prefersReducedMotion())

  useEffect(() => {
    if (reducedMotion) return
    const els = cardRefs.current.filter(Boolean)
    if (els.length === 0) return
    animate(
      els,
      {
        opacity: [0, 1],
        translateY: [60, 0],
        scale: [0.9, 1],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        delay: (_el: unknown, i: number) => i * 100,
        duration: 500,
        easing: springEasing,
      }
    )
  }, [reducedMotion])

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setSelectedIdx(null)
    }
  }, [])

  const handleCardClick = useCallback((idx: number) => {
    setSelectedIdx(idx)
  }, [])

  return (
    <div className="taxonomy-browser-section" data-testid="taxonomy-browser-section">
      {title && (
        <h3 className="taxonomy-browser-title" data-testid="taxonomy-browser-title">
          {title}
        </h3>
      )}
      <div className="taxonomy-browser-grid" data-testid="taxonomy-browser-grid">
        {categories.map((cat, idx) => {
          const Icon = cat.icon
          const accent = colorAccentMap[cat.color] ?? 'var(--ctp-blue)'
          const initialStyle = reducedMotion
            ? {}
            : { opacity: 0, transform: 'translateY(60px) scale(0.9)' }
          return (
            <div
              key={idx}
              role="button"
              tabIndex={0}
              aria-label={`Open details for ${cat.title}`}
              className="taxonomy-browser-card"
              data-testid={`taxonomy-browser-card-${idx}`}
              ref={(el) => {
                if (el) cardRefs.current[idx] = el
              }}
              style={{ borderTopColor: accent, ...initialStyle }}
              onClick={() => handleCardClick(idx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleCardClick(idx)
                }
              }}
            >
              <div className="taxonomy-browser-card-icon" data-testid={`taxonomy-browser-icon-${idx}`}>
                <Icon style={{ color: accent }} size={20} strokeWidth={1.5} />
              </div>
              <div className="taxonomy-browser-card-body">
                {cat.subtitle && (
                  <p className="taxonomy-browser-subtitle" data-testid={`taxonomy-browser-subtitle-${idx}`}>
                    {cat.subtitle}
                  </p>
                )}
                <h4 className="taxonomy-browser-card-title" data-testid={`taxonomy-browser-card-title-${idx}`}>
                  {cat.title}
                </h4>
                <p className="taxonomy-browser-description" data-testid={`taxonomy-browser-description-${idx}`}>
                  {cat.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {selectedIdx !== null && (
        <TaxonomyModal
          category={categories[selectedIdx]}
          open={selectedIdx !== null}
          onOpenChange={handleOpenChange}
        />
      )}
    </div>
  )
}

SectionRegistry.register('taxonomy-browser', TaxonomyBrowserSection as ComponentType<unknown>)

export default TaxonomyBrowserSection
