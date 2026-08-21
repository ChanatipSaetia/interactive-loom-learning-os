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
                ? 'bg-[#1e2e28]/95 border-[#a6d189]/60 border-l-[#a6d189] text-[#a6d189] shadow-[#a6d189]/20'
                : item.type === 'danger'
                ? 'bg-[#312028]/95 border-[#e78284]/60 border-l-[#e78284] text-[#ea999c] shadow-[#e78284]/20'
                : item.type === 'warning'
                ? 'bg-[#312a20]/95 border-[#ef9f76]/60 border-l-[#ef9f76] text-[#ef9f76] shadow-[#ef9f76]/20'
                : item.type === 'craft'
                ? 'bg-[#292233]/95 border-[#ca9ee6]/60 border-l-[#ca9ee6] text-[#ca9ee6] shadow-[#ca9ee6]/20'
                : item.type === 'exp'
                ? 'bg-[#1f2838]/95 border-[#8caaee]/60 border-l-[#8caaee] text-[#8caaee] shadow-[#8caaee]/20'
                : 'bg-[#1e1e2e]/95 border-[#414559] border-l-[#8caaee] text-[#c6d0f5] shadow-black/40'
            }`}
          >
            <div className="w-7 h-7 rounded-xl bg-[#181825]/80 flex items-center justify-center shrink-0 text-base shadow-inner animate-pulse">
              {item.icon}
            </div>
            <span className="truncate pr-1 text-[#c6d0f5] flex-1">{item.text}</span>
            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              className="w-6 h-6 rounded-lg bg-black/20 hover:bg-black/40 text-[#a5adce] hover:text-white flex items-center justify-center shrink-0 transition-colors"
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
