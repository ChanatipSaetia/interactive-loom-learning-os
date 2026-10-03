import { Container, Graphics } from 'pixi.js'
import { GamificationThemePalette } from '../../theme-palette'
import {
  generateParallaxParticles,
  drawSporeParticles,
  computeParallaxOffset,
  PARALLAX_FACTOR,
} from './spore-particles'
import {
  generateAstrolabeRings,
  generateStardust,
  drawAstrolabe,
  drawCartographyGrid,
  drawStardust,
} from './grassland-background'
import {
  CartographyBackgroundLayer,
  AstrolabeRing,
  StardustParticle,
} from './types'

export * from './types'
export * from './spore-particles'
export * from './grassland-background'

/**
 * Creates the Tactical Cartography & Astrolabe background layer
 */
export function createCartographyBackground(
  width: number,
  height: number,
  palette: GamificationThemePalette,
): CartographyBackgroundLayer {
  const container = new Container()
  container.label = 'TacticalCartographyLayer'

  const gridGfx = new Graphics()
  const astrolabeGfx = new Graphics()
  const stardustGfx = new Graphics()

  container.addChild(gridGfx)
  container.addChild(astrolabeGfx)
  container.addChild(stardustGfx)

  const rings: AstrolabeRing[] = generateAstrolabeRings(width, height, palette)
  const stars: StardustParticle[] = generateStardust(width, height, palette, 1337)

  // Draw static blueprint grid once
  drawCartographyGrid(gridGfx, width, height, palette)

  // Initial draw of astrolabe spheres and stardust
  drawAstrolabe(astrolabeGfx, rings, 0, palette)
  drawStardust(stardustGfx, stars, 0)

  const updateTransform = (pan: { x: number; y: number }) => {
    if (container.destroyed) return
    const offset = computeParallaxOffset(pan, PARALLAX_FACTOR)
    container.position.set(width / 2 + offset.x, height / 2 + offset.y)
  }

  const tick = (time: number) => {
    if (container.destroyed) return
    drawAstrolabe(astrolabeGfx, rings, time, palette)
    drawStardust(stardustGfx, stars, time)
  }

  const destroy = () => {
    if (!container.destroyed) {
      container.destroy({ children: true })
    }
  }

  return {
    container,
    updateTransform,
    tick,
    destroy,
  }
}

// Backward compatibility alias
export const createGrasslandBackground = createCartographyBackground

/**
 * Creates the full Tactical Cartography and Astrolabe background container
 */
export function createParallaxBackground(
  palette: GamificationThemePalette,
  width: number = 880,
  height: number = 580,
): Container {
  const container = new Container()
  container.label = 'TacticalAstrolabeBackdrop'

  const gridGfx = new Graphics()
  const astrolabeGfx = new Graphics()
  const stardustGfx = new Graphics()

  container.addChild(gridGfx)
  container.addChild(astrolabeGfx)
  container.addChild(stardustGfx)

  const rings = generateAstrolabeRings(width, height, palette)
  const stars = generateStardust(width, height, palette, 1337)

  drawCartographyGrid(gridGfx, width, height, palette)
  drawAstrolabe(astrolabeGfx, rings, 0, palette)
  drawStardust(stardustGfx, stars, 0)

  // Attach dynamic animation ticker function to container metadata
  const startTime = performance.now() * 0.001
  const tickFn = () => {
    if (container.destroyed) return
    const now = performance.now() * 0.001
    const elapsed = now - startTime
    drawAstrolabe(astrolabeGfx, rings, elapsed, palette)
    drawStardust(stardustGfx, stars, elapsed)
  }
  ;(container as unknown as { tick?: () => void }).tick = tickFn

  return container
}

/**
 * Backward compatibility helper for existing code that called buildParallaxLayer
 */
export function buildParallaxLayer(
  width: number,
  height: number,
  palette: GamificationThemePalette,
  seed: number = 1337,
): { container: Container; particles: StardustParticle[] } {
  const container = new Container()
  container.label = 'ParallaxDustLayer'
  const gfx = new Graphics()
  container.addChild(gfx)

  const particles = generateParallaxParticles(width, height, seed, palette)
  drawSporeParticles(gfx, particles, 0)

  return { container, particles }
}
