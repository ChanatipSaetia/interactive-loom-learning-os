import { describe, it, expect } from 'vitest'
import type {
  ProgressiveContentEvents,
  CategorySelected,
  GalleryItemViewed,
} from '../../../../../src/core/subdomains/progressive-content/events'

describe('ProgressiveContentEvents', () => {
  it('CategorySelected has correct structure', () => {
    const event: CategorySelected = {
      type: 'CategorySelected',
      categoryTitle: 'Microservices',
      categoryIndex: 2,
      timestamp: Date.now(),
    }
    expect(event.type).toBe('CategorySelected')
    expect(event.categoryTitle).toBe('Microservices')
    expect(event.categoryIndex).toBe(2)
    const unionEvent: ProgressiveContentEvents = event
    expect(unionEvent.type).toBe('CategorySelected')
  })

  it('GalleryItemViewed has correct structure', () => {
    const event: GalleryItemViewed = {
      type: 'GalleryItemViewed',
      itemId: 'img-1',
      itemIndex: 0,
      caption: 'System Architecture Diagram',
      timestamp: Date.now(),
    }
    expect(event.type).toBe('GalleryItemViewed')
    expect(event.itemId).toBe('img-1')
    expect(event.itemIndex).toBe(0)
    expect(event.caption).toBe('System Architecture Diagram')
    const unionEvent: ProgressiveContentEvents = event
    expect(unionEvent.type).toBe('GalleryItemViewed')
  })
})
