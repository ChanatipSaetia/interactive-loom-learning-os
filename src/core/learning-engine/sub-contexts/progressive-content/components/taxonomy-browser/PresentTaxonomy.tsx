import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useSound } from '../../../../../ui-system/sensory/SoundContext'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { beatMarks, type PresentRendererProps } from '../../../present-kernel'
import type { TaxonomyPresentData } from '../../present'
import { colorAccentMap, resolveIcon, type TaxonomyCategory } from './index'
import './taxonomy-browser.css'
import '../present.css'

/** The Read detail dialog's content, opened inside the stage instead of a page-wide portal. */
function Detail({ category, onClose }: { category: TaxonomyCategory; onClose: () => void }) {
  const pick = usePickAnchors()
  const Icon = resolveIcon(category.icon)
  const accent = colorAccentMap[category.color] ?? 'var(--ctp-blue)'
  return (
    <>
      <motion.div className="present-taxonomy-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="present-taxonomy-dialog"
        role="dialog"
        aria-label={`${category.title} details`}
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <button type="button" className="taxonomy-dialog-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="taxonomy-modal-header" {...pick(category)}>
          <div className="taxonomy-modal-icon" style={{ color: accent }}><Icon size={32} strokeWidth={1.5} /></div>
          {category.subtitle && <p className="taxonomy-modal-subtitle" style={{ color: accent }} {...pick(category, 'subtitle')}>{category.subtitle}</p>}
          <h2 className="taxonomy-modal-title" style={{ color: accent }} {...pick(category, 'title')}>{category.title}</h2>
        </div>
        <div className="taxonomy-modal-sections-scroll">
          <div className="taxonomy-modal-section">
            <h3 className="taxonomy-modal-section-title">Overview</h3>
            <p className="taxonomy-modal-text" {...pick(category, 'description')}>{category.description}</p>
          </div>
          {category.details && (
            <div className="taxonomy-modal-section taxonomy-modal-deepdive">
              <h3 className="taxonomy-modal-section-title">Deep Dive</h3>
              <div className="taxonomy-modal-elevated"><p className="taxonomy-modal-text" {...pick(category, 'details')}>{category.details}</p></div>
            </div>
          )}
          <div className="taxonomy-modal-section">
            <h3 className="taxonomy-modal-section-title">Scope & Boundaries</h3>
            {category.analogy && <blockquote className="taxonomy-modal-analogy" {...pick(category, 'analogy')}>{category.analogy}</blockquote>}
            {category.primaryFocus && (
              <div className="taxonomy-modal-focus" {...pick(category, 'primaryFocus')}>
                <span className="taxonomy-modal-focus-label">Primary Focus</span>
                <span className="taxonomy-modal-focus-text">{category.primaryFocus}</span>
              </div>
            )}
            <div className="taxonomy-modal-scope-grid">
              {category.inScope.length > 0 && (
                <div className="taxonomy-modal-scope-col">
                  <h4 className="taxonomy-modal-scope-col-title taxonomy-modal-scope-col-title--in">In Scope</h4>
                  <ul className="taxonomy-modal-scope-list">
                    {category.inScope.map((item, i) => <li key={i} className="taxonomy-modal-scope-item" {...pick(category.inScope, i)}>{item}</li>)}
                  </ul>
                </div>
              )}
              {category.outOfScope.length > 0 && (
                <div className="taxonomy-modal-scope-col">
                  <h4 className="taxonomy-modal-scope-col-title taxonomy-modal-scope-col-title--out">Out of Scope</h4>
                  <ul className="taxonomy-modal-scope-list">
                    {category.outOfScope.map((item, i) => <li key={i} className="taxonomy-modal-scope-item" {...pick(category.outOfScope, i)}>{item}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

/**
 * Taxonomy browser in Present mode, as the Read card grid: the cards cascade in, then the learner opens
 * any card to read its details (taxonomyBeats: show, explore).
 */
export default function PresentTaxonomy({ data, beat, beats, active }: PresentRendererProps<TaxonomyPresentData>) {
  const mark = beatMarks(beat)
  const pick = usePickAnchors()
  const { playSound } = useSound()
  const categories = data.categories ?? []
  const [open, setOpen] = useState<number | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const exploring = active && beats[beat]?.kind === 'explore'
  const shown = exploring && open !== null ? categories[open] : null

  const choose = (i: number) => {
    if (!exploring) return
    playSound('click')
    setOpen(i)
    // The detail opens at the top of the section, so bring that into view on a scrolled region
    rootRef.current?.closest('.present-region-body')?.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const close = () => {
    playSound('click')
    setOpen(null)
  }

  return (
    <div ref={rootRef} className={`taxonomy-browser-section present-taxonomy${categories.length > 4 ? ' is-many' : ''}${categories.length > 6 ? ' is-lots' : ''}${exploring ? ' is-exploring' : ''}`} data-testid="present-taxonomy">
      <div className="taxonomy-browser-grid">
        {categories.map((cat, i) => {
          const Icon = resolveIcon(cat.icon)
          const accent = colorAccentMap[cat.color] ?? 'var(--ctp-blue)'
          return (
            <div
              key={cat.title}
              role={exploring ? 'button' : undefined}
              tabIndex={exploring ? 0 : undefined}
              aria-label={exploring ? `Open details for ${cat.title}` : undefined}
              className="taxonomy-browser-card"
              style={{ borderTopColor: accent }}
              onClick={() => choose(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') choose(i)
              }}
              {...mark(0, { delay: i * 70 })}
              {...pick(cat)}
            >
              <div className="taxonomy-browser-card-icon"><Icon style={{ color: accent }} size={20} strokeWidth={1.5} /></div>
              <div className="taxonomy-browser-card-body">
                {cat.subtitle && <p className="taxonomy-browser-subtitle" {...pick(cat, 'subtitle')}>{cat.subtitle}</p>}
                <h4 className="taxonomy-browser-card-title" {...pick(cat, 'title')}>{cat.title}</h4>
                <p className="taxonomy-browser-description" {...pick(cat, 'description')}>{cat.description}</p>
              </div>
            </div>
          )
        })}
      </div>
      {beats.length > 1 && <p className="present-taxonomy-hint" {...mark(beats.length - 1, { motion: 'fade' })}>Tap a card to open it.</p>}
      <AnimatePresence>{shown && <Detail key={open} category={shown} onClose={close} />}</AnimatePresence>
    </div>
  )
}
