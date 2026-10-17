/**
 * AI assistant in Loom Viewer and Loom Studio (grill-log-ai-assistant.md),
 * against the mock OpenAI-compatible server in fixtures/: connect a
 * profile, pick a place, send it, and check what the request carried.
 */
import { test, expect, type Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'
// @ts-expect-error -- plain ES module fixture without type declarations
import { startMockOpenAI } from './fixtures/mock-openai-server.mjs'

interface MockServer {
  port: number
  close(): Promise<void>
}

const TOPIC = 'http-caching'
const TOPIC_DIR = path.join(process.cwd(), 'public/content', TOPIC)

function topicFiles(): Record<string, string> {
  const files: Record<string, string> = { 'topic.oui': fs.readFileSync(path.join(TOPIC_DIR, 'topic.oui'), 'utf8') }
  for (const f of fs.readdirSync(path.join(TOPIC_DIR, 'sections'))) {
    files[`sections/${f}`] = fs.readFileSync(path.join(TOPIC_DIR, 'sections', f), 'utf8')
  }
  return files
}

function topicText(): string {
  return [`// @loom-topic ${TOPIC}`, ...Object.entries(topicFiles()).map(([file, text]) => `// === ${file} ===\n${text}`)].join('\n')
}

let server: MockServer

test.beforeAll(async () => {
  server = await startMockOpenAI()
})
test.afterAll(async () => {
  await server.close()
})

/** Request bodies sent to the mock's chat endpoint. */
function captureChats(page: Page): Array<{ messages: Array<{ role: string; content: string }> }> {
  const bodies: Array<{ messages: Array<{ role: string; content: string }> }> = []
  page.on('request', (request) => {
    if (request.url().endsWith('/chat/completions')) bodies.push(JSON.parse(request.postData() ?? '{}'))
  })
  return bodies
}

async function connect(page: Page) {
  await page.getByTestId('ai-toggle').click()
  await page.getByTestId('ai-base-url').fill(`http://127.0.0.1:${server.port}/v1`)
  await page.getByTestId('ai-test').click()
  await expect(page.getByTestId('ai-test-result')).toContainText('Connected · 2 models')
  await page.getByTestId('ai-save').click()
  await expect(page.getByTestId('ai-panel')).toBeVisible()
}

test('Viewer: picks go to the model with their current source, and replies stream into the panel', async ({ page }) => {
  const chats = captureChats(page)
  await page.goto('/viewer.html')
  await page.evaluate((text) => {
    const data = new DataTransfer()
    data.setData('text/plain', text)
    document.body.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true }))
  }, topicText())
  await connect(page)

  const question = page.locator('[data-oui-file="sections/quiz.oui"][data-oui-anchor="q1"]').first()
  await question.scrollIntoViewIfNeeded()
  await question.click({ modifiers: ['Alt'], position: { x: 8, y: 8 } })
  await expect(page.getByTestId('pick-entry')).toHaveCount(1)
  // The panel's message box sends the picks with the message.
  await expect(page.getByTestId('ai-composer-picks')).toContainText('1 picked place')
  await page.getByTestId('ai-composer').fill('Is this question fair?')
  await page.getByTestId('ai-composer').press('Enter')

  const reply = page.getByTestId('ai-reply')
  await expect(reply).toHaveAttribute('data-status', 'done')
  await expect(reply).toContainText('Is this question fair?')
  await expect(page.getByTestId('ai-via')).toHaveText(`via 127.0.0.1:${server.port} · mock-large`)
  await expect(page.getByTestId('ai-chip')).toHaveCount(1)
  // The tray is empty again, ready for the next message.
  await expect(page.getByTestId('pick-entry')).toHaveCount(0)

  const [system, user] = chats[0].messages
  expect(system.role).toBe('system')
  expect(system.content).toContain('Loom Viewer is read-only')
  // The topic context goes with the user turn, so the system prompt stays cacheable.
  expect(system.content).not.toContain('### sections/quiz.oui')
  expect(user.content).toContain('### sections/quiz.oui: q1 (line')
  expect(user.content).toContain('QuizQuestion(id: string')
  expect(user.content).toContain('- sections/quiz.oui #q1')

  // A follow-up sends the thread, with the earlier turns exactly as before.
  await page.getByTestId('ai-composer').fill('Thanks')
  await page.getByTestId('ai-composer').press('Enter')
  await expect(page.getByTestId('ai-reply')).toHaveCount(2)
  await expect(page.getByTestId('ai-reply').nth(1)).toHaveAttribute('data-status', 'done')
  expect(chats[1].messages.map((m) => m.role)).toEqual(['system', 'user', 'assistant', 'user'])
  expect(chats[1].messages.slice(0, 2)).toEqual(chats[0].messages)
  expect(chats[1].messages[3].content).toBe('Thanks')

  // The thread survives a reload.
  await page.reload()
  await page.evaluate((text) => {
    const data = new DataTransfer()
    data.setData('text/plain', text)
    document.body.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true }))
  }, topicText())
  await page.getByTestId('ai-toggle').click()
  await expect(page.getByTestId('ai-reply')).toHaveCount(2)
})

