import type { CSSProperties } from 'react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentAgenda } from '../../../PresentAgenda'
import { PresentWords } from '../../../PresentWords'
import { beatMarks, focus, lead, QUIET, type BeatMarkAttributes, type BeatMarkOptions, type PresentRendererProps } from '../../../present-kernel'
import type { TaxonomyPresentData } from '../../present'
import { colorAccentMap, resolveIcon, type TaxonomyCategory } from './index'
import './taxonomy-browser.css'
import '../present.css'

type Mark = (at: number, options?: BeatMarkOptions) => BeatMarkAttributes
const accentOf = (category: TaxonomyCategory) => ({ '--taxonomy-accent': colorAccentMap[category.color] ?? 'var(--ctp-blue)' } as CSSProperties)

function Medallion({ category, large = false }: { category: TaxonomyCategory; large?: boolean }) {
  const Icon = resolveIcon(category.icon)
  return <div className={`present-taxonomy-medallion${large ? ' is-large' : ''}`} aria-hidden="true"><Icon size={large ? 44 : 34} strokeWidth={1.5} /></div>
}

/** An analogy leads the explanation; the definition connects the familiar example to the category. */
function Detail({ category, at, mark, anchors }: { category: TaxonomyCategory; at: number; mark: Mark; anchors: boolean }) {
  const anchor = usePickAnchors()
  const pick = (...args: Parameters<typeof anchor>) => (anchors ? anchor(...args) : {})
  return (
    <div className="present-taxonomy-detail" style={accentOf(category)} {...pick(category)}>
      <div className="present-taxonomy-detail-head" {...mark(at, { motion: 'fade' })}>
        <Medallion category={category} large />
        <div>
          {category.subtitle && <p className="present-taxonomy-subtitle" {...pick(category, 'subtitle')}><PresentWords text={category.subtitle} /></p>}
          <h2 className="present-headline" {...pick(category, 'title')}><PresentWords text={category.title} /></h2>
        </div>
      </div>
      <div className={`present-taxonomy-explainer${category.analogy ? '' : ' without-analogy'}`}>
        {category.analogy && <div className="present-taxonomy-analogy" {...mark(at, { motion: 'unfold', delay: 300 })} {...focus(anchors)}>
          <p className="present-eyebrow" {...QUIET}>Think of it this way</p>
          <blockquote {...pick(category, 'analogy')}><PresentWords text={category.analogy} /></blockquote>
        </div>}
        <div className="present-taxonomy-meaning" {...mark(at, { motion: 'fade', delay: category.analogy ? 700 : 300 })}>
          <p className="present-eyebrow" {...QUIET}>What it means</p>
          <p className="present-lead" {...pick(category, 'description')}><PresentWords text={lead(category.description, 2)} /></p>

        </div>
      </div>
    </div>
  )
}

/** A visual category overview, then analogy-led focus views. Existing narration beat IDs stay valid. */
export default function PresentTaxonomy({ data, beat }: PresentRendererProps<TaxonomyPresentData>) {
  const mark = beatMarks(beat)
  const pick = usePickAnchors()
  const categories = data.categories ?? []
  const open = beat >= 1 && beat <= categories.length ? beat - 1 : null
  return (
    <div className="taxonomy-browser-section present-taxonomy" data-testid="present-taxonomy">
      <div className="present-taxonomy-overview-grid" data-count={categories.length} {...mark(0, { motion: 'fade', until: 0 })}>
        {categories.map((cat, i) => (
          <div key={i} className="present-taxonomy-overview-card" style={accentOf(cat)} {...mark(0, { motion: 'rise', delay: i * 100, until: 0 })} {...(open === null && pick(cat))}>
            <Medallion category={cat} />
            <div className="present-taxonomy-overview-copy">
              <h3 {...(open === null && pick(cat, 'title'))}><PresentWords text={cat.title} /></h3>
              <p {...(open === null && pick(cat, cat.primaryFocus ? 'primaryFocus' : 'description'))}><PresentWords text={cat.primaryFocus || lead(cat.description)} /></p>
            </div>
          </div>
        ))}
        {!categories.length && <p className="present-lead">No categories to present.</p>}
      </div>
      {categories.length > 0 && <div className="present-taxonomy-focus" {...(beat >= 1 && { 'data-shown': '' })}>
        <div className="present-taxonomy-details">
          {categories.map((cat, i) => <div key={i} className="present-taxonomy-detail-scene" {...mark(i + 1, { motion: 'fade', until: i + 1 })}>
            <Detail category={cat} at={i + 1} mark={mark} anchors={open === i} />
          </div>)}
        </div>
        {categories.length > 1 && <PresentAgenda items={categories.map((cat) => cat.title)} current={open ?? -1} label="Categories" />}
      </div>}
    </div>
  )
}
