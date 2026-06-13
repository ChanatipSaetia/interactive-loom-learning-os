import { FileText } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../../sections/taxonomy-browser'

export const artifactCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: FileText as unknown as ComponentType<any>,
  title: 'Artifact',
  subtitle: 'A2A Data Model',
  description: 'Concrete output and deliverable from agent work with an artifactId, name, and Parts.',
  details: 'Represents the tangible output produced by an agent — documents, generated files, or other deliverables. Artifacts are streamed incrementally to the client, allowing the consumer to receive partial results as the agent works.',
  analogy: 'Like a deliverable attached to a project — the concrete output produced by the agent\'s work.',
  primaryFocus: 'Output documents, generated files, incremental streaming',
  inScope: [
    'Output documents',
    'Generated files',
    'Incremental streaming',
  ],
  outOfScope: ['Task coordination', 'Discovery', 'Messages'],
  color: 'mauve',
}
