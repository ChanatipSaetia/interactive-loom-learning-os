import { Link } from 'react-router-dom'
import { ThemeToggle } from '../motion/theme-toggle'
import './layout.css'

export function TopNav() {
  return (
    <header className="topnav">
      <div className="topnav-brand">
        <Link to="/" className="topnav-title">Learning&nbsp;OS</Link>
      </div>
      <ThemeToggle />
    </header>
  )
}