test('Studio: the request carries unsaved edits', async ({ page }) => {
  const chats = captureChats(page)
  await page.goto('/studio.html')
  await page.evaluate(async (files) => {
    const root = await navigator.storage.getDirectory()
    await root.removeEntry('assistant-demo', { recursive: true }).catch(() => {})
    const dir = await root.getDirectoryHandle('assistant-demo', { create: true })
    for (const [rel, text] of Object.entries(files)) {
      const parts = rel.split('/')
      let d = dir
      for (const p of parts.slice(0, -1)) d = await d.getDirectoryHandle(p, { create: true })
      const w = await (await d.getFileHandle(parts[parts.length - 1], { create: true })).createWritable()
      await w.write(text)
      await w.close()
    }
    await (window as unknown as { __loomStudio: { openFolder(d: FileSystemDirectoryHandle): Promise<void> } }).__loomStudio.openFolder(dir)
  }, topicFiles())
  await expect(page.getByTestId('studio-workspace')).toBeVisible()
  await page.getByTestId('studio-section-quiz').click()

  // An unsaved edit at the top of the file.
  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+Home')
  await page.keyboard.type('// Draft note\n')
  await expect(page.getByTestId('studio-save')).toContainText('Save (1)')

  await connect(page)
  const root = page.locator('[data-testid="studio-preview"] [data-oui-anchor="root"]').first()
  await root.click({ modifiers: ['Alt'], position: { x: 4, y: 4 } })
  await expect(page.getByTestId('pick-entry')).toHaveCount(1)
  await page.getByTestId('pick-send').click()
  await expect(page.getByTestId('ai-reply')).toHaveAttribute('data-status', 'done')

  const [system, user] = chats[0].messages
  expect(system.content).toContain('inside Loom Studio')
  expect(user.content).toContain('### sections/quiz.oui (whole file) (unsaved edits)')
  expect(user.content).toContain('// Draft note')
})

