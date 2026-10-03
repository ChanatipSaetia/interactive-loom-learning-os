import { Suspense, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTopics } from '../../learning-engine/composition/routes'
import type { SectionConfig } from '../../learning-engine/registry'
import { SectionRegistry } from '../../learning-engine/registry'
import { bundleToSections } from '../../learning-engine/composition/okf/sections'
import { useTopicBundle } from '../../learning-engine/composition/content'
import { ProgressProvider } from '../../supporting/learner-progress'
import { HUDProvider, useHUD } from '../../learning-engine/composition/context/HUDContext'
import { X } from 'lucide-react'

interface SectionRendererProps {
  config: SectionConfig
  sectionIndex: number
}

function SectionRenderer({ config, sectionIndex }: SectionRendererProps) {
  const Component = SectionRegistry.get(config.type)
  if (!Component) {
    return (
      <div className="section-missing" data-section-type={config.type}>
        Section type not registered: {config.type}
      </div>
    )
  }

  return (
    <div className="section-wrapper" data-section-type={config.type} data-section-index={sectionIndex}>
      <Suspense fallback={<div className="section-loading">Loading section...</div>}>
        <Component sectionIndex={sectionIndex} {...config.props} />
      </Suspense>
    </div>
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

/**
 * Read-only topic page. Content is authored in Loom Studio (studio.html),
 * not in the learning app.
 */
function TopicShellInner() {
  const { topicId } = useParams()
  const { topics } = useTopics()

  const topic = useMemo(() => topics.find((r) => r.id === topicId), [topicId, topics])

  const { bundle, loading, error } = useTopicBundle(topicId ?? '')
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
    <div className="topic-page topic-container" data-topic-id={topic.id} data-testid={`${topic.id}-topic`}>
      <h2 className="topic-page-title">{topic.label}</h2>
      <div className="topic-content topic-container-content">
        {sections.map((section, idx) => (
          <SectionRenderer key={`${topic.id}-${idx}`} config={section} sectionIndex={idx} />
        ))}
      </div>
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
