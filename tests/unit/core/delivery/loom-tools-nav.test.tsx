import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LOOM_TOOLS, LoomToolsNav } from '../../../../src/core/delivery/web-app-shell/LoomToolsNav'

describe('LoomToolsNav', () => {
  it('links the other Loom pages and marks the current one', () => {
    render(<LoomToolsNav current="viewer" />)
    expect(screen.getByTestId('loom-tools-viewer').tagName).toBe('SPAN')
    expect(screen.getByTestId('loom-tools-viewer').getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('link', { name: 'Create with AI' }).getAttribute('href')).toBe('/create.html')
    expect(screen.getByRole('link', { name: 'Loom Studio' }).getAttribute('href')).toBe('/studio.html')
  })

  it('describes every page in a tooltip', () => {
    render(<LoomToolsNav current="studio" />)
    for (const tool of LOOM_TOOLS) {
      const item = screen.getByTestId(`loom-tools-${tool.id}`)
      const tip = document.getElementById(item.getAttribute('aria-describedby')!)
      expect(tip?.getAttribute('role')).toBe('tooltip')
      expect(tip?.textContent).toContain(tool.description)
    }
  })

  it('opens the other pages in a new tab when asked', () => {
    render(<LoomToolsNav current="studio" newTab />)
    expect(screen.getByRole('link', { name: 'Loom Viewer' }).getAttribute('target')).toBe('_blank')
  })
})
