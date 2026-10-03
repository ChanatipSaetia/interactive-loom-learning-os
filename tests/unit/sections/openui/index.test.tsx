import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import OpenUISection from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/openui'
import { OpenUIFormEditor } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/openui/OpenUIFormEditor'
import { OpenUIHelpModal } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/openui/OpenUIHelpModal'
import { OpenUISectionSchema } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/schema'
import { loomOpenUIThemeCss } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/openui/theme'
import {
  openUIProgramOf,
  printOpenUISection,
  readOpenUIDirective,
} from '../../../../src/core/learning-engine/sub-contexts/progressive-content/openui-standard'

const PROGRAM = `root = Card([header, body])
header = CardHeader("Plans", "Compare what you get")
body = TextContent("Up to **3** projects.")`

describe('OpenUI Section', () => {
  it('renders standard OpenUI components', async () => {
    render(<OpenUISection title="Pricing" heading="Pick one" source={PROGRAM} />)
    expect(screen.getByTestId('openui-title')).toHaveTextContent('Pricing')
    expect(screen.getByTestId('openui-heading')).toHaveTextContent('Pick one')
    await waitFor(() => expect(screen.getByTestId('openui-content')).toHaveTextContent('Compare what you get'))
    expect(screen.getByTestId('openui-content')).toHaveTextContent('Up to 3 projects.')
  })

  it('lists program errors without crashing', async () => {
    render(<OpenUISection source={`root = Card([x])\nx = Nope()`} />)
    await waitFor(() => expect(screen.getByTestId('openui-errors')).toHaveTextContent('Nope'))
  })

  it('validates its data schema', () => {
    expect(OpenUISectionSchema.safeParse({ type: 'openui', source: PROGRAM }).success).toBe(true)
    expect(OpenUISectionSchema.safeParse({ type: 'openui', source: '' }).success).toBe(false)
  })
})

describe('Loom OpenUI theme', () => {
  it('maps Loom tokens onto --openui-* variables on body (so portals are themed)', () => {
    const css = loomOpenUIThemeCss()
    expect(css.startsWith('body {')).toBe(true)
    expect(css).toContain('--openui-text-neutral-primary: var(--ctp-text);')
    expect(css).toContain('--openui-interactive-accent-default: var(--primary);')
    // Untouched tokens keep react-ui's dark defaults, with upstream's naming.
    expect(css).toMatch(/--openui-text-body-default: [^;]+;/)
    expect(css).toMatch(/--openui-space-2xl: [^;]+;/)
  })

  it('injects the stylesheet once', () => {
    render(<OpenUISection source={PROGRAM} />)
    render(<OpenUISection source={PROGRAM} />)
    expect(document.querySelectorAll('#loom-openui-theme')).toHaveLength(1)
  })
})

describe('OpenUI directive', () => {
  it('reads title and heading from the first non-blank line', () => {
    expect(readOpenUIDirective('\n// @openui "A \\"quoted\\" title" "Sub"\nroot = Card([])')).toEqual({ title: 'A "quoted" title', heading: 'Sub', line: 2 })
    expect(readOpenUIDirective('// @openui\nroot = Card([])')).toEqual({ title: '', heading: undefined, line: 1 })
    expect(readOpenUIDirective('root = Card([])\n// @openui "late"')).toBeNull()
    expect(readOpenUIDirective('// @openuix "no"')).toBeNull()
  })

  it('round-trips through print', () => {
    const file = printOpenUISection(PROGRAM, 'Pricing', 'Pick one')
    expect(file.startsWith('// @openui "Pricing" "Pick one"\nroot = Card')).toBe(true)
    expect(openUIProgramOf(file)).toBe(PROGRAM)
    expect(readOpenUIDirective(file)).toMatchObject({ title: 'Pricing', heading: 'Pick one' })
  })
})

