/**
 * UIComponentRegistryContract — Standardized UI primitives.
 *
 * Provides `<Card>`, `<Button>`, `<RangeSlider>`, `<Modal>`, `<Badge>`
 * that subdomain components should use instead of ad‑hoc styled elements.
 * All styling uses CSS custom properties from Catppuccin Frappé theme.
 */

import {
  forwardRef,
  type HTMLProps,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from './utils'

// ---------------------------------------------------------------------------
// Button — re-export from existing motion component
// ---------------------------------------------------------------------------

import { Button } from './motion/button'

export {
  Button,
  StatefulButton,
  MagneticButton,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
  type StatefulButtonProps,
  type ButtonState,
  type MagneticButtonProps,
} from './motion/button'

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export type CardVariant = 'elevated' | 'outlined' | 'ghost'

export interface CardProps extends HTMLProps<HTMLDivElement> {
  variant?: CardVariant
  /** Optional click handler — adds interactive cursor and focus ring */
  onClick?: () => void
  children?: ReactNode
}

const VARIANT_CLASS: Record<CardVariant, string> = {
  elevated: 'bg-card border border-card-border shadow-sm',
  outlined: 'bg-transparent border border-border',
  ghost: 'bg-transparent border-0',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card({ variant = 'elevated', className, onClick, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg',
          VARIANT_CLASS[variant],
          onClick && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className,
        )}
        tabIndex={onClick ? 0 : undefined}
        role={onClick ? 'button' : undefined}
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    )
  },
)

