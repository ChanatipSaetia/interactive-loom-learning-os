import { GitFork, Shuffle, Users, ShieldCheck } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'

const hierarchicalCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: GitFork as unknown as ComponentType<any>,
  title: 'Hierarchical Orchestration',
  subtitle: 'Orchestrator-Workers',
  description: 'A central manager agent (orchestrator) decomposes goals, delegates tasks to specialized worker agents, collects results, and synthesizes the final output.',
  details: 'Ideal for complex, multi-step workflows requiring strict quality control, consensus, or routing.',
  analogy: 'Like a software engineering manager delegating backend, frontend, and QA tasks to developers.',
  primaryFocus: 'Task decomposition, delegation, and output synthesis.',
  inScope: ['Central director', 'Specialized sub-agents', 'Dynamic task routing'],
  outOfScope: ['Peer-to-peer unstructured negotiation'],
  color: 'mauve',
}

const sequentialCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Shuffle as unknown as ComponentType<any>,
  title: 'Sequential Choreography',
  subtitle: 'Chain of Agents',
  description: 'Agents work in a pipeline, passing data sequentially. Each agent receives input from the previous step, performs its specialized task, and hands off to the next.',
  details: 'Best for structured pipelines where steps are predictable (e.g. Code Gen -> Lint -> Test -> Fix).',
  analogy: 'An assembly line in a factory where each worker installs a specific part of a car.',
  primaryFocus: 'Linear hand-offs and deterministic stage-gate processing.',
  inScope: ['Sequential pipeline', 'Stage-gate validation', 'Incremental improvement'],
  outOfScope: ['Dynamic backtracking or ad-hoc loops'],
  color: 'blue',
}

const peerCollaborationCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Users as unknown as ComponentType<any>,
  title: 'Peer Collaboration',
  subtitle: 'Decentralized Network',
  description: 'Independent agents interact directly, negotiate, and collaborate to solve a problem without a centralized manager.',
  details: 'Useful for negotiation, multi-perspective debates, or open-ended creative tasks.',
  analogy: 'A brainstorming session among design peers sharing ideas, voting, and converging on a solution.',
  primaryFocus: 'Peer negotiation, debate, and consensus mechanisms.',
  inScope: ['Debate loops', 'Voting consensus', 'Agent-to-agent negotiation'],
  outOfScope: ['Rigid hierarchical command lines'],
  color: 'green',
}

const supervisorCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: ShieldCheck as unknown as ComponentType<any>,
  title: 'Supervisor Router',
  subtitle: 'Dynamic Routing',
  description: 'A supervisor agent monitors shared state, routes tasks dynamically to appropriate workers based on the current state, and decides when the overall goal is achieved.',
  details: 'Best for open-ended problem solving where the path to the solution is non-linear and depends on intermediate findings.',
  analogy: 'A triage doctor in an emergency room routing patients to specialists based on their symptoms.',
  primaryFocus: 'State-based routing and completion evaluation.',
  inScope: ['State-driven routing', 'Dynamic task assignment', 'Supervisor evaluations'],
  outOfScope: ['Deterministic linear pipelines'],
  color: 'peach',
}

export const taxonomyCategories: TaxonomyCategory[] = [
  hierarchicalCategory,
  sequentialCategory,
  peerCollaborationCategory,
  supervisorCategory,
]
