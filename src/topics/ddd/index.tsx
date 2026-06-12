import { SectionRenderer } from '../../components/layout/TopicShell'
import { TopicRegistry } from '../../core/topic-registry'
import { dddSections } from './sections'

export default function DddTopic() {
  return (
    <div className="ddd-topic" data-testid="ddd-topic">
      {dddSections.map((section, idx) => (
        <SectionRenderer key={idx} config={section} />
      ))}
    </div>
  )
}

TopicRegistry.register('ddd', DddTopic)
