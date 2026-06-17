import type { SectionConfig } from '../../core/registry'
import {
  docPipelineSchema,
  docPipelineParagraphs,
  docPipelineLifecycleMarkdown,
  docPipelineCapabilityBullets,
} from './data'

export const docPipelineSections: SectionConfig[] = [
  {
    type: 'text',
    props: {
      title: 'AI Document Ingestion Pipeline',
      heading: 'Automated Extraction with Human Audit',
      paragraphs: docPipelineParagraphs,
    },
  },
  {
    type: 'flowchart',
    props: {
      title: 'Document Processing Pipeline',
      schema: docPipelineSchema,
    },
  },
  {
    type: 'text',
    props: {
      title: 'Pipeline Lifecycle',
      paragraphs: [docPipelineLifecycleMarkdown],
    },
  },
  {
    type: 'bullets',
    props: {
      title: 'Pipeline Capabilities',
      ordered: false,
      items: docPipelineCapabilityBullets,
    },
  },
]
