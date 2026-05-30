import { NavLink } from 'react-router-dom'
import { type TopicLink } from '../components/layout/Sidebar'

export interface HomePageProps {
  topics: TopicLink[]
}

export function HomePage({ topics }: HomePageProps) {
  return (
    <div className="home-page">
      <h2 className="home-page-title">Interactive Learning Platform</h2>
      <p className="home-page-subtitle">
        Choose a topic below to begin learning with interactive diagrams, animations, and exercises.
      </p>
      <div className="home-topics-list">
        {topics.map((topic) => (
          <NavLink
            key={topic.id}
            to={topic.path}
            className="home-topic-card"
          >
            <h3 className="home-topic-card-title">{topic.label}</h3>
            <p className="home-topic-card-desc">Explore interactive sections</p>
          </NavLink>
        ))}
      </div>
    </div>
  )
}
