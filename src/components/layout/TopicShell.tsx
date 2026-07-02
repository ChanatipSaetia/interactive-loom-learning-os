import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTopics } from '../../core/routes'
import type { SectionConfig } from '../../core/registry'
import { SectionRegistry } from '../../core/registry'
import { useOKFBundled, bundleToSections } from '../../core/okf/sections'

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
  return <Component {...config.props} />
}

export function TopicShell() {
  const { topicId } = useParams()
  const { topics } = useTopics()

  const topic = useMemo(() => topics.find((r) => r.id === topicId), [topicId, topics])

  if (!topic) {
    return (
      <div className="topic-page">
        <h2 className="topic-page-title">Topic Not Found</h2>
        <p className="topic-page-placeholder">The requested topic does not exist.</p>
      </div>
    )
  }

  const { bundle, loading, error } = useOKFBundled(topicId ?? '')
  const sections = useMemo(() => bundle ? bundleToSections(bundle) : [], [bundle])

  if (loading) {
    return (
      <div className="topic-page" data-topic-id={topic.id}>
        <h2 className="topic-page-title">{topic.label}</h2>
        <div className="topic-loading">Loading topic data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="topic-page" data-topic-id={topic.id}>
        <h2 className="topic-page-title">{topic.label}</h2>
        <div className="topic-error">Failed to load topic: {error.message}</div>
      </div>
    )
  }

  return (
    <div className="topic-page" data-topic-id={topic.id}>
      <h2 className="topic-page-title">{topic.label}</h2>
      {sections.map((section, idx) => (
        <SectionRenderer key={idx} config={section} />
      ))}
    </div>
  )
}

export { SectionRenderer }
