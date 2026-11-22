import { test, expect } from '@playwright/test'
import path from 'path'
import { existsSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import sirv from 'sirv'

test.describe('Static HTML OKF embed (Serverless & CDN)', () => {
  let server: Server
  let baseURL: string

  test.beforeAll(async () => {
    if (!existsSync(path.resolve(process.cwd(), 'dist-lib/loom-sections.umd.js'))) {
      throw new Error('Build the local embed bundle first: npm run build:lib')
    }
    server = createServer(sirv(process.cwd(), { dev: true }))
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Static server failed to start')
    baseURL = `http://127.0.0.1:${address.port}`
  })

  test.afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  })

  test.beforeEach(async ({ page }) => {
    // Exercise the local build rather than relying on a live third-party CDN.
    await page.route('https://cdn.jsdelivr.net/**', (route) => route.abort())
  })
  test('renders OKF sections read-only when served over HTTP server', async ({ page }) => {
    await page.goto(`${baseURL}/test-okf-static/index.html`)

    await expect(page.locator('.topnav-title')).toHaveText('Learning OS')
    await expect(page.locator('#loom-root')).toContainText('Introduction')

    await expect(page.locator('[data-testid^="edit-section-toggle"]')).toHaveCount(0)
  })
})
