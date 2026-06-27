import { useState, useCallback, useRef, forwardRef, type ComponentType } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import * as Dialog from '@radix-ui/react-dialog'
import { ScrollReveal } from '../../components/motion/scroll-reveal'
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

const MotionDiv = forwardRef<HTMLDivElement, any>((props, ref) => (
  <motion.div ref={ref} {...props} />
));

function TaxonomyModal({
  category: propCategory,
  open,
  onOpenChange,
}: {
  category: TaxonomyCategory | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const [lastCategory, setLastCategory] = useState<TaxonomyCategory | undefined>(propCategory)

  if (open && propCategory && propCategory !== lastCategory) {
    setLastCategory(propCategory)
  }

  const category = open ? propCategory : (lastCategory || propCategory)
  if (!category) return null

  const Icon = category.icon
  const accent = colorAccentMap[category.color] ?? 'var(--ctp-blue)'

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount key="overlay">
              <MotionDiv
                className="taxonomy-overlay"
                data-testid="taxonomy-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => onOpenChange(false)}
              />
            </Dialog.Overlay>
            <Dialog.Content
              ref={dialogRef}
              className="taxonomy-dialog"
              data-testid="taxonomy-dialog"
              forceMount
              asChild
              key="content"
            >
              <MotionDiv
                initial={{ opacity: 0, scale: 0.95, x: '-50%' }}
                animate={{ opacity: 1, scale: 1, x: '-50%' }}
                exit={{ opacity: 0, scale: 0.95, x: '-50%' }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
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
              </MotionDiv>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

function TaxonomyBrowserSection({ title, categories }: TaxonomyBrowserSectionProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

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
          return (
            <ScrollReveal key={idx} delay={idx * 0.1}>
              <div
                role="button"
                tabIndex={0}
                aria-label={`Open details for ${cat.title}`}
                className="taxonomy-browser-card"
                data-testid={`taxonomy-browser-card-${idx}`}
                style={{ borderTopColor: accent }}
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
            </ScrollReveal>
          )
        })}
      </div>

      <TaxonomyModal
        category={categories[selectedIdx ?? 0]}
        open={selectedIdx !== null}
        onOpenChange={handleOpenChange}
      />
    </div>
  )
}

export default TaxonomyBrowserSection
