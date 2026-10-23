import { describe, it, expect } from 'vitest'
import { validateOUINarration } from '../../../../src/core/learning-engine/validation/oui-gateway'
import { content } from './helpers'

const section = content('http-caching/sections/directives.oui')
const ctx = { file: 'sections/directives.narrate.oui', sectionName: 'directives' }

describe('narration files', () => {
  it('compiles the steps and their effects', () => {
    const result = validateOUINarration(content('http-caching/sections/directives.narrate.oui'), section, ctx)
    expect(result.diagnostics).toEqual([])
    expect(result.status).toBe('valid')
    const steps = result.payload?.steps ?? []
    expect(steps).toHaveLength(5)
    expect(steps[2]).toEqual({
      beat: 'card2',
      caption: 'The name no-cache is the one people misread.',
      effects: [
        { kind: 'highlight', target: 'noCache.title' },
        { kind: 'callout', target: 'noCache', text: expect.stringMatching(/^no-cache does not mean/) },
      ],
    })
    expect(steps[0].effects).toEqual([{ kind: 'spotlight', targets: ['maxAge', 'noCache', 'noStore', 'private'] }])
  })

  it('warns about targets that name no statement or no prop of the section', () => {
    const result = validateOUINarration(`root = Narration([a])
a = NarrationStep("cards", "Look", [Highlight("nocache"), Callout("noCache.colour", "Hi")])
`, section, ctx)
    expect(result.status).toBe('warning')
    expect(result.diagnostics.map((d) => d.message)).toEqual([
      '"nocache" does not name a statement of sections/directives.oui.',
      '"noCache.colour": TaxonomyCategory has no prop "colour".',
    ])
    expect(result.diagnostics[0].fixHint).toContain('noCache')
    expect(result.diagnostics[0].line).toBe(2)
  })

  it('accepts prop paths, list indexes and steps with only a caption', () => {
    const result = validateOUINarration(`root = Narration([a, b])
a = NarrationStep("cards", "Only words.")
b = NarrationStep("card1", null, [Highlight("noCache.description"), Highlight("root.categories[0]")])
`, section, ctx)
    expect(result.diagnostics).toEqual([])
  })

  it('warns about targets inside a standard OpenUI section that Present mode cannot point at', () => {
    const openui = `// @openui "Guide"
root = Stack([intro, tabs])
intro = TextContent("Pick your platform.")
tabs = Tabs([TabItem("mac", "macOS", [mac])])
mac = TextContent("Use Homebrew.")
`
    const result = validateOUINarration(`root = Narration([a])
a = NarrationStep("part2", "Here.", [Highlight("intro"), Highlight("mac"), Highlight("tabs.items")])
`, openui, { sectionName: 'guide' })
    expect(result.diagnostics.map((d) => d.message)).toEqual([
      'Present mode cannot point at "mac" in a standard OpenUI section.',
      'Present mode cannot point at "tabs.items" in a standard OpenUI section.',
    ])
    expect(result.diagnostics[0].fixHint).toContain("Point at one of the root's children (intro, tabs)")
    const single = validateOUINarration(`root = Narration([a])
a = NarrationStep("all", "Here.", [Highlight("mac")])
`, `// @openui "Guide"\nroot = Tabs([TabItem("mac", "macOS", [mac])])\nmac = TextContent("Use Homebrew.")\n`, { sectionName: 'guide' })
    expect(single.diagnostics[0].fixHint).toContain('Card([...]) or Stack([...])')
  })

  it('accepts a bar, a point, a slice or a cell of a chart or table part (decision 117)', () => {
    const openui = `// @openui "Data"
root = Stack([bars, line, pie, table])
bars = BarChart(["A", "B"], [Series("One", [1, 2])])
line = LineChart(["A", "B"], [Series("One", [1, 2])])
pie = PieChart(["A", "B"], [1, 2])
table = Table([Col("Name", ["a", "b"]), Col("N", [1, 2], "number")])
`
    const ok = validateOUINarration(`root = Narration([a])
a = NarrationStep("part1", "Here.", [Highlight("bars.labels[1]"), Highlight("bars.series[0]"), Callout("line.series[0].values[1]", "Up."), Spotlight(["pie.values[0]", "table.columns[1].data[0]", "table.columns[0].label", "table.columns[1]"])])
`, openui, { sectionName: 'data' })
    expect(ok.diagnostics).toEqual([])
    const bad = validateOUINarration(`root = Narration([a])
a = NarrationStep("part1", "Here.", [Highlight("pie.series[0]"), Highlight("table.rows[1]"), Highlight("bars.labels")])
`, openui, { sectionName: 'data' })
    expect(bad.diagnostics.map((d) => d.field)).toEqual(['pie.series[0]', 'table.rows[1]', 'bars.labels'])
  })

  it('warns about steps that name no beat of the section (decision 108)', () => {
    const result = validateOUINarration(`root = Narration([a])
a = NarrationStep("q1", "No quiz here.")
`, section, ctx)
    expect(result.status).toBe('warning')
    expect(result.diagnostics[0].message).toBe('"q1" is not a beat of sections/directives.oui, so this step never plays.')
    expect(result.diagnostics[0].fixHint).toBe('Its beats are title, cards, card1, card2, card3, card4.')
  })

  it('needs its section and the Narration root', () => {
    expect(validateOUINarration('root = Narration([])\n', undefined, ctx).diagnostics[0].message).toBe('There is no sections/directives.oui for this narration to play with.')
    const wrong = validateOUINarration('root = Text("T", ["p"])\n', section, ctx)
    expect(wrong.status).toBe('error')
    expect(wrong.payload).toBeNull()
  })
})
