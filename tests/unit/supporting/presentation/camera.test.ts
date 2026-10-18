import { describe, it, expect } from 'vitest'
import {
  STAGE_LANDSCAPE,
  cameraTransform,
  cellOf,
  overviewCamera,
  regionAt,
  regionCamera,
  regionOrigin,
  worldSize,
} from '../../../../src/core/supporting/presentation/camera'

const S = STAGE_LANDSCAPE

describe('present camera', () => {
  it('lays regions out in a snake so neighbours stay adjacent', () => {
    expect([0, 1, 2, 3, 4, 5, 7].map((i) => cellOf(i))).toEqual([
      { col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 },
      { col: 3, row: 1 }, { col: 2, row: 1 }, { col: 0, row: 1 },
    ])
  })

  it('sizes the world to the regions it holds', () => {
    expect(worldSize(2, S)).toEqual({ w: 2 * 1200 + 180, h: 675 })
    expect(worldSize(9, S)).toEqual({ w: 4 * 1200 + 3 * 180, h: 3 * 675 + 2 * 180 })
  })

  it('centres a region, and leans toward a point without showing past its edges', () => {
    const o = regionOrigin(1, S)
    expect(regionCamera(1, S)).toEqual({ x: o.x + 600, y: o.y + 337.5, z: 1 })
    const leaned = regionCamera(1, S, { x: 1200, y: 337.5, z: 1.06 })
    expect(leaned.z).toBe(1.06)
    expect(leaned.x).toBeLessThanOrEqual(o.x + 1200 - 600 / 1.06 + 1e-9)
    expect(leaned.x).toBeGreaterThan(o.x + 600)
    expect(regionCamera(0, S, { x: 0, y: 0, z: 3 }).z).toBe(1.15)
  })

  it('fits every region in the overview', () => {
    const c = overviewCamera(9, S)
    const w = worldSize(9, S)
    expect(w.w * c.z).toBeLessThanOrEqual(S.w)
    expect(w.h * c.z).toBeLessThanOrEqual(S.h)
  })

  it('turns a camera into a transform and finds the region under a point', () => {
    expect(cameraTransform({ x: 600, y: 337.5, z: 1 }, S)).toBe('translate(0px, 0px) scale(1)')
    const o = regionOrigin(5, S)
    expect(regionAt({ x: o.x + 10, y: o.y + 10 }, 9, S)).toBe(5)
    expect(regionAt({ x: -5, y: 0 }, 9, S)).toBe(-1)
  })
})