describe('OpenUIHelpModal', () => {
  it('does not render when closed', () => {
    render(<OpenUIHelpModal isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByTestId('openui-help-modal')).not.toBeInTheDocument()
  })

  it('lists the standard component groups and closes', () => {
    const onClose = vi.fn()
    render(<OpenUIHelpModal isOpen={true} onClose={onClose} />)
    expect(screen.getByText('OpenUI Section Guide')).toBeInTheDocument()
    expect(screen.getByTestId('openui-help-modal')).toHaveTextContent('Tabs')
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('standard OpenUI snapshot', () => {
  it('matches the installed @openuidev/react-ui library (run `npm run openui:gen` after upgrading)', async () => {
    const { openuiLibrary } = await import('@openuidev/react-ui/genui-lib')
    const { defaultDarkTheme } = await import('@openuidev/react-ui')
    const darkTheme = (await import('../../../../src/core/learning-engine/sub-contexts/progressive-content/openui-standard/dark-theme.json')).default
    expect(darkTheme).toEqual(Object.fromEntries(Object.entries(defaultDarkTheme).filter(([, v]) => typeof v === 'string')))
    const { standardOpenUISchema, standardOpenUISpec } = await import(
      '../../../../src/core/learning-engine/sub-contexts/progressive-content/openui-standard'
    )
    expect(standardOpenUISchema).toEqual(JSON.parse(JSON.stringify(openuiLibrary.toJSONSchema())))
    expect(standardOpenUISpec).toEqual(JSON.parse(JSON.stringify({
      root: openuiLibrary.root,
      components: openuiLibrary.toSpec().components,
      componentGroups: openuiLibrary.componentGroups ?? [],
    })))
  })
})

describe('OpenUIFormEditor', () => {
  const data = (source: string) => ({ type: 'openui' as const, source })

  it('edits paragraphs of a migrated text section as blocks', () => {
    const onChange = vi.fn()
    render(<OpenUIFormEditor data={data('root = Stack([TextContent("One"), TextContent("Two")])')} onChange={onChange} />)
    expect(screen.getByTestId('openui-form-tree')).toBeInTheDocument()
    fireEvent.change(screen.getByTestId('openui-form-root-children-1-text'), { target: { value: 'Two!' } })
    expect(onChange).toHaveBeenLastCalledWith(data('root = Stack([TextContent("One"), TextContent("Two!")])'))
  })

  it('adds, reorders and removes blocks', () => {
    const onChange = vi.fn()
    const { rerender } = render(<OpenUIFormEditor data={data('root = Stack([TextContent("A"), TextContent("B")])')} onChange={onChange} />)
    fireEvent.click(screen.getByTestId('openui-form-root-children-1-up'))
    expect(onChange).toHaveBeenLastCalledWith(data('root = Stack([TextContent("B"), TextContent("A")])'))
    fireEvent.click(screen.getByTestId('openui-form-root-children-0-remove'))
    expect(onChange).toHaveBeenLastCalledWith(data('root = Stack([TextContent("B")])'))
    fireEvent.change(screen.getByTestId('openui-form-root-children-add'), { target: { value: 'Callout' } })
    expect(onChange).toHaveBeenLastCalledWith(data('root = Stack([TextContent("A"), TextContent("B"), Callout("info", "", "")])'))

    // Nested blocks (Tabs → TabItem → content) get their own lists.
    rerender(<OpenUIFormEditor data={data('root = Stack([Tabs([TabItem("a", "A", [TextContent("x")])])])')} onChange={onChange} />)
    fireEvent.change(screen.getByTestId('openui-form-root-children-0-items-0-content-add'), { target: { value: 'CodeBlock' } })
    expect(onChange).toHaveBeenLastCalledWith(data('root = Stack([Tabs([TabItem("a", "A", [TextContent("x"), CodeBlock("", "")])])])'))
  })

  it('edits enums, optional params, string lists and the root container', () => {
    const onChange = vi.fn()
    render(<OpenUIFormEditor data={data('root = Stack([Callout("info", "T", "D"), TagBlock(["a", "b"])])')} onChange={onChange} />)
    fireEvent.change(screen.getByTestId('openui-form-root-children-0-variant'), { target: { value: 'warning' } })
    expect(onChange).toHaveBeenLastCalledWith(data('root = Stack([Callout("warning", "T", "D"), TagBlock(["a", "b"])])'))
    fireEvent.change(screen.getByTestId('openui-form-root-children-1-tags'), { target: { value: 'a\nb\nc' } })
    expect(onChange).toHaveBeenLastCalledWith(data('root = Stack([Callout("info", "T", "D"), TagBlock(["a", "b", "c"])])'))
    fireEvent.change(screen.getByTestId('openui-form-root-gap'), { target: { value: 'l' } })
    expect(onChange).toHaveBeenLastCalledWith(data('root = Stack([Callout("info", "T", "D"), TagBlock(["a", "b"])], null, "l")'))
    fireEvent.click(screen.getByTestId('openui-form-root-children-0-visible'))
    expect(onChange).toHaveBeenLastCalledWith(data('root = Stack([Callout("info", "T", "D", true), TagBlock(["a", "b"])])'))
    fireEvent.change(screen.getByTestId('openui-form-root'), { target: { value: 'Card' } })
    expect(onChange).toHaveBeenLastCalledWith(data('root = Card([Callout("info", "T", "D"), TagBlock(["a", "b"])])'))
  })

  it('unchecking an optional checkbox removes the parameter instead of writing false', () => {
    const onChange = vi.fn()
    render(<OpenUIFormEditor data={data('root = Stack([Callout("info", "T", "D", true)])')} onChange={onChange} />)
    fireEvent.click(screen.getByTestId('openui-form-root-children-0-visible'))
    expect(onChange).toHaveBeenLastCalledWith(data('root = Stack([Callout("info", "T", "D")])'))
  })

  it('falls back to the program text when it cannot be edited as blocks', () => {
    const onChange = vi.fn()
    render(<OpenUIFormEditor data={data('$n = 1\nroot = TextContent("" + $n)')} onChange={onChange} />)
    expect(screen.getByTestId('openui-form-not-editable')).toHaveTextContent('$state')
    fireEvent.change(screen.getByTestId('openui-source-input'), { target: { value: 'root = TextContent("x")' } })
    expect(onChange).toHaveBeenLastCalledWith(data('root = TextContent("x")'))
  })
})
