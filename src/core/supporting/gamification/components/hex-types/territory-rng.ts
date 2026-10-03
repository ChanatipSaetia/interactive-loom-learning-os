/**
 * Deterministic seeded PRNG for procedural hex territory layouts.
 *
 * Seeded from the node id so every hex instance renders a unique city /
 * grove / yard, while re-renders of the same node stay perfectly stable.
 */

export interface TerritoryRng {
  next(): number
  range(min: number, max: number): number
  int(min: number, max: number): number
  pick<T>(items: readonly T[]): T
  sign(): number
  jitter(value: number, spread: number): number
  bool(chance?: number): boolean
}

export function createTerritoryRng(seedKey: string): TerritoryRng {
  let h = 2166136261
  for (let i = 0; i < seedKey.length; i++) {
    h ^= seedKey.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let s = h >>> 0

  const next = () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (items) => items[Math.floor(next() * items.length) % items.length],
    sign: () => (next() < 0.5 ? -1 : 1),
    jitter: (value, spread) => value + (next() * 2 - 1) * spread,
    bool: (chance = 0.5) => next() < chance,
  }
}

/** Jittered ring angle: follows the ring rhythm but not perfectly evenly. */
export function ringAngle(rng: TerritoryRng, i: number, count: number, a0: number, wobble = 0.18) {
  return a0 + (i * Math.PI * 2) / count + (rng.next() * 2 - 1) * ((Math.PI * 2) / count) * wobble
}

/** Nature-consistent size multiplier. */
export function sizeScale(rng: TerritoryRng, min = 0.85, max = 1.15) {
  return rng.range(min, max)
}
