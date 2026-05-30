import { SectionRenderer } from '../../components/layout/TopicShell'
import { TopicRegistry } from '../../core/topic-registry'
import { demoSections } from './sections'

export default function DemoTopic() {
  return (
    <div className="demo-topic" data-testid="demo-topic">
      {demoSections.map((section, idx) => (
        <SectionRenderer key={idx} config={section} />
      ))}
    </div>
  )
}

TopicRegistry.register('demo', DemoTopic)
