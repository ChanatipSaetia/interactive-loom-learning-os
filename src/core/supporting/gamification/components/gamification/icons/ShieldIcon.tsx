import React from 'react'
import type { GamificationIconProps } from './types'

export const ShieldIcon: React.FC<GamificationIconProps> = ({ size = '1em', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 2.2l7.2 2.7v5.7c0 4.8-3.1 8.4-7.2 11.2-4.1-2.8-7.2-6.4-7.2-11.2V4.9L12 2.2Z" />
    <path
      opacity="0.35"
      d="M12 5.4l4.6 1.8v3.5c0 3.2-2 5.7-4.6 7.5-2.6-1.8-4.6-4.3-4.6-7.5V7.2L12 5.4Z"
    />
  </svg>
)
