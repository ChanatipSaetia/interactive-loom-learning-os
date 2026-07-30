/**
 * UISystemContext — Unified UI System Contract.
 *
 * Consolidates theme tokens, UI component primitives, sound effects,
 * and motion variants into a single contract accessible via `useUISystem()`.
 *
 * @module src/core/ui-system
 */

// Provider & Hook
export { UISystemProvider, useUISystem } from './UISystemProvider'
export type { UISystemContract } from './UISystemProvider'

// ThemeContract — Catppuccin Frappé tokens
export {
  CTP,
  DEFAULT_THEME_TOKENS,
} from './ThemeContract'
export type {
  CTPColor,
  ThemeTokens,
} from './ThemeContract'

// UIComponentRegistryContract — UI primitives
export {
  // Button (re-exported from motion/)
  Button,
  StatefulButton,
  MagneticButton,
  // Card
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  // Badge
  Badge,
  // RangeSlider
  RangeSlider,
  // Modal
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  // Registry
  UIComponentRegistry,
} from './UIComponentRegistryContract'
export type {
  // Button types
  ButtonProps,
  ButtonVariant,
  ButtonSize,
  StatefulButtonProps,
  ButtonState,
  MagneticButtonProps,
  // Card types
  CardVariant,
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
  // Badge types
  BadgeVariant,
  BadgeProps,
  // RangeSlider types
  RangeSliderProps,
  // Modal types
  ModalProps,
  ModalHeaderProps,
  ModalTitleProps,
  ModalDescriptionProps,
  ModalContentProps,
  ModalFooterProps,
  // Registry type
  UIComponentRegistryContract,
} from './UIComponentRegistryContract'

// SensoryFeedbackContract — Sound & Motion
export {
  createAudioEngine,
  // Motion variants
  MOTION_FADE,
  MOTION_SLIDE_UP,
  MOTION_SLIDE_DOWN,
  MOTION_SCALE,
  MOTION_BLUR_IN,
  MOTION_STAGGER_CONTAINER,
  MOTION_STAGGER_CHILD,
  MOTION_PRESS,
  MOTION_DRAWER,
} from './SensoryFeedbackContract'
export type {
  SoundEffect,
  SoundContract,
  AudioEngine,
  SensoryFeedbackContract,
} from './SensoryFeedbackContract'
