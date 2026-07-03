import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTopics } from '../../core/routes'
import type { SectionConfig } from '../../core/registry'
import { SectionRegistry } from '../../core/registry'
import { useOKFBundled, bundleToSections } from '../../core/okf/sections'
import { ProgressProvider, useProgress } from '../../core/progress'

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

function ProgressIndicator({ total, topicId }: { total: number; topicId: string }) {
  const { store } = useProgress()
  const topicData = store[topicId] ?? {}
  const completed = Object.values(topicData).filter((s) => s.completed).length

  if (total === 0) return null

  return (
    <div
      className="topic-progress-bar"
      data-progress-completed={completed}
      data-progress-total={total}
    >
      <div
        className="topic-progress-fill"
        style={{ width: `${(completed / total) * 100}%` }}
      />
      <span className="topic-progress-label">
        {completed}/{total} sections completed
      </span>
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
      <div className="topic-page" data-topic-id={topic.id}>
        <h2 className="topic-page-title">{topic.label}</h2>
        <ProgressIndicator total={0} topicId={topicId ?? ''} />
        <div className="topic-loading">Loading topic data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="topic-page" data-topic-id={topic.id}>
        <h2 className="topic-page-title">{topic.label}</h2>
        <ProgressIndicator total={0} topicId={topicId ?? ''} />
        <div className="topic-error">Failed to load topic: {error.message}</div>
      </div>
    )
  }

  return (
    <div className="topic-page" data-topic-id={topic.id}>
      <h2 className="topic-page-title">{topic.label}</h2>
      <ProgressIndicator total={sections.length} topicId={topicId ?? ''} />
      {sections.map((section, idx) => (
        <SectionRenderer key={idx} config={section} />
      ))}
    </div>
  )
}

export function TopicShell() {
  return (
    <ProgressProvider>
      <TopicShellInner />
    </ProgressProvider>
  )
}

export { SectionRenderer }
