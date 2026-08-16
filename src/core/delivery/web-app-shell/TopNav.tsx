import { Link } from 'react-router-dom'
import { ThemeToggle } from '../../ui-system/motion/theme-toggle'
import { AudioToggle } from './AudioToggle'
import './layout.css'

export function TopNav() {
  return (
    <header className="topnav">
      <div className="topnav-brand flex items-center gap-4">
        <Link to="/" className="topnav-title">Learning&nbsp;OS</Link>
        <Link to="/gamification-demo" className="text-xs px-2.5 py-1 rounded-lg bg-[#8caaee]/20 text-[#8caaee] hover:bg-[#8caaee]/30 font-semibold border border-[#8caaee]/30 transition-colors">
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


