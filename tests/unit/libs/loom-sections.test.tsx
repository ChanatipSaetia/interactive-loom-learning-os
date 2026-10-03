import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, act, waitFor } from '@testing-library/react'
import LoomSections from '../../../libs/loom-sections'
import type { SectionConfig } from '../../../src/core/learning-engine/registry'

describe('LoomSections UMD / CDN Library', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    container.id = 'loom-test-container'
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
    document.documentElement.removeAttribute('data-theme')
  })

  it('renders sections in container', async () => {
    const sections: SectionConfig[] = [
      {
        type: 'openui',
        props: {
          title: 'CDN Test Section',
          source: 'root = Stack([TextContent("This is a section paragraph rendered via UMD bundle.")])',
        },
      },
    ]

    let cleanup: () => void = () => {}
    await act(async () => {
      cleanup = LoomSections.render(container, sections, {
        title: 'CDN Test Page',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('CDN Test Page')).toBeInTheDocument()
      expect(screen.getByText('CDN Test Section')).toBeInTheDocument()
      expect(screen.getByText('This is a section paragraph rendered via UMD bundle.')).toBeInTheDocument()
    })

    cleanup()
  })

  it('ignores the removed editable option with a warning and renders read-only', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const sections: SectionConfig[] = [
      { type: 'openui', props: { title: 'Read-only Section', source: 'root = TextContent("Some text.")' } },
    ]

    let cleanup: () => void = () => {}
    await act(async () => {
      cleanup = LoomSections.render(container, sections, { title: 'Embed Page', editable: true })
    })

    await waitFor(() => expect(screen.getByText('Some text.')).toBeInTheDocument())
    expect(screen.queryByTestId('edit-section-toggle-0')).toBeNull()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Loom Studio'))

    warn.mockRestore()
    cleanup()
  })

  it('fetches and renders OKF bundle using loadAndRenderOKF', async () => {
    const mockFetch = vi.spyOn(window, 'fetch').mockImplementation(async (url) => {
      const urlStr = String(url)
      if (urlStr.endsWith('demo/index.md')) {
        return new Response(`---
title: Demo Topic
---
* [section-01](./sections/sec1/section.md)
`)
      }
      if (urlStr.endsWith('sec1/section.md')) {
        return new Response(`---
type: text
title: Section 1 Title
resource: content.md
---
Introductory text
`)
      }
      if (urlStr.endsWith('sec1/content.md')) {
        return new Response('Content paragraph from OKF file.')
      }
      return new Response('', { status: 404 })
    })

    let cleanup: () => void = () => {}
    await act(async () => {
      cleanup = await LoomSections.loadAndRenderOKF(container, 'http://localhost/okf', 'demo', {
        title: 'OKF Demo Topic',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('OKF Demo Topic')).toBeInTheDocument()
      expect(screen.getByText('Section 1 Title')).toBeInTheDocument()
      expect(screen.getByText('Content paragraph from OKF file.')).toBeInTheDocument()
    })

    cleanup()
    mockFetch.mockRestore()
  })

  it('renders in-memory OKF bundle using renderOKF without fetch', async () => {
    const bundle = [
      {
        meta: { type: 'openui', title: 'Offline Section Title', resource: '.' },
        data: { type: 'openui' as const, source: 'root = Stack([TextContent("Offline paragraph content without fetch.")])' },
        sectionFolder: 'sec-offline',
        sectionBody: '',
      },
    ]

    let cleanup: () => void = () => {}
    await act(async () => {
      cleanup = LoomSections.renderOKF(container, bundle, {
        title: 'Serverless Offline OKF',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Serverless Offline OKF')).toBeInTheDocument()
      expect(screen.getByText('Offline Section Title')).toBeInTheDocument()
      expect(screen.getByText('Offline paragraph content without fetch.')).toBeInTheDocument()
    })

    cleanup()
  })
})


