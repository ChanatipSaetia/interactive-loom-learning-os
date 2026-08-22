import { Graphics } from 'pixi.js'
import { GamificationThemePalette, getGamificationThemePalette } from '../theme-palette'

// ─── PROCEDURAL VECTOR EMBLEMS / INSIGNIAS ───
export function drawVectorInsignia(g: Graphics, type: string, color: number, isDefeated: boolean = false, palette: GamificationThemePalette = getGamificationThemePalette()) {
  if (!g || g.destroyed) return
  g.clear()
  const c = isDefeated ? palette.overlay2Num : color
  const darkC = palette.crustNum

  switch (type) {
    case 'capital': {
      // 🏰 Citadel Crest: 3 battlement towers + arched gate
      g.roundRect(-10, -2, 20, 12, 1.5).fill({ color: c, alpha: 0.95 })
      // Central high tower
      g.rect(-4, -13, 8, 11).fill({ color: c, alpha: 0.95 })
      // Left and Right battlement towers
      g.rect(-10, -9, 5, 7).fill({ color: c, alpha: 0.95 })
      g.rect(5, -9, 5, 7).fill({ color: c, alpha: 0.95 })
      // Arched gate
      g.roundRect(-3.5, 3, 7, 7, 3).fill({ color: darkC, alpha: 0.9 })
      // Top crest diamond
      g.poly([0, -17, 3, -14, 0, -11, -3, -14]).fill({ color: 0xffffff, alpha: 0.9 })
      break
    }
    case 'reading_sanctuary': {
      // 🏛️ Temple of Wisdom: Triangular pediment + 3 pillars + pedestal
      g.poly([-12, -5, 0, -14, 12, -5]).fill({ color: c, alpha: 0.95 })
      // 3 Columns
      g.rect(-10, -4, 4, 12).fill({ color: c, alpha: 0.9 })
      g.rect(-2, -4, 4, 12).fill({ color: c, alpha: 0.9 })
      g.rect(6, -4, 4, 12).fill({ color: c, alpha: 0.9 })
      // Pedestal foundation
      g.roundRect(-13, 8, 26, 3.5, 1).fill({ color: c, alpha: 0.95 })
      // Inner wisdom gem
      g.circle(0, -7.5, 2.2).fill({ color: 0xffffff, alpha: 0.9 })
      break
    }
    case 'quiz_encounter': {
      // 👾 Encounter Monster Fiend (Horns, fangs, menacing glowing eyes)
      // Pointy Monster Horns / Ears
      g.poly([-8, -6, -13, -15, -4, -10]).fill({ color: c, alpha: 0.95 })
      g.poly([8, -6, 13, -15, 4, -10]).fill({ color: c, alpha: 0.95 })

      // Monster Head / Face Mask
      g.roundRect(-10, -7, 20, 15, 4).fill({ color: c, alpha: 0.95 })

      // Brow Ridge
      g.moveTo(-10, -3).lineTo(0, 0).lineTo(10, -3).stroke({ width: 2, color: darkC })

      // Sharp Menacing Eyes
      g.poly([-7, -4, -3, -1, -8, -1]).fill({ color: 0xffffff, alpha: 1.0 })
      g.poly([7, -4, 3, -1, 8, -1]).fill({ color: 0xffffff, alpha: 1.0 })
      // Glowing Pupils
      g.circle(-5, -2, 1.2).fill({ color: palette.peachNum, alpha: 1.0 })
      g.circle(5, -2, 1.2).fill({ color: palette.peachNum, alpha: 1.0 })

      // Snarl Mouth / Fangs
      g.roundRect(-6, 3, 12, 4, 1.5).fill({ color: darkC, alpha: 0.95 })
      // Top Fangs
      g.poly([-4, 3, -2, 3, -3, 6]).fill({ color: 0xffffff, alpha: 1.0 })
      g.poly([2, 3, 4, 3, 3, 6]).fill({ color: 0xffffff, alpha: 1.0 })
      // Bottom Jaw Fangs
      g.poly([-1, 7, 1, 7, 0, 4.5]).fill({ color: 0xffffff, alpha: 1.0 })
      break
    }
    case 'reflection_decryption': {
      // 🔮 Volatile Cryptographic Matrix & Runic Bomb Core (Sharp hazardous cipher spikes + glowing plasma core)
      const d = 11
      // 4 hazardous barbed matrix corner brackets
      g.moveTo(-d, -d + 5).lineTo(-d, -d).lineTo(-d + 5, -d).stroke({ width: 2.0, color: c })
      g.moveTo(d, -d + 5).lineTo(d, -d).lineTo(d - 5, -d).stroke({ width: 2.0, color: c })
      g.moveTo(-d, d - 5).lineTo(-d, d).lineTo(-d + 5, d).stroke({ width: 2.0, color: c })
      g.moveTo(d, d - 5).lineTo(d, d).lineTo(d - 5, d).stroke({ width: 2.0, color: c })

      // Outer hazardous diagonal sparks
      g.moveTo(-d, -d).lineTo(-d - 3, -d - 3).stroke({ width: 1.8, color: palette.redNum })
      g.moveTo(d, -d).lineTo(d + 3, -d - 3).stroke({ width: 1.8, color: palette.redNum })
      g.moveTo(-d, d).lineTo(-d - 3, d + 3).stroke({ width: 1.8, color: palette.redNum })
      g.moveTo(d, d).lineTo(d + 3, d + 3).stroke({ width: 1.8, color: palette.redNum })

      // Center volatile decryption diamond
      g.poly([0, -8, 8, 0, 0, 8, -8, 0]).stroke({ width: 1.8, color: c }).fill({ color: darkC, alpha: 0.7 })
      // Core glowing bomb spark
      g.circle(0, 0, 2.8).fill({ color: 0xffffff, alpha: 1.0 })
      g.circle(0, 0, 5).stroke({ width: 1, color: palette.redNum, alpha: 0.85 })
      break
    }
    case 'tradeoff_workshop': {
      // 🔨 Anvil & Forging Hammer
      // Anvil top & horn
      g.moveTo(-11, -3).lineTo(10, -3).lineTo(8, 2).lineTo(-7, 2).lineTo(-11, -3).fill({ color: c, alpha: 0.95 })
      // Anvil body & base
      g.rect(-5, 2, 10, 5).fill({ color: c, alpha: 0.9 })
      g.roundRect(-9, 7, 18, 4, 1).fill({ color: c, alpha: 0.95 })
      // Angled hammer
      g.moveTo(7, -13).lineTo(-2, -4).stroke({ width: 2, color: 0xffffff, alpha: 0.85 })
      g.poly([-6, -8, -1, -13, 2, -10, -3, -5]).fill({ color: c, alpha: 0.95 })
      break
    }
    case 'boss_lair': {
      // 🔥 Horned Demonic Skull Titan
      // Horns
      g.moveTo(-9, -5).quadraticCurveTo(-14, -13, -8, -16).stroke({ width: 2.2, color: palette.maroonNum })
      g.moveTo(9, -5).quadraticCurveTo(14, -13, 8, -16).stroke({ width: 2.2, color: palette.maroonNum })
      // Skull head plate
      g.roundRect(-9, -8, 18, 11, 3).fill({ color: c, alpha: 0.95 })
      // Fanged jaw
      g.poly([-6, 3, 6, 3, 4, 9, -4, 9]).fill({ color: c, alpha: 0.95 })
      // Eye sockets
      g.rect(-6, -4, 3.5, 3.5).fill({ color: darkC, alpha: 0.95 })
      g.rect(2.5, -4, 3.5, 3.5).fill({ color: darkC, alpha: 0.95 })
      // Glowing pupils
      g.circle(-4.2, -2.2, 1.2).fill({ color: 0xffffff, alpha: 0.9 })
      g.circle(4.2, -2.2, 1.2).fill({ color: 0xffffff, alpha: 0.9 })
      break
    }
    default:
      g.circle(0, 0, 8).fill({ color: c, alpha: 0.9 })
      break
  }
}