export interface CardHeaderProps extends HTMLProps<HTMLDivElement> {
  children?: ReactNode
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  function CardHeader({ className, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 p-5', className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)

export interface CardTitleProps extends HTMLProps<HTMLDivElement> {
  children?: ReactNode
}

export const CardTitle = forwardRef<HTMLDivElement, CardTitleProps>(
  function CardTitle({ className, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn('text-lg font-semibold leading-none tracking-tight text-foreground', className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)

export interface CardDescriptionProps extends HTMLProps<HTMLDivElement> {
  children?: ReactNode
}

export const CardDescription = forwardRef<HTMLDivElement, CardDescriptionProps>(
  function CardDescription({ className, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)

export interface CardContentProps extends HTMLProps<HTMLDivElement> {
  children?: ReactNode
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  function CardContent({ className, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn('p-5 pt-0', className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)

export interface CardFooterProps extends HTMLProps<HTMLDivElement> {
  children?: ReactNode
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  function CardFooter({ className, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn('flex items-center p-5 pt-0', className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'

export interface BadgeProps extends Omit<HTMLProps<HTMLSpanElement>, 'children'> {
  variant?: BadgeVariant
  children?: ReactNode
}

const BADGE_VARIANT_CLASS: Record<BadgeVariant, string> = {
  default: 'border-transparent bg-primary text-primary-foreground',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  destructive: 'border-transparent bg-destructive text-destructive-foreground',
  outline: 'border-border text-foreground bg-transparent',
  success: 'border-transparent bg-[var(--ctp-green)] text-[var(--ctp-crust)]',
  warning: 'border-transparent bg-[var(--ctp-yellow)] text-[var(--ctp-crust)]',
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge({ variant = 'default', className, children, ...props }, ref) {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          BADGE_VARIANT_CLASS[variant],
          className,
        )}
        {...props}
      >
        {children}
      </span>
    )
  },
)

// ---------------------------------------------------------------------------
// RangeSlider
// ---------------------------------------------------------------------------

export interface RangeSliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Visual label shown before the slider */
  label?: string
  /** Value suffix (e.g. '%', 'px') */
  suffix?: string
  /** Display format for the current value */
  formatValue?: (value: number) => string
}

export const RangeSlider = forwardRef<HTMLInputElement, RangeSliderProps>(
  function RangeSlider(
    { label, suffix = '', formatValue, className, style, ...props },
    ref,
  ) {
    const displayValue =
      typeof props.value === 'number'
        ? formatValue
          ? formatValue(props.value)
          : `${props.value}${suffix}`
        : ''

    return (
      <div className="flex items-center gap-3 w-full" style={style}>
        {label && (
          <label className="text-sm font-medium text-foreground shrink-0 min-w-[120px]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type="range"
          className={cn(
            'flex h-2 appearance-none rounded-lg bg-muted',
            'cursor-pointer',
            'accent-[var(--ctp-blue)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className,
          )}
          {...props}
        />
        <span className="text-sm tabular-nums text-muted-foreground shrink-0 min-w-[3em] text-right">
          {displayValue}
        </span>
      </div>
    )
  },
)

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export interface ModalProps {
  /** Whether the modal is currently open */
  open: boolean
  /** Request to close the modal */
  onClose: () => void
  /** Dialog title for accessibility */
  title?: string
  children?: ReactNode
  /** Max width of the modal content */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const MAX_WIDTH_CLASS: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-none',
}

export function Modal({ open, onClose, title, children, maxWidth = 'lg' }: ModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-lenis-prevent
      data-lenis-prevent-wheel
      data-lenis-prevent-touch
    >
      <div
        className={cn(
          'relative bg-card border border-border rounded-xl shadow-xl w-full max-h-[85vh] overflow-y-auto p-6 text-foreground',
          MAX_WIDTH_CLASS[maxWidth],
        )}
        onClick={(e) => e.stopPropagation()}
        style={{ overscrollBehavior: 'contain' }}
        data-lenis-prevent
        data-lenis-prevent-wheel
        data-lenis-prevent-touch
      >
        {title && (
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-card pb-2 z-10 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors text-xl font-bold px-2 py-1"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export interface ModalHeaderProps extends HTMLProps<HTMLDivElement> {
  children?: ReactNode
}

export const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  function ModalHeader({ className, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 text-center sm:text-left mb-4', className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)

export interface ModalTitleProps extends HTMLProps<HTMLHeadingElement> {
  children?: ReactNode
}

export const ModalTitle = forwardRef<HTMLHeadingElement, ModalTitleProps>(
  function ModalTitle({ className, children, ...props }, ref) {
    return (
      <h2
        ref={ref}
        className={cn('text-lg font-semibold leading-none tracking-tight text-foreground', className)}
        {...props}
      >
        {children}
      </h2>
    )
  },
)

export interface ModalDescriptionProps extends HTMLProps<HTMLParagraphElement> {
  children?: ReactNode
}

export const ModalDescription = forwardRef<HTMLParagraphElement, ModalDescriptionProps>(
  function ModalDescription({ className, children, ...props }, ref) {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
      >
        {children}
      </p>
    )
  },
)

export interface ModalContentProps extends HTMLProps<HTMLDivElement> {
  children?: ReactNode
}

export const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  function ModalContent({ className, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn('text-sm text-foreground', className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)

export interface ModalFooterProps extends HTMLProps<HTMLDivElement> {
  children?: ReactNode
}

export const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  function ModalFooter({ className, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4', className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)

// ---------------------------------------------------------------------------
// UIComponentRegistryContract — unified interface
// ---------------------------------------------------------------------------

export interface UIComponentRegistryContract {
  Card: typeof Card
  CardHeader: typeof CardHeader
  CardTitle: typeof CardTitle
  CardDescription: typeof CardDescription
  CardContent: typeof CardContent
  CardFooter: typeof CardFooter
  Button: typeof Button
  Badge: typeof Badge
  RangeSlider: typeof RangeSlider
  Modal: typeof Modal
  ModalHeader: typeof ModalHeader
  ModalTitle: typeof ModalTitle
  ModalDescription: typeof ModalDescription
  ModalContent: typeof ModalContent
  ModalFooter: typeof ModalFooter
}

/**
 * Registry instance with all standard UI primitives.
 * Consumed by `useUISystem().components`.
 */
export const UIComponentRegistry: UIComponentRegistryContract = {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
  RangeSlider,
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
}
