import { Brain, FileSearch, GitBranch, Network, Bot, Server, Boxes, FolderGit2 } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'

export const scenariosCategories: TaxonomyCategory[] = [
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: Brain as unknown as ComponentType<any>,
    title: 'LLM Orchestration Platform',
    subtitle: 'Full DDD Pays Off',
    description: 'Multi-step LLM workflows with quality gates, cost budgets, retry policies, and compliance audit trail. Team of 10 engineers.',
    details: 'DDD wins here. Entities: Workflow, Step, ModelAssignment, QualityGate, Revision. Value Objects: TokenBudget, QualityScore, ModelRef. The Workflow aggregate enforces invariants: total tokens cannot exceed budget, each step must pass quality gate before next step. Domain events drive the system: WorkflowSubmitted, StepExecuted, QualityGateFailed, ModelFallbackTriggered. With DDD: zero invariant violations, new content type in 2 weeks, compliance audit in 1 week. Without: 4 production bugs in 6 months, 70-column table, 3-week forensic audit.',
    analogy: 'Like air traffic control — multiple planes (workflows), each with rules, budgets, and checkpoints. You need a rich model, not a spreadsheet.',
    primaryFocus: 'Multi-step workflows with quality gates and compliance',
    inScope: ['Rich aggregate invariants', 'Domain events drive reactions', 'Audit trail from event log'],
    outOfScope: ['Simple CRUD operations', 'Flat data records'],
    color: 'pink',
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: FileSearch as unknown as ComponentType<any>,
    title: 'API Endpoint Registry',
    subtitle: 'DDD Is Overkill',
    description: 'Internal tool for registering API endpoints: name, URL, method, auth type, owner team, status. Search, filter, export. Team of 2 devs.',
    details: 'Actively harmful to use DDD here. No complex rules, no invariants, just CRUD with search. With DDD: 4 weeks, 35 files, ~1800 LOC, team asks "we need an aggregate for a URL?". Without DDD: 1 week, 7 files, ~350 LOC, "done in a week." The complexity of DDD infrastructure exceeds the domain complexity by 10x.',
    analogy: 'Like using a forklift to carry a book across the room — the tool exists for heavier loads.',
    primaryFocus: 'When CRUD is the right answer',
    inScope: ['Fast to ship', 'Easy to understand', 'Junior-friendly'],
    outOfScope: ['Complex business rules', 'Invariant enforcement', 'Multi-team coordination'],
    color: 'lavender',
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: GitBranch as unknown as ComponentType<any>,
    title: 'CI/CD Pipeline Engine',
    subtitle: 'Tactical DDD Only',
    description: 'Pipeline engine: build, test, lint, security scan, deploy. Complex DAG constraints, artifact passing, rollback triggers. Single team of 4.',
    details: 'Tactical DDD without Strategic. Genuine domain complexity (step dependencies, artifact immutability, rollback invariants) but one team and one codebase. PipelineRun aggregate with Step children and Status/Artifact value objects. Events: PipelineRunStarted, StepSucceeded/Failed, ArtifactProduced, RollbackTriggered. When the org acquired another company at Month 8, strategic DDD was retrofitted for integration.',
    analogy: 'Like a well-engineered engine in a single-car garage — rich mechanics, no need for a factory layout.',
    primaryFocus: 'Rich model within a single bounded context',
    inScope: ['Tactical patterns only', 'Single context', 'Rich invariants enforced'],
    outOfScope: ['Context maps', 'Cross-team boundaries', 'Multiple models'],
    color: 'green',
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: Network as unknown as ComponentType<any>,
    title: 'Developer Platform',
    subtitle: 'Strategic DDD Essential',
    description: 'Internal platform like Backstage: Service Catalog, CI/CD, Observability. Three teams, 15 engineers. "Component" means different things per context.',
    details: 'Strategic DDD is essential. Catalog BC: Component = service definition with owner and lifecycle. Orchestration BC: Component = build target with pipeline template. Observability BC: Component = monitoring target with alert rules. Without DDD: 70-column table, 35 null fields, every change breaks everything. With DDD: 3 focused models (~20 fields each), teams deploy independently, 3 features in parallel.',
    analogy: 'Like three departments in a hospital — Cardiology, Surgery, and Radiology all handle "patients" but with completely different models.',
    primaryFocus: 'Multi-team platforms where terminology diverges',
    inScope: ['Bounded contexts per team', 'Independent deployment', 'Context map drives architecture'],
    outOfScope: ['Shared database', 'Shared model classes'],
    color: 'sky',
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: Bot as unknown as ComponentType<any>,
    title: 'AI Agent Framework',
    subtitle: 'Hybrid Approach',
    description: 'Open-source framework: tool-use orchestration, context management, safety guardrails (rich). Plugin registry, analytics, settings (simple). Team of 6.',
    details: 'Not everything needs full DDD. Core domain (tool orchestration, context window, safety) gets full DDD with aggregates, events, and invariants — 60% of effort, 80% of value. Supporting (plugin registry, user settings) gets tactical patterns only. Generic (auth, storage) is bought: Auth0, S3 at $500/month instead of $80K in development.',
    analogy: 'Like a restaurant — invest in the kitchen (core), keep the dining area clean (supporting), buy electricity from the grid (generic).',
    primaryFocus: 'Subdomain classification focuses effort on what matters',
    inScope: ['Full DDD for core', 'Tactical for supporting', 'Buy generic'],
    outOfScope: ['Full DDD everywhere', 'Building everything from scratch'],
    color: 'peach',
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: Server as unknown as ComponentType<any>,
    title: 'Distributed Task Queue',
    subtitle: 'Thin Aggregate + Events',
    description: 'High-throughput task queue for ML training. Millisecond scheduling. Tasks retry up to 50 times. Team of 6.',
    details: 'Keep aggregates thin. A god aggregate with ExecutionHistory[50] and Result[] grows massive — scheduling latency becomes a bottleneck. Thin aggregate (just TaskId, Status, Priority, currentAttempt) keeps scheduling under 5ms. History stored as domain events: TaskSubmitted, TaskScheduled, TaskAttemptFailed, TaskSucceeded. Events enable perfect failure diagnosis — replay any task\'s lifecycle to find why attempt 37 failed.',
    analogy: 'Like a flight manifest — just the essentials for boarding. Full flight history is in the airline\'s log.',
    primaryFocus: 'High-throughput systems with thin aggregates and event-sourced history',
    inScope: ['Fixed-size aggregate', 'Event-sourced history', 'Replay capability'],
    outOfScope: ['God aggregate with all history', 'Loading full graph for scheduling'],
    color: 'mauve',
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: Boxes as unknown as ComponentType<any>,
    title: 'AI Model Registry',
    subtitle: 'Domain Events Drive Everything',
    description: 'Model lifecycle: development → validation → staging → production → deprecation. Promotion gates, A/B testing, rollback. Team of 5.',
    details: 'Textbook domain events. ModelVersionRegistered triggers validation pipeline. ValidationPassed triggers PromotionService. ModelPromotedToStaging triggers canary deployment. DriftDetectionService monitors metrics: if OK, TrafficShifted (10% → 50% → 100%); if degraded, ModelRolledBack. New deployment mode = new events and handlers, isolated from existing code. Compliance reporting is free — just query the event store.',
    analogy: 'Like a package tracking system — each status change is an event. You can replay the entire journey.',
    primaryFocus: 'Rich state transitions driven by domain events',
    inScope: ['Event-driven reactions', 'Built-in audit trail', 'Isolated new features'],
    outOfScope: ['Direct state mutation', 'Cascading method changes'],
    color: 'yellow',
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: FolderGit2 as unknown as ComponentType<any>,
    title: 'Open-Source Monorepo',
    subtitle: 'Organizational Reality',
    description: '50+ packages, 6 working groups, 30+ contributors. "Package" means something different to CLI, Runtime, LangServer, and Plugin SDK teams.',
    details: 'When multiple groups share terminology but mean different things, bounded contexts resolve both technical and social ambiguity. CLI: Package = distributable binary. Runtime: Package = ES module. LangServer: Package = VS Code extension. Plugin SDK: Package = npm package. Release BC orchestrates all versions. Without DDD: 40→50-field Package model, nulls everywhere, 3-week onboarding. With DDD: each group owns its model, 1-week onboarding, event-driven release coordination.',
    analogy: 'Like "ball" in sports — a baseball, basketball, and soccer ball are all "balls" but governed by completely different rules.',
    primaryFocus: 'Large distributed teams with shared terminology but divergent meaning',
    inScope: ['Per-group bounded contexts', 'Release orchestration', 'Event-driven coordination'],
    outOfScope: ['Shared model classes', 'Single source of truth'],
    color: 'red',
  },
]
