import React, { useState, useEffect, useRef } from 'react'
import { Application, Container, Graphics, Text } from 'pixi.js'
import { Timer } from 'lucide-react'

// Ancient Arcane Rune Glyph dictionary
const ARCANE_RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ']

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

        const backgroundGfx = new Graphics()
        stageContainer.addChild(backgroundGfx)

        const magicRingsGfx = new Graphics()
        stageContainer.addChild(magicRingsGfx)

        const runeSlotsGfx = new Graphics()
        stageContainer.addChild(runeSlotsGfx)

        const runeTextsContainer = new Container()
        stageContainer.addChild(runeTextsContainer)

        const sparksGfx = new Graphics()
        stageContainer.addChild(sparksGfx)

        // Text cache for rune glyphs
        const textObjects: Text[] = []

        app.ticker.add(() => {
          const t = performance.now() * 0.001
          const width = app.screen.width
          const height = app.screen.height
          const { sequences: seqs, currentSequenceIndex: curIdx, isSolved: solved, activeFillingSeq, filledSlotStep } = stateRef.current

          backgroundGfx.clear()
          magicRingsGfx.clear()
          runeSlotsGfx.clear()
          sparksGfx.clear()

          // Clear previous text glyphs
          textObjects.forEach((txt) => txt.destroy())
          textObjects.length = 0
          runeTextsContainer.removeChildren()

          const numCards = Math.max(1, seqs.length)
          const cardGap = 12
          const cardWidth = Math.min(320, (width - (numCards + 1) * cardGap) / numCards)
          const totalWidth = numCards * cardWidth + (numCards - 1) * cardGap
          const startX = (width - totalWidth) / 2
          const cardHeight = Math.min(108, height - 12)
          const cardY = (height - cardHeight) / 2

          // Render each Sequence Card with its Spinning Magic Ring & Left-to-Right Rune Slots
          seqs.forEach((seq, idx) => {
            const cx = startX + idx * (cardWidth + cardGap)
            const cy = cardY
            const isCleared = seq.isCleared || solved
            const isCurrent = idx === curIdx && !solved
            const isAnimating = activeFillingSeq === idx

            // Card Panel Background
            backgroundGfx.roundRect(cx, cy, cardWidth, cardHeight, 14)
              .fill({ color: isCleared ? 0x232634 : isCurrent ? 0x292c3c : 0x181825, alpha: 0.95 })
              .stroke({
                width: isCleared ? 1.8 : isCurrent ? 1.5 : 1.0,
                color: isCleared ? 0xa6d189 : isCurrent ? 0xca9ee6 : 0x414559,
                alpha: isCleared ? 0.9 : isCurrent ? 0.8 : 0.4,
              })

            // ─── 1. DRAW SACRED GEOMETRY SPINNING MAGIC RING (Left side of card) ───
            const ringCenterX = cx + 38
            const ringCenterY = cy + cardHeight / 2
            const ringRadius = 26

            // Outer Magic Glow Aura
            if (isCleared || isCurrent) {
              const auraColor = isCleared ? 0xa6d189 : 0xca9ee6
              const auraAlpha = (Math.sin(t * 3 + idx) * 0.08 + 0.12)
              magicRingsGfx.circle(ringCenterX, ringCenterY, ringRadius + 6)
                .fill({ color: auraColor, alpha: auraAlpha })
            }

            // Outer Concentric Glyph Circle
            const outerSpin = isCleared ? t * 0.8 : isCurrent ? t * 0.4 : 0
            magicRingsGfx.circle(ringCenterX, ringCenterY, ringRadius)
              .stroke({ width: 1.4, color: isCleared ? 0xa6d189 : isCurrent ? 0xca9ee6 : 0x626880, alpha: 0.85 })

            // 12 Outer Ring Rune Tick Marks
            for (let i = 0; i < 12; i++) {
              const angle = outerSpin + (i * Math.PI * 2) / 12
              const r1 = ringRadius - 2.5
              const r2 = ringRadius + (i % 3 === 0 ? 2.5 : 0)
              magicRingsGfx.moveTo(ringCenterX + Math.cos(angle) * r1, ringCenterY + Math.sin(angle) * r1)
                .lineTo(ringCenterX + Math.cos(angle) * r2, ringCenterY + Math.sin(angle) * r2)
                .stroke({ width: 1.2, color: isCleared ? 0xe5c890 : isCurrent ? 0xca9ee6 : 0x51576d })
            }

            // Inner Rotating Sacred Geometry (Hexagram / Mystic Triangle)
            const innerSpin = -(isCleared ? t * 1.2 : isCurrent ? t * 0.6 : 0)
            const innerR = ringRadius * 0.68
            const polyPoints: number[] = []
            for (let i = 0; i < 6; i++) {
              const angle = innerSpin + (i * Math.PI) / 3
              polyPoints.push(ringCenterX + Math.cos(angle) * innerR, ringCenterY + Math.sin(angle) * innerR)
            }
            magicRingsGfx.poly(polyPoints)
              .stroke({ width: 1.0, color: isCleared ? 0xe5c890 : isCurrent ? 0x8caaee : 0x414559, alpha: 0.75 })

            // Secondary Intersecting Triangle
            const tri1: number[] = []
            const tri2: number[] = []
            for (let i = 0; i < 3; i++) {
              const a1 = innerSpin + (i * Math.PI * 2) / 3
              const a2 = innerSpin + Math.PI / 3 + (i * Math.PI * 2) / 3
              tri1.push(ringCenterX + Math.cos(a1) * innerR, ringCenterY + Math.sin(a1) * innerR)
              tri2.push(ringCenterX + Math.cos(a2) * innerR, ringCenterY + Math.sin(a2) * innerR)
            }
            magicRingsGfx.poly(tri1).stroke({ width: 0.8, color: isCleared ? 0xa6d189 : 0xca9ee6, alpha: 0.6 })
            magicRingsGfx.poly(tri2).stroke({ width: 0.8, color: isCleared ? 0xa6d189 : 0xca9ee6, alpha: 0.6 })

            // Center Magic Core
            const coreColor = isCleared ? 0xe5c890 : isCurrent ? 0xca9ee6 : 0x414559
            const corePulse = Math.sin(t * 4 + idx) * 1.5 + 4
            magicRingsGfx.circle(ringCenterX, ringCenterY, corePulse)
              .fill({ color: coreColor, alpha: isCleared ? 0.95 : 0.7 })

            // ─── 2. DRAW LEFT-TO-RIGHT RUNE SLOTS (Right side of card) ───
            const slotsStartX = ringCenterX + ringRadius + 14
            const slotsAreaWidth = cx + cardWidth - slotsStartX - 10
            const itemCount = Math.max(1, seq.itemCount)
            const slotGap = 6
            const slotWidth = Math.min(42, (slotsAreaWidth - (itemCount - 1) * slotGap) / itemCount)
            const slotHeight = 36
            const slotY = cy + cardHeight / 2 + 6

            // Sequence Title Text in Card
            const titleText = new Text({
              text: `Magic Ring #${idx + 1} (${itemCount} Steps)`,
              style: {
                fontFamily: 'system-ui, sans-serif',
                fontSize: 11,
                fontWeight: 'bold',
                fill: isCleared ? '#a6d189' : isCurrent ? '#ca9ee6' : '#a5adce',
              },
            })
            titleText.position.set(slotsStartX, cy + 12)
            runeTextsContainer.addChild(titleText)
            textObjects.push(titleText)

            for (let s = 0; s < itemCount; s++) {
              const sx = slotsStartX + s * (slotWidth + slotGap)
              const isSlotDecrypted = isCleared || (isAnimating && filledSlotStep >= s + 1)
              const isSlotJustFilled = isAnimating && filledSlotStep === s + 1
              const runeChar = ARCANE_RUNES[(idx * 7 + s * 3 + 2) % ARCANE_RUNES.length]

              // Slot Background Box
              runeSlotsGfx.roundRect(sx, slotY, slotWidth, slotHeight, 8)
                .fill({ color: isSlotDecrypted ? 0x303446 : 0x181825, alpha: 0.9 })
                .stroke({
                  width: isSlotDecrypted ? 1.5 : 1.0,
                  color: isSlotDecrypted ? 0xca9ee6 : 0x414559,
                  alpha: isSlotDecrypted ? 0.9 : 0.4,
                })

              if (isSlotDecrypted) {
                // Glow Box Highlight
                runeSlotsGfx.roundRect(sx + 1, slotY + 1, slotWidth - 2, slotHeight - 2, 7)
                  .stroke({ width: 1.0, color: 0xe5c890, alpha: 0.4 })

                // Render Arcane Rune Character Text
                const runeText = new Text({
                  text: runeChar,
                  style: {
                    fontFamily: 'serif',
                    fontSize: 18,
                    fontWeight: 'bold',
                    fill: '#e5c890',
                  },
                })
                runeText.anchor.set(0.5)
                runeText.position.set(sx + slotWidth / 2, slotY + slotHeight / 2)
                runeTextsContainer.addChild(runeText)
                textObjects.push(runeText)
              } else {
                // Step Number Label in Encrypted Slot
                const numText = new Text({
                  text: `${s + 1}`,
                  style: {
                    fontFamily: 'monospace',
                    fontSize: 10,
                    fill: '#51576d',
                  },
                })
                numText.anchor.set(0.5)
                numText.position.set(sx + slotWidth / 2, slotY + slotHeight / 2)
                runeTextsContainer.addChild(numText)
                textObjects.push(numText)
              }

              // Sparkles on newly filled slot during cascade
              if (isSlotJustFilled) {
                for (let k = 0; k < 4; k++) {
                  const sparkAngle = t * 10 + (k * Math.PI) / 2
                  const spX = sx + slotWidth / 2 + Math.cos(sparkAngle) * (slotWidth * 0.55)
                  const spY = slotY + slotHeight / 2 + Math.sin(sparkAngle) * (slotHeight * 0.55)
                  sparksGfx.circle(spX, spY, 2.0).fill({ color: 0xe5c890, alpha: 0.95 })
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
      <div className="relative w-full h-32 bg-[#181825] rounded-xl border border-[#414559] overflow-hidden shadow-inner">
        <div ref={canvasContainerRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  )
}
