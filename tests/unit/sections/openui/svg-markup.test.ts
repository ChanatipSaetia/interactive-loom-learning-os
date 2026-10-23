import { describe, it, expect } from 'vitest'
import { sanitizeSvgMarkup, svgShapeIds } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/openui/svg-markup'
import { indexStatementLines } from '../../../../src/core/learning-engine/composition/oui/compile'
import { scan, indexStatements } from '../../../../src/core/supporting/authoring-editor/oui-language/scanner'

const draw = (markup: string, label?: string) => {
  const result = sanitizeSvgMarkup(markup, 's1', label)
  if ('error' in result) throw new Error(result.error)
  const host = document.createElement('div')
  host.innerHTML = result.svg
  return host.querySelector('svg')!
}

describe('Svg markup (decision 118)', () => {
  it('drops scripts, handlers, foreign content and outside links', () => {
    const svg = draw(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 10 10">
      <script>alert(1)</script>
      <style>body { display: none }</style>
      <foreignObject><div>hi</div></foreignObject>
      <image href="https://example.com/x.png"/>
      <a href="javascript:alert(1)"><rect width="1" height="1"/></a>
      <rect id="box" width="5" height="5" onclick="alert(1)" style="fill: url(https://example.com/x)"/>
      <use xlink:href="https://example.com/x.svg#a"/>
      <set attributeName="href" to="javascript:alert(1)"/>
    </svg>`)
    expect(svg.querySelector('script, style, foreignObject, image, a, set')).toBeNull()
    const box = svg.querySelector('rect')!
    expect(box.getAttribute('onclick')).toBeNull()
    expect(box.getAttribute('style')).toBeNull()
    expect(svg.querySelector('use')?.getAttribute('xlink:href')).toBeNull()
  })

  it('scopes ids and their references, keeping the authored id for narration', () => {
    const svg = draw(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
      <defs><marker id="arrow"><path d="M0 0 L4 2 L0 4 Z"/></marker></defs>
      <line id="flow" x1="0" y1="5" x2="10" y2="5" marker-end="url(#arrow)"/>
      <use href="#flow"/>
    </svg>`)
    expect(svg.querySelector('marker')?.getAttribute('id')).toBe('s1-arrow')
    const line = svg.querySelector('line')!
    expect(line.getAttribute('data-svg-id')).toBe('flow')
    expect(line.getAttribute('marker-end')).toBe('url(#s1-arrow)')
    expect(svg.querySelector('use')?.getAttribute('href')).toBe('#s1-flow')
  })

  it('turns Loom palette names into theme colors and inks the rest in the text color', () => {
    const svg = draw('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><circle r="4" fill="green" stroke="#123456"/></svg>', 'A dot')
    const circle = svg.querySelector('circle')!
    expect(circle.getAttribute('fill')).toBeNull()
    expect(circle.getAttribute('style')).toContain('fill: var(--ctp-green)')
    expect(circle.getAttribute('stroke')).toBe('#123456')
    expect(svg.getAttribute('viewBox')).toBe('0 0 40 20')
    expect(svg.getAttribute('width')).toBeNull()
    expect(svg.getAttribute('fill')).toBe('currentColor')
    expect(svg.getAttribute('aria-label')).toBe('A dot')
  })

  it('says why markup cannot be drawn', () => {
    expect(sanitizeSvgMarkup('<svg xmlns="http://www.w3.org/2000/svg"><rect></svg>', 's')).toHaveProperty('error')
    expect(sanitizeSvgMarkup('<div>no</div>', 's')).toHaveProperty('error')
  })

  it('reads the ids of a drawing from its markup', () => {
    expect(svgShapeIds('<svg><g id="a"><rect id=\'b\' x="1"/></g><path d="M0 0" id="c"/><circle data-id="x"/></svg>')).toEqual(['a', 'b', 'c'])
  })

  it('keeps statement lines right across a multi-line single-quoted string', () => {
    const source = `root = Card([header, engine, tip])\nheader = CardHeader("T")\nengine = Svg('<svg>\n  <rect id="a" x="1"/>\n  x = 1\n</svg>', "cap")\ntip = Callout("info", "A", "B")\n`
    expect([...indexStatementLines(source)]).toEqual([['root', 1], ['header', 2], ['engine', 3], ['tip', 7]])
    expect(indexStatements(scan(source)).map((s) => s.name)).toEqual(['root', 'header', 'engine', 'tip'])
  })
})
