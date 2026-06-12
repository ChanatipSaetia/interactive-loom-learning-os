import { ShieldAlert } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'

export const runtimeControlsCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: ShieldAlert as unknown as ComponentType<any>,
  title: '4. Runtime Controls',
  subtitle: 'What stops it when it goes wrong?',
  description: 'A deployed agent is a digital insider with write access. Runtime controls are the enforcement mechanisms that bound agent behavior at execution time.',
  details: 'Four controls: API contracts define permissible calls at every tool invocation. Permission scoping separates read from write access per workflow. Kill switches halt agents on drift or failure. Reasoning sandboxes dry-run proposed actions against policy before execution.',
  analogy: 'Like circuit breakers in an electrical system — they trip automatically when conditions exceed safe thresholds, preventing cascading failures.',
  primaryFocus: 'API contracts, permission scoping, kill switches, reasoning sandboxes',
  inScope: ['API call validation', 'Read/write permission separation', 'Anomaly-based kill switches', 'Pre-execution policy validation'],
  outOfScope: ['Unrestricted tool access', 'Agents without emergency stop capability'],
  color: 'red',
}
