export const HEX_RADIUS = 42

const HEX_GAP_SCALE = 1.32

// Axial to pixel coordinates relative to origin (0, 0)
export function axialToPixel(q: number, r: number, originX = 0, originY = 0) {
  const x = originX + HEX_RADIUS * 1.5 * HEX_GAP_SCALE * q
  const y = originY + HEX_RADIUS * Math.sqrt(3) * HEX_GAP_SCALE * (r + q / 2)
  return { x, y }
}

// Star polygon vertices for star particles
export function getStarVertices(cx: number, cy: number, points: number, outerRadius: number, innerRadius: number): number[] {
  const verts: number[] = []
  const step = Math.PI / points
  for (let i = 0; i < 2 * points; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius
    const angle = i * step - Math.PI / 2
    verts.push(cx + r * Math.cos(angle), cy + r * Math.sin(angle))
  }
  return verts
}

// Flat-topped hexagon polygon vertices
export function getHexVertices(cx: number, cy: number, radius: number): number[] {
  const points: number[] = []
  for (let i = 0; i < 6; i++) {
    const angleRad = (Math.PI / 180) * (60 * i)
    points.push(cx + radius * Math.cos(angleRad), cy + radius * Math.sin(angleRad))
  }
  return points
}
