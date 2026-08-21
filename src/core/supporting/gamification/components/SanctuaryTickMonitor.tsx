import React, { useState, useEffect, useRef } from 'react'
import { Heart } from 'lucide-react'
import { Badge } from '../../../ui-system'

interface SanctuaryTickMonitorProps {
  healingAmount?: number
  visitCount: number
  chaosLevel?: number
  pulsesUsed?: number
  maxTicks?: number
  characterHp?: number
  maxCharacterHp?: number
  onTickHeal: (tickAmount: number) => void
}

export const SanctuaryTickMonitor: React.FC<SanctuaryTickMonitorProps> = ({
  visitCount,
  chaosLevel = 0,
  pulsesUsed = 0,
  maxTicks = 5,
  characterHp,
  maxCharacterHp,
  onTickHeal,
}) => {
  const [secondsInSanctuary, setSecondsInSanctuary] = useState(0)
  const [tickProgress, setTickProgress] = useState(0)
  const [floatingParticles, setFloatingParticles] = useState<Array<{ id: number; text: string }>>([])
  const [isTabActive, setIsTabActive] = useState<boolean>(
    typeof document !== 'undefined' ? !document.hidden : true
  )

  const isHpFull = typeof characterHp === 'number' && typeof maxCharacterHp === 'number' && characterHp >= maxCharacterHp
  const isHpFullRef = useRef(isHpFull)
  isHpFullRef.current = isHpFull

  const secondsRef = useRef(0)

  // Keep latest refs to prevent interval re-instantiation and stale closures
  const onTickHealRef = useRef(onTickHeal)
  onTickHealRef.current = onTickHeal

  const pulsesUsedRef = useRef(pulsesUsed)
  pulsesUsedRef.current = pulsesUsed

  const maxTicksRef = useRef(maxTicks)
  maxTicksRef.current = maxTicks

  // Diminishing returns multiplier: visit 1 -> 1.0x, visit 2 -> 0.5x, visit 3+ -> 0.2x
  const decayMultiplier = visitCount <= 1 ? 1.0 : visitCount === 2 ? 0.5 : 0.2
  const effectiveTickHeal = Math.max(2, Math.round(10 * decayMultiplier) - Math.floor(chaosLevel * 0.05))

  const effectiveTickHealRef = useRef(effectiveTickHeal)
  effectiveTickHealRef.current = effectiveTickHeal

  const isMaxTicksReached = pulsesUsed >= maxTicks

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

  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Only count seconds when tab is active and visible
      if (document.hidden) return

      // 2. Pause pulse countdown if character is already at full HP
      if (isHpFullRef.current) return

      // 3. Stop incrementing if already at max pulses
      if (pulsesUsedRef.current >= maxTicksRef.current) return

      secondsRef.current += 1
      const nextSec = secondsRef.current

      // Update visual display state (pure state updaters)
      setSecondsInSanctuary(nextSec)
      setTickProgress(((nextSec % 10) / 10) * 100)

      // Trigger 10-second tick heal exactly once outside of setState updaters
      if (nextSec > 0 && nextSec % 10 === 0) {
        if (pulsesUsedRef.current < maxTicksRef.current && !isHpFullRef.current) {
          const healVal = effectiveTickHealRef.current
          const currentTotal = pulsesUsedRef.current + 1
          const maxVal = maxTicksRef.current

          onTickHealRef.current(healVal)

          const particleId = Date.now()
          setFloatingParticles((p) => [
            ...p,
            { id: particleId, text: `+${healVal} HP Restored (${currentTotal}/${maxVal})` },
          ])
          setTimeout(() => {
            setFloatingParticles((p) => p.filter((item) => item.id !== particleId))
          }, 2500)
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const currentTotalPulses = pulsesUsed

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
            {isHpFull && !isMaxTicksReached && (
              <Badge variant="secondary" className="text-[10px] bg-[#a6d189]/10 text-[#a6d189] border border-[#a6d189]/30">
                Full HP (Paused)
              </Badge>
            )}
            {!isTabActive && !isHpFull && !isMaxTicksReached && (
              <Badge variant="warning" className="text-[10px] animate-pulse">
                Paused (Tab Inactive)
              </Badge>
            )}
          </div>
          <span className="text-xs text-[#a5adce]">
            {isMaxTicksReached
              ? 'Sanctuary pulses exhausted for this campaign. Revisit or restart campaign.'
              : isHpFull
              ? 'Character health is full (100%). Pulse will resume when HP is lost.'
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
            {isMaxTicksReached ? 'Exhausted' : isHpFull ? 'HP Full' : !isTabActive ? 'Paused' : 'Next Pulse'}
          </span>
          <span className="text-xs font-mono font-bold text-[#a6d189]">
            {isMaxTicksReached ? `${currentTotalPulses}/${maxTicks}` : isHpFull ? 'Full ❤️' : !isTabActive ? '⏸️' : `${10 - (secondsInSanctuary % 10)}s`}
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
