import { describe, it, expect, beforeEach } from 'vitest'
import { TopicRegistry } from '../../../../src/core/topic-registry'
import type { ComponentType } from 'react'

const MockComponent: ComponentType = () => null

describe('TopicRegistry', () => {
  beforeEach(() => {
    TopicRegistry.clear()
  })

  it('registers a topic', () => {
    TopicRegistry.register('demo', MockComponent)
    expect(TopicRegistry.get('demo')).toBe(MockComponent)
  })

  it('returns undefined for unregistered topic', () => {
    expect(TopicRegistry.get('nonexistent')).toBeUndefined()
  })

  it('lists all registered topics', () => {
    TopicRegistry.register('demo', MockComponent)
    TopicRegistry.register('another', MockComponent)
    const list = TopicRegistry.list()
    expect(list).toContain('demo')
    expect(list).toContain('another')
    expect(list).toHaveLength(2)
  })

  it('overrides existing registration', () => {
    const AnotherComponent: ComponentType = () => null
    TopicRegistry.register('demo', MockComponent)
    TopicRegistry.register('demo', AnotherComponent)
    expect(TopicRegistry.get('demo')).toBe(AnotherComponent)
  })

  it('clears all registrations', () => {
    TopicRegistry.register('demo', MockComponent)
    TopicRegistry.clear()
    expect(TopicRegistry.list()).toHaveLength(0)
  })
})
