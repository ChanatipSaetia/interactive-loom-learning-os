import { useState, type HTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'
import { fieldDoc, type LoomOUIComponent } from './openui-kernel'
import './OUIFieldKey.css'

interface OUIFieldRef {
  /** OUI component whose prop this form field edits. */
  of: LoomOUIComponent
  /** Prop name in `of`'s `fields`. */
  field: string
}

const TOOLTIP_WIDTH = 260
const GUTTER = 8

/**
 * Info icon with the prop's OUI description as a hover/focus tooltip, so form
 * fields and `.oui` hovers explain a field with the same words. The tooltip
 * is portalled to `body` so scrolling form panels do not clip it.
 */
export function OUIFieldHelp({ of, field }: OUIFieldRef) {
  const help = fieldDoc(of, field)
  const [anchor, setAnchor] = useState<DOMRect | null>(null)
  if (!help) return null

  const show = (el: HTMLElement) => setAnchor(el.getBoundingClientRect())
  const hide = () => setAnchor(null)
  const left = anchor ? Math.max(GUTTER, Math.min(anchor.left - 6, window.innerWidth - TOOLTIP_WIDTH - GUTTER)) : 0

  return (
    <span
      className="visual-form-help"
      tabIndex={0}
      role="img"
      aria-label={help}
      data-testid={`field-help-${of.name}-${field}`}
      onMouseEnter={(e) => show(e.currentTarget)}
      onMouseLeave={hide}
      onFocus={(e) => show(e.currentTarget)}
      onBlur={hide}
    >
      <Info size={11} aria-hidden />
      {anchor && createPortal(
        <div className="visual-form-tooltip" role="tooltip" style={{ left, bottom: window.innerHeight - anchor.top + 6, maxWidth: TOOLTIP_WIDTH }}>
          {help}
        </div>,
        document.body,
      )}
    </span>
  )
}

interface OUIFieldKeyProps extends OUIFieldRef, HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
}

/** Form field label (`.visual-form-key`) followed by its {@link OUIFieldHelp}. */
export function OUIFieldKey({ of, field, children, className, ...rest }: OUIFieldKeyProps) {
  return (
    <span className={className ? `visual-form-key ${className}` : 'visual-form-key'} {...rest}>
      {children}
      <OUIFieldHelp of={of} field={field} />
    </span>
  )
}
