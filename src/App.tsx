import { Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { HomePage } from './pages/HomePage'
import { TopicShell } from './components/layout/TopicShell'
import { routes } from './core/routes'

export function App() {
  return (
    <div className="app-layout">
      <Sidebar topics={routes} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage topics={routes} />} />
          <Route path="/:topicId/*" element={<TopicShell />} />
        </Routes>
      </main>
    </div>
  )
}
