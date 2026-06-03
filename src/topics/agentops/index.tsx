import { SectionRenderer } from '../../components/layout/TopicShell'
import { TopicRegistry } from '../../core/topic-registry'
import { agentopsSections } from './sections'

export default function AgentopsTopic() {
  return (
    <div className="agentops-topic" data-testid="agentops-topic">
      {agentopsSections.map((section, idx) => (
        <SectionRenderer key={idx} config={section} />
      ))}
    </div>
  )
}

TopicRegistry.register('agentops', AgentopsTopic)
