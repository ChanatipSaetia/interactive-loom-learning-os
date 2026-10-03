import React from 'react'
import { X } from 'lucide-react'
import type { SnackbarItem } from './useGamificationCampaign'

interface SnackbarToastsProps {
  snackbars: SnackbarItem[]
  onDismiss: (id: number) => void
}

export const SnackbarToasts: React.FC<SnackbarToastsProps> = ({ snackbars, onDismiss }) => {
  if (snackbars.length === 0) return null

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none flex flex-col items-center gap-2 max-w-[92vw] sm:max-w-md w-full">
      {snackbars.slice().reverse().map((item) => (
        <div
          key={item.id}
          className="w-full flex items-center justify-center animate-in fade-in slide-in-from-top-4 duration-300 ease-out"
        >
          <div
            className={`pointer-events-auto w-full backdrop-blur-xl border text-xs sm:text-sm font-semibold px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl shadow-2xl flex items-center gap-3 border-l-4 transition-all duration-300 relative overflow-hidden ${
              item.type === 'success'
                ? 'bg-[var(--ctp-surface0)]/95 border-[var(--ctp-green)]/60 border-l-[var(--ctp-green)] text-[var(--ctp-green)] shadow-[var(--ctp-green)]/20'
                : item.type === 'danger'
                ? 'bg-[var(--ctp-surface0)]/95 border-[var(--ctp-red)]/60 border-l-[var(--ctp-red)] text-[var(--ctp-red)] shadow-[var(--ctp-red)]/20'
                : item.type === 'warning'
                ? 'bg-[var(--ctp-surface0)]/95 border-[var(--ctp-peach)]/60 border-l-[var(--ctp-peach)] text-[var(--ctp-peach)] shadow-[var(--ctp-peach)]/20'
                : item.type === 'craft'
                ? 'bg-[var(--ctp-surface0)]/95 border-[var(--ctp-mauve)]/60 border-l-[var(--ctp-mauve)] text-[var(--ctp-mauve)] shadow-[var(--ctp-mauve)]/20'
                : item.type === 'exp'
                ? 'bg-[var(--ctp-surface0)]/95 border-[var(--ctp-blue)]/60 border-l-[var(--ctp-blue)] text-[var(--ctp-blue)] shadow-[var(--ctp-blue)]/20'
                : 'bg-[var(--ctp-surface0)]/95 border-[var(--ctp-surface1)] border-l-[var(--ctp-blue)] text-[var(--ctp-text)] shadow-black/40'
            }`}
          >
            <div className="w-7 h-7 rounded-xl bg-[var(--ctp-crust)]/80 flex items-center justify-center shrink-0 text-base shadow-inner animate-pulse">
              {item.icon}
            </div>
            <span className="truncate pr-1 text-[var(--ctp-text)] flex-1">{item.text}</span>
            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              className="w-6 h-6 rounded-lg bg-black/20 hover:bg-black/40 text-[var(--ctp-subtext0)] hover:text-[var(--ctp-text)] flex items-center justify-center shrink-0 transition-colors"
              title="Dismiss notification"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
