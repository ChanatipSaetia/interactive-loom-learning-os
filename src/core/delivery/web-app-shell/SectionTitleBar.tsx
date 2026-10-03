import { useState } from 'react'
import { createPortal } from 'react-dom'
import { HelpCircle } from 'lucide-react'
import { SectionHelpModal } from './SectionHelpModal'

interface SectionTitleBarProps {
  title?: string
  sectionIndex: number
  className?: string
  titleClassName?: string
  titleTestId?: string
  HelpModal?: React.ComponentType<{ isOpen: boolean; onClose: () => void }>
  extraActions?: React.ReactNode
}

export function SectionTitleBar({
  title,
  sectionIndex,
  className = '',
  titleClassName = 'section-unified-title',
  titleTestId,
  HelpModal,
  extraActions,
}: SectionTitleBarProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const renderModal = () => {
    if (!isHelpOpen) return null
    const modalNode = HelpModal ? (
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    ) : (
      <SectionHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    )
    return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode
  }

  if (!title) {
    return (
      <div className={`section-title-bar-actions ${className}`}>
        {extraActions}
        <button
          className="section-action-btn"
          data-testid={`section-help-btn-${sectionIndex}`}
          onClick={() => setIsHelpOpen(true)}
          aria-label="Help & Guide"
          title="Help & Guide"
        >
          <HelpCircle size={14} />
        </button>
        {renderModal()}
      </div>
    )
  }

  return (
    <div className={`section-title-bar ${className}`}>
      <h3 className={`section-title-bar-title ${titleClassName}`} data-testid={titleTestId ?? `section-title-${sectionIndex}`}>
        {title}
      </h3>
      <div className="section-title-bar-actions">
        {extraActions}
        <button
          className="section-action-btn"
          data-testid={`section-help-btn-${sectionIndex}`}
          onClick={() => setIsHelpOpen(true)}
          aria-label="Help & Guide"
          title="Help & Guide"
        >
          <HelpCircle size={14} />
        </button>
        {renderModal()}
      </div>
    </div>
  )
}
