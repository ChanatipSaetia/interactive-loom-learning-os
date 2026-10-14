import { describe, it, expect, beforeAll } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { Suspense } from 'react'
import { compileOUISection, indexStatementLines, sourceMapOf } from '../../../../../../src/core/learning-engine/composition/oui/compile'
import { bundleToSections } from '../../../../../../src/core/learning-engine/composition/okf/sections'
import { SectionRegistry } from '../../../../../../src/core/learning-engine/registry'
import { registerCoreSections } from '../../../../../../src/core/learning-engine/registry/register-core-sections'
import { SECTION_TEMPLATES } from '../../../../../../src/core/supporting/authoring-editor/workspace'
import { PickSection, statementOfAnchor } from '../../../../../../src/core/supporting/authoring-editor/pick'

beforeAll(() => registerCoreSections())

/** Render a section source the way Studio and Viewer do and list its anchors. */
async function anchorsOf(source: string): Promise<string[]> {
  document.body.innerHTML = ''
  const { value } = compileOUISection(source)
  const config = bundleToSections([value!])[0]
  const Component = SectionRegistry.get(config.type)!
  const { container } = render(
    <PickSection file="sections/s.oui" label="S" sourceMap={sourceMapOf(value)}>
      <Suspense fallback={<p>loading</p>}><Component sectionIndex={0} {...config.props} /></Suspense>
    </PickSection>,
  )
  await waitFor(() => expect(container.textContent).not.toContain('loading'))
  return [...container.querySelectorAll('[data-oui-anchor]')].map((el) => el.getAttribute('data-oui-anchor')!)
}

/** Section types whose items are tagged (Phase 2: progressive-content and practice-assessment; Phase 3: process-simulation). */
const TAGGED = ['intro', 'text', 'bullets', 'taxonomy-browser', 'image-gallery', 'pillar-layer', 'quiz', 'flashcards', 'concept-map', 'flowchart', 'scenario']

describe('Section pick anchors', () => {
  for (const template of SECTION_TEMPLATES.filter((t) => TAGGED.includes(t.type))) {
    it(`tags ${template.type} elements with anchors to real statements`, async () => {
      const source = template.source('Sample')
      const anchors = await anchorsOf(source)
      const statements = indexStatementLines(source)
      expect(anchors.filter((a) => a !== 'root').length).toBeGreaterThan(0)
      for (const anchor of anchors) expect(statements.has(statementOfAnchor(anchor))).toBe(true)
      // Every element marked by a section also says which file and section it belongs to.
      for (const el of document.querySelectorAll('[data-oui-anchor]')) {
        expect(el.getAttribute('data-oui-file')).toBe('sections/s.oui')
        expect(el.getAttribute('data-oui-section')).toBe('S')
      }
    })
  }

  it('points at named statements, inline components and props', async () => {
    const anchors = await anchorsOf(`root = Quiz("Check", [q2])
q2 = QuizQuestion("kafka-offsets", "Why?", [QuizChoice("a", "A", true, "Because"), c2], "Think")
c2 = QuizChoice("b", "B", false, "No")
`)
    expect(anchors).toEqual(expect.arrayContaining([
      'root', 'q2', 'q2.question', 'q2.hint', 'q2.choices[0]', 'q2.choices[0].text', 'c2', 'c2.text',
    ]))
  })

  it('tags concept map nodes, links and link labels', async () => {
    const anchors = await anchorsOf(`root = ConceptMap("Map", [a, b], [ConceptLink(a, b, "uses")])
a = Concept("a", "Alpha", "concept")
b = Concept("b", "Beta")
`)
    expect(anchors).toEqual(expect.arrayContaining(['a', 'a.title', 'a.category', 'b', 'root.links[0]', 'root.links[0].label']))
  })

  it('tags paragraphs and nested bullets', async () => {
    expect(await anchorsOf('root = Text("T", ["One", "Two"])\n')).toEqual(['root', 'root.paragraphs[0]', 'root.paragraphs[1]'])
    const bullets = await anchorsOf('root = Bullets("B", [Bullet("Top", [Bullet("Child")]), b2])\nb2 = Bullet("Second")\n')
    expect(bullets).toEqual(expect.arrayContaining(['root.items[0]', 'root.items[0].text', 'b2', 'b2.text']))
  })
})
