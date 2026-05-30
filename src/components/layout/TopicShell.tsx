import { Suspense, lazy, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { routes } from '../../core/routes'
import { SectionRegistry, type SectionConfig } from '../../core/registry'
import DemoTopic from '../../topics/demo/index'

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

const topicComponents: Record<string, React.ComponentType> = {
  demo: DemoTopic,
}

export function TopicShell() {
  const { topicId } = useParams()

  const topic = useMemo(() => routes.find((r) => r.id === topicId), [topicId])

  if (!topic) {
    return (
      <div className="topic-page">
        <h2 className="topic-page-title">Topic Not Found</h2>
        <p className="topic-page-placeholder">The requested topic does not exist.</p>
      </div>
    )
  }

  const resolvedTopicId = topicId ?? ''
  const TopicContent = topicComponents[resolvedTopicId]
    ? lazy(async () => ({ default: topicComponents[resolvedTopicId] }))
    : null

  if (!TopicContent) {
    return (
      <div className="topic-page" data-topic-id={topic.id}>
        <h2 className="topic-page-title">{topic.label}</h2>
        <p className="topic-page-placeholder">Topic component not found.</p>
      </div>
    )
  }

  return (
    <div className="topic-page" data-topic-id={topic.id}>
      <h2 className="topic-page-title">{topic.label}</h2>
      <Suspense fallback={<div className="topic-loading">Loading...</div>}>
        <TopicContent />
      </Suspense>
    </div>
  )
}

export { SectionRenderer }
