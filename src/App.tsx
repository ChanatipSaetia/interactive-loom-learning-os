import { Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { HomePage } from './pages/HomePage'
import { TopicPage } from './pages/TopicPage'

const topics = [
  { id: 'demo', label: 'REST API vs WebSocket', path: '/demo/rest-vs-websocket' }
]

export function App() {
  return (
    <div className="app-layout">
      <Sidebar topics={topics} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage topics={topics} />} />
          <Route path="/:topicId/*" element={<TopicPage />} />
        </Routes>
      </main>
    </div>
  )
}
