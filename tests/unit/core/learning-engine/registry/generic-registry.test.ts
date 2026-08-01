import { describe, it, expect, beforeEach } from 'vitest'
import { Registry } from '../../../../../src/core/learning-engine/registry/generic-registry'

describe('Registry (generic)', () => {
  let registry: Registry<string>

  beforeEach(() => {
    registry = new Registry()
  })

  it('registers a value', () => {
    registry.register('key', 'value')
    expect(registry.get('key')).toBe('value')
  })

  it('returns undefined for unregistered key', () => {
    expect(registry.get('missing')).toBeUndefined()
  })

  it('lists all registered keys', () => {
    registry.register('a', 'one')
    registry.register('b', 'two')
    const list = registry.list()
    expect(list).toContain('a')
    expect(list).toContain('b')
    expect(list).toHaveLength(2)
  })

  it('overrides existing registration', () => {
    registry.register('key', 'first')
    registry.register('key', 'second')
    expect(registry.get('key')).toBe('second')
  })

  it('clears all registrations', () => {
    registry.register('key', 'value')
    registry.clear()
    expect(registry.list()).toHaveLength(0)
    expect(registry.get('key')).toBeUndefined()
  })

  it('supports complex value types', () => {
    const obj = { nested: { deep: true } }
    const registryObj = new Registry<{ nested: { deep: boolean } }>()
    registryObj.register('complex', obj)
    expect(registryObj.get('complex')).toBe(obj)
    expect(registryObj.get('complex')?.nested.deep).toBe(true)
  })
})
