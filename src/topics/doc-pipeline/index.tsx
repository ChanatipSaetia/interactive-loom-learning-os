import { SectionRenderer } from '../../components/layout/TopicShell'
import { docPipelineSections } from './sections'

export default function DocPipelineTopic() {
  return (
    <div className="doc-pipeline-topic" data-testid="doc-pipeline-topic">
      {docPipelineSections.map((section, idx) => (
        <SectionRenderer key={idx} config={section} />
      ))}
    </div>
  )
}
