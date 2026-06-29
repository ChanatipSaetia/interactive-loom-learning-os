import { SectionRenderer } from '../../components/layout/TopicShell'
import { haystackSections } from './sections'

export default function HaystackTopic() {
  return (
    <div className="haystack-topic" data-testid="haystack-topic">
      {haystackSections.map((section, idx) => (
        <SectionRenderer key={idx} config={section} />
      ))}
    </div>
  )
}
