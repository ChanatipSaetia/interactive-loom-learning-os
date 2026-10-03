import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import OpenUISection from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/openui'
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
