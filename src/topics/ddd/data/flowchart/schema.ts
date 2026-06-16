import { TYPES } from '../../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../../sections/flowchart'

export const dddSchema: UnifiedFlowchartSchema = {
  entities: {
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
    'evt_discover_domain': {
      title: 'Domain Discovered',
      desc: 'Team identifies the business domain and its complexity.',
      viewTypes: { EVENT_STORMING: TYPES.EVENT },
    },
    'cmd_event_storm': {
      title: 'Conduct Event Storming',
      desc: 'Sticky notes on wall. Domain experts + developers discover language and events.',
      viewTypes: { EVENT_STORMING: TYPES.COMMAND },
    },
    'evt_language_emerges': {
      title: 'Ubiquitous Language Emerged',
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
      title: 'Enforce Invariants Policy',
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
  },
  relations: [
    { id: 'r_sa_1', from: 'ubiquitous-language', to: 'bounded-contexts', views: ['SYS_ARCH'] },
    { id: 'r_sa_2', from: 'bounded-contexts', to: 'context-map', views: ['SYS_ARCH'] },
    { id: 'r_sa_3', from: 'subdomains', to: 'bounded-contexts', views: ['SYS_ARCH'] },
    { id: 'r_sa_4', from: 'bounded-contexts', to: 'aggregate', views: ['SYS_ARCH'] },
    { id: 'r_sa_5', from: 'aggregate', to: 'repository', views: ['SYS_ARCH'] },
    { id: 'r_sa_6', from: 'aggregate', to: 'domain-event', views: ['SYS_ARCH'] },
    { id: 'r_sa_7', from: 'domain-service', to: 'aggregate', views: ['SYS_ARCH'] },
    { id: 'r_sa_8', from: 'domain_expert', to: 'ubiquitous-language', views: ['SYS_ARCH'] },

    { id: 'r_es_1', from: 'domain_expert', to: 'evt_discover_domain', views: ['EVENT_STORMING'] },
    { id: 'r_es_2', from: 'evt_discover_domain', to: 'cmd_event_storm', views: ['EVENT_STORMING'] },
    { id: 'r_es_3', from: 'cmd_event_storm', to: 'evt_language_emerges', views: ['EVENT_STORMING'] },
    { id: 'r_es_4', from: 'evt_language_emerges', to: 'cmd_define_contexts', views: ['EVENT_STORMING'] },
    { id: 'r_es_5', from: 'cmd_define_contexts', to: 'dec_split_context', views: ['EVENT_STORMING'] },
    { id: 'r_es_6', from: 'dec_split_context', to: 'cmd_map_relationships', views: ['EVENT_STORMING'] },
    { id: 'r_es_7', from: 'cmd_map_relationships', to: 'evt_contexts_defined', views: ['EVENT_STORMING'] },
    { id: 'r_es_8', from: 'evt_contexts_defined', to: 'cmd_build_model', views: ['EVENT_STORMING'] },
    { id: 'r_es_9', from: 'cmd_build_model', to: 'pol_enforce_invariants', views: ['EVENT_STORMING'] },
    { id: 'r_es_10', from: 'pol_enforce_invariants', to: 'evt_model_implemented', views: ['EVENT_STORMING'] },
  ],
  views: {
    EVENT_STORMING: {
      name: 'DDD Discovery Process',
      icon: 'GitBranch',
      nodes: [
        { id: 'domain_expert', grid: [0, 2] },
        { id: 'evt_discover_domain', grid: [1, 1] },
        { id: 'cmd_event_storm', grid: [2, 2] },
        { id: 'evt_language_emerges', grid: [3, 1] },
        { id: 'cmd_define_contexts', grid: [4, 2] },
        { id: 'dec_split_context', grid: [6, 2] },
        { id: 'cmd_map_relationships', grid: [7, 2] },
        { id: 'evt_contexts_defined', grid: [8, 1] },
        { id: 'cmd_build_model', grid: [8, 3] },
        { id: 'pol_enforce_invariants', grid: [9, 3] },
        { id: 'evt_model_implemented', grid: [10, 2] },
      ],
      groups: [
        {
          id: 'es_discovery',
          title: 'Discovery Phase',
          desc: 'Event Storming reveals the ubiquitous language and domain events.',
          nodeIds: ['evt_discover_domain', 'cmd_event_storm', 'evt_language_emerges'],
          color: 'rgba(245, 194, 230, 0.12)',
          borderColor: '#f2cde7',
          textColor: '#f2cde7',
        },
        {
          id: 'es_context',
          title: 'Context Definition',
          desc: 'Bounded contexts drawn where model diverges. Relationships mapped.',
          nodeIds: ['cmd_define_contexts', 'dec_split_context', 'cmd_map_relationships', 'evt_contexts_defined'],
          color: 'rgba(148, 226, 213, 0.12)',
          borderColor: '#94e2d5',
          textColor: '#94e2d5',
        },
        {
          id: 'es_implementation',
          title: 'Tactical Implementation',
          desc: 'Entities, Aggregates, Events implemented within bounded context.',
          nodeIds: ['cmd_build_model', 'pol_enforce_invariants', 'evt_model_implemented'],
          color: 'rgba(132, 185, 240, 0.12)',
          borderColor: '#85a6f4',
          textColor: '#85a6f4',
        },
      ]
    },
    SYS_ARCH: {
      name: 'DDD Layers',
      icon: 'Layers',
      nodes: [
        { id: 'domain_expert', grid: [0, 2] },
        { id: 'ubiquitous-language', grid: [1, 2] },
        { id: 'subdomains', grid: [3, 0] },
        { id: 'bounded-contexts', grid: [3, 2] },
        { id: 'context-map', grid: [5, 0] },
        { id: 'aggregate', grid: [3, 3] },
        { id: 'repository', grid: [2, 3] },
        { id: 'domain-event', grid: [4, 3] },
        { id: 'domain-service', grid: [5, 2] },
      ],
      groups: [
        {
          id: 'sa_strategic',
          title: 'Strategic Design',
          desc: 'Subdomains, Bounded Contexts, Context Maps — where 80% of DDD value lives.',
          nodeIds: ['subdomains', 'bounded-contexts', 'context-map'],
          color: 'rgba(245, 194, 230, 0.12)',
          borderColor: '#f2cde7',
          textColor: '#f2cde7',
        },
        {
          id: 'sa_tactical',
          title: 'Tactical Design',
          desc: 'Building blocks inside a bounded context: Aggregates, Repositories, Events, Services.',
          nodeIds: ['aggregate', 'repository', 'domain-event', 'domain-service'],
          color: 'rgba(132, 185, 240, 0.12)',
          borderColor: '#85a6f4',
          textColor: '#85a6f4',
        },
      ]
    }
  },
  journeys: [
    {
      id: 'ddd-discovery',
      label: 'DDD Discovery Process',
      description: 'Follow the journey from domain discovery through Event Storming to tactical implementation.',
      steps: [
        {
          nodeIds: ['domain_expert', 'evt_discover_domain'],
          description: 'Domain Discovered — Domain experts collaborate to identify business complexity.',
        },
        {
          nodeIds: ['cmd_event_storm', 'evt_language_emerges'],
          description: 'Event Storming — Sticky notes reveal events, commands, and the ubiquitous language.',
        },
        {
          nodeIds: ['cmd_define_contexts', 'dec_split_context'],
          description: 'Bounded Contexts — Where the same word means different things, a new context is drawn.',
        },
        {
          nodeIds: ['cmd_map_relationships', 'evt_contexts_defined'],
          description: 'Context Map — Relationships defined: Partnership, ACL, Customer/Supplier, Conformist.',
        },
        {
          nodeIds: ['cmd_build_model', 'pol_enforce_invariants', 'evt_model_implemented'],
          description: 'Tactical Implementation — Entities, Aggregates, Events enforce invariants. Code mirrors business reality.',
        },
      ]
    },
    {
      id: 'ddd-layers',
      label: 'DDD Structural Layers',
      description: 'Explore how Strategic and Tactical layers connect through the ubiquitous language.',
      steps: [
        {
          nodeIds: ['domain_expert', 'ubiquitous-language'],
          description: 'Ubiquitous Language — Domain experts and developers share one language, everywhere.',
        },
        {
          nodeIds: ['subdomains', 'bounded-contexts', 'context-map'],
          description: 'Strategic Design — Subdomains classified, bounded contexts drawn, relationships mapped.',
        },
        {
          nodeIds: ['aggregate', 'repository', 'domain-event', 'domain-service'],
          description: 'Tactical Design — Inside each bounded context: aggregates enforce invariants, repositories persist, events drive reactions.',
        },
      ]
    }
  ]
}
