import { Suspense, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTopics } from '../../core/routes'
import type { SectionConfig } from '../../core/registry'
import { SectionRegistry } from '../../core/registry'
import { useOKFBundled, bundleToSections } from '../../core/okf/sections'
import { ProgressProvider } from '../../core/progress'
import { HUDProvider, useHUD } from '../../core/context/HUDContext'
import { X } from 'lucide-react'

interface SectionRendererProps {
  config: SectionConfig
}

function SectionRenderer({ config }: SectionRendererProps) {
  const Component = SectionRegistry.get(config.type)
  if (!Component) {
    return (
      <div className="section-missing" data-section-type={config.type}>
        Section type not registered: {config.type}
      </div>
    )
  }
  return (
    <Suspense fallback={<div className="section-loading">Loading section...</div>}>
      <Component {...config.props} />
    </Suspense>
  )
}

function HUDDrawer() {
  const { isOpen, title, body, closeHUD } = useHUD()

  return (
    <div className={`hud-drawer ${isOpen ? 'open' : ''}`} data-testid="hud-drawer">
      <div className="hud-header">
        <span className="hud-title">{title}</span>
        <button className="hud-close" onClick={closeHUD} aria-label="Close details">
          <X size={18} />
        </button>
      </div>
      <div className="hud-body" dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  )
}

function TopicShellInner() {
  const { topicId } = useParams()
  const { topics } = useTopics()

  const topic = useMemo(() => topics.find((r) => r.id === topicId), [topicId, topics])

  const { bundle, loading, error } = useOKFBundled(topicId ?? '')
  const sections = useMemo(() => (bundle ? bundleToSections(bundle) : []), [bundle])

  if (!topic) {
    return (
      <div className="topic-page">
        <h2 className="topic-page-title">Topic Not Found</h2>
        <p className="topic-page-placeholder">The requested topic does not exist.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="topic-page" data-topic-id={topic.id} data-testid={`${topic.id}-topic`}>
        <h2 className="topic-page-title">{topic.label}</h2>
        <div className="topic-loading">Loading topic data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="topic-page" data-topic-id={topic.id} data-testid={`${topic.id}-topic`}>
        <h2 className="topic-page-title">{topic.label}</h2>
        <div className="topic-error">Failed to load topic: {error.message}</div>
      </div>
    )
  }

  return (
    <div className="topic-page" data-topic-id={topic.id} data-testid={`${topic.id}-topic`}>
      <h2 className="topic-page-title">{topic.label}</h2>
      {sections.map((section, idx) => (
        <SectionRenderer key={`${topic.id}-${idx}`} config={section} />
      ))}
      <HUDDrawer />
    </div>
  )
}

export function TopicShell() {
  return (
    <ProgressProvider>
      <HUDProvider>
        <TopicShellInner />
      </HUDProvider>
    </ProgressProvider>
  )
}

export { SectionRenderer }
