import { describe, it, expect, vi } from 'vitest'
import { Container, Ticker } from 'pixi.js'
import { HeroAgent } from '../../../../../src/core/supporting/gamification/components/hero-agent'
import { axialToPixel } from '../../../../../src/core/supporting/gamification/components/hex-geometry'
import { getGamificationThemePalette } from '../../../../../src/core/supporting/gamification/theme-palette'

const palette = getGamificationThemePalette()

function makeHero(nodeId: string | null = 'capital', q = 0, r = 0) {
  return new HeroAgent({ palette, currentNodeId: nodeId, coord: { q, r } })
}

/** Stub ticker capturing the hero's tick callback so tests can advance frames. */
function makeStubTicker() {
  let cb: (() => void) | null = null
  const stub = {
    add: (fn: () => void) => {
      cb = fn
    },
    remove: () => {
      cb = null
    },
  } as unknown as Ticker
  return { stub, fire: () => cb?.() }
}

describe('HeroAgent', () => {
  it('spawns at its initial node pixel position with top z-index', () => {
    const hero = makeHero('capital', 1, -1)
    const pos = axialToPixel(1, -1, 0, 0)
    expect(hero.container.position.x).toBeCloseTo(pos.x)
    expect(hero.container.position.y).toBeCloseTo(pos.y)
    expect(hero.container.zIndex).toBe(999)
    expect(hero.nodeId).toBe('capital')
    expect(hero.isWalking).toBe(false)
    hero.destroy()
  })

  it('attachTo survives a map container removeChildren() rebuild', () => {
    const map = new Container()
    const hero = makeHero()
    map.addChild(hero.container)
    map.removeChildren()
    expect(map.children).toHaveLength(0)

    hero.attachTo(map)
    expect(map.children).toContain(hero.container)
    expect(hero.container.destroyed).toBe(false)
    hero.destroy()
  })

  it('moveTo teleports the hero and updates its current node', () => {
    const hero = makeHero('capital')
    hero.moveTo('sanctuary_1', { q: 2, r: 0 })
    const pos = axialToPixel(2, 0, 0, 0)
    expect(hero.container.position.x).toBeCloseTo(pos.x)
    expect(hero.container.position.y).toBeCloseTo(pos.y)
    expect(hero.nodeId).toBe('sanctuary_1')
    hero.destroy()
  })

  it('walkTo follows the bezier arc and ends at the target hex', () => {
    const hero = makeHero('node_a', 0, 0)
    const { stub, fire } = makeStubTicker()
    hero.attachTicker(stub)
    const onComplete = vi.fn()

    hero.walkTo({
      nodeId: 'node_b',
      coord: { q: 2, r: 0 },
      connections: [{ fromId: 'node_a', toId: 'node_b' }],
      duration: 1000,
      onComplete,
    })
    expect(hero.isWalking).toBe(true)

    const start = axialToPixel(0, 0, 0, 0)
    const end = axialToPixel(2, 0, 0, 0)
    let midSample: { x: number; y: number } | null = null

    let fake = performance.now()
    vi.stubGlobal('performance', { now: () => fake })
    try {
      for (let i = 0; i <= 12; i++) {
        fake += 100
        fire()
        if (i === 5) midSample = { x: hero.container.position.x, y: hero.container.position.y }
      }
    } finally {
      vi.unstubAllGlobals()
    }

    // Walk completed and the hero stays at the target hex (does not disappear)
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(hero.isWalking).toBe(false)
    expect(hero.nodeId).toBe('node_b')
    expect(hero.container.destroyed).toBe(false)
    expect(hero.container.position.x).toBeCloseTo(end.x)
    expect(hero.container.position.y).toBeCloseTo(end.y)

    // Mid-walk sample left the straight chord (arc curvature, not a linear slide)
    expect(midSample).not.toBeNull()
    const s = midSample as { x: number; y: number }
    const chordY = start.y + ((end.y - start.y) * (s.x - start.x)) / (end.x - start.x)
    expect(Math.abs(s.y - chordY)).toBeGreaterThan(1)
    hero.destroy()
  })

  it('ignores a second walk while one is in flight', () => {
    const hero = makeHero('node_a', 0, 0)
    const { stub, fire } = makeStubTicker()
    hero.attachTicker(stub)
    const first = vi.fn()
    const second = vi.fn()

    hero.walkTo({ nodeId: 'node_b', coord: { q: 2, r: 0 }, connections: [], duration: 500, onComplete: first })
    hero.walkTo({ nodeId: 'node_c', coord: { q: 4, r: 0 }, connections: [], duration: 500, onComplete: second })
    expect(second).not.toHaveBeenCalled()

    const fake = performance.now() + 10_000
    vi.stubGlobal('performance', { now: () => fake })
    try {
      fire()
    } finally {
      vi.unstubAllGlobals()
    }
    expect(first).toHaveBeenCalledTimes(1)
    expect(hero.nodeId).toBe('node_b')
    hero.destroy()
  })

  it('immediately completes a walk to the hex the hero already stands on', () => {
    const hero = makeHero('node_a', 1, 1)
    const onComplete = vi.fn()
    hero.walkTo({ nodeId: 'node_a_again', coord: { q: 1, r: 1 }, connections: [], onComplete })
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(hero.isWalking).toBe(false)
    expect(hero.nodeId).toBe('node_a_again')
    hero.destroy()
  })
})
