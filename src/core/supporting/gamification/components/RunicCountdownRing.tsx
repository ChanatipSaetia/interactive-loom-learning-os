import React, { useState, useEffect } from 'react'
import { Timer, Sparkles, CheckCircle2 } from 'lucide-react'

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
  // Evasion provides extra reaction time (+seconds based on Evasion attribute)
  const totalDuration = durationSeconds + Math.round(evasionBonusSeconds * 0.3)
  const [timeLeft, setTimeLeft] = useState(totalDuration)
  const [activeFillingSeq, setActiveFillingSeq] = useState<number | null>(null)
  const [filledSlotStep, setFilledSlotStep] = useState<number>(-1)

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
      setActiveFillingSeq(lastDecryptedSequence)
      setFilledSlotStep(0)

      const intervals: Array<ReturnType<typeof setTimeout>> = []
      for (let s = 1; s <= count; s++) {
        intervals.push(
          setTimeout(() => {
            setFilledSlotStep(s)
          }, s * 220)
        )
      }

      const finishTimer = setTimeout(() => {
        setActiveFillingSeq(null)
      }, (count + 2) * 220)

      return () => {
        intervals.forEach(clearTimeout)
        clearTimeout(finishTimer)
      }
    }
  }, [lastDecryptedSequence])

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

  const isUrgent = timeLeft <= 10
  const clearedCount = sequences.filter((s) => s.isCleared).length

  return (
    <div className="flex flex-col gap-3 bg-[#1e1e2e]/95 p-3.5 rounded-2xl border border-[#ca9ee6]/40 shadow-2xl backdrop-blur-md">
      {/* Top Header Bar: Status Badge, Title & Countdown Timer */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0 border transition-all duration-500 shadow-md ${
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
            <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shadow-inner ${
              isUrgent ? 'border-[#e78284] bg-[#e78284]/15' : 'border-[#ca9ee6] bg-[#ca9ee6]/15'
            }`}>
              <Timer size={15} className={isUrgent ? 'text-[#e78284] animate-spin' : 'text-[#ca9ee6]'} />
            </div>
          </div>
        )}
      </div>

      {/* Grid of Spinning Magic Rings & Left-to-Right Rune Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sequences.map((seq, seqIdx) => {
          const isCurrentActive = seqIdx === currentSequenceIndex && !isSolved
          const isCleared = seq.isCleared || isSolved
          const isAnimatingThisSeq = activeFillingSeq === seqIdx

          return (
            <div
              key={seqIdx}
              className={`relative p-3 rounded-xl border transition-all duration-500 flex flex-col gap-2.5 ${
                isCleared
                  ? 'bg-gradient-to-br from-[#232634] via-[#1e1e2e] to-[#292c3c] border-[#a6d189]/60 shadow-[0_0_18px_rgba(166,209,137,0.2)]'
                  : isCurrentActive
                  ? 'bg-[#232634] border-[#ca9ee6] ring-1 ring-[#ca9ee6]/50 shadow-[0_0_20px_rgba(202,158,230,0.25)]'
                  : 'bg-[#181825]/80 border-[#414559] opacity-60'
              }`}
            >
              {/* Top Bar of Ring Card */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Spinning Magic Ring Circle */}
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    {/* Outer Rotating Magic Ring */}
                    <div
                      className={`absolute inset-0 rounded-full border border-dashed transition-all duration-700 ${
                        isCleared
                          ? 'border-[#a6d189] animate-[spin_4s_linear_infinite] shadow-[0_0_10px_rgba(166,209,137,0.5)]'
                          : isCurrentActive
                          ? 'border-[#ca9ee6] animate-[spin_8s_linear_infinite]'
                          : 'border-[#626880]'
                      }`}
                    />
                    {/* Inner Rotating Magic Core */}
                    <div
                      className={`absolute inset-1 rounded-full border transition-all duration-700 ${
                        isCleared
                          ? 'border-[#e5c890] animate-[spin_2.5s_linear_infinite_reverse]'
                          : isCurrentActive
                          ? 'border-[#8caaee] animate-[spin_6s_linear_infinite_reverse]'
                          : 'border-[#414559]'
                      }`}
                    />
                    {/* Center Core Glyph */}
                    <span className="text-xs font-bold font-serif relative z-10">
                      {isCleared ? '✨' : isCurrentActive ? '🔮' : '🔒'}
                    </span>
                  </div>

                  <div>
                    <span className={`text-xs font-bold block ${isCleared ? 'text-[#a6d189]' : isCurrentActive ? 'text-[#ca9ee6]' : 'text-[#a5adce]'}`}>
                      Magic Ring #{seqIdx + 1}
                    </span>
                    <span className="text-[10px] text-[#a5adce]">
                      {seq.itemCount} Sequence Steps
                    </span>
                  </div>
                </div>

                {/* State Tag */}
                <div className="flex items-center gap-1">
                  {isCleared ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#a6d189]/20 border border-[#a6d189]/40 text-[#a6d189] font-bold flex items-center gap-1">
                      <CheckCircle2 size={11} /> ENERGIZED
                    </span>
                  ) : isCurrentActive ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#ca9ee6]/20 border border-[#ca9ee6]/40 text-[#ca9ee6] font-bold flex items-center gap-1 animate-pulse">
                      <Sparkles size={11} className="text-[#e5c890]" /> DECRYPTING
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#181825] border border-[#414559] text-[#626880] font-mono">
                      DORMANT
                    </span>
                  )}
                </div>
              </div>

              {/* Left-to-Right Sequence Magic Character Slots */}
              <div className="flex items-center gap-1.5 pt-1">
                {Array.from({ length: seq.itemCount }).map((_, slotIdx) => {
                  // Determine if this slot is decrypted
                  const isSlotDecrypted =
                    isCleared ||
                    (isAnimatingThisSeq && filledSlotStep >= slotIdx + 1)

                  const isSlotJustFilled =
                    isAnimatingThisSeq && filledSlotStep === slotIdx + 1

                  const runeChar = ARCANE_RUNES[(seqIdx * 5 + slotIdx * 3 + 2) % ARCANE_RUNES.length]

                  return (
                    <div
                      key={slotIdx}
                      className={`relative flex-1 h-9 rounded-lg border flex items-center justify-center transition-all duration-300 ${
                        isSlotDecrypted
                          ? 'bg-gradient-to-b from-[#ca9ee6]/25 to-[#8caaee]/20 border-[#ca9ee6] text-[#e5c890] shadow-[0_0_12px_rgba(229,200,144,0.4)]'
                          : 'bg-[#181825] border-[#414559] text-[#626880]'
                      } ${isSlotJustFilled ? 'scale-110 ring-2 ring-[#e5c890] bg-[#e5c890]/30 animate-pulse' : ''}`}
                    >
                      {isSlotDecrypted ? (
                        <span className="text-base font-bold font-serif drop-shadow-[0_0_6px_rgba(229,200,144,0.9)] animate-pulse">
                          {runeChar}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono opacity-40">
                          {slotIdx + 1}
                        </span>
                      )}

                      {/* Spark particle on newly filled slot */}
                      {isSlotJustFilled && (
                        <span className="absolute -top-2 text-xs text-[#e5c890] animate-ping">
                          ✨
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
