import React from 'react'
import type { GamificationIconProps } from './types'

export const BulbIcon: React.FC<GamificationIconProps> = ({ size = '1em', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" {...props}>
    <path
      fillRule="evenodd"
      d="M18.4 9a6.4 6.4 0 1 1-12.8 0 6.4 6.4 0 0 1 12.8 0ZM10.3 7.2h3.4l-.8 3.1h-1.8l-.8-3.1ZM11.3 11.2h1.4v1.7h-1.4v-1.7Z"
    />
    <path d="M9.6 14.4h4.8v3.4a2.4 2.4 0 0 1-4.8 0v-3.4Z" />
    <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M12 .6v1.5" />
      <path d="M5 4.6l1.1 1.1" />
      <path d="M19 4.6l-1.1 1.1" />
      <path d="M2.8 9h1.5" />
      <path d="M21.2 9h-1.5" />
    </g>
  </svg>
)
