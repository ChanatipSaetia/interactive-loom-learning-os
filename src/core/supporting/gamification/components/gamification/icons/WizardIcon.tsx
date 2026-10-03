import React from 'react'
import type { GamificationIconProps } from './types'

export const WizardIcon: React.FC<GamificationIconProps> = ({ size = '1em', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" {...props}>
    <path
      fillRule="evenodd"
      d="M12 2.2c-.5 3.1-1.7 6.9-3.2 9.9h6.4C13.7 9.1 12.5 5.3 12 2.2ZM12.3 5.9l.5 1.1 1.1.5-1.1.5-.5 1.1-.5-1.1-1.1-.5 1.1-.5.5-1.1Z"
    />
    <ellipse cx="12" cy="15.4" rx="3.3" ry="2.8" opacity="0.45" />
    <ellipse cx="12" cy="12.1" rx="6.3" ry="1.5" />
    <circle cx="10.9" cy="15" r="0.55" />
    <circle cx="13.1" cy="15" r="0.55" />
    <path d="M8.9 15.9c.3 2.5 1.4 4.5 3.1 5.9 1.7-1.4 2.8-3.4 3.1-5.9-.9.6-2 .9-3.1.9s-2.2-.3-3.1-.9Z" />
  </svg>
)
