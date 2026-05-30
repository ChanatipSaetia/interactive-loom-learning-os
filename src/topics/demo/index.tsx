import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { routes } from '../../core/routes'
import { SectionRenderer } from '../../components/layout/TopicShell'

export default function DemoTopic() {
  const { topicId } = useParams()
  const topic = useMemo(
    () => routes.find((r) => r.id === topicId),
    [topicId]
  )

  if (!topic || topic.sections.length === 0) {
    return <div className="demo-topic" />
  }

  return (
    <div className="demo-topic" data-testid="demo-topic">
      {topic.sections.map((section, idx) => (
        <SectionRenderer key={idx} config={section} />
      ))}
    </div>
  )
}
