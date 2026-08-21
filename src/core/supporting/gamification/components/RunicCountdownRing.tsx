import React, { useState, useEffect, useRef } from 'react'
import { Application, Container, Graphics } from 'pixi.js'
import { Timer } from 'lucide-react'

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
  durationSeconds = 45,
  isSolved,
  evasionBonusSeconds = 0,
  intelligenceChance = 0,
  onTimeout,
  onStatTriggered,
  sequences = [{ index: 0, itemCount: 4, isCleared: false }],
  currentSequenceIndex = 0,
  lastDecryptedSequence,
}) => {
  const totalDuration = durationSeconds + Math.round(evasionBonusSeconds * 0.3)
  const [timeLeft, setTimeLeft] = useState(totalDuration)
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
  }, [sequences, currentSequenceIndex, isSolved])

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

  // Left-to-Right cascading rune fill animation when a sequence is completed
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
          }, s * 220)
        )
      }

      const finishTimer = setTimeout(() => {
        stateRef.current.activeFillingSeq = null
      }, (count + 2) * 220)

      return () => {
        intervals.forEach(clearTimeout)
        clearTimeout(finishTimer)
      }
    }
  }, [lastDecryptedSequence, sequences])

  useEffect(() => {
    if (isSolved) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isSolved, onTimeout])

  // PixiJS Magic Altar & Spinning Magic Rings Canvas
  useEffect(() => {
    const domElement = canvasContainerRef.current
    if (!domElement) return

    let isDestroyed = false
    const app = new Application()

    const initPixi = async () => {
      try {
        await app.init({
          resizeTo: domElement,
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

        appRef.current = app
        domElement.appendChild(app.canvas)

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
          const width = app.screen.width
          const height = app.screen.height
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

            // Card Panel Background
            bgGfx.roundRect(cx, cy, cardWidth, cardHeight, 14)
              .fill({ color: isCleared ? 0x232634 : isCurrent ? 0x292c3c : 0x181825, alpha: 0.95 })
              .stroke({
                width: isCleared ? 1.8 : isCurrent ? 1.5 : 1.0,
                color: isCleared ? 0xa6d189 : isCurrent ? 0xca9ee6 : 0x414559,
                alpha: isCleared ? 0.9 : isCurrent ? 0.8 : 0.4,
              })

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

            // ─── 2. DRAW LEFT-TO-RIGHT RUNE SLOTS (Right side of card) ───
            const slotsStartX = ringCenterX + ringRadius + 14
            const slotsAreaWidth = cx + cardWidth - slotsStartX - 10
            const itemCount = Math.max(1, seq.itemCount)
            const slotGap = 6
            const slotWidth = Math.min(44, (slotsAreaWidth - (itemCount - 1) * slotGap) / itemCount)
            const slotHeight = 38
            const slotY = cy + cardHeight / 2 - slotHeight / 2 + 8

            for (let s = 0; s < itemCount; s++) {
              const sx = slotsStartX + s * (slotWidth + slotGap)
              const isSlotDecrypted = isCleared || (isAnimating && filledSlotStep >= s + 1)
              const isSlotJustFilled = isAnimating && filledSlotStep === s + 1

              // Slot Background Box
              runeSlotsGfx.roundRect(sx, slotY, slotWidth, slotHeight, 8)
                .fill({ color: isSlotDecrypted ? 0x303446 : 0x181825, alpha: 0.9 })
                .stroke({
                  width: isSlotDecrypted ? 1.5 : 1.0,
                  color: isSlotDecrypted ? 0xca9ee6 : 0x414559,
                  alpha: isSlotDecrypted ? 0.9 : 0.4,
                })

              if (isSlotDecrypted) {
                // Golden highlight inner border
                runeSlotsGfx.roundRect(sx + 1, slotY + 1, slotWidth - 2, slotHeight - 2, 7)
                  .stroke({ width: 1.0, color: 0xe5c890, alpha: 0.4 })

                // Draw Sacred Rune Emblem Glyphs using vectors
                const runeCenterX = sx + slotWidth / 2
                const runeCenterY = slotY + slotHeight / 2

                // Center Rune Staff
                runeSlotsGfx.moveTo(runeCenterX, runeCenterY - 11)
                  .lineTo(runeCenterX, runeCenterY + 11)
                  .stroke({ width: 2.2, color: 0xe5c890, alpha: 0.95 })

                // Rune Branches
                if (s % 3 === 0) {
                  // Fehu / Algiz style branches
                  runeSlotsGfx.moveTo(runeCenterX, runeCenterY - 4)
                    .lineTo(runeCenterX + 6, runeCenterY - 10)
                    .stroke({ width: 1.8, color: 0xe5c890, alpha: 0.95 })
                  runeSlotsGfx.moveTo(runeCenterX, runeCenterY + 3)
                    .lineTo(runeCenterX + 6, runeCenterY - 3)
                    .stroke({ width: 1.8, color: 0xe5c890, alpha: 0.95 })
                } else if (s % 3 === 1) {
                  // Berkana / Thurisaz style chevron
                  runeSlotsGfx.moveTo(runeCenterX, runeCenterY - 8)
                    .lineTo(runeCenterX + 6, runeCenterY - 2)
                    .lineTo(runeCenterX, runeCenterY + 4)
                    .stroke({ width: 1.8, color: 0xe5c890, alpha: 0.95 })
                } else {
                  // Othala / Dagaz diamond
                  runeSlotsGfx.moveTo(runeCenterX, runeCenterY - 7)
                    .lineTo(runeCenterX + 5, runeCenterY)
                    .lineTo(runeCenterX, runeCenterY + 7)
                    .lineTo(runeCenterX - 5, runeCenterY)
                    .closePath()
                    .stroke({ width: 1.8, color: 0xe5c890, alpha: 0.95 })
                }
              } else {
                // Encrypted Lock Node
                const lockX = sx + slotWidth / 2
                const lockY = slotY + slotHeight / 2
                runeSlotsGfx.rect(lockX - 4, lockY - 1, 8, 7)
                  .fill({ color: 0x414559, alpha: 0.7 })
                runeSlotsGfx.arc(lockX, lockY - 1, 3.5, Math.PI, 0)
                  .stroke({ width: 1.2, color: 0x626880, alpha: 0.7 })
              }

              // Sparkles on newly filled slot during cascade
              if (isSlotJustFilled) {
                for (let k = 0; k < 6; k++) {
                  const sparkAngle = t * 12 + (k * Math.PI) / 3
                  const spX = sx + slotWidth / 2 + Math.cos(sparkAngle) * (slotWidth * 0.55)
                  const spY = slotY + slotHeight / 2 + Math.sin(sparkAngle) * (slotHeight * 0.55)
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
      if (appRef.current) {
        appRef.current.destroy(true, { children: true })
        appRef.current = null
      }
    }
  }, [])

  const isUrgent = timeLeft <= 10
  const clearedCount = sequences.filter((s) => s.isCleared).length

  return (
    <div className="flex flex-col gap-2.5 bg-[#1e1e2e]/95 p-3 rounded-2xl border border-[#ca9ee6]/40 shadow-2xl backdrop-blur-md">
      {/* Top Header Bar: Status Badge, Title & Countdown Timer */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 border transition-all duration-500 shadow-md ${
            isSolved ? 'bg-[#a6d189]/25 border-[#a6d189] text-[#a6d189] shadow-[0_0_20px_rgba(166,209,137,0.4)]' :
            isUrgent ? 'bg-[#e78284]/25 border-[#e78284] text-[#e78284] animate-pulse shadow-[0_0_20px_rgba(231,130,132,0.4)]' :
            'bg-[#ca9ee6]/20 border-[#ca9ee6]/50 text-[#ca9ee6] shadow-[0_0_15px_rgba(202,158,230,0.25)]'
          }`}>
            {isSolved ? '✨' : '🔮'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-extrabold tracking-wide block ${isSolved ? 'text-[#a6d189]' : 'text-[#ca9ee6]'}`}>
                {isSolved ? 'Runic Cipher Decrypted!' : 'Timed Magic Decryption Challenge'}
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

        {!isSolved && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-[#a5adce] block uppercase tracking-wider font-semibold">Decryption Window</span>
              <span className={`text-sm font-mono font-bold ${isUrgent ? 'text-[#e78284] animate-pulse' : 'text-[#ca9ee6]'}`}>
                {timeLeft}s
              </span>
            </div>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-inner ${
              isUrgent ? 'border-[#e78284] bg-[#e78284]/15' : 'border-[#ca9ee6] bg-[#ca9ee6]/15'
            }`}>
              <Timer size={14} className={isUrgent ? 'text-[#e78284] animate-spin' : 'text-[#ca9ee6]'} />
            </div>
          </div>
        )}
      </div>

      {/* PixiJS Canvas Viewport for Spinning Magic Rings & Left-to-Right Arcane Decryption */}
      <div className="relative w-full h-36 min-h-[140px] bg-[#181825] rounded-xl border border-[#414559] overflow-hidden shadow-inner">
        <div ref={canvasContainerRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  )
}
