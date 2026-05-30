import { Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { OverviewPage } from './components/overview/OverviewPage'
import { TopicShell } from './components/layout/TopicShell'
import { routes } from './core/routes'

export function App() {
  return (
    <div className="app-layout">
      <Sidebar topics={routes} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<OverviewPage topics={routes} />} />
          <Route path="/:topicId/*" element={<TopicShell />} />
        </Routes>
      </main>
    </div>
  )
}
