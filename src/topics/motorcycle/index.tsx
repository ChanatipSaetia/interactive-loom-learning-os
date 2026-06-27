import { SectionRenderer } from '../../components/layout/TopicShell'
import { motorcycleSections } from './sections'

export default function MotorcycleTopic() {
  return (
    <div className="motorcycle-topic" data-testid="motorcycle-topic">
      {motorcycleSections.map((section, idx) => (
        <SectionRenderer key={idx} config={section} />
      ))}
    </div>
  )
}
