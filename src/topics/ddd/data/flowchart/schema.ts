import { TYPES } from '../../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../../sections/flowchart'

export const dddSchema: UnifiedFlowchartSchema = {
  entities: {
    'ubiquitous-language': {
      title: 'Ubiquitous Language',
      desc: 'Shared language across code, docs, and conversation. The heart of DDD.',
      type: TYPES.AGGREGATE,
    },
    'bounded-contexts': {
      title: 'Bounded Contexts',
      desc: 'Explicit boundaries for a domain model. Where one concept = one term.',
      type: TYPES.AGGREGATE,
    },
    'subdomains': {
      title: 'Subdomains',
      desc: 'Core, Supporting, Generic — classification of domain responsibilities.',
      type: TYPES.AGGREGATE,
    },
    'context-map': {
      title: 'Context Map',
      desc: 'Relationships between bounded contexts: Partnership, ACL, Conformist, etc.',
      type: TYPES.AGGREGATE,
    },
    'aggregate': {
      title: 'Aggregate',
      desc: 'Cluster of entities + VOs as one unit. One root, one transaction.',
      type: TYPES.AGGREGATE,
    },
    'repository': {
      title: 'Repository',
      desc: 'Collection-like interface for persisting and loading aggregates.',
      type: TYPES.AGGREGATE,
    },
    'domain-event': {
      title: 'Domain Event',
      desc: 'Past-tense fact about the domain. Published after state change.',
      type: TYPES.EXTERNAL,
    },
    'domain-service': {
      title: 'Domain Service',
      desc: 'Stateless logic spanning multiple aggregates.',
      type: TYPES.AGGREGATE,
    },
    'evt_discover_domain': {
      title: 'Domain Discovered',
      desc: 'Team identifies the business domain and its complexity.',
      type: TYPES.EVENT,
    },
    'cmd_event_storm': {
      title: 'Conduct Event Storming',
      desc: 'Sticky notes on wall. Domain experts + developers discover language and events.',
      type: TYPES.COMMAND,
    },
    'evt_language_emerges': {
      title: 'Ubiquitous Language Emerged',
      desc: 'Shared terms crystallize from workshop: "settlement", "claim", not "doTheThing".',
      type: TYPES.EVENT,
    },
    'cmd_define_contexts': {
      title: 'Define Bounded Contexts',
      desc: 'Draw context boundaries where the same word means different things.',
      type: TYPES.COMMAND,
    },
    'dec_split_context': {
      title: 'Same Word, Different Model?',
      desc: 'If yes → new bounded context. If no → can share.',
      type: TYPES.POLICY,
    },
    'cmd_map_relationships': {
      title: 'Map Context Relationships',
      desc: 'Choose pattern: Partnership, ACL, Customer/Supplier, Conformist.',
      type: TYPES.COMMAND,
    },
    'evt_contexts_defined': {
      title: 'Bounded Contexts Defined',
      desc: 'Context map shows all boundaries and relationships.',
      type: TYPES.EVENT,
    },
    'cmd_build_model': {
      title: 'Build Tactical Model',
      desc: 'Implement Entities, Value Objects, Aggregates, Repositories, Events.',
      type: TYPES.COMMAND,
    },
    'pol_enforce_invariants': {
      title: 'Enforce Invariants Policy',
      desc: 'Aggregate root ensures all rules hold. One transaction = one aggregate.',
      type: TYPES.POLICY,
    },
    'evt_model_implemented': {
      title: 'Model Implemented',
      desc: 'Code mirrors business reality. Teams communicate in shared language.',
      type: TYPES.EVENT,
    },
    'domain_expert': {
      title: 'Domain Expert',
      desc: 'Subject matter expert who understands the business domain.',
      type: TYPES.USER,
    },
    'cmd_discover': {
      title: 'Discover Domain Complexity',
      desc: 'Initial research into the target business functions.',
      type: TYPES.COMMAND,
    },
    'evt_discovered': {
      title: 'Domain Complexity Mapped',
      desc: 'Initial map of domain requirements and rules.',
      type: TYPES.EVENT,
    },
    'pol_define': {
      title: 'Define Boundaries',
      desc: 'Policy: structure contexts and subdomains based on domain semantics.',
      type: TYPES.POLICY,
    },
    'evt_boundaries_drawn': {
      title: 'Boundaries Drawn',
      desc: 'Logical subdomains and context mappings verified.',
      type: TYPES.EVENT,
    },
    'pol_map': {
      title: 'Map Relationships',
      desc: 'Policy: choose context mapping patterns.',
      type: TYPES.POLICY,
    },
    'pol_build': {
      title: 'Enforce Tactical Model',
      desc: 'Policy: execute aggregate root structures.',
      type: TYPES.POLICY,
    },
    'evt_state_changed': {
      title: 'State Changed',
      desc: 'Aggregate root modifies memory state.',
      type: TYPES.EVENT,
    },
    'pol_persist': {
      title: 'Persist Changes',
      desc: 'Policy: invoke database saves.',
      type: TYPES.POLICY,
    },
    'evt_event_published': {
      title: 'Event Published',
      desc: 'Outbox event triggered to alert external boundaries.',
      type: TYPES.EVENT,
    },
    'pol_publish': {
      title: 'Alert External Boundaries',
      desc: 'Policy: push domain events downstream.',
      type: TYPES.POLICY,
    },
    'evt_logic_evaluated': {
      title: 'Logic Evaluated',
      desc: 'Stateless multi-aggregate logic executes successfully.',
      type: TYPES.EVENT,
    },
    'pol_call': {
      title: 'Call Multi-Aggregate Logic',
      desc: 'Policy: invoke stateless services.',
      type: TYPES.POLICY,
    },
  },
  relations: [
    { id: 'r_es_1', from: 'domain_expert', to: 'cmd_discover', views: ['EVENT_STORMING'] },
    { id: 'r_es_2', from: 'cmd_discover', to: 'ubiquitous-language', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r_es_3', from: 'ubiquitous-language', to: 'evt_discovered', views: ['EVENT_STORMING'] },
    { id: 'r_es_4', from: 'evt_discovered', to: 'pol_define', views: ['EVENT_STORMING'] },
    { id: 'r_es_5', from: 'pol_define', to: 'cmd_define_contexts', views: ['EVENT_STORMING'] },
    { id: 'r_es_6', from: 'cmd_define_contexts', to: 'bounded-contexts', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r_es_7', from: 'subdomains', to: 'cmd_define_contexts', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r_es_8', from: 'bounded-contexts', to: 'evt_boundaries_drawn', views: ['EVENT_STORMING'] },
    { id: 'r_es_9', from: 'evt_boundaries_drawn', to: 'pol_map', views: ['EVENT_STORMING'] },
    { id: 'r_es_10', from: 'pol_map', to: 'cmd_map_relationships', views: ['EVENT_STORMING'] },
    { id: 'r_es_11', from: 'cmd_map_relationships', to: 'context-map', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r_es_12', from: 'context-map', to: 'evt_contexts_defined', views: ['EVENT_STORMING'] },
    { id: 'r_es_13', from: 'evt_contexts_defined', to: 'pol_build', views: ['EVENT_STORMING'] },
    { id: 'r_es_14', from: 'pol_build', to: 'cmd_build_model', views: ['EVENT_STORMING'] },
    { id: 'r_es_15', from: 'cmd_build_model', to: 'aggregate', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r_es_16', from: 'aggregate', to: 'evt_state_changed', views: ['EVENT_STORMING'] },
    { id: 'r_es_17', from: 'evt_state_changed', to: 'pol_persist', views: ['EVENT_STORMING'] },
    { id: 'r_es_18', from: 'pol_persist', to: 'repository', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r_es_19', from: 'aggregate', to: 'evt_event_published', views: ['EVENT_STORMING'] },
    { id: 'r_es_20', from: 'evt_event_published', to: 'pol_publish', views: ['EVENT_STORMING'] },
    { id: 'r_es_21', from: 'pol_publish', to: 'domain-event', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r_es_22', from: 'domain-service', to: 'evt_logic_evaluated', views: ['EVENT_STORMING'] },
    { id: 'r_es_23', from: 'evt_logic_evaluated', to: 'pol_call', views: ['EVENT_STORMING'] },
    { id: 'r_es_24', from: 'pol_call', to: 'aggregate', handledBy: true, views: ['EVENT_STORMING'] },
    // Retain classic discovery flow
    { id: 'r_es_classic_1', from: 'domain_expert', to: 'evt_discover_domain', views: ['EVENT_STORMING'] },
    { id: 'r_es_classic_2', from: 'evt_discover_domain', to: 'cmd_event_storm', views: ['EVENT_STORMING'] },
    { id: 'r_es_classic_3', from: 'cmd_event_storm', to: 'evt_language_emerges', views: ['EVENT_STORMING'] },
    { id: 'r_es_classic_4', from: 'evt_language_emerges', to: 'cmd_define_contexts', views: ['EVENT_STORMING'] },
    { id: 'r_es_classic_5', from: 'cmd_define_contexts', to: 'dec_split_context', views: ['EVENT_STORMING'] },
    { id: 'r_es_classic_6', from: 'dec_split_context', to: 'cmd_map_relationships', views: ['EVENT_STORMING'] },
    { id: 'r_es_classic_7', from: 'cmd_map_relationships', to: 'evt_contexts_defined', views: ['EVENT_STORMING'] },
    { id: 'r_es_classic_8', from: 'evt_contexts_defined', to: 'cmd_build_model', views: ['EVENT_STORMING'] },
    { id: 'r_es_classic_9', from: 'cmd_build_model', to: 'pol_enforce_invariants', views: ['EVENT_STORMING'] },
    { id: 'r_es_classic_10', from: 'pol_enforce_invariants', to: 'evt_model_implemented', views: ['EVENT_STORMING'] },
  ],
  views: {
    EVENT_STORMING: {
      name: 'DDD Discovery Process',
      icon: 'GitBranch',
      nodes: [
        { id: 'domain_expert', grid: [0, 2] },
        { id: 'evt_discover_domain', grid: [1, 1] },
        { id: 'cmd_discover', grid: [1, 2], root: true },
        { id: 'ubiquitous-language', grid: [2, 1] },
        { id: 'cmd_event_storm', grid: [2, 2] },
        { id: 'evt_language_emerges', grid: [3, 1] },
        { id: 'evt_discovered', grid: [3, 2] },
        { id: 'pol_define', grid: [4, 2] },
        { id: 'subdomains', grid: [5, 0] },
        { id: 'bounded-contexts', grid: [5, 1] },
        { id: 'cmd_define_contexts', grid: [5, 2] },
        { id: 'dec_split_context', grid: [6, 2] },
        { id: 'evt_boundaries_drawn', grid: [6, 3] },
        { id: 'pol_map', grid: [7, 3] },
        { id: 'context-map', grid: [8, 1] },
        { id: 'cmd_map_relationships', grid: [8, 2] },
        { id: 'evt_contexts_defined', grid: [9, 2] },
        { id: 'pol_build', grid: [10, 2] },
        { id: 'domain-service', grid: [11, 0] },
        { id: 'aggregate', grid: [11, 1] },
        { id: 'cmd_build_model', grid: [11, 2] },
        { id: 'pol_enforce_invariants', grid: [12, 2] },
        { id: 'evt_state_changed', grid: [12, 1] },
        { id: 'pol_persist', grid: [13, 1] },
        { id: 'repository', grid: [13, 0] },
        { id: 'evt_event_published', grid: [12, 3] },
        { id: 'pol_publish', grid: [13, 3] },
        { id: 'domain-event', grid: [13, 2] },
        { id: 'evt_logic_evaluated', grid: [10, 0] },
        { id: 'pol_call', grid: [9, 0] },
        { id: 'evt_model_implemented', grid: [14, 2] },
      ],
      groups: [
        {
          id: 'es_discovery',
          title: 'Discovery Phase',
          desc: 'Event Storming reveals the ubiquitous language and domain events.',
          nodeIds: ['evt_discover_domain', 'cmd_discover', 'ubiquitous-language', 'cmd_event_storm', 'evt_language_emerges', 'evt_discovered'],
          color: 'rgba(245, 194, 230, 0.12)',
          borderColor: 'var(--ctp-pink)',
          textColor: 'var(--ctp-pink)',
        },
        {
          id: 'es_context',
          title: 'Context Definition',
          desc: 'Bounded contexts drawn where model diverges. Relationships mapped.',
          nodeIds: ['pol_define', 'subdomains', 'bounded-contexts', 'cmd_define_contexts', 'dec_split_context', 'evt_boundaries_drawn', 'pol_map', 'context-map', 'cmd_map_relationships', 'evt_contexts_defined'],
          color: 'rgba(148, 226, 213, 0.12)',
          borderColor: 'var(--ctp-teal)',
          textColor: 'var(--ctp-teal)',
        },
        {
          id: 'es_implementation',
          title: 'Tactical Implementation',
          desc: 'Entities, Aggregates, Events implemented within bounded context.',
          nodeIds: ['pol_build', 'domain-service', 'aggregate', 'cmd_build_model', 'pol_enforce_invariants', 'evt_state_changed', 'pol_persist', 'repository', 'evt_event_published', 'pol_publish', 'domain-event', 'evt_logic_evaluated', 'pol_call', 'evt_model_implemented'],
          color: 'rgba(132, 185, 240, 0.12)',
          borderColor: 'var(--ctp-blue)',
          textColor: 'var(--ctp-blue)',
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
          description: 'Tactical Implementation — Tactical building blocks inside context model business reality.',
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
          description: 'Tactical Design — Aggregates enforce invariants, repositories persist, events drive reactions.',
        },
      ]
    }
  ]
}
