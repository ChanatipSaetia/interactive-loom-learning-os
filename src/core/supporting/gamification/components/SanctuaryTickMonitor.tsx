import React, { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { Badge } from '../../../ui-system'

interface SanctuaryTickMonitorProps {
  healingAmount?: number
  visitCount: number
  chaosLevel?: number
  pulsesUsed?: number
  maxTicks?: number
  onTickHeal: (tickAmount: number) => void
}

export const SanctuaryTickMonitor: React.FC<SanctuaryTickMonitorProps> = ({
  visitCount,
  pulsesUsed = 0,
  maxTicks = 5,
  onTickHeal,
}) => {
  const [secondsInSanctuary, setSecondsInSanctuary] = useState(0)
  const [tickProgress, setTickProgress] = useState(0)
  const [sessionTicks, setSessionTicks] = useState(0)
  const [floatingParticles, setFloatingParticles] = useState<Array<{ id: number; text: string }>>([])
  const [isTabActive, setIsTabActive] = useState<boolean>(
    typeof document !== 'undefined' ? !document.hidden : true
  )

  // Track document visibility state (only heal when user sees the browser)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Diminishing returns multiplier: visit 1 -> 1.0x, visit 2 -> 0.5x, visit 3+ -> 0.2x
  const decayMultiplier = visitCount <= 1 ? 1.0 : visitCount === 2 ? 0.5 : 0.2
  const effectiveTickHeal = Math.max(2, Math.round(10 * decayMultiplier))
  const currentTotalPulses = pulsesUsed + sessionTicks
  const isMaxTicksReached = currentTotalPulses >= maxTicks

  useEffect(() => {
    if (isMaxTicksReached) return

    const interval = setInterval(() => {
      // Only count seconds when tab is active and visible
      if (document.hidden) return

      setSecondsInSanctuary((prev) => {
        const next = prev + 1
        const progress = ((next % 10) / 10) * 100
        setTickProgress(progress)

        // Trigger 10-second tick heal up to maxTicks globally across campaign
        if (next > 0 && next % 10 === 0) {
          setSessionTicks((prevSession) => {
            const nextTotal = pulsesUsed + prevSession + 1
            if (nextTotal > maxTicks) return prevSession
            onTickHeal(effectiveTickHeal)
            const particleId = Date.now()
            setFloatingParticles((p) => [
              ...p,
              { id: particleId, text: `+${effectiveTickHeal} HP Restored (${nextTotal}/${maxTicks})` },
            ])
            setTimeout(() => {
              setFloatingParticles((p) => p.filter((item) => item.id !== particleId))
            }, 2500)
            return prevSession + 1
          })
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [effectiveTickHeal, isMaxTicksReached, maxTicks, onTickHeal, pulsesUsed])

  return (
    <div className="flex items-center justify-between gap-4 bg-[#232634] p-3 rounded-2xl border border-[#a6d189]/30 relative overflow-hidden">
      {/* Left: Sanctuary Presence Status */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#a6d189]/20 border border-[#a6d189]/40 flex items-center justify-center text-xl text-[#a6d189] shrink-0">
          🏛️
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#a6d189]">Active Reading Sanctuary</span>
            <Badge variant="success" className="text-[10px]">
              {decayMultiplier * 100}% Potency (Visit #{visitCount || 1})
            </Badge>
            <Badge variant={isMaxTicksReached ? 'secondary' : 'default'} className="text-[10px]">
              {isMaxTicksReached ? `Depleted (${currentTotalPulses}/${maxTicks})` : `${currentTotalPulses}/${maxTicks} Global Pulses`}
            </Badge>
            {!isTabActive && (
              <Badge variant="warning" className="text-[10px] animate-pulse">
                Paused (Tab Inactive)
              </Badge>
            )}
          </div>
          <span className="text-xs text-[#a5adce]">
            {isMaxTicksReached
              ? 'Sanctuary pulses exhausted for this campaign. Revisit or restart campaign.'
              : !isTabActive
              ? 'Healing is paused while viewing other tabs.'
              : `Active reading: ${secondsInSanctuary}s · Ticks every 10s (${maxTicks - currentTotalPulses} remaining)`}
          </span>
        </div>
      </div>

      {/* Center: Floating Healing Particles */}
      <div className="relative h-8 flex items-center justify-center min-w-[140px]">
        {floatingParticles.map((particle) => (
          <span
            key={particle.id}
            className="absolute font-bold text-xs text-[#a6d189] animate-bounce tracking-wide"
          >
            ✨ {particle.text}
          </span>
        ))}
      </div>

      {/* Right: 10s Progress Ring & Chaos Status */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <span className="text-[10px] text-[#a5adce] block">
            {isMaxTicksReached ? 'Exhausted' : !isTabActive ? 'Paused' : 'Next Pulse'}
          </span>
          <span className="text-xs font-mono font-bold text-[#a6d189]">
            {isMaxTicksReached ? `${currentTotalPulses}/${maxTicks}` : !isTabActive ? '⏸️' : `${10 - (secondsInSanctuary % 10)}s`}
          </span>
        </div>
        <div className="w-8 h-8 rounded-full border-2 border-[#303446] relative flex items-center justify-center">
          <div
            className="w-full h-full rounded-full border-2 border-[#a6d189] transition-all duration-300"
            style={{ clipPath: `polygon(0 0, 100% 0, 100% ${tickProgress}%, 0 ${tickProgress}%)` }}
          />
          <Heart size={12} className="text-[#a6d189] absolute" />
        </div>
      </div>
    </div>
  )
}
