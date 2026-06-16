import { SectionRenderer } from '../../components/layout/TopicShell'
import { aiOperatingModelSections } from './sections'

export default function AiOperatingModelTopic() {
  return (
    <div className="ai-operating-model-topic" data-testid="ai-operating-model-topic">
      {aiOperatingModelSections.map((section, idx) => (
        <SectionRenderer key={idx} config={section} />
      ))}
    </div>
  )
}
