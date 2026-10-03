import { Container } from 'pixi.js'

export interface AstrolabeRing {
  radius: number
  strokeWidth: number
  color: number
  alpha: number
  hasTicks?: boolean
  tickCount?: number
  tickLength?: number
  rotationSpeed?: number
  phase?: number
}

export interface CartographyGridConfig {
  spacing: number
  gridColor: number
  gridAlpha: number
  crosshairSize: number
  showAxes: boolean
}

export interface StardustParticle {
  x: number
  y: number
  radius: number
  alpha: number
  color: number
  twinkleSpeed?: number
  phase?: number
  speedX?: number
  speedY?: number
}

export interface CartographyBackgroundLayer {
  container: Container
  updateTransform: (pan: { x: number; y: number }) => void
  tick: (time: number) => void
  destroy: () => void
}

// Backward compatibility types
export type ParallaxParticle = StardustParticle
export type GrasslandBackgroundLayer = CartographyBackgroundLayer

export interface GrassBlade {
  length: number
  baseAngle: number
  width: number
  color: number
}

export interface GrassTuft {
  x: number
  y: number
  blades: GrassBlade[]
  hasWildflower?: boolean
  wildflowerColor?: number
  phase: number
}

export interface TerrainContourPatch {
  points: Array<{ x: number; y: number }>
  color: number
  alpha: number
}
