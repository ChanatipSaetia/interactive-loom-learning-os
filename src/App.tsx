import { Routes, Route } from 'react-router-dom'
import { TopNav } from './components/layout/TopNav'
import { OverviewPage } from './components/overview/OverviewPage'
import { TopicShell } from './components/layout/TopicShell'
import { ScrollProgress } from './components/motion/scroll-progress'
import { SmoothScroll } from './components/motion/smooth-scroll'
import { EditorProvider } from './core/context/EditorContext'
import { TopicsProvider } from './core/routes'
import { UISystemProvider } from './core/ui-system'

export function App() {
  return (
    <UISystemProvider>
      <TopicsProvider>
        <EditorProvider>
          <SmoothScroll>
            <div className="app-layout">
              <TopNav />
              <main className="main-content">
                <ScrollProgress variant="bar" position="top" height={3} className="z-[100]" />
                <Routes>
                  <Route path="/" element={<OverviewPage />} />
                  <Route path="/topics/:topicId/*" element={<TopicShell />} />
                  <Route path="/:topicId/*" element={<TopicShell />} />
                </Routes>
              </main>
            </div>
          </SmoothScroll>
        </EditorProvider>
      </TopicsProvider>
    </UISystemProvider>
  )
}

