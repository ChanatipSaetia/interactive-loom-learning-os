import { Link } from 'react-router-dom'
import { ThemeToggle } from '../motion/theme-toggle'
import { AudioToggle } from './AudioToggle'
import './layout.css'

export function TopNav() {
  return (
    <header className="topnav">
      <div className="topnav-brand">
        <Link to="/" className="topnav-title">Learning&nbsp;OS</Link>
      </div>
      <div className="flex items-center gap-2">
        <AudioToggle />
        <ThemeToggle />
      </div>
    </header>
  )
}

