import { AnimatePresence, motion } from 'motion/react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { QUIET, beatMarks, focus, type BeatMarkAttributes, type BeatMarkOptions, type PresentRendererProps } from '../../../present-kernel'
import type { TaxonomyPresentData } from '../../present'
import { colorAccentMap, resolveIcon, type TaxonomyCategory } from './index'
import './taxonomy-browser.css'
import '../present.css'

type Mark = (at: number, options?: BeatMarkOptions) => BeatMarkAttributes

/**
 * The Read detail dialog's content, opened inside the stage instead of a page-wide portal, on its own
 * beat `at`: the voice reads its title, overview and deep dive.
 */
function Detail({ category, at, mark }: { category: TaxonomyCategory; at: number; mark: Mark }) {
  const pick = usePickAnchors()
  const Icon = resolveIcon(category.icon)
  const accent = colorAccentMap[category.color] ?? 'var(--ctp-blue)'
  return (
    <>
      <motion.div className="present-taxonomy-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div
        className="present-taxonomy-dialog"
        role="dialog"
        aria-label={`${category.title} details`}
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="taxonomy-modal-header" {...pick(category)}>
          <div className="taxonomy-modal-icon" style={{ color: accent }}><Icon size={32} strokeWidth={1.5} /></div>
          {category.subtitle && <p className="taxonomy-modal-subtitle" style={{ color: accent }} {...pick(category, 'subtitle')}>{category.subtitle}</p>}
          <h2 className="taxonomy-modal-title" style={{ color: accent }} {...mark(at, { motion: 'fade' })} {...pick(category, 'title')}>{category.title}</h2>
        </div>
        <div className="taxonomy-modal-sections-scroll">
          <div className="taxonomy-modal-section">
            <h3 className="taxonomy-modal-section-title">Overview</h3>
            <p className="taxonomy-modal-text" {...mark(at, { delay: 200 })} {...focus(true)} {...pick(category, 'description')}>{category.description}</p>
          </div>
          {category.details && (
            <div className="taxonomy-modal-section taxonomy-modal-deepdive">
              <h3 className="taxonomy-modal-section-title">Deep Dive</h3>
              <div className="taxonomy-modal-elevated"><p className="taxonomy-modal-text" {...mark(at, { delay: 400 })} {...pick(category, 'details')}>{category.details}</p></div>
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
 * Taxonomy browser in Present mode, as the Read card grid (taxonomyBeats): the cards cascade in while the
 * voice reads their titles, then the stage opens each card in turn and the voice reads its details.
 */
export default function PresentTaxonomy({ data, beat }: PresentRendererProps<TaxonomyPresentData>) {
  const mark = beatMarks(beat)
  const pick = usePickAnchors()
  const categories = data.categories ?? []
  const open = beat >= 1 && beat <= categories.length ? beat - 1 : null
  const shown = open !== null ? categories[open] : null

  return (
    <div className={`taxonomy-browser-section present-taxonomy${categories.length > 4 ? ' is-many' : ''}${categories.length > 6 ? ' is-lots' : ''}`} data-testid="present-taxonomy">
      {/* While a card is open, narration targets find its detail, not the card behind it */}
      <div className="taxonomy-browser-grid">
        {categories.map((cat, i) => {
          const Icon = resolveIcon(cat.icon)
          const accent = colorAccentMap[cat.color] ?? 'var(--ctp-blue)'
          return (
            <div
              key={cat.title}
              className="taxonomy-browser-card"
              style={{ borderTopColor: accent }}
              {...mark(0, { delay: i * 70 })}
              {...focus(open === i)}
              {...(open === null && pick(cat))}
            >
              <div className="taxonomy-browser-card-icon"><Icon style={{ color: accent }} size={20} strokeWidth={1.5} /></div>
              <div className="taxonomy-browser-card-body">
                {cat.subtitle && <p className="taxonomy-browser-subtitle" {...(open === null && pick(cat, 'subtitle'))}>{cat.subtitle}</p>}
                <h4 className="taxonomy-browser-card-title" {...(open === null && pick(cat, 'title'))}>{cat.title}</h4>
                <p className="taxonomy-browser-description" {...QUIET} {...(open === null && pick(cat, 'description'))}>{cat.description}</p>
              </div>
            </div>
          )
        })}
      </div>
      <AnimatePresence>{shown && open !== null && <Detail key={open} category={shown} at={open + 1} mark={mark} />}</AnimatePresence>
    </div>
  )
}
