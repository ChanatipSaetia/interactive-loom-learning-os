import React, { useState } from 'react'
import { HexNodeData } from '../types'
import { Button, Badge } from '../../../ui-system'
import { ChevronDown, ChevronUp, X } from 'lucide-react'

interface EncounterDrawerProps {
  node: HexNodeData | null
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  headerWidget?: React.ReactNode
}

export const EncounterDrawer: React.FC<EncounterDrawerProps> = ({
  node,
  isOpen,
  onClose,
  children,
  headerWidget,
}) => {
  const [isMinimized, setIsMinimized] = useState(false)

  if (!isOpen || !node) return null

  const isCapital = node.type === 'capital'
  const isSanctuary = node.type === 'reading_sanctuary'
  const isQuiz = node.type === 'quiz_encounter'
  const isReflection = node.type === 'reflection_decryption'
  const isWorkshop = node.type === 'tradeoff_workshop'
  const isBoss = node.type === 'boss_lair'

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-end">
      {/* Dimmed Background Backdrop */}
      {!isMinimized && (
        <div
          className="absolute inset-0 bg-[#11111b]/80 backdrop-blur-md pointer-events-auto transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Full-Screen Encounter Viewport Container */}
      <div
        className={`relative w-full mx-auto bg-[#1e1e2e] border-t border-[#414559] shadow-2xl pointer-events-auto flex flex-col transition-all duration-300 overflow-hidden ${
          isMinimized
            ? 'h-16 shadow-lg max-w-7xl rounded-t-3xl border-x'
            : 'h-full inset-0 rounded-none'
        }`}
      >
        {/* Top Navigation & Title Bar */}
        <div className="bg-[#232634] px-6 py-3.5 border-b border-[#414559] flex items-center justify-between gap-4 shrink-0 select-none shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl shrink-0">
              {isCapital && '🏰'}
              {isSanctuary && '🏛️'}
              {isQuiz && (node.monster?.icon || '👹')}
              {isReflection && '🔮'}
              {isWorkshop && '⚒️'}
              {isBoss && '🐲'}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#b5bfe2] truncate">{node.title}</h2>
                <Badge variant="secondary" className="text-[10px] uppercase bg-[#8caaee]/20 text-[#8caaee]">
                  {node.type.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>
          </div>

          {/* Window Control Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-[#a5adce] hover:text-[#c6d0f5] hover:bg-[#303446]"
              onClick={() => setIsMinimized((prev) => !prev)}
              title={isMinimized ? 'Expand to Full Screen' : 'Minimize to Dock'}
            >
              {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-[#e78284] hover:bg-[#e78284]/20"
              onClick={onClose}
              title="Close Encounter"
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* Optional Docked Header Widget (Combat Duel Header, Sanctuary Monitor, Tradeoff Preview) */}
        {!isMinimized && headerWidget && (
          <div className="bg-[#181825] px-6 py-3 border-b border-[#414559] shrink-0">
            {headerWidget}
          </div>
        )}

        {/* Scrollable Encounter Section Viewport */}
        {!isMinimized && (
          <div className="flex-1 overflow-y-auto p-6 text-[#c6d0f5] space-y-6">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
