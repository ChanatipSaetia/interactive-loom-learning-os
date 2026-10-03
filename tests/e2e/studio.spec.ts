/**
 * Loom Studio end to end, against a real FileSystemDirectoryHandle from the
 * origin-private file system (the native folder picker cannot be automated).
 */
import { test, expect, type Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const TOPIC_DIR = path.join(process.cwd(), 'public/content/mtls')

function topicFiles(): Record<string, string> {
  const files: Record<string, string> = { 'topic.oui': fs.readFileSync(path.join(TOPIC_DIR, 'topic.oui'), 'utf8') }
  for (const f of fs.readdirSync(path.join(TOPIC_DIR, 'sections'))) {
    files[`sections/${f}`] = fs.readFileSync(path.join(TOPIC_DIR, 'sections', f), 'utf8')
  }
  return files
}

async function openOpfsTopic(page: Page, name: string, files: Record<string, string>) {
  await page.evaluate(async ({ name, files }) => {
    const root = await navigator.storage.getDirectory()
    await root.removeEntry(name, { recursive: true }).catch(() => {})
    const dir = await root.getDirectoryHandle(name, { create: true })
    for (const [rel, text] of Object.entries(files)) {
      const parts = rel.split('/')
      let d = dir
      for (const p of parts.slice(0, -1)) d = await d.getDirectoryHandle(p, { create: true })
      const w = await (await d.getFileHandle(parts[parts.length - 1], { create: true })).createWritable()
      await w.write(text)
      await w.close()
    }
    await window.__loomStudio!.openFolder(dir)
  }, { name, files })
  await expect(page.getByTestId('studio-workspace')).toBeVisible()
}

function readOpfs(page: Page, name: string, rel: string) {
  return page.evaluate(async ({ name, rel }) => {
    let d = await (await navigator.storage.getDirectory()).getDirectoryHandle(name)
    const parts = rel.split('/')
    for (const p of parts.slice(0, -1)) d = await d.getDirectoryHandle(p)
    try {
      return await (await (await d.getFileHandle(parts[parts.length - 1])).getFile()).text()
    } catch {
      return null
    }
  }, { name, rel })
}

test.describe('Loom Studio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/studio.html')
    await expect(page.getByTestId('studio-open-folder')).toBeVisible()
  })

  test('edits, saves and restructures a topic folder', async ({ page }) => {
    await openOpfsTopic(page, 'mtls', topicFiles())
    await expect(page.locator('[data-testid="studio-preview"] .section-wrapper')).toBeVisible()

    // Code edit, saved exactly as typed.
    await page.locator('.cm-content').click()
    await page.keyboard.press('Control+Home')
    await page.keyboard.type('// Edited in Loom Studio\n')
    await expect(page.getByTestId('studio-save')).toContainText('Save (1)')
    await page.keyboard.press('Control+s')
    await expect(page.getByTestId('studio-save')).toContainText('Saved')
    expect(await readOpfs(page, 'mtls', 'sections/pillar-layer.oui')).toMatch(/^\/\/ Edited in Loom Studio\n/)

    // Add a section from a template.
    await page.getByTestId('studio-add-section').click()
    await page.getByTestId('studio-template-quiz').click()
    await page.getByTestId('studio-add-title').fill('Final Check')
    await page.getByTestId('studio-confirm').click()
    await expect(page.locator('[data-testid="studio-preview"] .section-wrapper[data-section-type="quiz"]')).toBeVisible()
    expect(await readOpfs(page, 'mtls', 'topic.oui')).toContain('SectionRef("final-check")')

    // Rename, then delete.
    await page.getByLabel('Rename final-check').click()
    await page.getByTestId('studio-rename-input').fill('wrap-up')
    await page.getByTestId('studio-confirm').click()
    await expect(page.getByTestId('studio-section-wrap-up')).toBeVisible()
    expect(await readOpfs(page, 'mtls', 'sections/final-check.oui')).toBeNull()
    await page.getByLabel('Delete wrap-up').click()
    await page.getByTestId('studio-confirm').click()
    await expect(page.getByTestId('studio-section-wrap-up')).toHaveCount(0)
    expect(await readOpfs(page, 'mtls', 'sections/wrap-up.oui')).toBeNull()
  })

  test('starts a new topic in an empty folder', async ({ page }) => {
    await openOpfsTopic(page, 'fresh-topic', {})
    await expect(page.getByTestId('studio-topic-title')).toHaveValue('Fresh Topic')
    expect(await readOpfs(page, 'fresh-topic', 'topic.oui')).toContain('root = Topic(')
  })
})
