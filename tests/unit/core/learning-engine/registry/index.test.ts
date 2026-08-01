import { describe, it, expect, beforeEach } from 'vitest'
import { SectionRegistry } from '../../../../../src/core/learning-engine/registry'
import type { ComponentType } from 'react'

const MockComponent: ComponentType<unknown> = () => null
const mockLoader = () => Promise.resolve({ default: MockComponent })

describe('SectionRegistry', () => {
  beforeEach(() => {
    SectionRegistry.clear()
  })

  it('registers a section type', () => {
    SectionRegistry.register('text', mockLoader)
    expect(SectionRegistry.get('text')).toBeDefined()
  })

  it('returns undefined for unregistered type', () => {
    expect(SectionRegistry.get('nonexistent')).toBeUndefined()
  })

  it('lists all registered section types', () => {
    SectionRegistry.register('text', mockLoader)
    SectionRegistry.register('bullets', mockLoader)
    const list = SectionRegistry.list()
    expect(list).toContain('text')
    expect(list).toContain('bullets')
    expect(list).toHaveLength(2)
  })

  it('overrides existing registration', () => {
    const AnotherComponent: ComponentType<unknown> = () => null
    const anotherLoader = () => Promise.resolve({ default: AnotherComponent })
    SectionRegistry.register('text', mockLoader)
    SectionRegistry.register('text', anotherLoader)
    expect(SectionRegistry.get('text')).toBeDefined()
  })

  it('clears all registrations', () => {
    SectionRegistry.register('text', mockLoader)
    SectionRegistry.clear()
    expect(SectionRegistry.list()).toHaveLength(0)
  })
})
