import React, { useCallback, useRef, useState, useEffect } from 'react'
import { Application, Container, Graphics } from 'pixi.js'
import { MonsterData, CharacterAttributes, ItemReward } from '../types'
import { Button } from '../../../ui-system'
import { Shield, Zap, Sparkles } from 'lucide-react'
import { PixiCanvasViewport } from './PixiCanvasViewport'
import { drawWarrior } from './warrior-renderer'
import { useGamificationTheme } from '../theme-palette'

interface CombatStageHeaderProps {
  monster: MonsterData
  playerAttributes: CharacterAttributes
  playerHp: number
  maxPlayerHp: number
  inventory: ItemReward[]
  onUseItem?: (itemId: string) => void
  combatLogMessage?: string
  playerAttackedTimestamp?: number
  monsterAttackedTimestamp?: number
}

export const CombatStageHeader: React.FC<CombatStageHeaderProps> = ({
  monster,
  playerAttributes,
  playerHp,
  maxPlayerHp,
  inventory,
  onUseItem,
  combatLogMessage,
  playerAttackedTimestamp = 0,
  monsterAttackedTimestamp = 0,
}) => {
  const palette = useGamificationTheme()
  const [activeItemFeedback, setActiveItemFeedback] = useState<string | null>(null)
  const playerHitTimeRef = useRef<number>(0)
  const monsterHitTimeRef = useRef<number>(0)

  // Track when player is attacked (wrong answer)
  useEffect(() => {
    if (playerAttackedTimestamp > 0) {
      playerHitTimeRef.current = performance.now() * 0.001
    }
  }, [playerAttackedTimestamp])

  // Track when monster is attacked (correct answer slash)
  useEffect(() => {
    if (monsterAttackedTimestamp > 0) {
      monsterHitTimeRef.current = performance.now() * 0.001
    }
  }, [monsterAttackedTimestamp])

  const monsterHp = monster.currentHp ?? monster.maxHp
  const monsterHpPercent = Math.max(0, (monsterHp / monster.maxHp) * 100)
  const playerHpPercent = Math.max(0, (playerHp / maxPlayerHp) * 100)

  const handleTriggerItem = (item: ItemReward) => {
    if (onUseItem) {
      onUseItem(item.id)
    }
    setActiveItemFeedback(`Used ${item.name}! Skill Activated.`)
    setTimeout(() => setActiveItemFeedback(null), 3000)
  }

  const handleInitPixi = useCallback((app: Application, stageContainer: Container) => {
    // Background Battle Atmosphere / Grid Grid Lines
    const bgGfx = new Graphics()
    stageContainer.addChild(bgGfx)

    // Ground Platform
    const groundGfx = new Graphics()
    stageContainer.addChild(groundGfx)

    // Center Clash Spark FX
    const clashGfx = new Graphics()
    stageContainer.addChild(clashGfx)

    // Sword Slash FX Layer (Hero attacking Monster on correct answer)
    const slashFxContainer = new Container()
    stageContainer.addChild(slashFxContainer)
    const slashWaveGfx = new Graphics()
    const slashSparksGfx = new Graphics()
    slashFxContainer.addChild(slashWaveGfx)
    slashFxContainer.addChild(slashSparksGfx)

    // Left Combatant: Knight Warrior Container
    const warriorContainer = new Container()
    stageContainer.addChild(warriorContainer)
    const warriorGfx = new Graphics()
    warriorContainer.addChild(warriorGfx)

    // Fire Blast FX on Player when hit
    const playerFireGfx = new Graphics()
    warriorContainer.addChild(playerFireGfx)

    // Right Combatant: Monster Fiend Container
    const monsterContainer = new Container()
    stageContainer.addChild(monsterContainer)
    const monsterGfx = new Graphics()
    monsterContainer.addChild(monsterGfx)

    // Combat Animation Ticker
    const tickerCallback = () => {
      if (!app || !app.renderer || !stageContainer || stageContainer.destroyed) return
      if (groundGfx.destroyed || bgGfx.destroyed || warriorGfx.destroyed || monsterGfx.destroyed) return

      const t = performance.now() * 0.001
      const width = app.screen.width || 800
      const height = app.screen.height || 144
      const centerY = height * 0.58

      // Ground Platform
      groundGfx.clear()
      const groundY = centerY + 22
      groundGfx.ellipse(width * 0.5, groundY, width * 0.45, 14).fill({ color: palette.crustNum, alpha: 0.85 })
      groundGfx.moveTo(width * 0.08, groundY).lineTo(width * 0.92, groundY).stroke({ width: 1.5, color: palette.surface1Num, alpha: 0.6 })

      // Ambient Background Energy Ribbons
      bgGfx.clear()
      const pulse = Math.sin(t * 2) * 0.15 + 0.85
      bgGfx.circle(width * 0.35, centerY - 6, 45).fill({ color: palette.blueNum, alpha: 0.05 * pulse })
      bgGfx.circle(width * 0.65, centerY - 6, 45).fill({ color: palette.redNum, alpha: 0.05 * pulse })

      // ─── 1. DRAW KNIGHT WARRIOR ───
      const warriorX = Math.max(120, width * 0.36)
      const warriorBob = Math.sin(t * 3.5) * 2.2
      warriorContainer.position.set(warriorX, centerY + warriorBob)
      warriorContainer.scale.set(1.15)

      // Calculate slash progress for warrior attack motion when monster was attacked
      let swordSlashProgress = 0
      const monsterHitTime = monsterHitTimeRef.current
      if (monsterHitTime > 0) {
        const elapsedSlash = t - monsterHitTime
        const slashDuration = 0.65
        if (elapsedSlash <= slashDuration) {
          swordSlashProgress = elapsedSlash / slashDuration
        }
      }

      drawWarrior(warriorGfx, {
        walkCycle: 0,
        bob: 0,
        cloakPhase: t * 4,
        swordSlashProgress,
        palette,
      })

      // ─── 1B. FIRE BLAST ON PLAYER ───
      playerFireGfx.clear()
      const hitTime = playerHitTimeRef.current
      if (hitTime > 0) {
        const elapsedHit = t - hitTime
        const hitDuration = 1.0
        if (elapsedHit <= hitDuration) {
          const hitProgress = elapsedHit / hitDuration
          const flameIntensity = Math.sin(hitProgress * Math.PI)
          warriorGfx.tint = elapsedHit < 0.35 ? 0xff7777 : 0xffffff

          const flameTongues = [
            { x: -6, y: 6, h: 26, w: 7, phase: 0 },
            { x: -1, y: 8, h: 34, w: 9, phase: 1.2 },
            { x: 4, y: 6, h: 28, w: 8, phase: 2.4 },
          ]

          flameTongues.forEach(({ x: fx, y: fy, h: fh, w: fw, phase }) => {
            const flicker = Math.sin(t * 18 + phase) * 3
            const curH = (fh + flicker) * flameIntensity
            const curW = fw * flameIntensity
            const tipY = fy - curH

            playerFireGfx.poly([
              fx - curW, fy,
              fx + (Math.sin(t * 14 + phase) * 4), tipY,
              fx + curW, fy,
            ]).fill({ color: palette.redNum, alpha: flameIntensity * 0.85 })

            playerFireGfx.poly([
              fx - (curW * 0.55), fy,
              fx + (Math.sin(t * 16 + phase) * 2), tipY + (curH * 0.25),
              fx + (curW * 0.55), fy,
            ]).fill({ color: palette.peachNum, alpha: flameIntensity * 0.95 })

            playerFireGfx.poly([
              fx - (curW * 0.25), fy,
              fx, tipY + (curH * 0.55),
              fx + (curW * 0.25), fy,
            ]).fill({ color: palette.yellowNum, alpha: flameIntensity * 0.95 })
          })

          for (let k = 0; k < 6; k++) {
            const sparkAngle = t * 10 + (k * Math.PI) / 3
            const spDist = 14 + (k % 3) * 6
            const spX = Math.cos(sparkAngle) * spDist
            const spY = Math.sin(sparkAngle) * (spDist * 0.8) - 4
            playerFireGfx.circle(spX, spY, 1.8).fill({ color: palette.yellowNum, alpha: flameIntensity })
          }
        } else {
          warriorGfx.tint = 0xffffff
        }
      }

      // ─── 2. DRAW MONSTER FIEND ───
      const monsterX = Math.min(width - 120, width * 0.64)
      const monsterBob = Math.sin(t * 3.0 + 1) * 3
      monsterContainer.position.set(monsterX, centerY + monsterBob)

      monsterGfx.clear()
      monsterGfx.ellipse(0, 16, 14, 4.5).fill({ color: palette.crustNum, alpha: 0.6 })

      const fiendAura = Math.sin(t * 5) * 0.3 + 0.7
      monsterGfx.circle(0, -2, 24).fill({ color: palette.redNum, alpha: 0.08 * fiendAura })

      monsterGfx.poly([-10, -8, -17, -18, -4, -12]).fill({ color: palette.redNum, alpha: 0.95 })
      monsterGfx.poly([8, -8, 15, -18, 4, -12]).fill({ color: palette.redNum, alpha: 0.95 })

      monsterGfx.roundRect(-12, 3, 24, 12, 3).fill({ color: palette.surface0Num, alpha: 0.95 })
      monsterGfx.poly([-12, 13, -16, 17, -10, 15]).fill({ color: palette.maroonNum })
      monsterGfx.poly([10, 13, 14, 17, 8, 15]).fill({ color: palette.maroonNum })

      monsterGfx.roundRect(-12, -9, 24, 18, 4).fill({ color: palette.redNum, alpha: 0.95 })
        .stroke({ width: 1.8, color: palette.maroonNum })

      monsterGfx.moveTo(-12, -4).lineTo(0, -1).lineTo(12, -4).stroke({ width: 2.2, color: palette.crustNum })
      monsterGfx.poly([-9, -5, -4, -2, -10, -2]).fill({ color: 0xffffff, alpha: 1.0 })
      monsterGfx.poly([7, -5, 2, -2, 8, -2]).fill({ color: 0xffffff, alpha: 1.0 })
      monsterGfx.circle(-7, -3, 1.4).fill({ color: palette.peachNum, alpha: 1.0 })
      monsterGfx.circle(4, -3, 1.4).fill({ color: palette.peachNum, alpha: 1.0 })

      // ─── 3. SWORD SLASH ATTACK FX ON MONSTER ───
      slashWaveGfx.clear()
      slashSparksGfx.clear()
      const monsterHit = monsterHitTimeRef.current
      if (monsterHit > 0) {
        const elapsedSlash = t - monsterHit
        const slashDuration = 0.65
        if (elapsedSlash <= slashDuration) {
          const slashProgress = elapsedSlash / slashDuration
          const slashIntensity = Math.sin(slashProgress * Math.PI)
          monsterGfx.tint = elapsedSlash < 0.25 ? 0x88ffff : 0xffffff

          const impactX = monsterX - 6
          const impactY = centerY - 4

          slashWaveGfx.moveTo(impactX - 28, impactY - 24)
            .lineTo(impactX + 28, impactY + 24)
            .stroke({ width: 4.5 * slashIntensity, color: 0xffffff, alpha: slashIntensity })

          slashWaveGfx.moveTo(impactX - 32, impactY - 28)
            .lineTo(impactX + 32, impactY + 28)
            .stroke({ width: 8.0 * slashIntensity, color: palette.blueNum, alpha: 0.6 * slashIntensity })

          for (let i = 0; i < 8; i++) {
            const sparkAngle = (i * Math.PI) / 4 + elapsedSlash * 6
            const sparkDist = (slashProgress - 0.15) * 40
            const sparkX = impactX + Math.cos(sparkAngle) * sparkDist
            const sparkY = impactY + Math.sin(sparkAngle) * sparkDist
            slashSparksGfx.circle(sparkX, sparkY, Math.max(0.5, 2.5 * (1 - slashProgress)))
              .fill({ color: i % 2 === 0 ? 0xffffff : palette.blueNum, alpha: (1 - slashProgress) * slashIntensity })
          }
        } else {
          monsterGfx.tint = 0xffffff
        }
      }
    }

    app.ticker.add(tickerCallback)

    return () => {
      app.ticker.remove(tickerCallback)
    }
  }, [palette])

  return (
    <div className="flex flex-col gap-2.5">
      {/* PixiJS Tactical Duel Arena Canvas Viewport */}
      <div className="relative w-full aspect-[11/2] min-h-[110px] max-h-44 bg-[var(--ctp-crust)] rounded-2xl border border-[var(--ctp-surface1)] overflow-hidden shadow-inner">
        {/* Reusable React Pixi Canvas Viewport */}
        <PixiCanvasViewport
          className="absolute inset-0 w-full h-full"
          backgroundColor={palette.crustNum}
          backgroundAlpha={0.95}
          defaultWidth={800}
          defaultHeight={144}
          onInit={handleInitPixi}
        />

        {/* HUD Combatant Badges Overlay */}
        <div className="absolute inset-0 pointer-events-none p-2.5 flex justify-between items-start">
          {/* Warrior Status Header Overlay */}
          <div className="bg-[var(--ctp-surface0)]/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-[var(--ctp-blue)]/40 max-w-[200px] shadow-md pointer-events-auto">
            <div className="flex items-center justify-between text-xs gap-3">
              <span className="font-bold text-[var(--ctp-blue)] truncate">Architect Champion</span>
              <span className="font-mono text-[var(--ctp-green)] text-[11px] font-bold">{playerHp}/{maxPlayerHp} HP</span>
            </div>
            <div className="w-full bg-[var(--ctp-crust)] h-1.5 rounded-full overflow-hidden mt-1 border border-[var(--ctp-surface1)]">
              <div
                className="h-full bg-gradient-to-r from-[var(--ctp-green)] to-[var(--ctp-blue)] transition-all duration-300"
                style={{ width: `${playerHpPercent}%` }}
              />
            </div>
            <div className="flex items-center gap-2 mt-1 text-[9px] text-[var(--ctp-subtext0)]">
              <span className="flex items-center gap-0.5"><Shield size={9} /> {playerAttributes.armor}% Arm</span>
              <span className="flex items-center gap-0.5"><Zap size={9} /> {playerAttributes.evasion}% Eva</span>
            </div>
          </div>

          {/* Tactical Center Badge */}
          <div className="flex flex-col items-center">
            <div className="bg-[var(--ctp-surface0)]/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-[var(--ctp-maroon)]/40 text-[10px] font-bold text-[var(--ctp-maroon)] uppercase tracking-wider flex items-center gap-1 shadow-sm">
              <Sparkles size={11} className="text-[var(--ctp-yellow)]" />
              <span>Tactical Encounter</span>
            </div>
            {/* Usable Tactical Items */}
            {inventory.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5 pointer-events-auto">
                {inventory.map((item) => (
                  <Button
                    key={item.id}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[10px] bg-[var(--ctp-surface0)]/90 border border-[var(--ctp-blue)]/40 text-[var(--ctp-blue)] hover:bg-[var(--ctp-blue)]/20 flex items-center gap-1 font-bold shadow-sm"
                    onClick={() => handleTriggerItem(item)}
                    title={`Use ${item.name}`}
                  >
                    <span>{item.icon || '⚔️'}</span>
                    <span className="truncate max-w-[70px]">{item.name}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Monster Status Header Overlay */}
          <div className="bg-[var(--ctp-surface0)]/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-[var(--ctp-red)]/40 max-w-[200px] shadow-md text-right pointer-events-auto">
            <div className="flex items-center justify-between text-xs gap-3">
              <span className="font-bold text-[var(--ctp-red)] truncate">{monster.name}</span>
              <span className="font-mono text-[var(--ctp-red)] text-[11px] font-bold">{monsterHp}/{monster.maxHp} HP</span>
            </div>
            <div className="w-full bg-[var(--ctp-crust)] h-1.5 rounded-full overflow-hidden mt-1 border border-[var(--ctp-surface1)]">
              <div
                className="h-full bg-gradient-to-r from-[var(--ctp-red)] to-[var(--ctp-maroon)] transition-all duration-300"
                style={{ width: `${monsterHpPercent}%` }}
              />
            </div>
            <div className="text-[9px] text-[var(--ctp-subtext0)] mt-1">
              <span>⚔️ Attack: {monster.damage} Dmg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Item feedback alert */}
      {activeItemFeedback && (
        <div className="text-center text-[11px] text-[var(--ctp-green)] font-semibold animate-pulse">
          ✨ {activeItemFeedback}
        </div>
      )}

      {/* Combat Log Message Bar */}
      {combatLogMessage && (
        <div className="bg-[var(--ctp-surface0)] px-3 py-1.5 rounded-lg border border-[var(--ctp-surface1)] text-xs font-mono text-[var(--ctp-text)] text-center truncate">
          {combatLogMessage}
        </div>
      )}
    </div>
  )
}
