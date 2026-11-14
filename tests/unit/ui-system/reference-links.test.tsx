import { useRef } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useReferenceLinks } from '../../../src/core/ui-system/primitives/reference-links'

function Example({ href = 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview', title = 'Requests, responses and headers', label = 'MDN HTTP overview' }) {
  const root = useRef<HTMLDivElement>(null)
  const preview = useReferenceLinks(root, href)
  return <><div ref={root}><a href={href} title={title}>{label}</a><a href="#next">Next section</a><a href="mailto:help@example.com">Email</a><button>Next activity</button></div>{preview}</>
}

afterEach(() => vi.useRealTimers())

it('styles an external reference and shows authored details without fetching', () => {
  const fetch = vi.spyOn(globalThis, 'fetch')
  render(<Example />)
  const link = screen.getByRole('link', { name: 'MDN HTTP overview' })
  expect(link).toHaveClass('loom-reference-link')
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  fireEvent.mouseOver(link)
  expect(screen.getByRole('dialog', { name: 'Reference: MDN HTTP overview' })).toBeInTheDocument()
  expect(screen.getByText('Requests, responses and headers')).toBeInTheDocument()
  expect(screen.getByText('External website')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Open reference' })).toHaveAttribute('href', link.getAttribute('href'))
  expect(fetch).not.toHaveBeenCalled()
  fetch.mockRestore()
})

it('supports focus, entering the preview, returning, and dismissing with Escape', () => {
  render(<Example />)
  const link = screen.getByRole('link', { name: 'MDN HTTP overview' })
  act(() => link.focus())
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  fireEvent.keyDown(link, { key: 'Tab' })
  const open = screen.getByRole('link', { name: 'Open reference' })
  expect(open).toHaveFocus()
  fireEvent.keyDown(open, { key: 'Tab', shiftKey: true })
  expect(link).toHaveFocus()
  fireEvent.keyDown(link, { key: 'Escape' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(link).not.toHaveAttribute('aria-controls')
})

it('keeps the preview open while hovered and closes after leaving both regions', () => {
  vi.useFakeTimers()
  render(<Example />)
  const link = screen.getByRole('link', { name: 'MDN HTTP overview' })
  fireEvent.mouseOver(link)
  fireEvent.mouseOut(link)
  fireEvent.mouseEnter(screen.getByRole('dialog'))
  act(() => vi.advanceTimersByTime(250))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  fireEvent.mouseLeave(screen.getByRole('dialog'))
  act(() => vi.advanceTimersByTime(250))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('leaves fragment, mail and unsafe schemes alone and never renders descriptions as HTML', () => {
  const { rerender } = render(<Example title={'<img src=x onerror=alert(1)>'} />)
  fireEvent.mouseOver(screen.getByRole('link', { name: 'MDN HTTP overview' }))
  expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
  expect(screen.getByRole('dialog').querySelector('img')).toBeNull()
  expect(screen.getByRole('link', { name: 'Next section' })).not.toHaveClass('loom-reference-link')
  expect(screen.getByRole('link', { name: 'Email' })).not.toHaveClass('loom-reference-link')
  rerender(<Example href="data:text/html,hello" />)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'MDN HTTP overview' })).not.toHaveClass('loom-reference-link')
})

it('enhances links added after rendering and dismisses removed references', async () => {
  const { container } = render(<Example />)
  const root = container.firstElementChild!
  const link = document.createElement('a')
  link.href = 'https://svelte.dev/docs'
  link.textContent = 'Svelte docs'
  act(() => root.append(link))
  await waitFor(() => expect(link).toHaveClass('loom-reference-link'))
  fireEvent.mouseOver(link)
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  act(() => link.remove())
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})

it('dismisses with Escape before the presentation handler and restores focus', () => {
  render(<Example />)
  const exitPresentation = vi.fn()
  window.addEventListener('keydown', exitPresentation)
  const link = screen.getByRole('link', { name: 'MDN HTTP overview' })
  act(() => link.focus())
  fireEvent.keyDown(link, { key: 'Tab' })
  exitPresentation.mockClear()
  fireEvent.keyDown(screen.getByRole('link', { name: 'Open reference' }), { key: 'Escape' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(link).toHaveFocus()
  expect(exitPresentation).not.toHaveBeenCalled()
  window.removeEventListener('keydown', exitPresentation)
})

it('updates active metadata and removes external behavior when a destination changes', async () => {
  render(<Example />)
  const link = screen.getByRole('link', { name: 'MDN HTTP overview' })
  fireEvent.mouseOver(link)
  act(() => { link.setAttribute('title', 'Updated explanation'); link.setAttribute('href', '/guide') })
  await waitFor(() => expect(screen.getByText('Updated explanation')).toBeInTheDocument())
  expect(link).not.toHaveAttribute('target')
  expect(screen.getByRole('link', { name: 'Open reference' })).not.toHaveAttribute('target')
  expect(screen.queryByText('External website')).not.toBeInTheDocument()
})
