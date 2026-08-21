import React, { useState, useEffect } from 'react'
import { Timer } from 'lucide-react'

interface RunicCountdownRingProps {
  durationSeconds?: number
  isSolved: boolean
  onTimeout: () => void
}

export const RunicCountdownRing: React.FC<RunicCountdownRingProps> = ({
  durationSeconds = 45,
  isSolved,
  onTimeout,
}) => {
  const [timeLeft, setTimeLeft] = useState(durationSeconds)

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

  return (
    <div className="flex items-center justify-between gap-4 bg-[#232634] p-3 rounded-2xl border border-[#ca9ee6]/30">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border ${
          isSolved ? 'bg-[#a6d189]/20 border-[#a6d189]/40 text-[#a6d189]' :
          isUrgent ? 'bg-[#e78284]/20 border-[#e78284]/40 text-[#e78284] animate-pulse' :
          'bg-[#ca9ee6]/20 border-[#ca9ee6]/40 text-[#ca9ee6]'
        }`}>
          {isSolved ? '✨' : '🔮'}
        </div>
        <div>
          <span className={`text-sm font-bold block ${isSolved ? 'text-[#a6d189]' : 'text-[#ca9ee6]'}`}>
            {isSolved ? 'Runic Cipher Decrypted!' : 'Timed Magic Decryption Challenge'}
          </span>
          <span className="text-xs text-[#a5adce]">
            {isSolved
              ? 'Port Blade contract deciphered and collected!'
              : 'Reorder the lifecycle steps before ancient magic destabilizes!'}
          </span>
        </div>
      </div>

      {!isSolved && (
        <div className="flex items-center gap-3">
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
  )
}
