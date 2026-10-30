import type { BulletScene } from './present'

export interface BulletPage {
  from: number
  to: number
}

/** Pack measured rows, keeping complete parent groups together whenever they fit on a page. */
export function paginateBullets(scenes: BulletScene[], heights: number[], available: number, contextHeights: number[] = []): BulletPage[] {
  if (!scenes.length) return []
  const capacity = Math.max(1, available)
  const pages: BulletPage[] = []
  let from = 0
  let used = 0
  const height = (i: number) => Math.max(1, heights[i] ?? 1)
  for (let i = 0; i < scenes.length; i++) {
    if (i > from && !scenes[i].parents.length) {
      let group = height(i)
      for (let j = i + 1; j < scenes.length && scenes[j].topIndex === scenes[i].topIndex; j++) group += height(j)
      // Do not orphan a parent when its whole group can fit on a fresh page.
      if (group <= capacity && used + group > capacity) {
        pages.push({ from, to: i - 1 })
        from = i
        used = 0
      }
    }
    if (i > from && used + height(i) > capacity) {
      pages.push({ from, to: i - 1 })
      from = i
      used = contextHeights[i] ?? 0
    }
    used += height(i)
  }
  pages.push({ from, to: scenes.length - 1 })
  return pages
}
