import { SectionRenderer } from '../../components/layout/TopicShell'
import { a2aA2uiSections } from './sections'

export default function A2aA2uiTopic() {
  return (
    <div className="a2a-a2ui-topic" data-testid="a2a-a2ui-topic">
      {a2aA2uiSections.map((section, idx) => (
        <SectionRenderer key={idx} config={section} />
      ))}
    </div>
  )
}
