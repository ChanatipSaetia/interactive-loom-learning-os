import { Routes, Route } from 'react-router-dom'
import { TopNav } from './core/delivery/web-app-shell/TopNav'
import { OverviewPage } from './core/supporting/catalog-discovery'
import { TopicShell } from './core/delivery/web-app-shell/TopicShell'
import { GamificationCampaignView } from './core/supporting/gamification'
import { SmoothScroll } from './core/ui-system/motion/smooth-scroll'
import { TopicsProvider } from './core/learning-engine/composition/routes'
import { UISystemProvider } from './core/ui-system'

export function App() {
  return (
    <UISystemProvider>
      <TopicsProvider>
        <SmoothScroll>
          <div className="app-layout">
            <TopNav />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<OverviewPage />} />
                <Route path="/campaign" element={<GamificationCampaignView />} />
                <Route path="/campaign/:topicId" element={<GamificationCampaignView />} />
                <Route path="/gamification-demo" element={<GamificationCampaignView />} />
                <Route path="/topics/:topicId/*" element={<TopicShell />} />
                <Route path="/:topicId/*" element={<TopicShell />} />
              </Routes>
            </main>
          </div>
        </SmoothScroll>
      </TopicsProvider>
    </UISystemProvider>
  )
}

