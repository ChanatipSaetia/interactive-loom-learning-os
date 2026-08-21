import React, { useState, useEffect } from 'react'
import { Timer, Sparkles, Lock, CheckCircle2 } from 'lucide-react'

// Ancient Arcane Rune Glyph dictionary
const ARCANE_RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ']

interface RunicCountdownRingProps {
  durationSeconds?: number
  isSolved: boolean
  evasionBonusSeconds?: number
  intelligenceChance?: number
  onTimeout: () => void
  onStatTriggered?: (stat: 'evasion' | 'intelligence', details: string) => void
  totalSlots?: number
  clearedSlots?: number
  lastDecryptedSlot?: number
}

export const RunicCountdownRing: React.FC<RunicCountdownRingProps> = ({
  durationSeconds = 45,
  isSolved,
  evasionBonusSeconds = 0,
  intelligenceChance = 0,
  onTimeout,
  onStatTriggered,
  totalSlots = 3,
  clearedSlots = 0,
  lastDecryptedSlot,
}) => {
  // Evasion provides extra reaction time (+seconds based on Evasion attribute)
  const totalDuration = durationSeconds + Math.round(evasionBonusSeconds * 0.3)
  const [timeLeft, setTimeLeft] = useState(totalDuration)
  const [animatingSlot, setAnimatingSlot] = useState<number | null>(null)

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

  // Trigger decrypt burst animation when a new slot is cleared
  useEffect(() => {
    if (lastDecryptedSlot !== undefined && lastDecryptedSlot >= 0) {
      setAnimatingSlot(lastDecryptedSlot)
      const timer = setTimeout(() => setAnimatingSlot(null), 1800)
      return () => clearTimeout(timer)
    }
  }, [lastDecryptedSlot, clearedSlots])

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
  const effectiveSlots = Math.max(1, totalSlots)

  return (
    <div className="flex flex-col gap-2.5 bg-[#232634] p-3 rounded-2xl border border-[#ca9ee6]/30 shadow-lg">
      {/* Top Bar: Icon, Title & Countdown Timer */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border transition-all duration-300 ${
            isSolved ? 'bg-[#a6d189]/20 border-[#a6d189]/40 text-[#a6d189] shadow-[0_0_12px_rgba(166,209,137,0.3)]' :
            isUrgent ? 'bg-[#e78284]/20 border-[#e78284]/40 text-[#e78284] animate-pulse' :
            'bg-[#ca9ee6]/20 border-[#ca9ee6]/40 text-[#ca9ee6]'
          }`}>
            {isSolved ? '✨' : '🔮'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold block ${isSolved ? 'text-[#a6d189]' : 'text-[#ca9ee6]'}`}>
                {isSolved ? 'Runic Cipher Decrypted!' : 'Timed Magic Decryption Challenge'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#181825] border border-[#ca9ee6]/30 text-[#ca9ee6] font-mono">
                {clearedSlots}/{effectiveSlots} Decoded
              </span>
            </div>
            <span className="text-xs text-[#a5adce]">
              {isSolved
                ? 'All magic sequence slots unlocked! Contract cipher collected.'
                : 'Solve each sequence to decrypt and bind the magic glyph into its cipher slot!'}
            </span>
          </div>
        </div>

        {!isSolved && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-[#a5adce] block">Time Remaining</span>
              <span className={`text-sm font-mono font-bold ${isUrgent ? 'text-[#e78284] animate-pulse' : 'text-[#ca9ee6]'}`}>
                {timeLeft}s
              </span>
            </div>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
              isUrgent ? 'border-[#e78284]' : 'border-[#ca9ee6]'
            }`}>
              <Timer size={14} className={isUrgent ? 'text-[#e78284]' : 'text-[#ca9ee6]'} />
            </div>
          </div>
        )}
      </div>

      {/* Runic Magic Slot Progression Bar */}
      <div className="bg-[#181825] p-2.5 rounded-xl border border-[#414559]/70 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-xs text-[#ca9ee6] font-mono font-bold mr-2 shrink-0">
          <Sparkles size={13} className="text-[#e5c890] animate-pulse" />
          <span>MAGIC SLOTS:</span>
        </div>

        <div className="flex items-center gap-3 flex-1 justify-around">
          {Array.from({ length: effectiveSlots }).map((_, idx) => {
            const isSlotDecrypted = idx < clearedSlots || isSolved
            const isCurrentAnim = animatingSlot === idx
            const runeChar = ARCANE_RUNES[(idx * 7 + 3) % ARCANE_RUNES.length]

            return (
              <div
                key={idx}
                className={`relative flex-1 max-w-[140px] h-11 rounded-xl border flex items-center justify-between px-3 transition-all duration-500 ${
                  isSlotDecrypted
                    ? 'bg-gradient-to-r from-[#ca9ee6]/20 to-[#8caaee]/20 border-[#ca9ee6] shadow-[0_0_15px_rgba(202,158,230,0.35)]'
                    : 'bg-[#232634] border-[#414559] opacity-60'
                } ${isCurrentAnim ? 'scale-105 ring-2 ring-[#e5c890] animate-bounce' : ''}`}
              >
                {/* Slot index badge */}
                <span className="text-[10px] font-mono font-bold text-[#a5adce]">
                  #{idx + 1}
                </span>

                {/* Magic Decrypted Character Glyph */}
                <div className="flex items-center gap-1.5">
                  {isSlotDecrypted ? (
                    <>
                      <span className="text-lg font-bold font-serif text-[#e5c890] animate-pulse drop-shadow-[0_0_8px_rgba(229,200,144,0.8)]">
                        {runeChar}
                      </span>
                      <CheckCircle2 size={13} className="text-[#a6d189]" />
                    </>
                  ) : (
                    <div className="flex items-center gap-1 text-[#626880]">
                      <Lock size={12} />
                      <span className="text-xs font-mono">ENCRYPTED</span>
                    </div>
                  )}
                </div>

                {/* Magic Burst Particles during decryption */}
                {isCurrentAnim && (
                  <span className="absolute -top-2 -right-1 text-xs animate-ping text-[#e5c890]">
                    ✨
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
