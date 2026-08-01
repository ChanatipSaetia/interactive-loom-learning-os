import { Routes, Route } from 'react-router-dom'
import { TopNav } from './core/delivery/web-app-shell/TopNav'
import { OverviewPage } from './core/supporting/catalog-discovery'
import { TopicShell } from './core/delivery/web-app-shell/TopicShell'
import { ScrollProgress } from './core/ui-system/motion/scroll-progress'
import { SmoothScroll } from './core/ui-system/motion/smooth-scroll'
import { EditorProvider } from './core/learning-engine/composition/context/EditorContext'
import { TopicsProvider } from './core/learning-engine/composition/routes'
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

