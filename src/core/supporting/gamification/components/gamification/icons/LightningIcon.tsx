import React from 'react'
import type { GamificationIconProps } from './types'

export const LightningIcon: React.FC<GamificationIconProps> = ({ size = '1em', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" {...props}>
    <path d="M13.9 2.2 5.5 13.9h4.6l-.9 7.9 7.9-11.6h-4.6l1.4-8Z" />
  </svg>
)
