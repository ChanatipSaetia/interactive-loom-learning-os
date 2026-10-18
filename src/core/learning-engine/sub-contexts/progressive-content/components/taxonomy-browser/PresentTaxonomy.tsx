import type { CSSProperties } from 'react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentAgenda } from '../../../PresentAgenda'
import { PresentWords } from '../../../PresentWords'
import { beatMarks, focus, lead, type BeatMarkAttributes, type BeatMarkOptions, type PresentRendererProps } from '../../../present-kernel'
import type { TaxonomyPresentData } from '../../present'
import { colorAccentMap, resolveIcon, type TaxonomyCategory } from './index'
import './taxonomy-browser.css'
import '../present.css'

type Mark = (at: number, options?: BeatMarkOptions) => BeatMarkAttributes

/** Sentences of a card's description the stage shows when the card is open; the rest stays in Read. */
const OVERVIEW_SENTENCES = 2

/**
 * One card opened (beat `at`), in the Read detail dialog's look (decision 109): its title as the
 * headline, the opening of its description, and its analogy. The deep dive, primary focus and scope
 * lists stay in Read.
 */
function Detail({ category, at, mark, anchors }: { category: TaxonomyCategory; at: number; mark: Mark; anchors: boolean }) {
  const anchor = usePickAnchors()
  const pick = (...args: Parameters<typeof anchor>) => (anchors ? anchor(...args) : {})
  const Icon = resolveIcon(category.icon)
  const accent = colorAccentMap[category.color] ?? 'var(--ctp-blue)'
  return (
    <div className="present-taxonomy-detail" style={{ '--present-accent': accent } as CSSProperties} {...pick(category)}>
      <div className="present-taxonomy-detail-head">
        <div className="taxonomy-modal-icon" style={{ color: accent }} {...mark(at, { motion: 'pop' })}><Icon size={36} strokeWidth={1.5} /></div>
        <div>
          {category.subtitle && <p className="taxonomy-modal-subtitle" style={{ color: accent }} {...mark(at, { motion: 'fade', delay: 120 })} {...pick(category, 'subtitle')}>{category.subtitle}</p>}
          <h2 className="present-headline" style={{ color: accent }} {...mark(at, { motion: 'zoom', delay: 120 })} {...pick(category, 'title')}>{category.title}</h2>
        </div>
      </div>
      <p className="present-lead present-taxonomy-overview" {...mark(at, { motion: 'words', delay: 500 })} {...focus(true)} {...pick(category, 'description')}>
        <PresentWords text={lead(category.description, OVERVIEW_SENTENCES)} />
      </p>
      {category.analogy && <blockquote className="taxonomy-modal-analogy" {...mark(at, { motion: 'unfold', delay: 1100 })} {...pick(category, 'analogy')}>{category.analogy}</blockquote>}
    </div>
  )
}

/**
 * Taxonomy browser in Present mode (taxonomyBeats): the Read cards cascade in, by name only; then the
 * grid makes way for an agenda of the cards beside the open one, and each beat opens the next card
 * (decisions 109 and 111).
 */
export default function PresentTaxonomy({ data, beat }: PresentRendererProps<TaxonomyPresentData>) {
  const mark = beatMarks(beat)
  const pick = usePickAnchors()
  const categories = data.categories ?? []
  const open = beat >= 1 && beat <= categories.length ? beat - 1 : null

  return (
    <div className={`taxonomy-browser-section present-taxonomy present-scenes${categories.length > 4 ? ' is-many' : ''}${categories.length > 6 ? ' is-lots' : ''}`} data-testid="present-taxonomy">
      <div className="taxonomy-browser-grid" {...mark(0, { motion: 'fade', ...(categories.length > 0 && { until: 0 }) })}>
        {categories.map((cat, i) => {
          const Icon = resolveIcon(cat.icon)
          const accent = colorAccentMap[cat.color] ?? 'var(--ctp-blue)'
          return (
            <div key={cat.title} className="taxonomy-browser-card" style={{ borderTopColor: accent }} {...mark(0, { delay: i * 90 })} {...(open === null && pick(cat))}>
              <div className="taxonomy-browser-card-icon"><Icon style={{ color: accent }} size={22} strokeWidth={1.5} /></div>
              <div className="taxonomy-browser-card-body">
                {cat.subtitle && <p className="taxonomy-browser-subtitle" {...(open === null && pick(cat, 'subtitle'))}>{cat.subtitle}</p>}
                <h4 className="taxonomy-browser-card-title" {...(open === null && pick(cat, 'title'))}>{cat.title}</h4>
              </div>
            </div>
          )
        })}
      </div>
      {categories.length > 0 && (
        <div className="present-with-agenda" {...mark(1, { motion: 'fade' })}>
          <PresentAgenda items={categories.map((c) => c.title)} current={open ?? -1} label="Categories" />
          <div className="present-scenes">
            {categories.map((cat, i) => (
              <div key={cat.title} {...mark(i + 1, { motion: 'fade', ...(i < categories.length - 1 && { until: i + 1 }) })}>
                {/* Only the open card carries its Pick anchors, so narration targets find what is in view */}
                <Detail category={cat} at={i + 1} mark={mark} anchors={open === i} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
