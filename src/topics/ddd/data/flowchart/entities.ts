import { TYPES } from '../../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../../sections/flowchart'

export const entities: UnifiedFlowchartSchema['entities'] = {
  // SYS_ARCH entities
  'ubiquitous-language': {
    title: 'Ubiquitous Language',
    desc: 'Shared language across code, docs, and conversation. The heart of DDD.',
    viewTypes: { SYS_ARCH: TYPES.DATA_OBJECT },
  },
  'bounded-contexts': {
    title: 'Bounded Contexts',
    desc: 'Explicit boundaries for a domain model. Where one concept = one term.',
    viewTypes: { SYS_ARCH: TYPES.SERVICE },
  },
  'subdomains': {
    title: 'Subdomains',
    desc: 'Core, Supporting, Generic — classification of domain responsibilities.',
    viewTypes: { SYS_ARCH: TYPES.SERVICE },
  },
  'context-map': {
    title: 'Context Map',
    desc: 'Relationships between bounded contexts: Partnership, ACL, Conformist, etc.',
    viewTypes: { SYS_ARCH: TYPES.SERVICE },
  },
  'aggregate': {
    title: 'Aggregate',
    desc: 'Cluster of entities + VOs as one unit. One root, one transaction.',
    viewTypes: { SYS_ARCH: TYPES.DATABASE },
  },
  'repository': {
    title: 'Repository',
    desc: 'Collection-like interface for persisting and loading aggregates.',
    viewTypes: { SYS_ARCH: TYPES.DATABASE },
  },
  'domain-event': {
    title: 'Domain Event',
    desc: 'Past-tense fact about the domain. Published after state change.',
    viewTypes: { SYS_ARCH: TYPES.EXTERNAL },
  },
  'domain-service': {
    title: 'Domain Service',
    desc: 'Stateless logic spanning multiple aggregates.',
    viewTypes: { SYS_ARCH: TYPES.SERVICE },
  },
  // EVENT_STORMING entities
  'evt_discover_domain': {
    title: 'Domain Discovered',
    desc: 'Team identifies the business domain and its complexity.',
    viewTypes: { EVENT_STORMING: TYPES.EVENT },
  },
  'cmd_event_storm': {
    title: 'Event Storming Workshop',
    desc: 'Sticky notes on wall. Domain experts + developers discover language and events.',
    viewTypes: { EVENT_STORMING: TYPES.COMMAND },
  },
  'evt_language_emerges': {
    title: 'Ubiquitous Language Emerges',
    desc: 'Shared terms crystallize from workshop: "settlement", "claim", not "doTheThing".',
    viewTypes: { EVENT_STORMING: TYPES.EVENT },
  },
  'cmd_define_contexts': {
    title: 'Define Bounded Contexts',
    desc: 'Draw context boundaries where the same word means different things.',
    viewTypes: { EVENT_STORMING: TYPES.COMMAND },
  },
  'dec_split_context': {
    title: 'Same Word, Different Model?',
    desc: 'If yes → new bounded context. If no → can share.',
    viewTypes: { EVENT_STORMING: TYPES.DECISION },
  },
  'cmd_map_relationships': {
    title: 'Map Context Relationships',
    desc: 'Choose pattern: Partnership, ACL, Customer/Supplier, Conformist.',
    viewTypes: { EVENT_STORMING: TYPES.COMMAND },
  },
  'evt_contexts_defined': {
    title: 'Bounded Contexts Defined',
    desc: 'Context map shows all boundaries and relationships.',
    viewTypes: { EVENT_STORMING: TYPES.EVENT },
  },
  'cmd_build_model': {
    title: 'Build Tactical Model',
    desc: 'Implement Entities, Value Objects, Aggregates, Repositories, Events.',
    viewTypes: { EVENT_STORMING: TYPES.COMMAND },
  },
  'pol_enforce_invariants': {
    title: 'Enforce Invariants',
    desc: 'Aggregate root ensures all rules hold. One transaction = one aggregate.',
    viewTypes: { EVENT_STORMING: TYPES.POLICY },
  },
  'evt_model_implemented': {
    title: 'Model Implemented',
    desc: 'Code mirrors business reality. Teams communicate in shared language.',
    viewTypes: { EVENT_STORMING: TYPES.EVENT },
  },
  'domain_expert': {
    title: 'Domain Expert',
    desc: 'Subject matter expert who understands the business domain.',
    viewTypes: {
      EVENT_STORMING: TYPES.USER,
      SYS_ARCH: TYPES.USER,
    },
  },
}
