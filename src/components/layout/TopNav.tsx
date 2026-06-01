import { NavLink } from 'react-router-dom'
import type { TopicRoute } from '../../core/routes'
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
        <NavLink
          to="/"
          end
          className={({ isActive }) => `topnav-link${isActive ? ' topnav-link-active' : ''}`}
        >
          Overview
        </NavLink>
        <span className="topnav-divider" aria-hidden="true" />
        {topics.map((topic) => (
          <NavLink
            key={topic.id}
            to={topic.path}
            className={({ isActive }) => `topnav-link${isActive ? ' topnav-link-active' : ''}`}
          >
            {topic.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
