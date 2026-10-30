import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import PresentTaxonomy from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/taxonomy-browser/PresentTaxonomy'
import { taxonomyBeats, type TaxonomyPresentData } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/present'
import { beatSpeech } from '../../../../src/core/supporting/presentation/narration'
import { content, propsOf } from './helpers'

const data = propsOf<TaxonomyPresentData>(content('onboarding-it-web-dx/sections/methods.oui'))
const draw = (beat: number, value = data) => <PresentTaxonomy data={value} beats={taxonomyBeats(value)} beat={beat} sectionIndex={0} active />

describe('taxonomy presentation prototype', () => {
  it('shows five distinct icon medallions and concise focus lines in the overview', () => {
    const { container } = render(draw(0))
    const overview = container.querySelector('.present-taxonomy-overview-grid')!
    expect(overview).toHaveAttribute('data-count', '5')
    expect(overview.querySelectorAll('.present-taxonomy-medallion svg')).toHaveLength(5)
    expect(overview.textContent).toContain(data.categories[0].primaryFocus)
    expect(overview.textContent).not.toContain(data.categories[0].analogy)
    expect(overview.textContent).not.toContain(data.categories[0].details)
  })

  it('connects the analogy to the definition while narrating only the current category', () => {
    const { container, rerender } = render(draw(1))
    const first = data.categories[0]
    const visible = () => container.querySelector('.present-taxonomy-detail-scene[data-shown]')!
    expect(visible().querySelector('blockquote')).toHaveTextContent(first.analogy)
    expect(visible().querySelector('.present-taxonomy-meaning')).toHaveTextContent(first.description)
    const speech = beatSpeech(container, 1).map((p) => p.text).join(' ')
    expect(speech).toContain(first.analogy)
    expect(speech).not.toContain(data.categories[1].analogy)
    expect(container.textContent).not.toContain(first.details)
    rerender(draw(2))
    expect(visible().querySelector('blockquote')).toHaveTextContent(data.categories[1].analogy)
    rerender(draw(0))
    expect(container.querySelector('.present-taxonomy-detail-scene[data-shown]')).toBeNull()
    expect(container.querySelector('.present-taxonomy-overview-grid')).toHaveAttribute('data-shown')
  })

  it('shows the definition without fabricating an analogy when none is authored', () => {
    const value = { categories: [{ ...data.categories[0], analogy: '' }] }
    const { container } = render(draw(1, value))
    expect(container.querySelector('.present-taxonomy-explainer')).toHaveClass('without-analogy')
    expect(container.querySelector('blockquote')).toBeNull()
    expect(container.querySelector('.present-agenda')).toBeNull()
  })
})
