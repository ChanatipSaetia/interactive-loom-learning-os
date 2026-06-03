import { SectionRenderer } from '../../components/layout/TopicShell'
import { TopicRegistry } from '../../core/topic-registry'
import { aiGovernanceSections } from './sections'

export default function AiGovernanceTopic() {
  return (
    <div className="ai-governance-topic" data-testid="ai-governance-topic">
      {aiGovernanceSections.map((section, idx) => (
        <SectionRenderer key={idx} config={section} />
      ))}
    </div>
  )
}

TopicRegistry.register('ai-governance', AiGovernanceTopic)
