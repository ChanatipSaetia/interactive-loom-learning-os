import { describe, it, expect, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { EditorState } from '@codemirror/state'
import { EditorView, showTooltip } from '@codemirror/view'
import { CompletionContext } from '@codemirror/autocomplete'
import { ensureSyntaxTree } from '@codemirror/language'
import { forceLinting, diagnosticCount } from '@codemirror/lint'
import {
  ouiCompletionSource,
  ouiEditorExtensions,
  ouiLanguage,
  renderTooltipMarkdown,
  toCodeMirrorSnippet,
  goToDefinition,
} from '../../../../../../src/core/supporting/authoring-editor/oui-language/codemirror'
import { OUICodeEditor } from '../../../../../../src/core/supporting/authoring-editor/components/OUICodeEditor'

function tokens(code: string): string[] {
  const state = EditorState.create({ doc: code, extensions: [ouiLanguage] })
  const tree = ensureSyntaxTree(state, code.length, 5000)!
  const out: string[] = []
  tree.iterate({ enter: (n) => { if (n.name !== 'Document') out.push(`${n.name}:${code.slice(n.from, n.to)}`) } })
  return out
}

describe('CodeMirror highlighting', () => {
  it('classifies statements, calls and values', () => {
    expect(tokens('root = Quiz("T", [q1]) // c\n$n = 1\nq1 = X(@Count(a), true, {k: 2})')).toEqual(expect.arrayContaining([
      'rootKeyword:root',
      'component:Quiz',
      'string:"T"',
      'reference:q1',
      'comment:// c',
      'stateDefinition:$n',
      'number:1',
      'definition:q1',
      'builtinCall:@Count',
      'atom:true',
      'propertyName:k',
    ]))
  })

  it('does not treat continuation lines inside brackets as definitions', () => {
    expect(tokens('root = Text(\n  title,\n  [a]\n)')).toContain('reference:title')
  })
})

describe('CodeMirror completions', () => {
  it('returns snippet completions for the argument position', () => {
    const doc = 'root = Quiz("T", [])'
    const state = EditorState.create({ doc })
    const result = ouiCompletionSource()(new CompletionContext(state, doc.indexOf(']'), true))
    expect(result?.options.map((o) => o.label)).toContain('QuizQuestion')
    expect(result?.options.find((o) => o.label === 'QuizQuestion')?.type).toBe('class')
  })

  it('stays quiet while typing ordinary punctuation without a prefix', () => {
    const doc = 'root = Text("T", [] '
    const state = EditorState.create({ doc })
    expect(ouiCompletionSource()(new CompletionContext(state, doc.length - 1, false))).toBeNull()
  })

  it('converts snippet syntax', () => {
    expect(toCodeMirrorSnippet('Lead($0)')).toBe('Lead(${})')
    expect(toCodeMirrorSnippet('Text("${1:title}", [${2}])')).toBe('Text("${1:title}", [${2}])')
  })
})

describe('CodeMirror editor features', () => {
  function view(doc: string, cursor: number) {
    return new EditorView({
      state: EditorState.create({ doc, selection: { anchor: cursor }, extensions: ouiEditorExtensions() }),
      parent: document.body,
    })
  }

  it('shows a signature tooltip at the cursor', () => {
    const doc = 'x = Step("id", '
    const v = view(doc, doc.length)
    const tooltips = v.state.facet(showTooltip).filter(Boolean)
    expect(tooltips).toHaveLength(1)
    const { dom } = tooltips[0]!.create(v)
    expect(dom.querySelector('.oui-signature-active')?.textContent).toBe('policy: string')
    v.destroy()
  })

  it('lints with gateway diagnostics', async () => {
    const v = view('root = Quizz("T", [])', 0)
    forceLinting(v)
    await waitFor(() => expect(diagnosticCount(v.state)).toBe(1))
    v.destroy()
  })

  it('jumps to definitions', () => {
    const doc = 'root = Text("T", [p])\np = "x"'
    const v = view(doc, doc.indexOf('p]'))
    expect(goToDefinition(v)).toBe(true)
    expect(v.state.selection.main.from).toBe(doc.indexOf('p ='))
    v.destroy()
  })
})

describe('renderTooltipMarkdown', () => {
  it('renders code fences, bold and inline code, escaping HTML', () => {
    expect(renderTooltipMarkdown('```oui\nA<b>(x)\n```\n**Step › id**: `string` <img>')).toBe(
      '<pre>A&lt;b&gt;(x)</pre><strong>Step › id</strong>: <code>string</code> &lt;img&gt;',
    )
  })
})

describe('OUICodeEditor', () => {
  it('renders the source and reports edits', () => {
    const onChange = vi.fn()
    const { getByTestId, rerender } = render(<OUICodeEditor value={'root = Text("T", [])'} onChange={onChange} />)
    const host = getByTestId('oui-code-editor')
    expect(host.textContent).toContain('root = Text("T", [])')

    const editor = EditorView.findFromDOM(host.querySelector('.cm-editor') as HTMLElement)!
    editor.dispatch({ changes: { from: 0, insert: '// hi\n' } })
    expect(onChange).toHaveBeenLastCalledWith('// hi\nroot = Text("T", [])')

    rerender(<OUICodeEditor value={'root = Text("New", [])'} onChange={onChange} />)
    expect(editor.state.doc.toString()).toBe('root = Text("New", [])')
  })
})