test('Studio: a proposed edit is applied to the buffer, and Save writes it', async ({ page }) => {
  const chats = captureChats(page)
  await page.goto('/studio.html')
  await page.evaluate(async (files) => {
    const root = await navigator.storage.getDirectory()
    await root.removeEntry('assistant-edit', { recursive: true }).catch(() => {})
    const dir = await root.getDirectoryHandle('assistant-edit', { create: true })
    for (const [rel, text] of Object.entries(files)) {
      const parts = rel.split('/')
      let d = dir
      for (const p of parts.slice(0, -1)) d = await d.getDirectoryHandle(p, { create: true })
      const w = await (await d.getFileHandle(parts[parts.length - 1], { create: true })).createWritable()
      await w.write(text)
      await w.close()
    }
    await (window as unknown as { __loomStudio: { openFolder(d: FileSystemDirectoryHandle): Promise<void> } }).__loomStudio.openFolder(dir)
  }, topicFiles())
  await expect(page.getByTestId('studio-workspace')).toBeVisible()
  await connect(page)

  // The mock answers `REPLY<<…>>` with exactly that text: here, an edit to the quiz's hint.
  const hint = 'Shared caches are CDNs and proxies.'
  const proposal = [
    'I made the hint more concrete.',
    '',
    '```oui-edit file=sections/quiz.oui',
    `q1 = QuizQuestion("q1", "Which directive keeps a response out of a CDN but lets the browser cache it?", [QuizChoice("a", "private", true, "Correct."), QuizChoice("b", "no-store", false, "That stops the browser too.")], "${hint}")`,
    '```',
  ].join('\n')
  await page.getByTestId('ai-composer').fill(`REPLY<<${proposal}>>`)
  await page.getByTestId('ai-composer').press('Enter')

  const card = page.getByTestId('ai-edit')
  await expect(card).toBeVisible()
  await expect(page.getByTestId('ai-proposal')).toContainText('The edits apply and validate.')
  await expect(page.getByTestId('ai-edit-diff')).toContainText(hint)
  expect(chats).toHaveLength(1)
  expect(chats[0].messages[0].content).toContain('## Proposing Changes')

  await page.getByTestId('ai-edit-apply').click()
  await expect(card).toHaveAttribute('data-state', 'applied')
  await expect(page.getByTestId('studio-save')).toContainText('Save (1)')
  await expect(page.locator('.cm-content')).toContainText(hint)

  await page.getByTestId('studio-save').click()
  await expect(page.getByTestId('studio-save')).toContainText('Saved')
  const saved = await page.evaluate(async () => {
    const dir = await (await (await navigator.storage.getDirectory()).getDirectoryHandle('assistant-edit')).getDirectoryHandle('sections')
    return (await (await dir.getFileHandle('quiz.oui')).getFile()).text()
  })
  expect(saved).toContain(hint)
})

test('Studio: Apply all adds a new section and lists it in topic.oui, written on Save', async ({ page }) => {
  await page.goto('/studio.html')
  await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory()
    await root.removeEntry('assistant-create', { recursive: true }).catch(() => {})
    const dir = await root.getDirectoryHandle('assistant-create', { create: true })
    const write = async (d: FileSystemDirectoryHandle, name: string, text: string) => {
      const w = await (await d.getFileHandle(name, { create: true })).createWritable()
      await w.write(text)
      await w.close()
    }
    await write(dir, 'topic.oui', 'root = Topic("Create", "Demo", "A demo.", [SectionRef("intro")])\n')
    await write(await dir.getDirectoryHandle('sections', { create: true }), 'intro.oui', 'root = Text("Intro", ["Hello."])\n')
    await (window as unknown as { __loomStudio: { openFolder(d: FileSystemDirectoryHandle): Promise<void> } }).__loomStudio.openFolder(dir)
  })
  await expect(page.getByTestId('studio-workspace')).toBeVisible()
  await connect(page)

  const proposal = [
    'Added a summary section.',
    '',
    '```oui-edit file=topic.oui',
    'root = Topic("Create", "Demo", "A demo.", [SectionRef("intro"), SectionRef("summary")])',
    '```',
    '',
    '```oui-edit file=sections/summary.oui mode=create',
    'root = Text("Summary", ["That is all."])',
    '```',
  ].join('\n')
  await page.getByTestId('ai-composer').fill(`REPLY<<${proposal}>>`)
  await page.getByTestId('ai-composer').press('Enter')
  await expect(page.getByTestId('ai-edit')).toHaveCount(2)
  await expect(page.getByTestId('ai-proposal')).toContainText('The edits apply and validate.')

  await page.getByTestId('ai-edit-apply-all').click()
  await expect(page.locator('[data-testid="ai-edit"][data-state="applied"]')).toHaveCount(2)
  await expect(page.getByTestId('studio-section-summary')).toBeVisible()
  await expect(page.getByTestId('studio-save')).toContainText('Save (2)')

  await page.getByTestId('studio-save').click()
  await expect(page.getByTestId('studio-save')).toContainText('Saved')
  const saved = await page.evaluate(async () => {
    const dir = await (await navigator.storage.getDirectory()).getDirectoryHandle('assistant-create')
    const read = async (d: FileSystemDirectoryHandle, name: string) => (await (await d.getFileHandle(name)).getFile()).text()
    return { topic: await read(dir, 'topic.oui'), summary: await read(await dir.getDirectoryHandle('sections'), 'summary.oui') }
  })
  expect(saved.topic).toContain('SectionRef("summary")')
  expect(saved.summary).toContain('That is all.')
})
