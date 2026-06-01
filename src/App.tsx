import { Routes, Route } from 'react-router-dom'
import { TopNav } from './components/layout/TopNav'
import { OverviewPage } from './components/overview/OverviewPage'
import { TopicShell } from './components/layout/TopicShell'
import { routes } from './core/routes'

export function App() {
  return (
    <div className="app-layout">
      <TopNav topics={routes} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<OverviewPage topics={routes} />} />
          <Route path="/topics/:topicId/*" element={<TopicShell />} />
          <Route path="/:topicId/*" element={<TopicShell />} />
        </Routes>
      </main>
    </div>
  )
}
