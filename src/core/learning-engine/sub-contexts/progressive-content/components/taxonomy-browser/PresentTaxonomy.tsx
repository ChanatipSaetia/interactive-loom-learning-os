import { useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { MOTION_FADE } from '../../../../../ui-system'
import { useSound } from '../../../../../ui-system/sensory/SoundContext'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { beatMarks, type PresentRendererProps } from '../../../present-kernel'
import type { TaxonomyPresentData } from '../../present'
import { colorAccentMap, resolveIcon } from './index'
import '../present.css'

/**
 * Taxonomy browser in Present mode: the cards cascade in, then the learner opens any card to read it
 * (taxonomyBeats: show, explore).
 */
export default function PresentTaxonomy({ data, beat, beats, active }: PresentRendererProps<TaxonomyPresentData>) {
  const mark = beatMarks(beat)
  const pick = usePickAnchors()
  const { playSound } = useSound()
  const categories = data.categories ?? []
  const [open, setOpen] = useState<number | null>(null)
  const exploring = active && beats[beat]?.kind === 'explore'
  const shown = open !== null ? categories[open] : null

  const choose = (i: number) => {
    if (!exploring) return
    playSound('click')
    setOpen((o) => (o === i ? null : i))
  }

  return (
    <div className="present-taxonomy" data-testid="present-taxonomy">
      <div className="present-taxonomy-cards">
        {categories.map((cat, i) => {
          const Icon = resolveIcon(cat.icon)
          const accent = colorAccentMap[cat.color] ?? 'var(--ctp-blue)'
          return (
            <button
              key={cat.title}
              type="button"
              className={`present-taxonomy-card${open === i ? ' is-open' : ''}${open !== null && open !== i ? ' is-dim' : ''}`}
              style={{ '--accent': accent } as CSSProperties}
              disabled={!exploring}
              aria-pressed={exploring ? open === i : undefined}
              onClick={() => choose(i)}
              {...mark(0, { delay: i * 60 })}
              {...pick(cat)}
            >
              <Icon size={20} strokeWidth={1.6} aria-hidden />
              <span className="present-taxonomy-card-text">
                <span className="present-taxonomy-card-title">{cat.title}</span>
                <span className="present-taxonomy-card-sub">{cat.subtitle}</span>
              </span>
            </button>
          )
        })}
      </div>
      <div className="present-taxonomy-detail" aria-live="polite">
        <AnimatePresence mode="wait">
          {shown ? (
            <motion.div key={open} className="present-card" variants={MOTION_FADE} initial="hidden" animate="visible" exit="exit" style={{ '--accent': colorAccentMap[shown.color] } as CSSProperties}>
              <h3 style={{ color: 'var(--accent)' }}>{shown.subtitle}</h3>
              <p className="present-taxonomy-detail-title">{shown.title}</p>
              <p>{shown.description}</p>
              {shown.analogy && <p className="present-taxonomy-analogy">{shown.analogy}</p>}
              <div className="present-taxonomy-scope">
                {shown.inScope.length > 0 && <div><h4>Use for</h4><ul>{shown.inScope.map((s) => <li key={s}>{s}</li>)}</ul></div>}
                {shown.outOfScope.length > 0 && <div><h4>Not for</h4><ul>{shown.outOfScope.map((s) => <li key={s}>{s}</li>)}</ul></div>}
              </div>
            </motion.div>
          ) : (
            <motion.p key="hint" className="present-taxonomy-hint" variants={MOTION_FADE} initial="hidden" animate="visible" exit="exit" {...mark(beats.length - 1, { motion: 'fade' })}>
              {exploring ? 'Tap a card to open it.' : ''}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
