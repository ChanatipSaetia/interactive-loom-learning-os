import { Link } from 'react-router-dom'
import { ThemeToggle } from '../../ui-system/motion/theme-toggle'
import { AudioToggle } from './AudioToggle'
import './layout.css'

export function TopNav() {
  return (
    <header className="topnav">
      <div className="topnav-brand flex items-center gap-4">
        <Link to="/" className="topnav-title">Learning&nbsp;OS</Link>
        <Link to="/campaign" className="text-xs px-2.5 py-1 rounded-lg bg-[var(--ctp-blue)]/20 text-[var(--ctp-blue)] hover:bg-[var(--ctp-blue)]/30 font-semibold border border-[var(--ctp-blue)]/30 transition-colors">
          🎮 Gamification Campaign
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <AudioToggle />
        <ThemeToggle />
      </div>
    </header>
  )
}


