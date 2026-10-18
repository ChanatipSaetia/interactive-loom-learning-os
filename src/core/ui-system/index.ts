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
  // PageModal
  PageModal,
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
  // PageModal types
  PageModalProps,
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
  // Present mode durations and curves
  PRESENT_MOTION,
} from './SensoryFeedbackContract'
export type {
  SoundEffect,
  SoundContract,
  AudioEngine,
  SensoryFeedbackContract,
} from './SensoryFeedbackContract'

// FLIP for elements the learner moves (corrects for scaled ancestors)
export { useFlip, flipId, playFlip, SPRING_PRESS_EASING } from './motion/flip'
export type { FlipOptions } from './motion/flip'

// Pick anchors — mark elements for Loom Studio / Viewer Pick mode
export { PickAnchorProvider, usePickAnchor, usePickAnchors } from './pick-anchor'
export type { PickAnchorScope, PickAnchorAttributes, PickAnchorFn } from './pick-anchor'
