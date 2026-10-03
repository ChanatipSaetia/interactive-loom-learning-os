import React from 'react'
import type { GamificationIconProps } from './types'

export const TrophyIcon: React.FC<GamificationIconProps> = ({ size = '1em', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" {...props}>
    <path
      fillRule="evenodd"
      d="M6.4 3.4h11.2v4a5.6 5.6 0 0 1-11.2 0v-4ZM12 6.1l.5 1.1 1.1.5-1.1.5-.5 1.1-.5-1.1-1.1-.5 1.1-.5.5-1.1Z"
    />
    <path d="M10.9 12.6h2.2v3.6h-2.2v-3.6Z" />
    <path d="M8.2 16h7.6l1 3.1H7.2l1-3.1Z" />
    <path d="M6.2 19.4h11.6a1.3 1.3 0 0 1 1.3 1.3v.5H4.9v-.5a1.3 1.3 0 0 1 1.3-1.3Z" />
    <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6.2 4.9H3.8a1 1 0 0 0-1 1.1c.1 1.9 1.3 3.3 3.2 3.7" />
      <path d="M17.8 4.9h2.4a1 1 0 0 1 1 1.1c-.1 1.9-1.3 3.3-3.2 3.7" />
    </g>
  </svg>
)
