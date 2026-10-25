/**
 * Learner memory inside a chat (decision 186): the app hands its events to the
 * server's `record_events`, which the local server writes to the learner's
 * memory folder. A server without one (a hosted endpoint without sign-in) has
 * no such tool; the events then stay with the page, and Open in Viewer is the
 * way to keep them.
 */
import type { App } from '@modelcontextprotocol/ext-apps'
import { memoryAdapter, type LearnerMemoryPort } from '../core/supporting/learner-progress'

export function appMemoryAdapter(app: App, onUnavailable: () => void): LearnerMemoryPort {
  const page = memoryAdapter()
  let available = true
  return {
    async append(events) {
      await page.append(events)
      if (!available) return
      try {
        const result = await app.callServerTool({ name: 'record_events', arguments: { events } })
        if (result.isError) throw new Error('record_events failed')
      } catch {
        available = false
        onUnavailable()
      }
    },
    readAll: () => page.readAll(),
  }
}
