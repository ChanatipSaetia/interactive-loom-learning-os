import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { lead } from '../../../../src/core/learning-engine/sub-contexts/present-kernel'
import { introBeats, taxonomyBeats, type IntroPresentData, type TaxonomyPresentData } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/present'
import { tradeoffBeats, type TradeoffPresentData } from '../../../../src/core/learning-engine/sub-contexts/tradeoff-sandbox/present'
import PresentIntro from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/intro/PresentIntro'
import PresentTaxonomy from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/taxonomy-browser/PresentTaxonomy'
import PresentTradeoff from '../../../../src/core/learning-engine/sub-contexts/tradeoff-sandbox/components/tradeoff-sandbox/PresentTradeoff'
import { leadTerm } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/text/PresentText'
import { content, propsOf } from './helpers'

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo

/** The scenes a beat shows: marked for a beat up to it and not gone yet. */
const shown = () => [...document.querySelectorAll('.present-scenes > [data-shown]')].map((e) => e.textContent ?? '')

describe('one idea at a time (decision 109)', () => {
  it('lead keeps the opening sentences and leaves text without stops whole', () => {
    expect(lead('One. Two! Three?', 2)).toBe('One. Two!')
    expect(lead('Use it, e.g. for pages. Then more.')).toBe('Use it, e.g. for pages.')
    expect(lead('ข้อความภาษาไทยไม่มีจุด')).toBe('ข้อความภาษาไทยไม่มีจุด')
    expect(lead(undefined)).toBe('')
  })

  it('a paragraph opening with a bold term gives its headline', () => {
    expect(leadTerm('**Pipelines** — A Pipeline is a graph.')).toEqual({ term: 'Pipelines', rest: 'A Pipeline is a graph.' })
    expect(leadTerm('Plain **bold** later.')).toEqual({ rest: 'Plain **bold** later.' })
  })

  it('intro: each scene replaces the last, and leaves tags out', () => {
    const data = propsOf<IntroPresentData>(content('http-caching/sections/intro.oui'))
    const draw = (beat: number) => render(<PresentIntro data={data} beats={introBeats(data)} beat={beat} sectionIndex={0} active />)
    draw(1)
    expect(shown().some((t) => t.includes('keep a copy of a response'))).toBe(true)
    expect(shown().some((t) => t.includes('Reuse responses safely'))).toBe(false)
    expect(screen.queryByText('CDN')).toBeNull()
  })

  it('taxonomy: the grid shows names only; an open card shows its overview, not its deep dive', () => {
    const data = propsOf<TaxonomyPresentData>(content('http-caching/sections/directives.oui'))
    const first = data.categories[0]
    const { rerender } = render(<PresentTaxonomy data={data} beats={taxonomyBeats(data)} beat={0} sectionIndex={0} active />)
    expect(document.querySelector('.taxonomy-browser-description')).toBeNull()
    rerender(<PresentTaxonomy data={data} beats={taxonomyBeats(data)} beat={1} sectionIndex={0} active />)
    expect(document.querySelector('.present-agenda .is-now')?.textContent).toContain(first.title)
    if (first.details) expect(document.body.textContent).not.toContain(first.details)
  })

  it('tradeoff: choices by name and effects, without their gains and costs', () => {
    const data = propsOf<TradeoffPresentData>(content('haystack/sections/tradeoffs.oui'))
    render(<PresentTradeoff data={data} beats={tradeoffBeats(data)} beat={0} sectionIndex={0} active />)
    expect(document.querySelectorAll('.compare-card').length).toBeGreaterThan(1)
    expect(document.querySelector('.compare-pros, .compare-cons, .compare-card-summary')).toBeNull()
  })
})

describe('intro without a title (decision 109)', () => {
  it('starts at What, with no empty title beat', () => {
    const data = propsOf<IntroPresentData>(content('haystack/sections/intro.oui'))
    expect(data.title || data.subtitle).toBeFalsy()
    expect(introBeats(data).map((b) => b.id)).toEqual(['what', 'why', 'roadmap'])
    render(<PresentIntro data={data} beats={introBeats(data)} beat={0} sectionIndex={0} active />)
    expect(document.querySelector('.present-intro-hero')).toBeNull()
    expect(shown().some((t) => t.includes('Haystack 2.x is an open-source'))).toBe(true)
  })
})
