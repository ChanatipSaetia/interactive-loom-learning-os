import { Routes, Route } from 'react-router-dom'
import { TopNav } from './components/layout/TopNav'
import { OverviewPage } from './components/overview/OverviewPage'
import { TopicShell } from './components/layout/TopicShell'
import { ScrollProgress } from './components/motion/scroll-progress'
import { TopicsProvider } from './core/routes'

export function App() {
  return (
    <TopicsProvider>
      <div className="app-layout">
        <ScrollProgress variant="bar" position="top" height={3} />
        <TopNav />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/topics/:topicId/*" element={<TopicShell />} />
            <Route path="/:topicId/*" element={<TopicShell />} />
          </Routes>
        </main>
      </div>
    </TopicsProvider>
  )
}
