import { Graphics } from 'pixi.js'

export interface WarriorRenderOptions {
  walkCycle?: number
  bob?: number
  cloakPhase?: number
  swordSlashProgress?: number // 0..1 for attack slash thrust
}

/**
 * Procedurally draws the heroic Knight Warrior with full detail:
 * - Shadow & fluttering Crimson Cloak
 * - Armored Greaves & Sabatons
 * - Steel Cuirass (Breastplate with golden crest & center ridge)
 * - Armored Belt & Buckle
 * - Kite Shield with Azure & Gold crest
 * - Broadsword with steel blade, cyan glow highlight, crossguard & pommel gem
 * - Heavy Pauldrons
 * - Greathelm with T-visor slit, glowing cyan eye glimmer, & Golden Plume
 */
export function drawWarrior(g: Graphics, options: WarriorRenderOptions = {}) {
  if (!g || g.destroyed) return
  g.clear()

  const {
    walkCycle = 0,
    bob = 0,
    cloakPhase = walkCycle,
    swordSlashProgress = 0,
  } = options

  const legSwing = Math.sin(walkCycle) * 7
  const armSwing = Math.cos(walkCycle) * 6

  // 1. Ground shadow
  g.ellipse(0, 16, 11, 3.5).fill({ color: 0x181825, alpha: 0.55 })

  // 2. Cape / Crimson Battle Cloak waving behind (to the left since facing right)
  const cloakWave = Math.sin(cloakPhase) * 4
  const cloakWaveY = Math.cos(cloakPhase * 0.8) * 2.5
  g.poly([
    -4, -5 - bob,
    -16 - cloakWave, 7 + cloakWaveY - bob,
    -11, 13 - bob,
    -2, 2 - bob,
  ]).fill({ color: 0xe78284, alpha: 0.92 }).stroke({ width: 1, color: 0xea999c, alpha: 0.6 })

  // 3. Left Leg (Back - Steel Greaves)
  g.moveTo(-2, 5 - bob)
    .lineTo(-2 - legSwing, 15)
    .stroke({ width: 3.5, color: 0x51576d, cap: 'round' })
  // Left Sabaton / Boot
  g.circle(-2 - legSwing + 1, 15, 2.2).fill({ color: 0x414559 })

  // 4. Right Leg (Front - Steel Greaves)
  g.moveTo(2, 5 - bob)
    .lineTo(2 + legSwing, 15)
    .stroke({ width: 3.8, color: 0x949cbb, cap: 'round' })
  // Right Sabaton / Boot
  g.circle(2 + legSwing + 1.5, 15, 2.4).fill({ color: 0x737994 })

  // 5. Torso / Steel Cuirass (Breastplate with golden trims)
  g.roundRect(-5.5, -7 - bob, 11, 13, 2.5).fill({ color: 0x737994, alpha: 1.0 })
    .stroke({ width: 1.6, color: 0xc6d0f5 })
  // Center chestplate ridge
  g.moveTo(0, -6 - bob).lineTo(0, 4 - bob).stroke({ width: 1.5, color: 0x414559 })
  // Golden Breastplate Inlay Crest
  g.poly([0, -4 - bob, 2.5, -2 - bob, 0, 0 - bob, -2.5, -2 - bob]).fill({ color: 0xe5c890 })

  // 6. Armored Belt & Buckle
  g.rect(-5.5, 2 - bob, 11, 2.5).fill({ color: 0x292c3c })
  g.rect(-2, 1.5 - bob, 4, 3.5).fill({ color: 0xe5c890 })

  // 7. Left Arm & Kite Shield (Back Arm holding Knight's Heater Shield)
  const shieldX = -6 - armSwing * 0.5
  const shieldY = -1 - bob
  // Shield Rim & Field (Azure & Gold Crest)
  g.poly([
    shieldX - 3, shieldY - 7,
    shieldX + 4, shieldY - 7,
    shieldX + 4, shieldY + 3,
    shieldX, shieldY + 8,
    shieldX - 3, shieldY + 3,
  ]).fill({ color: 0x303446, alpha: 0.95 }).stroke({ width: 1.4, color: 0x8caaee })
  // Shield Gold Cross / Star
  g.poly([shieldX + 0.5, shieldY - 4, shieldX + 0.5, shieldY + 4]).stroke({ width: 1.5, color: 0xe5c890 })

  // 8. Right Arm & Gleaming Broadsword
  let handX = 4 + armSwing * 0.8
  let handY = 2 - bob
  let bladeTipX = handX + 16
  let bladeTipY = handY - 14
  let bladeHighlightX = handX + 15
  let bladeHighlightY = handY - 13
  let crossguardP1 = { x: handX - 2, y: handY + 1 }
  let crossguardP2 = { x: handX + 3, y: handY - 4 }
  let pommelX = handX - 2.5
  let pommelY = handY + 2

  if (swordSlashProgress > 0 && swordSlashProgress < 1) {
    // Attack slash thrust motion
    const slashAngle = (1 - swordSlashProgress) * Math.PI * 0.45
    handX = 6 + Math.sin(swordSlashProgress * Math.PI) * 7
    handY = 1 - bob + swordSlashProgress * 3
    bladeTipX = handX + Math.cos(slashAngle) * 22
    bladeTipY = handY - Math.sin(slashAngle) * 16
    bladeHighlightX = handX + Math.cos(slashAngle) * 20
    bladeHighlightY = handY - Math.sin(slashAngle) * 15
    crossguardP1 = { x: handX - 2, y: handY + 2 }
    crossguardP2 = { x: handX + 2, y: handY - 4 }
    pommelX = handX - 3
    pommelY = handY + 3
  }

  g.moveTo(3, -4 - bob)
    .lineTo(handX, handY)
    .stroke({ width: 3.2, color: 0x949cbb, cap: 'round' })

  // Broadsword / Greatsword
  // Steel Blade
  g.moveTo(handX + 1, handY - 1)
    .lineTo(bladeTipX, bladeTipY)
    .stroke({ width: 2.8, color: 0xffffff, cap: 'round' })
  // Blade Full Core Highlight
  g.moveTo(handX + 2, handY - 2)
    .lineTo(bladeHighlightX, bladeHighlightY)
    .stroke({ width: 1.2, color: 0x8caaee })
  // Crossguard
  g.moveTo(crossguardP1.x, crossguardP1.y)
    .lineTo(crossguardP2.x, crossguardP2.y)
    .stroke({ width: 2.4, color: 0xe5c890 })
  // Pommel Gem
  g.circle(pommelX, pommelY, 1.5).fill({ color: 0xe78284 })

  // 9. Heavy Pauldrons (Shoulder Armor Plates)
  g.poly([-7, -8 - bob, -3, -11 - bob, -2, -6 - bob]).fill({ color: 0x949cbb }).stroke({ width: 1, color: 0xc6d0f5 })
  g.poly([3, -11 - bob, 7, -8 - bob, 3, -6 - bob]).fill({ color: 0x949cbb }).stroke({ width: 1, color: 0xc6d0f5 })

  // 10. Armored Warrior Helmet (Greathelm with Visor Slit & Golden Horns/Plume)
  g.roundRect(-4.5, -16 - bob, 9, 10, 2.5).fill({ color: 0x737994 })
    .stroke({ width: 1.5, color: 0xc6d0f5 })

  // Helmet Visor T-Slit (Glowing cyan heroic eyes inside)
  g.moveTo(-2.5, -12 - bob).lineTo(3.5, -12 - bob).stroke({ width: 1.4, color: 0x181825 })
  g.moveTo(1, -14 - bob).lineTo(1, -9 - bob).stroke({ width: 1.4, color: 0x181825 })
  // Glowing Eye Glimmer
  g.circle(2, -12 - bob, 0.9).fill({ color: 0x8caaee, alpha: 1.0 })

  // Golden Plume / Crest on Helmet
  g.poly([
    -1, -16 - bob,
    -4, -22 - bob,
    2, -21 - bob,
    4, -16 - bob,
  ]).fill({ color: 0xe5c890 }).stroke({ width: 1, color: 0xef9f76 })
}
