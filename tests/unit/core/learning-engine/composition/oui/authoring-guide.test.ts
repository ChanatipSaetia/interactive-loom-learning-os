import { describe, expect, it } from 'vitest'
import { getAuthoringGuide, guideSectionTypes } from '../../../../../../src/core/learning-engine/composition/oui/authoring-guide'
import { getLoomAuthoringPrompt } from '../../../../../../src/core/learning-engine/composition/oui/authoring-prompt'
import { LOOM_OUI_COMPONENTS } from '../../../../../../src/core/learning-engine/composition/oui/library'

const signature = (name: string) => new RegExp(`^${name}\\(`, 'm')

const DRIVE = new Set(['Domain', 'DomainRef', 'Library', 'Catalog', 'TopicRef'])

describe('getAuthoringGuide', () => {
  it('includes bullet composition guidance only when bullets are requested', () => {
    const bullets = getAuthoringGuide(['bullets'])
    expect(bullets).toContain('## Bullet Composition')
    expect(bullets).toContain('Bullet("Prepare **access**", null, "key")')
    expect(bullets).toContain('NarrationStep("item1.child1"')
    expect(getAuthoringGuide(['quiz'])).not.toContain('## Bullet Composition')
    expect(getAuthoringGuide()).not.toContain('## Bullet Composition')
  })

  it('returns the whole prompt for "all"', () => {
    expect(getAuthoringGuide(['all'])).toBe(getLoomAuthoringPrompt())
  })

  it('keeps every component when every section type is asked for', () => {
    const guide = getAuthoringGuide(guideSectionTypes().map((t) => t.type))
    for (const component of LOOM_OUI_COMPONENTS) {
      // The learner's Loom folder (domain.oui, index.oui) comes with get_storage_guide, not with how to write a topic
      if (DRIVE.has(component.name)) expect(guide, component.name).not.toMatch(signature(component.name))
      else expect(guide, component.name).toMatch(signature(component.name))
    }
  })

  it('lists only the shared components and the section types without any asked for', () => {
    const guide = getAuthoringGuide()
    expect(guide).toMatch(signature('Topic'))
    expect(guide).toMatch(signature('Narration'))
    expect(guide).not.toMatch(signature('Quiz'))
    expect(guide).toContain('- Quiz:')
    expect(guide).toContain('Request exact component names')
    expect(guide).not.toContain('## Page Composition')
  })

  it('keeps a section type with its sub-components and leaves out the others', () => {
    const guide = getAuthoringGuide(['quiz'])
    for (const name of ['Quiz', 'QuizQuestion', 'QuizChoice', 'Lead', 'Topic', 'SectionRef']) expect(guide, name).toMatch(signature(name))
    for (const name of ['Flashcards', 'Flowchart', 'Scenario', 'Intro']) expect(guide, name).not.toMatch(signature(name))
    expect(guide.length).toBeLessThan(getLoomAuthoringPrompt().length / 2)
  })

  it('adds the standard OpenUI part only for openui', () => {
    expect(getAuthoringGuide(['openui'])).toContain('root = Page(')
    expect(getAuthoringGuide(['openui'])).toContain('## Narration Files')
    expect(getAuthoringGuide(['quiz'])).toContain('## Narration Files')
  })

  it('names section types it does not know', () => {
    expect(getAuthoringGuide([], ['Quiz', 'Karaoke'])).toContain('Unknown components: Karaoke.')
  })
})

it('returns exact canonical signatures and dependencies without unrelated sections', () => {
  const guide = getAuthoringGuide([], ['QuizQuestion'])
  expect(guide).toMatch(/^QuizQuestion\(/m)
  expect(guide).toMatch(/^QuizChoice\(/m)
  expect(guide).not.toMatch(/^Flowchart\(/m)
  expect(guide.length).toBeLessThan(getAuthoringGuide(['quiz']).length)
  expect(getAuthoringGuide([], ['MissingComponent'])).toContain('Unknown components: MissingComponent')
})

it('resolves every component by its canonical name without selecting a library', () => {
  expect(getAuthoringGuide([], ['TextContent'])).toMatch(/^TextContent\(text: string,/m)
  expect(getAuthoringGuide([], ['Text'])).toMatch(/^Text\(variant\?/m)
  expect(getAuthoringGuide([], ['Quiz', 'Table'])).toMatch(/^Quiz\(/m)
  expect(getAuthoringGuide([], ['Quiz', 'Table'])).toMatch(/^Col\(/m)
  expect(getAuthoringGuide([], ['Text'])).not.toContain('Ambiguous component names')
  expect(getAuthoringGuide([], ['Table'], 'loom')).toMatch(/^Table\(/m)
})

it('distinguishes manifest, page and narration source roots from bare signatures', () => {
  const topic = getAuthoringGuide([], ['Topic'])
  expect(topic).toContain('root = Topic(...)')
  expect(topic).not.toContain('Page rules:')
  expect(topic).not.toContain('root = Page(')
  const narration = getAuthoringGuide([], ['Narration'])
  expect(narration).toContain('root = Narration(...)')
  expect(narration).not.toContain('Page rules:')
  expect(getAuthoringGuide([], ['Page'])).toContain('root = Page(')
})
