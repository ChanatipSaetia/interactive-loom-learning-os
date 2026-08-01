import { Volume2, VolumeX } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useSound } from '../../ui-system/sensory/SoundContext'
import { cn } from '../../ui-system/utils'
import { SPRING_PRESS } from '../../ui-system/motion/ease'

export function AudioToggle({ className }: { className?: string }) {
  const { isMuted, toggleMute, playSound } = useSound()
  const reduce = useReducedMotion()

  const handleToggle = () => {
    toggleMute()
    if (isMuted) {
      // Play a light preview sound when unmuting
      setTimeout(() => playSound('click'), 50)
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      whileTap={reduce ? undefined : { scale: 0.95 }}
      transition={SPRING_PRESS}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent',
        isMuted && 'text-muted-foreground opacity-80',
        className
      )}
      aria-label={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
      title={isMuted ? 'Sound FX: Off' : 'Sound FX: On'}
    >
      <div className="relative flex h-4 w-4 items-center justify-center">
        {isMuted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
      </div>
      <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound On'}</span>
    </motion.button>
  )
}
