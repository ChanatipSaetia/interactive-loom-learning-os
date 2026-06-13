import { Monitor } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../../sections/taxonomy-browser'

export const a2uiCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Monitor as unknown as ComponentType<any>,
  title: 'A2UI — Agent-to-UI',
  subtitle: 'Declarative UI generation across trust boundaries',
  description: 'A2UI is an open protocol that allows AI agents to send rich, interactive UIs to clients without executing code on the client side. The agent generates a declarative JSON specification of pre-approved components, and the client renders them natively — whether React, Angular, Flutter, or native mobile.',
  details: 'A2UI is designed to be secure by default: it transmits declarative data, not executable code. Agents can only use components from the client pre-approved catalog. The flat JSON structure is LLM-friendly, supporting incremental streaming so the UI updates in real-time as the model generates. The protocol is Apache 2.0 licensed, created by Google with CopilotKit contributions, and flows through the A2A transport layer.',
  analogy: 'Like sending a blueprint to a contractor — you specify what to build, and the contractor constructs it using their own approved materials and methods.',
  primaryFocus: 'Declarative components, streaming generation, framework-agnostic rendering',
  inScope: ['Declarative UI specs', 'Form components', 'Result cards', 'Action buttons', 'Progressive rendering', 'Framework-agnostic output'],
  outOfScope: ['Executable code delivery', 'Client-side logic', 'Styling engines', 'Framework-specific implementation'],
  color: 'peach',
}
