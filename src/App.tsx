import { Routes, Route } from 'react-router-dom'
import { TopNav } from './components/layout/TopNav'
import { OverviewPage } from './components/overview/OverviewPage'
import { TopicShell } from './components/layout/TopicShell'
import { ScrollProgress } from './components/motion/scroll-progress'
import { SmoothScroll } from './components/motion/smooth-scroll'
import { TopicsProvider } from './core/routes'

export function App() {
  return (
    <TopicsProvider>
      <SmoothScroll>
        <div className="app-layout">
          <TopNav />
          <ScrollProgress variant="bar" position="top" height={3} className="z-[100]" />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/topics/:topicId/*" element={<TopicShell />} />
              <Route path="/:topicId/*" element={<TopicShell />} />
            </Routes>
          </main>
        </div>
      </SmoothScroll>
    </TopicsProvider>
  )
}
