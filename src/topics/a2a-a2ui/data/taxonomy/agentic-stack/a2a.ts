import { Users } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../../sections/taxonomy-browser'

export const a2aCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Users as unknown as ComponentType<any>,
  title: 'A2A — Agent-to-Agent',
  subtitle: 'Stateful multi-turn coordination between agents',
  description: 'The A2A protocol enables peer-to-peer communication between opaque agentic applications. Agents discover each other through Agent Cards, delegate tasks with full lifecycle management, and exchange messages via event streaming — all through a standardized protocol governed by the Linux Foundation.',
  details: 'A2A follows a three-layer architecture: a canonical data model (Task, Message, Part, Artifact, AgentCard), abstract operations (Send Message, Get Task, Cancel Task, Subscribe), and protocol bindings (JSON-RPC, gRPC, HTTP+JSON). Key principles include async-first design with long-running tasks and streaming, enterprise-ready security with OAuth 2.0 and mTLS, and opaque execution where agents preserve internal logic and collaborate only through declared capabilities.',
  analogy: 'Like managers coordinating between teams — each team is autonomous, they negotiate work, delegate subtasks, and exchange results without revealing internal processes.',
  primaryFocus: 'Agent Cards, task lifecycle, event streaming, opaque collaboration',
  inScope: ['Task delegation', 'Multi-turn negotiation', 'Agent discovery via Agent Cards', 'Streaming results', 'Cross-organization collaboration'],
  outOfScope: ['Tool invocation', 'Internal agent reasoning', 'Agent framework implementation', 'UI rendering'],
  color: 'blue',
}
