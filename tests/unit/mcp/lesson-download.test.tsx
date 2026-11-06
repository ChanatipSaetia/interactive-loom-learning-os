import { act, fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import type { App } from '@modelcontextprotocol/ext-apps'
import { McpApp } from '../../../src/mcp-app/McpApp'
import { downloadLesson, lessonFileName } from '../../../src/mcp-app/lesson-download'
import { copyText } from '../../../src/core/ui-system/clipboard'
import { THREE_SPLINE_OUI } from '../../fixtures/ai-experience/three-spline'

vi.mock('../../../src/core/ui-system/clipboard', () => ({ copyText: vi.fn(async () => true) }))
afterEach(() => { cleanup(); vi.clearAllMocks() })
const source = THREE_SPLINE_OUI + '\r\n// Preserve comments and Unicode: กล้อง 🎥\r\n'
const host = (supported = true) => ({
  getHostCapabilities: vi.fn(() => supported ? { downloadFile: {} } : {}),
  downloadFile: vi.fn(async (_params: Parameters<App['downloadFile']>[0]): Promise<{ isError?: boolean }> => ({})),
  getHostContext: vi.fn(() => ({})), connect: vi.fn(async () => {}),
  updateModelContext: vi.fn(async () => ({})), sendMessage: vi.fn(async () => ({})),
  callServerTool: vi.fn(async () => ({ isError: true })),
})

it('passes the exact source including narration, comments, Unicode and line endings through host download', async () => {
  const app = host()
  expect(await downloadLesson(app as unknown as App, source, '../3D lesson')).toBe('requested')
  expect(app.downloadFile).toHaveBeenCalledWith({ contents: [{ type: 'resource', resource: { uri: 'file:///3D-lesson.loom.oui', mimeType: 'text/plain', text: source } }] })
})

it('normalizes only the filename and provides a safe fallback', () => {
  expect(lessonFileName('../../')).toBe('lesson.loom.oui')
  expect(lessonFileName()).toBe('lesson.loom.oui')
  expect(lessonFileName('a'.repeat(300))).toBe('a'.repeat(80) + '.loom.oui')
})

it('does not request unsupported downloads', async () => {
  const app = host(false)
  expect(await downloadLesson(app as unknown as App, source)).toBe('unsupported')
  expect(app.downloadFile).not.toHaveBeenCalled()
})

it.each(['denied', 'disconnected'])('does not claim a successful download when %s', async (reason) => {
  const app = host()
  if (reason === 'denied') app.downloadFile.mockResolvedValue({ isError: true })
  else app.downloadFile.mockRejectedValue(new Error('disconnected'))
  expect(await downloadLesson(app as unknown as App, source)).toBe('failed')
  expect(app.downloadFile).toHaveBeenCalledTimes(1)
})

async function show(app: ReturnType<typeof host>, oui: string, result = false) {
  const api = app as unknown as App
  await act(async () => {
    if (result) await api.ontoolresult?.({ content: [], structuredContent: { oui } })
    else await api.ontoolinput?.({ arguments: { oui } })
  })
}

it('exports the current source after a show_topic replacement or an open_topic result', async () => {
  const app = host()
  render(<McpApp app={app as unknown as App} />)
  await show(app, source)
  fireEvent.click(screen.getByRole('button', { name: 'Download lesson' }))
  await waitFor(() => expect(app.downloadFile).toHaveBeenCalledTimes(1))
  expect(app.downloadFile.mock.calls[0][0]).toMatchObject({ contents: [{ resource: { text: source } }] })
  const changed = source.replace('Objects need a viewpoint', 'A revised viewpoint')
  await show(app, changed, true)
  fireEvent.click(screen.getByRole('button', { name: 'Download lesson' }))
  await waitFor(() => expect(app.downloadFile).toHaveBeenCalledTimes(2))
  expect(app.downloadFile.mock.calls[1][0]).toMatchObject({ contents: [{ resource: { text: changed } }] })
  expect(app.sendMessage).not.toHaveBeenCalled()
})

it('offers exact-source copying when the host lacks downloads, including for invalid source', async () => {
  const app = host(false)
  render(<McpApp app={app as unknown as App} />)
  const invalid = '// @loom-topic repair-me\r\nnot a valid lesson 🎥'
  await show(app, invalid)
  fireEvent.click(screen.getByRole('button', { name: 'Download lesson' }))
  expect(await screen.findByText(/This chat does not support file downloads/)).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Copy lesson source' }))
  await waitFor(() => expect(copyText).toHaveBeenCalledWith(invalid))
  expect(app.downloadFile).not.toHaveBeenCalled()
  expect(app.sendMessage).not.toHaveBeenCalled()
})
