import { Routes, Route } from 'react-router-dom'
import { TopNav } from './core/delivery/web-app-shell/TopNav'
import { OverviewPage } from './core/supporting/catalog-discovery'
import { TopicShell } from './core/delivery/web-app-shell/TopicShell'
import { GamificationCampaignView } from './core/supporting/gamification'
import { SmoothScroll } from './core/ui-system/motion/smooth-scroll'
import { EditorProvider } from './core/learning-engine/composition/context/EditorContext'
import { TopicsProvider } from './core/learning-engine/composition/routes'
import { UISystemProvider } from './core/ui-system'
import { StorageProvider } from './core/learning-engine/composition/context/StorageContext'
import { InRepoStorageAdapter } from './core/delivery/adapters/in-repo-storage'

// Composition root: the SPA reads OKF content over HTTP from the Vite server / build.
const storage = new InRepoStorageAdapter()

export function App() {
  return (
    <UISystemProvider>
      <StorageProvider storage={storage}>
        <TopicsProvider>
          <EditorProvider>
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
          </EditorProvider>
        </TopicsProvider>
      </StorageProvider>
    </UISystemProvider>
  )
}


