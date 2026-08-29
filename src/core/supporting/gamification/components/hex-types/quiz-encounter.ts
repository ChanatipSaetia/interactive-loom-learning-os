import { Graphics, FillGradient, Container } from 'pixi.js'
import { HEX_RADIUS } from '../hex-geometry'
import { GamificationThemePalette, getGamificationThemePalette } from '../../theme-palette'
import { HexInsigniaOptions, HexTypeDefinition, HexTypeEffectContext } from './types'

export function drawQuizEncounterTerrainGround(
  g: Graphics,
  options: HexInsigniaOptions = {},
) {
  if (!g || g.destroyed) return
  g.clear()

  const { palette = getGamificationThemePalette(), isDefeated = false, isLocked = false } = options
  const alphaMod = isLocked ? 0.35 : 0.85

  if (isDefeated) {
    // Serene cleansed campfire clearing
    g.ellipse(0, 5, HEX_RADIUS * 0.7, HEX_RADIUS * 0.4)
      .fill({ color: palette.surface0Num, alpha: 0.25 * alphaMod })
    // Wildflower regrowth
    g.circle(-14, 12, 1.4).fill({ color: palette.tealNum, alpha: 0.6 * alphaMod })
    g.circle(16, 10, 1.4).fill({ color: palette.lavenderNum, alpha: 0.6 * alphaMod })
    return
  }

  // 1. Scorched earth & trampled warpath clearing
  g.ellipse(0, 6, HEX_RADIUS * 0.75, HEX_RADIUS * 0.42)
    .fill({ color: palette.crustNum, alpha: 0.45 * alphaMod })

  // 2. Earthwork rampart / defensive trenches
  g.arc(0, 0, HEX_RADIUS * 0.82, -Math.PI * 0.8, -Math.PI * 0.2)
    .stroke({ width: 2, color: palette.maroonNum, alpha: 0.3 * alphaMod })
  g.arc(0, 0, HEX_RADIUS * 0.82, Math.PI * 0.2, Math.PI * 0.8)
    .stroke({ width: 2, color: palette.surface1Num, alpha: 0.35 * alphaMod })
}

export function drawQuizEncounterInsignia(
  g: Graphics,
  options: HexInsigniaOptions = {},
) {
  if (!g || g.destroyed) return
  g.clear()

  const {
    color,
    isDefeated = false,
    palette = getGamificationThemePalette(),
    time = 0,
  } = options

  const c = isDefeated ? palette.overlay2Num : (color ?? palette.redNum)
  const darkC = palette.crustNum
  const timberColor = palette.surface2Num
  const ironColor = palette.overlay0Num
  const redColor = palette.redNum

  if (isDefeated) {
    // ─── CLEANSED STATE: PEACEFUL CAMPSITE ───
    g.ellipse(0, 8, 12, 4).fill({ color: darkC, alpha: 0.4 })
    // Rested tent / pavillion
    g.poly([-8, 8, 0, -5, 8, 8]).fill({ color: palette.surface1Num }).stroke({ width: 1.1, color: palette.textNum })
    g.poly([-1, 8, 0, -5, 3, 8]).fill({ color: palette.surface0Num })
    // Extinguished campfire stones
    g.circle(-7, 8, 1.5).fill({ color: palette.overlay0Num })
    g.circle(-5, 9, 1.2).fill({ color: palette.overlay0Num })
    g.circle(-9, 9, 1.2).fill({ color: palette.overlay0Num })
    // Peaceful white flag
    const flagWave = Math.sin(time * 2.5) * 1.5
    g.moveTo(6, 8).lineTo(6, -8).stroke({ width: 1, color: palette.textNum })
    g.poly([
      6, -8,
      13, -7 + flagWave * 0.4,
      10, -5 + flagWave * 0.8,
      6, -4,
    ]).fill({ color: palette.textNum, alpha: 0.9 }).stroke({ width: 0.8, color: palette.subtext0Num })
    return
  }

  // ─── ACTIVE STATE: WARRIOR HORDE / BEAST DEN PALISADE ───
  // 1. Spiked Wooden Palisade / Rampart
  g.ellipse(0, 9, 14, 4.5).fill({ color: darkC, alpha: 0.6 })
  const stakes = [-12, -7, 7, 12]
  for (const sx of stakes) {
    const sH = 11 + Math.abs(sx) * 0.25
    g.poly([
      sx - 2, 8,
      sx - 2, 8 - sH,
      sx, 6 - sH,
      sx + 2, 8 - sH,
      sx + 2, 8,
    ]).fill({ color: timberColor }).stroke({ width: 1, color: palette.textNum })
  }

  // 2. Central Iron Horned War-Helm (Beast / Warlord Trophy)
  const helmBob = Math.sin(time * 2.8) * 1.2
  const helmY = -2 + helmBob

  // Large curved beast horns
  // Left Horn
  g.poly([
    -6, helmY - 5,
    -14, helmY - 10,
    -17, helmY - 17,
    -12, helmY - 14,
    -4, helmY - 7,
  ]).fill({ color: palette.textNum }).stroke({ width: 1.2, color: darkC })
  // Right Horn
  g.poly([
    6, helmY - 5,
    14, helmY - 10,
    17, helmY - 17,
    12, helmY - 14,
    4, helmY - 7,
  ]).fill({ color: palette.textNum }).stroke({ width: 1.2, color: darkC })

  // Iron Helmet Dome
  g.roundRect(-8, helmY - 7, 16, 15, 4)
    .fill({ color: ironColor })
    .stroke({ width: 1.3, color: palette.textNum })

  // Spiked Nose Guard & Brow Plate
  g.poly([
    -8, helmY - 3,
    0, helmY - 1,
    8, helmY - 3,
    8, helmY - 6,
    -8, helmY - 6,
  ]).fill({ color: palette.maroonNum }).stroke({ width: 1, color: palette.textNum })
  g.poly([-2, helmY - 3, 0, helmY + 5, 2, helmY - 3]).fill({ color: palette.maroonNum })

  // Glowing Amber Slit Eye Visors (Warrior Eye Glare)
  g.poly([-7, helmY - 3, -3, helmY - 0.5, -7, helmY - 0.5]).fill({ color: palette.textNum })
  g.poly([7, helmY - 3, 3, helmY - 0.5, 7, helmY - 0.5]).fill({ color: palette.textNum })
  g.poly([-6, helmY - 2.5, -3.5, helmY - 1, -6, helmY - 1]).fill({ color: palette.yellowNum })
  g.poly([6, helmY - 2.5, 3.5, helmY - 1, 6, helmY - 1]).fill({ color: palette.yellowNum })

  // 3. Spiked Iron Fangs / Jaw Grill
  g.rect(-6, helmY + 2, 12, 4).fill({ color: darkC })
  g.poly([-4, helmY + 4, -2, helmY + 4, -3, helmY + 7]).fill({ color: palette.textNum })
  g.poly([2, helmY + 4, 4, helmY + 4, 3, helmY + 7]).fill({ color: palette.textNum })

  // 4. Burning War Torch (Left flank)
  const flameFlicker = Math.sin(time * 8) * 1.5
  g.moveTo(-13, 8).lineTo(-13, -6).stroke({ width: 1.5, color: timberColor })
  g.poly([
    -15, -6,
    -13, -15 + flameFlicker,
    -10, -8,
    -11, -5,
  ]).fill({ color: redColor }).stroke({ width: 0.8, color: palette.yellowNum })
  g.circle(-13, -8, 2.2).fill({ color: palette.yellowNum, alpha: 0.9 })
  g.circle(-13, -8, 1).fill({ color: c, alpha: 0.95 })
}

