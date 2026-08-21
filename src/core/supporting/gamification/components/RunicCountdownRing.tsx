import React, { useEffect, useRef } from 'react'
import { Application, Container, Graphics } from 'pixi.js'

interface SequenceChallengeInfo {
  index: number
  itemCount: number
  isCleared: boolean
}

interface RunicCountdownRingProps {
  durationSeconds?: number
  isSolved: boolean
  evasionBonusSeconds?: number
  intelligenceChance?: number
  onTimeout: () => void
  onStatTriggered?: (stat: 'evasion' | 'intelligence', details: string) => void
  sequences?: SequenceChallengeInfo[]
  currentSequenceIndex?: number
  lastDecryptedSequence?: number
}

export const RunicCountdownRing: React.FC<RunicCountdownRingProps> = ({
  isSolved,
  sequences = [{ index: 0, itemCount: 4, isCleared: false }],
  currentSequenceIndex = 0,
  lastDecryptedSequence,
  evasionBonusSeconds = 0,
  intelligenceChance = 0,
  onStatTriggered,
}) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)

  // Keep state refs for smooth animation frame access
  const stateRef = useRef({
    sequences,
    currentSequenceIndex,
    isSolved,
    lastDecryptedSequence,
    animTime: 0,
    activeFillingSeq: null as number | null,
    filledSlotStep: -1,
  })

  useEffect(() => {
    stateRef.current.sequences = sequences
    stateRef.current.currentSequenceIndex = currentSequenceIndex
    stateRef.current.isSolved = isSolved
    stateRef.current.lastDecryptedSequence = lastDecryptedSequence
  }, [sequences, currentSequenceIndex, isSolved, lastDecryptedSequence])

  // Trigger stat notification on mount
  useEffect(() => {
    if (evasionBonusSeconds > 0) {
      const bonus = Math.round(evasionBonusSeconds * 0.3)
      if (bonus > 0) {
        onStatTriggered?.('evasion', `+${bonus}s Decryption Time gained from ${evasionBonusSeconds}% Evasion Speed!`)
      }
    }
    if (intelligenceChance > 0) {
      const hasInsight = Math.random() * 100 < intelligenceChance
      if (hasInsight) {
        onStatTriggered?.('intelligence', `Runic Intuition! ${intelligenceChance}% Intelligence stabilized the ancient runes!`)
      }
    }
  }, [])

  // Sequential iterative rune fill animation when a sequence is completed
  useEffect(() => {
    if (lastDecryptedSequence !== undefined && lastDecryptedSequence >= 0) {
      const seq = sequences[lastDecryptedSequence]
      const count = seq?.itemCount ?? 4
      stateRef.current.activeFillingSeq = lastDecryptedSequence
      stateRef.current.filledSlotStep = 0

      const intervals: Array<ReturnType<typeof setTimeout>> = []
      for (let s = 1; s <= count; s++) {
        intervals.push(
          setTimeout(() => {
            stateRef.current.filledSlotStep = s
          }, s * 320)
        )
      }

      const finishTimer = setTimeout(() => {
        stateRef.current.activeFillingSeq = null
        stateRef.current.filledSlotStep = count
      }, (count + 2) * 320)

      return () => {
        intervals.forEach(clearTimeout)
        clearTimeout(finishTimer)
      }
    }
  }, [lastDecryptedSequence, sequences])

  // Countdown temporarily disabled for reflection
  // useEffect(() => {
  //   if (isSolved) return
  //   const timer = setInterval(() => {
  //     setTimeLeft((prev) => {
  //       if (prev <= 1) {
  //         clearInterval(timer)
  //         onTimeout()
  //         return 0
  //       }
  //       return prev - 1
  //     })
  //   }, 1000)
  //   return () => clearInterval(timer)
  // }, [isSolved, onTimeout])

  // PixiJS Magic Altar & Spinning Magic Rings Canvas
  useEffect(() => {
    const domElement = canvasContainerRef.current
    if (!domElement) return

    let isDestroyed = false
    const app = new Application()

    let resizeObserver: ResizeObserver | null = null

    const initPixi = async () => {
      try {
        const initialW = domElement.clientWidth || 800
        const initialH = domElement.clientHeight || 144

        await app.init({
          width: initialW,
          height: initialH,
          backgroundColor: 0x181825,
          backgroundAlpha: 0.95,
          antialias: true,
          resolution: (typeof window !== 'undefined' && window.devicePixelRatio) || 1,
          autoDensity: true,
        })

        if (isDestroyed) {
          app.destroy(true, { children: true })
          return
        }

        const canvas = app.canvas as HTMLCanvasElement
        canvas.style.position = 'absolute'
        canvas.style.inset = '0'
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        canvas.style.display = 'block'
        canvas.style.userSelect = 'none'

        domElement.appendChild(canvas)
        appRef.current = app

        // Dynamic ResizeObserver to guarantee WebGL canvas stays synced with DOM parent
        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect
            if (width > 0 && height > 0 && appRef.current) {
              appRef.current.renderer.resize(width, height)
            }
          }
        })
        resizeObserver.observe(domElement)

        const stageContainer = new Container()
        app.stage.addChild(stageContainer)

        // Background Battle Atmosphere / Card panels
        const bgGfx = new Graphics()
        stageContainer.addChild(bgGfx)

        // Ground/Altar Base Lines
        const altarGfx = new Graphics()
        stageContainer.addChild(altarGfx)

        // Magic Rings Sacred Geometry Layer
        const magicRingsGfx = new Graphics()
        stageContainer.addChild(magicRingsGfx)

        // Left-to-Right Rune Slots Layer
        const runeSlotsGfx = new Graphics()
        stageContainer.addChild(runeSlotsGfx)

        // Sparkle and burst particle layer
        const sparksGfx = new Graphics()
        stageContainer.addChild(sparksGfx)

        app.ticker.add(() => {
          const t = performance.now() * 0.001
          const width = app.screen.width || domElement.clientWidth || 800
          const height = app.screen.height || domElement.clientHeight || 144
          const { sequences: seqs, currentSequenceIndex: curIdx, isSolved: solved, activeFillingSeq, filledSlotStep } = stateRef.current

          bgGfx.clear()
          altarGfx.clear()
          magicRingsGfx.clear()
          runeSlotsGfx.clear()
          sparksGfx.clear()

          const numCards = Math.max(1, seqs.length)
          const cardGap = 12
          const cardWidth = Math.min(340, (width - (numCards + 1) * cardGap) / numCards)
          const totalWidth = numCards * cardWidth + (numCards - 1) * cardGap
          const startX = Math.max(8, (width - totalWidth) / 2)
          const cardHeight = Math.min(116, height - 16)
          const cardY = (height - cardHeight) / 2

          // Render each Sequence Card with its Spinning Magic Ring & Left-to-Right Rune Slots
          seqs.forEach((seq, idx) => {
            const cx = startX + idx * (cardWidth + cardGap)
            const cy = cardY
            const isCleared = seq.isCleared || solved
            const isCurrent = idx === curIdx && !solved
            const isAnimating = activeFillingSeq === idx

            // Card Panel Background (Border-free / Seamless canvas atmosphere)
            bgGfx.roundRect(cx, cy, cardWidth, cardHeight, 14)
              .fill({ color: isCleared ? 0x232634 : isCurrent ? 0x24273a : 0x181825, alpha: 0.6 })

            // ─── 1. DRAW SACRED GEOMETRY SPINNING MAGIC RING (Left side of card) ───
            const ringCenterX = cx + 42
            const ringCenterY = cy + cardHeight / 2
            const ringRadius = 28

            // Outer Magic Glow Aura
            if (isCleared || isCurrent) {
              const auraColor = isCleared ? 0xa6d189 : 0xca9ee6
              const auraAlpha = Math.sin(t * 3 + idx) * 0.08 + 0.15
              magicRingsGfx.circle(ringCenterX, ringCenterY, ringRadius + 8)
                .fill({ color: auraColor, alpha: auraAlpha })
            }

            // Outer Concentric Glyph Circle
            const outerSpin = isCleared ? t * 0.9 : isCurrent ? t * 0.45 : 0
            magicRingsGfx.circle(ringCenterX, ringCenterY, ringRadius)
              .stroke({ width: 1.5, color: isCleared ? 0xa6d189 : isCurrent ? 0xca9ee6 : 0x626880, alpha: 0.9 })

            // Middle Dashed Concentric Circle
            magicRingsGfx.circle(ringCenterX, ringCenterY, ringRadius - 4)
              .stroke({ width: 1.0, color: isCleared ? 0xe5c890 : isCurrent ? 0x8caaee : 0x414559, alpha: 0.6 })

            // 12 Outer Ring Rune Tick Marks & Rune Nodes
            for (let i = 0; i < 12; i++) {
              const angle = outerSpin + (i * Math.PI * 2) / 12
              const r1 = ringRadius - 3.5
              const r2 = ringRadius + (i % 3 === 0 ? 3.5 : 1.0)
              magicRingsGfx.moveTo(ringCenterX + Math.cos(angle) * r1, ringCenterY + Math.sin(angle) * r1)
                .lineTo(ringCenterX + Math.cos(angle) * r2, ringCenterY + Math.sin(angle) * r2)
                .stroke({ width: 1.4, color: isCleared ? 0xe5c890 : isCurrent ? 0xca9ee6 : 0x51576d })

              // Mini Orb on 4 cardinal points
              if (i % 3 === 0) {
                magicRingsGfx.circle(ringCenterX + Math.cos(angle) * (ringRadius + 3.5), ringCenterY + Math.sin(angle) * (ringRadius + 3.5), 1.5)
                  .fill({ color: isCleared ? 0xa6d189 : 0xe5c890, alpha: 0.9 })
              }
            }

            // Inner Rotating Sacred Geometry (Interlocking Dual Triangles / Hexagram)
            const innerSpin = -(isCleared ? t * 1.3 : isCurrent ? t * 0.65 : 0)
            const innerR = ringRadius * 0.62
            const tri1: number[] = []
            const tri2: number[] = []
            for (let i = 0; i < 3; i++) {
              const a1 = innerSpin + (i * Math.PI * 2) / 3
              const a2 = innerSpin + Math.PI / 3 + (i * Math.PI * 2) / 3
              tri1.push(ringCenterX + Math.cos(a1) * innerR, ringCenterY + Math.sin(a1) * innerR)
              tri2.push(ringCenterX + Math.cos(a2) * innerR, ringCenterY + Math.sin(a2) * innerR)
            }
            magicRingsGfx.poly(tri1).stroke({ width: 1.2, color: isCleared ? 0xe5c890 : isCurrent ? 0x8caaee : 0x414559, alpha: 0.8 })
            magicRingsGfx.poly(tri2).stroke({ width: 1.2, color: isCleared ? 0xa6d189 : isCurrent ? 0xca9ee6 : 0x414559, alpha: 0.8 })

            // Center Magic Core with pulsating radiance
            const coreColor = isCleared ? 0xe5c890 : isCurrent ? 0xca9ee6 : 0x414559
            const corePulse = Math.sin(t * 5 + idx) * 1.5 + 4.5
            magicRingsGfx.circle(ringCenterX, ringCenterY, corePulse)
              .fill({ color: coreColor, alpha: isCleared ? 0.95 : 0.75 })

            // ─── 2. DRAW LEFT-TO-RIGHT RUNE SLOTS (Floating illuminated runes connected to ring) ───
            const slotsStartX = ringCenterX + ringRadius + 16
            const slotsAreaWidth = cx + cardWidth - slotsStartX - 12
            const itemCount = Math.max(1, seq.itemCount)
            const slotGap = 8
            const slotWidth = Math.min(46, (slotsAreaWidth - (itemCount - 1) * slotGap) / itemCount)
            const slotHeight = 36
            const slotY = cy + cardHeight / 2 - slotHeight / 2

            // Flow energy beam connecting ring to rune line with advancing progress
            const activeStep = isAnimating ? filledSlotStep : (isCleared ? itemCount : 0)
            const targetX = slotsStartX + Math.max(0, activeStep - 1) * (slotWidth + slotGap) + slotWidth / 2

            // Inactive base beam
            runeSlotsGfx.moveTo(ringCenterX + ringRadius, cy + cardHeight / 2)
              .lineTo(slotsStartX + (itemCount - 1) * (slotWidth + slotGap) + slotWidth / 2, cy + cardHeight / 2)
              .stroke({
                width: 1.2,
                color: 0x414559,
                alpha: 0.25,
              })

            // Energized active beam traversing left-to-right
            if (activeStep > 0) {
              runeSlotsGfx.moveTo(ringCenterX + ringRadius, cy + cardHeight / 2)
                .lineTo(targetX, cy + cardHeight / 2)
                .stroke({
                  width: 2.0,
                  color: isCleared ? 0xa6d189 : 0xe5c890,
                  alpha: 0.85,
                })
            }

            for (let s = 0; s < itemCount; s++) {
              const sx = slotsStartX + s * (slotWidth + slotGap)
              const isSlotDecrypted = isCleared || (isAnimating && filledSlotStep >= s + 1)
              const isSlotJustFilled = isAnimating && filledSlotStep === s + 1
              const runeCenterX = sx + slotWidth / 2
              const runeCenterY = slotY + slotHeight / 2

              if (isSlotDecrypted) {
                // Soft glowing aura behind decrypted rune (seamless, no border edge)
                const auraRadius = isSlotJustFilled ? 18 + Math.sin(t * 8) * 3 : 14
                runeSlotsGfx.circle(runeCenterX, runeCenterY, auraRadius)
                  .fill({ color: isSlotJustFilled ? 0xe5c890 : 0x8caaee, alpha: isSlotJustFilled ? 0.35 : 0.08 })

                // Expanding golden shockwave ring on newly unlocked rune
                if (isSlotJustFilled) {
                  runeSlotsGfx.circle(runeCenterX, runeCenterY, 20)
                    .stroke({ width: 1.5, color: 0xe5c890, alpha: 0.9 })
                }

                // Draw Sacred Rune Emblem Glyphs using vectors
                // Center Rune Staff
                runeSlotsGfx.moveTo(runeCenterX, runeCenterY - 12)
                  .lineTo(runeCenterX, runeCenterY + 12)
                  .stroke({ width: 2.2, color: 0xe5c890, alpha: 0.95 })

                // Rune Branches
                if (s % 3 === 0) {
                  // Fehu / Algiz style branches
                  runeSlotsGfx.moveTo(runeCenterX, runeCenterY - 4)
                    .lineTo(runeCenterX + 7, runeCenterY - 11)
                    .stroke({ width: 1.8, color: 0xe5c890, alpha: 0.95 })
                  runeSlotsGfx.moveTo(runeCenterX, runeCenterY + 3)
                    .lineTo(runeCenterX + 7, runeCenterY - 4)
                    .stroke({ width: 1.8, color: 0xe5c890, alpha: 0.95 })
                } else if (s % 3 === 1) {
                  // Berkana / Thurisaz style chevron
                  runeSlotsGfx.moveTo(runeCenterX, runeCenterY - 9)
                    .lineTo(runeCenterX + 7, runeCenterY - 2)
                    .lineTo(runeCenterX, runeCenterY + 5)
                    .stroke({ width: 1.8, color: 0xe5c890, alpha: 0.95 })
                } else {
                  // Othala / Dagaz diamond
                  runeSlotsGfx.moveTo(runeCenterX, runeCenterY - 8)
                    .lineTo(runeCenterX + 6, runeCenterY)
                    .lineTo(runeCenterX, runeCenterY + 8)
                    .lineTo(runeCenterX - 6, runeCenterY)
                    .closePath()
                    .stroke({ width: 1.8, color: 0xe5c890, alpha: 0.95 })
                }
              } else {
                // Subtle glowing node circle for encrypted position (no hard box)
                runeSlotsGfx.circle(runeCenterX, runeCenterY, 4)
                  .fill({ color: 0x414559, alpha: 0.6 })
                  .stroke({ width: 1.0, color: 0x626880, alpha: 0.5 })
              }

              // Sparkles on newly filled slot during cascade
              if (isSlotJustFilled) {
                for (let k = 0; k < 8; k++) {
                  const sparkAngle = t * 14 + (k * Math.PI) / 4
                  const spX = runeCenterX + Math.cos(sparkAngle) * 18
                  const spY = runeCenterY + Math.sin(sparkAngle) * 18
                  sparksGfx.circle(spX, spY, 2.2).fill({ color: 0xe5c890, alpha: 0.95 })
                }
              }
            }
          })
        })
      } catch (err) {
        console.error('PixiJS RunicCountdownRing init failed:', err)
      }
    }

    initPixi()

    return () => {
      isDestroyed = true
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      if (appRef.current) {
        appRef.current.destroy(true, { children: true })
        appRef.current = null
      }
    }
  }, [])

  const clearedCount = sequences.filter((s) => s.isCleared).length

  return (
    <div className="flex flex-col gap-2.5 bg-[#1e1e2e]/95 p-3 rounded-2xl border border-[#ca9ee6]/40 shadow-2xl backdrop-blur-md">
      {/* Top Header Bar: Status Badge & Title */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 border transition-all duration-500 shadow-md ${
            isSolved ? 'bg-[#a6d189]/25 border-[#a6d189] text-[#a6d189] shadow-[0_0_20px_rgba(166,209,137,0.4)]' :
            'bg-[#ca9ee6]/20 border-[#ca9ee6]/50 text-[#ca9ee6] shadow-[0_0_15px_rgba(202,158,230,0.25)]'
          }`}>
            {isSolved ? '✨' : '🔮'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-extrabold tracking-wide block ${isSolved ? 'text-[#a6d189]' : 'text-[#ca9ee6]'}`}>
                {isSolved ? 'Runic Cipher Decrypted!' : 'Arcane Decryption Challenge'}
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#181825] border border-[#ca9ee6]/40 text-[#ca9ee6] font-mono font-bold">
                {clearedCount}/{sequences.length} Circles Active
              </span>
            </div>
            <span className="text-xs text-[#a5adce]">
              {isSolved
                ? 'All arcane circles energized! Ancient lifecycle contract deciphered.'
                : 'Solve each sequence: Magic characters will decrypt left-to-right and activate its spinning magic ring!'}
            </span>
          </div>
        </div>
      </div>

      {/* PixiJS Canvas Viewport for Spinning Magic Rings & Left-to-Right Arcane Decryption */}
      <div className="relative w-full h-36 min-h-[140px] bg-[#181825] rounded-xl border border-[#414559] overflow-hidden shadow-inner">
        <div ref={canvasContainerRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  )
}
