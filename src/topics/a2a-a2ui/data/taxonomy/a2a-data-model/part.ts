import { Package } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../../sections/taxonomy-browser'

export const partCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Package as unknown as ComponentType<any>,
  title: 'Part',
  subtitle: 'A2A Data Model',
  description: 'Modality-independent content container — a oneof: text, raw bytes, URL, or structured data.',
  details: 'Carries a mediaType and metadata alongside the payload. A Part is the lowest-level content unit in the protocol, allowing messages and artifacts to carry any kind of content without constraining the modality.',
  analogy: 'Like an envelope that can carry a letter, a photo, or a document — the container adapts to the content type.',
  primaryFocus: 'Text, binary data, file URLs, structured JSON',
  inScope: [
    'Text content',
    'Binary data',
    'File URLs',
    'Structured JSON',
  ],
  outOfScope: ['Task management', 'Agent identity'],
  color: 'green',
}
