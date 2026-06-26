import { NavLink } from 'react-router-dom'
import type { TopicRoute } from '../../core/routes'
import { ThemeToggle } from '../motion/theme-toggle'
import { cn } from '../../lib/utils'
import './layout.css'

export interface TopNavProps {
  topics: TopicRoute[]
}

export function TopNav({ topics }: TopNavProps) {
  return (
    <header className="topnav">
      <div className="topnav-brand">
        <span className="topnav-title">Learning&nbsp;OS</span>
      </div>
      <nav className="topnav-links" aria-label="Main navigation">
        <div className="topnav-nav-group">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                "topnav-link inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )
            }
          >
            Overview
          </NavLink>
          {topics.map((topic) => (
            <NavLink
              key={topic.id}
              to={topic.path}
              className={({ isActive }) =>
                cn(
                  "topnav-link inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )
              }
            >
              {topic.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <ThemeToggle />
    </header>
  )
}
