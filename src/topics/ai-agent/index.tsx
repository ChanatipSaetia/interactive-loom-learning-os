import { SectionRenderer } from '../../components/layout/TopicShell'
import { TopicRegistry } from '../../core/topic-registry'
import { aiAgentSections } from './sections'

export default function AiAgentTopic() {
  return (
    <div className="ai-agent-topic" data-testid="ai-agent-topic">
      {aiAgentSections.map((section, idx) => (
        <SectionRenderer key={idx} config={section} />
      ))}
    </div>
  )
}

TopicRegistry.register('ai-agent', AiAgentTopic)
