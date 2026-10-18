/**
 * Camera geometry for the Present stage (decision 75): sections are regions on one canvas, laid out
 * in a snake of `COLUMNS` columns so the camera only ever moves to a neighbour. Pure; units are the
 * stage's own unscaled pixels.
 */

export interface Size {
  w: number
  h: number
}

export interface Camera {
  /** Point of the world at the centre of the stage. */
  x: number
  y: number
  z: number
}

export const STAGE_LANDSCAPE: Size = { w: 1200, h: 675 }
export const STAGE_PORTRAIT: Size = { w: 600, h: 960 }
export const COLUMNS = 4
/** Stage widths below this (in screen pixels) use the portrait stage. */
export const PORTRAIT_BELOW = 640
/** Largest zoom when the camera leans toward the action (decision 75). */
export const MAX_LEAN_ZOOM = 1.15

export const gapFor = (stage: Size) => (stage.w < stage.h ? 120 : 180)

/** Grid cell of region `index`: rows run left to right, then right to left. */
export function cellOf(index: number, columns = COLUMNS): { col: number; row: number } {
  const row = Math.floor(index / columns)
  const c = index % columns
  return { col: row % 2 ? columns - 1 - c : c, row }
}

export function regionOrigin(index: number, stage: Size, columns = COLUMNS): { x: number; y: number } {
  const { col, row } = cellOf(index, columns)
  const gap = gapFor(stage)
  return { x: col * (stage.w + gap), y: row * (stage.h + gap) }
}

export function worldSize(count: number, stage: Size, columns = COLUMNS): Size {
  const gap = gapFor(stage)
  const cols = Math.min(columns, Math.max(1, count))
  const rows = Math.max(1, Math.ceil(count / columns))
  return { w: cols * stage.w + (cols - 1) * gap, h: rows * stage.h + (rows - 1) * gap }
}

/**
 * Camera on region `index`. With `lean` (a point inside the region and a zoom), the camera moves
 * 30% toward that point but never shows past the region's own edges.
 */
export function regionCamera(index: number, stage: Size, lean?: { x: number; y: number; z: number }, columns = COLUMNS): Camera {
  const o = regionOrigin(index, stage, columns)
  let x = o.x + stage.w / 2
  let y = o.y + stage.h / 2
  if (!lean) return { x, y, z: 1 }
  const z = Math.min(Math.max(1, lean.z), MAX_LEAN_ZOOM)
  x += (o.x + lean.x - x) * 0.3
  y += (o.y + lean.y - y) * 0.3
  const hw = stage.w / 2 / z
  const hh = stage.h / 2 / z
  x = Math.min(Math.max(x, o.x + hw), o.x + stage.w - hw)
  y = Math.min(Math.max(y, o.y + hh), o.y + stage.h - hh)
  return { x, y, z }
}

/** Camera showing every region at once. */
export function overviewCamera(count: number, stage: Size, columns = COLUMNS): Camera {
  const world = worldSize(count, stage, columns)
  return { x: world.w / 2, y: world.h / 2, z: Math.min(stage.w / world.w, stage.h / world.h) * 0.94 }
}

/** CSS transform of the world element for a camera (transform-origin 0 0). */
export function cameraTransform(c: Camera, stage: Size): string {
  return `translate(${stage.w / 2 - c.x * c.z}px, ${stage.h / 2 - c.y * c.z}px) scale(${c.z})`
}

/** Index of the region containing a world point, or -1. */
export function regionAt(point: { x: number; y: number }, count: number, stage: Size, columns = COLUMNS): number {
  for (let i = 0; i < count; i++) {
    const o = regionOrigin(i, stage, columns)
    if (point.x >= o.x && point.x <= o.x + stage.w && point.y >= o.y && point.y <= o.y + stage.h) return i
  }
  return -1
}

/** Largest zoom of a narration Spotlight (decision 94). */
export const MAX_FOCUS_ZOOM = 2

/**
 * Camera on region `index` framing `box` (region coordinates) with some room around it: zoomed in up
 * to MAX_FOCUS_ZOOM and kept inside the region's edges. A narration Spotlight uses it.
 */
export function focusCamera(index: number, stage: Size, box: { x: number; y: number; w: number; h: number }, columns = COLUMNS): Camera {
  const o = regionOrigin(index, stage, columns)
  const pad = 48
  const z = Math.min(MAX_FOCUS_ZOOM, Math.max(1, Math.min(stage.w / (box.w + pad * 2), stage.h / (box.h + pad * 2))))
  const hw = stage.w / 2 / z
  const hh = stage.h / 2 / z
  const x = Math.min(Math.max(o.x + box.x + box.w / 2, o.x + hw), o.x + stage.w - hw)
  const y = Math.min(Math.max(o.y + box.y + box.h / 2, o.y + hh), o.y + stage.h - hh)
  return { x, y, z }
}
