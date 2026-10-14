/**
 * Loom Viewer Refresh, against real File System Access handles from the
 * origin-private file system (the native pickers are stubbed to return them).
 */
import { test, expect, type Page } from '@playwright/test'

async function writeOpfs(page: Page, files: Record<string, string>) {
  await page.evaluate(async (files) => {
    const root = await navigator.storage.getDirectory()
    for (const [rel, text] of Object.entries(files)) {
      const parts = rel.split('/')
      let d = root
      for (const p of parts.slice(0, -1)) d = await d.getDirectoryHandle(p, { create: true })
      const w = await (await d.getFileHandle(parts[parts.length - 1], { create: true })).createWritable()
      await w.write(text)
      await w.close()
    }
  }, files)
}

const topicFile = (title: string) => `root = Topic("${title}", "Demo", "", [SectionRef("intro")])\n`

test.describe('Loom Viewer refresh', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/viewer.html')
    await page.evaluate(async () => {
      const root = await navigator.storage.getDirectory()
      await root.removeEntry('refresh-topic', { recursive: true }).catch(() => {})
      await root.removeEntry('refresh.loom.oui').catch(() => {})
    })
  })

  test('reloads a picked folder after its files change', async ({ page }) => {
    await writeOpfs(page, {
      'refresh-topic/topic.oui': topicFile('Before'),
      'refresh-topic/sections/intro.oui': 'root = Text("Intro", ["First draft."])\n',
    })
    await page.evaluate(() => {
      Object.assign(window, {
        showDirectoryPicker: async () => (await navigator.storage.getDirectory()).getDirectoryHandle('refresh-topic'),
      })
    })
    await page.getByTestId('viewer-open-folder').click()
    await expect(page.getByRole('heading', { level: 2 })).toHaveText('Before')
    await expect(page.getByTestId('viewer-topic')).toContainText('First draft.')

    await writeOpfs(page, {
      'refresh-topic/topic.oui': topicFile('After'),
      'refresh-topic/sections/intro.oui': 'root = Text("Intro", ["Second draft."])\n',
    })
    await page.getByTestId('viewer-refresh').click()
    await expect(page.getByRole('heading', { level: 2 })).toHaveText('After')
    await expect(page.getByTestId('viewer-topic')).toContainText('Second draft.')
    await expect(page.getByTestId('viewer-status')).toHaveText('Refreshed')
  })

  test('reloads a picked .loom.oui file after it changes', async ({ page }) => {
    const source = (title: string) => `// @loom-topic refresh\n// === topic.oui ===\n${topicFile(title)}// === sections/intro.oui ===\nroot = Text("Intro", ["Hello."])\n`
    await writeOpfs(page, { 'refresh.loom.oui': source('Old Title') })
    await page.evaluate(() => {
      Object.assign(window, {
        showOpenFilePicker: async () => [await (await navigator.storage.getDirectory()).getFileHandle('refresh.loom.oui')],
      })
    })
    await page.getByTestId('viewer-open-file').click()
    await expect(page.getByRole('heading', { level: 2 })).toHaveText('Old Title')

    await writeOpfs(page, { 'refresh.loom.oui': source('New Title') })
    await page.getByTestId('viewer-refresh').click()
    await expect(page.getByRole('heading', { level: 2 })).toHaveText('New Title')
  })
})
