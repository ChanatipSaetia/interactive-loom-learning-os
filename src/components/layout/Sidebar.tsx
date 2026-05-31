import { NavLink } from 'react-router-dom'
import type { TopicRoute } from '../../core/routes'
import './layout.css'

export interface SidebarProps {
  topics: TopicRoute[]
}

export function Sidebar({ topics }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">Learning OS</h1>
      </div>
      <nav className="sidebar-nav">
        <NavLink
          to="/"
          className={({ isActive }) => `sidebar-link sidebar-link-home${isActive ? ' sidebar-link-active' : ''}`}
        >
          Overview
        </NavLink>
        <div className="sidebar-section-label">Topics</div>
        {topics.map((topic) => (
          <NavLink
            key={topic.id}
            to={topic.path}
            className={({ isActive }) => `sidebar-link${isActive ? ' sidebar-link-active' : ''}`}
          >
            {topic.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
