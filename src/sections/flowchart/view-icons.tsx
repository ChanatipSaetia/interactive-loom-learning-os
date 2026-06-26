
interface IconProps {
  size?: number;
  className?: string;
}

export function EventStormingIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Orange Note */}
      <rect x="3" y="5" width="10" height="10" rx="1" fill="var(--ctp-peach)" stroke="var(--ctp-peach)" fillOpacity="0.2" />
      {/* Blue Note */}
      <rect x="11" y="9" width="10" height="10" rx="1" fill="var(--ctp-blue)" stroke="var(--ctp-blue)" fillOpacity="0.2" />
    </svg>
  );
}

export function SystemArchitectureIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="3" width="20" height="5" rx="1" fill="currentColor" fillOpacity="0.1" />
      <rect x="2" y="10" width="20" height="5" rx="1" fill="currentColor" fillOpacity="0.1" />
      <rect x="2" y="17" width="20" height="5" rx="1" fill="currentColor" fillOpacity="0.1" />
      <circle cx="6" cy="5.5" r="1.2" fill="var(--ctp-green)" stroke="var(--ctp-green)" />
      <circle cx="6" cy="12.5" r="1.2" fill="var(--ctp-green)" stroke="var(--ctp-green)" />
      <circle cx="6" cy="19.5" r="1.2" fill="var(--ctp-green)" stroke="var(--ctp-green)" />
      <path d="M16 5.5h2M16 12.5h2M16 19.5h2" strokeWidth="1.5" />
    </svg>
  );
}

export function DataFlowIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="5" cy="8" r="3" fill="var(--ctp-blue)" stroke="var(--ctp-blue)" fillOpacity="0.15" />
      <circle cx="19" cy="16" r="3" fill="var(--ctp-teal)" stroke="var(--ctp-teal)" fillOpacity="0.15" />
      <path d="M8 8h4a4 4 0 0 1 4 4v0a4 4 0 0 0 4 4h2" strokeDasharray="3 3" />
      <polygon points="17 13 20 16 17 19" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SwimlanesIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <line x1="2" y1="9" x2="22" y2="9" />
      <line x1="2" y1="15" x2="22" y2="15" />
      <rect x="5" y="5.5" width="4" height="2" rx="0.5" fill="var(--ctp-mauve)" stroke="var(--ctp-mauve)" fillOpacity="0.25" />
      <rect x="12" y="11.5" width="6" height="2" rx="0.5" fill="var(--ctp-blue)" stroke="var(--ctp-blue)" fillOpacity="0.25" />
      <rect x="7" y="17.5" width="5" height="2" rx="0.5" fill="var(--ctp-yellow)" stroke="var(--ctp-yellow)" fillOpacity="0.25" />
    </svg>
  );
}

export function SequenceIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="6" y1="5" x2="6" y2="21" strokeDasharray="3 3" />
      <line x1="18" y1="5" x2="18" y2="21" strokeDasharray="3 3" />
      <rect x="3" y="2" width="6" height="3" rx="0.5" fill="currentColor" fillOpacity="0.1" />
      <rect x="15" y="2" width="6" height="3" rx="0.5" fill="currentColor" fillOpacity="0.1" />
      
      <path d="M6 9h12" />
      <polygon points="14 6 18 9 14 12" fill="currentColor" stroke="none" />
      
      <path d="M18 15H6" strokeDasharray="2 2" />
      <polygon points="10 12 6 15 10 18" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function StateMachineIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="6" cy="12" r="3" fill="currentColor" fillOpacity="0.1" />
      <circle cx="18" cy="12" r="3" fill="var(--ctp-blue)" stroke="var(--ctp-blue)" fillOpacity="0.15" />
      <path d="M9 10a5 5 0 0 1 6-2" />
      <polygon points="12 5 15 8 12 11" fill="currentColor" stroke="none" />
      <path d="M15 14a5 5 0 0 1-6 2" />
      <polygon points="12 13 9 16 12 19" fill="currentColor" stroke="none" />
    </svg>
  );
}
