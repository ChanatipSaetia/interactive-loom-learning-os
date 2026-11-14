import { describe, it, expect, beforeAll } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { Suspense } from 'react'
import { compileOUISection, indexStatementLines, sourceMapOf } from '../../../../../../src/core/learning-engine/composition/oui/compile'
import { bundleToSections } from '../../../../../../src/core/learning-engine/composition/okf/sections'
import { SectionRegistry } from '../../../../../../src/core/learning-engine/registry'
import { registerCoreSections } from '../../../../../../src/core/learning-engine/registry/register-core-sections'
import { SECTION_TEMPLATES } from '../../../../../../src/core/supporting/authoring-editor/workspace'
import { PickSection, statementOfAnchor } from '../../../../../../src/core/supporting/authoring-editor/pick'
import { HUDProvider } from '../../../../../../src/core/learning-engine/composition/context/HUDContext'
import { ProgressProvider } from '../../../../../../src/core/supporting/learner-progress'

beforeAll(() => registerCoreSections())

/** Render a section source the way Studio and Viewer do and list its anchors. */
async function anchorsOf(source: string): Promise<string[]> {
  document.body.innerHTML = ''
  const { value } = compileOUISection(source)
  const config = bundleToSections([value!])[0]
  const Component = (await SectionRegistry.loader(config.type)!()).default
  // The same providers Studio and Viewer render sections in.
  const { container } = render(
    <ProgressProvider>
      <HUDProvider>
        <PickSection file="sections/s.oui" label="S" sourceMap={sourceMapOf(value)}>
          <Suspense fallback={<p>loading</p>}><Component sectionIndex={0} {...config.props} /></Suspense>
        </PickSection>
      </HUDProvider>
    </ProgressProvider>,
  )
  await waitFor(() => expect(container.textContent).not.toContain('loading'))
  // Graph layouts attach item anchors after their first measured render.
  await waitFor(() => expect(container.querySelector('[data-oui-anchor]:not([data-oui-anchor="root"])')).not.toBeNull())
  return [...container.querySelectorAll('[data-oui-anchor]')].map((el) => el.getAttribute('data-oui-anchor')!)
}

/** Every Loom section type tags its items; standard OpenUI sections stay section-level (decision 49). */
const TAGGED = SECTION_TEMPLATES.map((t) => t.type).filter((type) => type !== 'openui')

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
    const anchors = await anchorsOf(`root = Page("Check", Quiz("Check", [q2]))
q2 = QuizQuestion("kafka-offsets", "Why?", [QuizChoice("a", "A", true, "Because"), c2], "Think")
c2 = QuizChoice("b", "B", false, "No")
`)
    expect(anchors).toEqual(expect.arrayContaining([
      'root', 'q2', 'q2.question', 'q2.hint', 'q2.choices[0]', 'q2.choices[0].text', 'c2', 'c2.text',
    ]))
  })

  it('tags concept map nodes, links and link labels', async () => {
    const anchors = await anchorsOf(`root = Page("Map", ConceptMap("Map", [a, b], [ConceptLink(a, b, "uses")]))
a = Concept("a", "Alpha", "concept")
b = Concept("b", "Beta")
`)
    expect(anchors).toEqual(expect.arrayContaining(['a', 'a.title', 'a.category', 'b', 'root.body.links[0]', 'root.body.links[0].label']))
  })

  it('tags paragraphs and nested bullets', async () => {
    expect(await anchorsOf("root = Page(\"T\", Stack([TextContent(\"One\"), TextContent(\"Two\")]))\n")).toEqual(['root', 'root.body.children[0].text', 'root.body.children[1].text'])
    const bullets = await anchorsOf("root = Page(\"B\", Bullets(\"B\", [Bullet(\"Top\", [Bullet(\"Child\")]), b2]))\nb2 = Bullet(\"Second\")\n")
    expect(bullets).toEqual(expect.arrayContaining(['root.body.items[0]', 'root.body.items[0].text', 'b2', 'b2.text']))
  })
})
