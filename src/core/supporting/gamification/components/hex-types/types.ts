import { Container, Graphics, FillGradient } from 'pixi.js'
import { GamificationThemePalette } from '../../theme-palette'
import { HexNodeData, HexNodeType } from '../../types'

export interface HexInsigniaOptions {
  color?: number
  isDefeated?: boolean
  isLocked?: boolean
  palette?: GamificationThemePalette
  time?: number
}

export interface HexTypeEffectContext {
  node: HexNodeData
  nodeContainer: Container
  innerGfx: Graphics
  palette: GamificationThemePalette
  animControllers: Array<(time: number) => void>
  x: number
  y: number
  isSelected: boolean
  isCleared: boolean
  isLocked: boolean
  isBoss: boolean
  isDefeatedEncounter: boolean
  capitalCleared: boolean
  atkUx: number
  atkUy: number
  atkLen: number
}

export interface HexTypeDefinition {
  type: HexNodeType
  title: string

  /** Procedural vector drawing in the layered warrior miniature style */
  drawInsignia: (g: Graphics, options?: HexInsigniaOptions) => void

  /** Optional full terrain ground biome drawn across the full hex tile */
  drawTerrainGround?: (g: Graphics, options?: HexInsigniaOptions) => void

  /** Thematic top-to-bottom fill gradient */
  createGradient: (isLocked: boolean, isCleared: boolean, palette: GamificationThemePalette) => FillGradient

  /** Dynamic particle / lighting effects */
  renderEffects?: (ctx: HexTypeEffectContext) => void

  /** Glow filter accent color */
  getGlowColor: (palette: GamificationThemePalette) => number
}
