import { describe, it, expect } from 'vitest'
import { routes } from '../../../src/core/routes'

describe('routes', () => {
  it('exports a non-empty array of topic routes', () => {
    expect(Array.isArray(routes)).toBe(true)
    expect(routes.length).toBeGreaterThan(0)
  })

  it('each route has required fields', () => {
    for (const route of routes) {
      expect(route.id).toBeDefined()
      expect(route.label).toBeDefined()
      expect(route.path).toBeDefined()
      expect(route.category).toBeDefined()
      expect(route.description).toBeDefined()
      expect(Array.isArray(route.sections)).toBe(true)
    }
  })

  it('demo route has correct path', () => {
    const demo = routes.find((r) => r.id === 'demo')
    expect(demo).toBeDefined()
    expect(demo?.path).toBe('/demo/ai-agent')
  })
})
