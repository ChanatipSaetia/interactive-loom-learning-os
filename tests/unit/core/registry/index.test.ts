import { describe, it, expect, beforeEach } from 'vitest'
import { SectionRegistry } from '../../../../src/core/registry'
import type { ComponentType } from 'react'

const MockComponent: ComponentType<unknown> = () => null

describe('SectionRegistry', () => {
  beforeEach(() => {
    SectionRegistry.clear()
  })

  it('registers a section type', () => {
    SectionRegistry.register('text', MockComponent)
    expect(SectionRegistry.get('text')).toBe(MockComponent)
  })

  it('returns undefined for unregistered type', () => {
    expect(SectionRegistry.get('nonexistent')).toBeUndefined()
  })

  it('lists all registered section types', () => {
    SectionRegistry.register('text', MockComponent)
    SectionRegistry.register('bullets', MockComponent)
    const list = SectionRegistry.list()
    expect(list).toContain('text')
    expect(list).toContain('bullets')
    expect(list).toHaveLength(2)
  })

  it('overrides existing registration', () => {
    const AnotherComponent: ComponentType<unknown> = () => null
    SectionRegistry.register('text', MockComponent)
    SectionRegistry.register('text', AnotherComponent)
    expect(SectionRegistry.get('text')).toBe(AnotherComponent)
  })

  it('clears all registrations', () => {
    SectionRegistry.register('text', MockComponent)
    SectionRegistry.clear()
    expect(SectionRegistry.list()).toHaveLength(0)
  })
})