export function createQuizEncounterGradient(
  isLocked: boolean,
  isCleared: boolean,
  palette: GamificationThemePalette,
): FillGradient {
  const gradient = new FillGradient({
    start: { x: 0, y: -HEX_RADIUS },
    end: { x: 0, y: HEX_RADIUS },
  })

  if (isCleared) {
    gradient.addColorStop(0, palette.surface1)
    gradient.addColorStop(0.5, palette.surface0)
    gradient.addColorStop(1, palette.crust)
    return gradient
  }

  if (isLocked) {
    gradient.addColorStop(0, palette.surface0)
    gradient.addColorStop(0.5, palette.base)
    gradient.addColorStop(1, palette.crust)
    return gradient
  }

  gradient.addColorStop(0, palette.red)
  gradient.addColorStop(0.45, palette.maroon)
  gradient.addColorStop(1, palette.crust)
  return gradient
}

export function renderQuizEncounterEffects(ctx: HexTypeEffectContext) {
  const { nodeContainer, palette, animControllers, isLocked, isCleared } = ctx
  if (isLocked || isCleared) return

  const flameContainer = new Container()
  flameContainer.label = 'QuizWarFlames'
  const flameGfx = new Graphics()
  flameContainer.addChild(flameGfx)
  nodeContainer.addChild(flameContainer)

  const sparks = Array.from({ length: 5 }, (_, i) => ({
    x: -13 + (Math.random() - 0.5) * 4,
    speedY: 12 + Math.random() * 8,
    size: 1 + Math.random() * 1.2,
    offset: i * 0.4,
  }))

  animControllers.push((t) => {
    flameGfx.clear()
    for (const sp of sparks) {
      const progress = ((t * 0.8 + sp.offset) % 1)
      const curY = -7 - progress * sp.speedY
      const curX = sp.x + Math.sin(t * 5 + sp.offset) * 3
      const alpha = (1 - progress) * 0.8

      flameGfx.circle(curX, curY, sp.size).fill({ color: palette.yellowNum, alpha })
    }
  })
}

export const quizEncounterHex: HexTypeDefinition = {
  type: 'quiz_encounter',
  title: 'Quiz Encounter',
  drawTerrainGround: drawQuizEncounterTerrainGround,
  drawInsignia: drawQuizEncounterInsignia,
  createGradient: createQuizEncounterGradient,
  renderEffects: renderQuizEncounterEffects,
  getGlowColor: (palette) => palette.redNum,
}
