import React from 'react'
import type { GamificationIconProps } from './types'

export const SparkleIcon: React.FC<GamificationIconProps> = ({ size = '1em', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" {...props}>
    <path d="M10.6 2.6 12.4 8.6l6 1.8-6 1.8-1.8 6-1.8-6-6-1.8 6-1.8 1.8-6Z" />
    <path d="M19 12.5l.7 2.4 2.4.7-2.4.7-.7 2.4-.7-2.4-2.4-.7 2.4-.7.7-2.4Z" />
    <circle cx="18.6" cy="5.4" r="1.15" opacity="0.5" />
  </svg>
)
