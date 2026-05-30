import { SectionRenderer } from '../../components/layout/TopicShell'
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
