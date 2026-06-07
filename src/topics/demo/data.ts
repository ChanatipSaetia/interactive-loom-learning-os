import { TYPES } from '../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../sections/flowchart'
import type { TradeoffScenario } from '../../sections/tradeoff-sandbox'
import type { TaxonomyCategory } from '../../sections/taxonomy-browser'
import type { BulletItem } from '../../sections/bullets'
import type { ComponentType } from 'react'
import { Brain, Zap, Shield, Workflow } from 'lucide-react'

// ─── Tradeoff Sandbox (Section-TradeoffSandbox.md) ────────────────────────────

export const tradeoffSandboxScenarios: TradeoffScenario[] = [
  {
    id: 'enterprise-web',
    title: 'Enterprise Web Application',
    description: 'Build a scalable enterprise web app: React SPA, Node.js microservices, PostgreSQL, deployed on Cloud PaaS. Evaluate trade-offs across frontend, backend, and infrastructure decisions.',
    metrics: [
      { id: 'performance', label: 'Performance', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'scalability', label: 'Scalability', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'complexity', label: 'Complexity', baseValue: 30, min: 0, max: 100, direction: 'lower' },
      { id: 'cost', label: 'Cost Efficiency', baseValue: 50, min: 0, max: 100, direction: 'higher' },
    ],
   steps: [
       {
         id: 'frontend',
         title: 'Frontend Framework',
         description: 'Choose the client-side rendering approach.',
         recommended: 'next-ssr',
         choices: [
           {
             id: 'react-spa',
             label: 'React SPA',
             description: 'Single-page application with client-side routing and state management.',
             metrics: { performance: 10, scalability: 5, complexity: 5, cost: 5 },
             pros: [
               { title: 'Rich ecosystem', description: 'Vast library support and community' },
               { title: 'Smooth UX', description: 'Client-side transitions feel native' },
             ],
             cons: [
               { title: 'SEO challenges', description: 'Requires SSR or SSG for search indexing' },
               { title: 'Larger initial bundle', description: 'Full framework must load first' },
             ],
             whenToUse: 'Useful for admin dashboards and internal tools where SEO is not a concern and developer familiarity with React is high.',
           },
           {
             id: 'next-ssr',
             label: 'Next.js SSR',
             description: 'Server-side rendered React with hybrid static/dynamic rendering.',
             metrics: { performance: 15, scalability: 10, complexity: 10, cost: -5 },
             pros: [
               { title: 'Better SEO', description: 'Server-rendered HTML for crawlers' },
               { title: 'Faster first paint', description: 'HTML delivered from server' },
               { title: 'Hybrid rendering', description: 'Mix static and dynamic pages' },
             ],
             cons: [
               { title: 'Server dependency', description: 'Requires Node.js server runtime' },
               { title: 'More complex deploy', description: 'SSR adds deployment surface' },
             ],
             whyThisFits: 'Enterprise web applications benefit from server-side rendering for SEO, faster perceived performance, and the ability to mix static public pages with dynamic user-specific content.',
           },
         ],
       },
       {
         id: 'backend',
         title: 'Backend Architecture',
         description: 'Decide how to structure the server-side logic.',
         recommended: 'modular-monolith',
         choices: [
           {
             id: 'microservices',
             label: 'Microservices',
             description: 'Independent services communicating via REST/gRPC.',
             metrics: { performance: -5, scalability: 20, complexity: 20, cost: -10 },
             pros: [
               { title: 'Independent scaling', description: 'Scale hot services without scaling all' },
               { title: 'Tech diversity', description: 'Each service can use best-fit language' },
               { title: 'Fault isolation', description: 'One service failure does not crash all' },
             ],
             cons: [
               { title: 'Network overhead', description: 'Inter-service calls add latency' },
               { title: 'Operational cost', description: 'More services to monitor and deploy' },
               { title: 'Distributed tracing', description: 'Debugging spans multiple services' },
             ],
             whenToUse: 'Consider when your team has significant DevOps experience and specific services have vastly different scaling requirements.',
           },
           {
             id: 'modular-monolith',
             label: 'Modular Monolith',
             description: 'Single deployable with strict module boundaries.',
             metrics: { performance: 10, scalability: -5, complexity: -10, cost: 15 },
             pros: [
               { title: 'Simpler deployment', description: 'One artifact to deploy' },
               { title: 'Fast local calls', description: 'In-process communication, no network' },
               { title: 'Easier debugging', description: 'Single stack trace, one log file' },
             ],
             cons: [
               { title: 'Monolithic scaling', description: 'Must scale entire app, not parts' },
               { title: 'Tight coupling risk', description: 'Module boundaries can degrade over time' },
             ],
             whyThisFits: 'Starting with a modular monolith reduces operational overhead while maintaining clean boundaries. It can be split into microservices later if specific modules need independent scaling.',
           },
         ],
       },
       {
         id: 'database',
         title: 'Data Storage',
         description: 'Choose the primary persistence layer.',
         recommended: 'postgresql',
         choices: [
           {
             id: 'postgresql',
             label: 'PostgreSQL',
             description: 'Relational database with ACID compliance and JSON support.',
             metrics: { performance: 5, scalability: 5, complexity: -5, cost: 5 },
             pros: [
               { title: 'ACID compliance', description: 'Guaranteed data integrity' },
               { title: 'JSON support', description: 'Semi-structured data without NoSQL' },
               { title: 'Mature ecosystem', description: 'Well-understood tooling and patterns' },
             ],
             cons: [
               { title: 'Schema migrations', description: 'Schema changes require planning' },
               { title: 'Vertical scaling limits', description: 'Read replicas needed for scale' },
             ],
             whyThisFits: 'Enterprise applications require strong data integrity, complex querying, and reliable transactions. PostgreSQL provides all of this with the flexibility of JSON columns for semi-structured data.',
           },
           {
             id: 'mongo',
             label: 'MongoDB',
             description: 'Document database with flexible schema and horizontal scaling.',
             metrics: { performance: 10, scalability: 15, complexity: 5, cost: -5 },
             pros: [
               { title: 'Flexible schema', description: 'No migrations for evolving models' },
               { title: 'Horizontal scaling', description: 'Sharding built into the platform' },
               { title: 'Fast writes', description: 'Document model suits high-throughput inserts' },
             ],
             cons: [
               { title: 'No ACID joins', description: 'Multi-document transactions are limited' },
               { title: 'Schema drift risk', description: 'Without enforcement, data quality varies' },
             ],
             whenToUse: 'Best for content management systems, catalog data, or high-throughput event logging where strict consistency is less critical.',
           },
         ],
       },
     ],
  },
  {
    id: 'realtime-chat',
    title: 'Real-Time Chat & Collab System',
    description: 'Design a real-time collaborative system: WebAssembly compute, Node.js services, Redis pub/sub, Kubernetes orchestration. Balance latency, consistency, and cost.',
    metrics: [
      { id: 'latency', label: 'Low Latency', baseValue: 40, min: 0, max: 100, direction: 'higher' },
      { id: 'consistency', label: 'Consistency', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'devex', label: 'Developer Experience', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'ops-cost', label: 'Ops Cost', baseValue: 50, min: 0, max: 100, direction: 'higher' },
    ],
steps: [
       {
         id: 'compute',
         title: 'Compute Layer',
         description: 'Where does the real-time computation happen?',
         recommended: 'node-central',
         choices: [
           {
             id: 'wasm-edge',
             label: 'WebAssembly at Edge',
             description: 'Run compute-intensive logic close to users via WASM edge workers.',
             metrics: { latency: 20, consistency: -10, devex: 5, 'ops-cost': -10 },
             pros: [
               { title: 'Ultra-low latency', description: 'Code runs at network edge' },
               { title: 'Language flexibility', description: 'Rust, C++, Go compiled to WASM' },
               { title: 'Secure sandboxing', description: 'WASM sandbox isolates untrusted code' },
             ],
             cons: [
               { title: 'Debugging difficulty', description: 'WASM stack traces are less readable' },
               { title: 'State management', description: 'Edge workers are typically stateless' },
               { title: 'Tooling maturity', description: 'WASM ecosystem still evolving' },
             ],
             whenToUse: 'Suitable when ultra-low latency is the primary concern and the compute logic is stateless and lightweight.',
           },
           {
             id: 'node-central',
             label: 'Node.js Centralized',
             description: 'Centralized Node.js cluster handling WebSocket connections.',
             metrics: { latency: 5, consistency: 15, devex: 15, 'ops-cost': 15 },
             pros: [
               { title: 'Mature ecosystem', description: 'npm has everything needed' },
               { title: 'Shared language', description: 'Same JS/TS as frontend' },
               { title: 'Simple debugging', description: 'Familiar stack traces and tools' },
             ],
             cons: [
               { title: 'Single region latency', description: 'All traffic routes to one datacenter' },
               { title: 'Memory limits', description: 'V8 heap can bottleneck under load' },
             ],
             whyThisFits: 'For collaborative systems, keeping state centralized simplifies consistency guarantees and makes debugging real-time interactions straightforward. Shared language with the frontend accelerates development.',
           },
         ],
       },
       {
         id: 'state',
         title: 'State Management',
         description: 'How to handle shared real-time state across connected clients.',
         recommended: 'redis-pubsub',
         choices: [
           {
             id: 'redis-pubsub',
             label: 'Redis Pub/Sub',
             description: 'Fast in-memory pub/sub for message broadcast and session state.',
             metrics: { latency: 15, consistency: 5, devex: 10, 'ops-cost': 5 },
             pros: [
               { title: 'Sub-millisecond reads', description: 'In-memory data store' },
               { title: 'Pub/Sub native', description: 'Built-in message broker' },
               { title: 'Simple operations', description: 'Easy to deploy and monitor' },
             ],
             cons: [
               { title: 'Memory-bound', description: 'Dataset must fit in RAM' },
               { title: 'Eventual consistency', description: 'Cross-region replication lag' },
             ],
             whyThisFits: 'Redis provides the simplicity and speed needed for real-time collaboration. Its pub/sub model maps directly to the broadcast pattern required for multi-user editing.',
           },
           {
             id: 'crdt-sync',
             label: 'CRDT Sync',
             description: 'Conflict-free replicated data types for eventual consistency.',
             metrics: { latency: 10, consistency: 20, devex: -5, 'ops-cost': -5 },
             pros: [
               { title: 'Conflict-free merges', description: 'Guaranteed convergence without coordination' },
               { title: 'Offline support', description: 'Changes merge when reconnected' },
               { title: 'No single point of failure', description: 'Any replica can serve' },
             ],
             cons: [
               { title: 'Complex implementation', description: 'CRDT algorithms are non-trivial' },
               { title: 'Storage overhead', description: 'Vector clocks and tombstones add size' },
               { title: 'Limited query support', description: 'Optimized for sync, not analytics' },
             ],
             whenToUse: 'Ideal for offline-first collaborative editing where conflict resolution must be automatic and guaranteed.',
           },
         ],
       },
       {
         id: 'orchestration',
         title: 'Deployment Orchestration',
         description: 'How to manage the deployment and scaling of services.',
         recommended: 'kubernetes',
         choices: [
           {
             id: 'kubernetes',
             label: 'Kubernetes',
             description: 'Full container orchestration with auto-scaling and self-healing.',
             metrics: { latency: 5, consistency: 10, devex: -10, 'ops-cost': -20 },
             pros: [
               { title: 'Auto-scaling', description: 'HPA/VPA scale pods by metrics' },
               { title: 'Self-healing', description: 'Crashed pods restart automatically' },
               { title: 'Service mesh ready', description: 'Istio/Linkerd for traffic management' },
             ],
             cons: [
               { title: 'Steep learning curve', description: 'K8s concepts take time to master' },
               { title: 'Resource overhead', description: 'Control plane consumes cluster resources' },
               { title: 'Complex debugging', description: 'Multi-layer abstraction obscures root cause' },
             ],
             whyThisFits: 'Real-time collaboration systems need reliable auto-scaling to handle variable connection loads. Kubernetes provides the operational guarantees required for production-grade availability.',
           },
           {
             id: 'serverless',
             label: 'Serverless',
             description: 'Platform-managed functions with automatic scaling.',
             metrics: { latency: -10, consistency: 5, devex: 20, 'ops-cost': 25 },
             pros: [
               { title: 'Zero infra management', description: 'Platform handles scaling and uptime' },
               { title: 'Pay per use', description: 'No idle resource cost' },
               { title: 'Fast iteration', description: 'Deploy individual functions instantly' },
             ],
             cons: [
               { title: 'Cold start latency', description: 'First request after idle incurs delay' },
               { title: 'Vendor lock-in', description: 'Platform-specific APIs and limits' },
               { title: 'Connection limits', description: 'WebSocket long-polling constrained' },
             ],
             whenToUse: 'Good for prototypes and early-stage products where development speed matters more than connection stability.',
           },
         ],
       },
     ],
  },
  {
    id: 'financial-audit',
    title: 'High-Security Financial Auditing Platform',
    description: 'Build a compliance-critical auditing system: Angular frontend, Java monolith, PostgreSQL, deployed on-premise. Prioritize security, auditability, and regulatory compliance.',
    metrics: [
      { id: 'security', label: 'Security', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'compliance', label: 'Compliance', baseValue: 40, min: 0, max: 100, direction: 'higher' },
      { id: 'maintainability', label: 'Maintainability', baseValue: 40, min: 0, max: 100, direction: 'higher' },
      { id: 'time-market', label: 'Time to Market', baseValue: 40, min: 0, max: 100, direction: 'higher' },
    ],
steps: [
       {
         id: 'ui',
         title: 'UI Framework',
         description: 'Choose the frontend framework for the auditing dashboard.',
         recommended: 'angular',
         choices: [
           {
             id: 'angular',
             label: 'Angular',
             description: 'Enterprise-grade framework with built-in dependency injection and strong typing.',
             metrics: { security: 10, compliance: 10, maintainability: 10, 'time-market': -5 },
             pros: [
               { title: 'Built-in security', description: 'XSS protection and type safety out of the box' },
               { title: 'Enterprise features', description: 'RxJS, DI, and forms are first-class' },
               { title: 'Strong structure', description: 'Opinionated architecture aids large teams' },
             ],
             cons: [
               { title: 'Steep learning curve', description: 'Angular concepts require training' },
               { title: 'Slower iteration', description: 'Boilerplate slows prototyping' },
               { title: 'Larger bundle size', description: 'Framework adds initial load weight' },
             ],
             whyThisFits: 'Financial auditing platforms require strict type safety, built-in security, and opinionated structure. Angular provides these out of the box, reducing the risk of security gaps from architectural inconsistency.',
           },
           {
             id: 'react-enterprise',
             label: 'React + TypeScript',
             description: 'Flexible component model with strong type checking.',
             metrics: { security: 5, compliance: 5, maintainability: 5, 'time-market': 15 },
             pros: [
               { title: 'Fast prototyping', description: 'Component composition speeds development' },
               { title: 'Large talent pool', description: 'Most common web framework' },
               { title: 'Ecosystem', description: 'Rich UI libraries and tooling' },
             ],
             cons: [
               { title: 'Architecture choices', description: 'Team must decide patterns and conventions' },
               { title: 'Type safety gaps', description: 'Some patterns resist strict typing' },
             ],
             whenToUse: 'Better suited when speed of development and talent availability outweigh the need for enforced architectural consistency.',
           },
         ],
       },
       {
         id: 'backend',
         title: 'Backend Pattern',
         description: 'Determine the server-side architecture for audit processing.',
         recommended: 'java-monolith',
         choices: [
           {
             id: 'java-monolith',
             label: 'Java Monolith (Spring)',
             description: 'Spring Boot monolith with layered architecture and comprehensive audit logging.',
             metrics: { security: 15, compliance: 20, maintainability: -5, 'time-market': -10 },
             pros: [
               { title: 'Audit trail built-in', description: 'Spring Security provides comprehensive audit logging' },
               { title: 'Enterprise security', description: 'OIDC, SAML, and RBAC are native' },
               { title: 'Regulatory fit', description: 'SOC2, PCI-DSS patterns well-established' },
               { title: 'Type safety', description: 'Java generics catch errors at compile time' },
             ],
             cons: [
               { title: 'Slow iteration', description: 'Full rebuild and redeploy for changes' },
               { title: 'Heavy resource usage', description: 'JVM requires significant memory' },
               { title: 'Longer onboarding', description: 'New developers need Java/Spring training' },
             ],
             whyThisFits: 'High-security financial auditing requires comprehensive audit trails, enterprise-grade security, and proven regulatory compliance patterns — all of which Spring Boot provides natively.',
           },
           {
             id: 'java-modular',
             label: 'Java Modular (Spring Boot Modules)',
             description: 'Spring Boot with clear module boundaries and feature toggles.',
             metrics: { security: 10, compliance: 15, maintainability: 10, 'time-market': 5 },
             pros: [
               { title: 'Independent testing', description: 'Modules can be tested in isolation' },
               { title: 'Progressive enhancement', description: 'Features released behind toggles' },
               { title: 'Clearer boundaries', description: 'Module contracts enforce loose coupling' },
             ],
             cons: [
               { title: 'Module complexity', description: 'Inter-module communication adds overhead' },
               { title: 'Still JVM-bound', description: 'Resource usage similar to monolith' },
             ],
             whenToUse: 'Consider when the auditing platform needs to evolve incrementally with feature toggles and independent module testing.',
           },
         ],
       },
       {
         id: 'deployment',
         title: 'Deployment Strategy',
         description: 'Choose where and how to deploy the platform.',
         recommended: 'on-premise',
         choices: [
           {
             id: 'on-premise',
             label: 'On-Premise',
             description: 'Deploy within the organization data center for full data control.',
             metrics: { security: 25, compliance: 25, maintainability: -10, 'time-market': -15 },
             pros: [
               { title: 'Data sovereignty', description: 'All data stays within organizational control' },
               { title: 'Regulatory compliance', description: 'Meets strictest on-prem requirements' },
               { title: 'No vendor lock-in', description: 'Own infrastructure, no external dependency' },
             ],
             cons: [
               { title: 'Infrastructure cost', description: 'Hardware, power, cooling, and staff' },
               { title: 'Manual patching', description: 'Security updates require planned windows' },
               { title: 'Longer deployment', description: 'Physical setup and configuration time' },
             ],
             whyThisFits: 'Financial auditing platforms often face strictest regulatory requirements. On-premise deployment ensures data sovereignty and meets the most stringent compliance standards without third-party cloud dependencies.',
           },
           {
             id: 'private-cloud',
             label: 'Private Cloud (AWS Outposts)',
             description: 'Cloud-managed hardware within organizational data center.',
             metrics: { security: 15, compliance: 15, maintainability: 10, 'time-market': 10 },
             pros: [
               { title: 'Cloud tools on-prem', description: 'Same AWS APIs with local data' },
               { title: 'Automated patching', description: 'Managed hardware updates' },
               { title: 'Faster provisioning', description: 'Software-defined infrastructure' },
             ],
             cons: [
               { title: 'AWS dependency', description: 'Still tied to AWS ecosystem and pricing' },
               { title: 'Minimum hardware', description: 'Outposts require minimum rack commitment' },
             ],
             whenToUse: 'A good compromise when the organization wants cloud tooling and automation while maintaining physical data control.',
           },
         ],
       },
     ],
  },
]

// ─── Text paragraphs (Section-Text.md: string[]) ─────────────────────────────

export const agentTextParagraphs: string[] = [
  'An **AI agent** is a software system that perceives its environment, reasons about a goal, and takes autonomous actions — potentially across multiple steps — to achieve that goal.',
  'Modern agents combine a large language model with a memory store, a tool registry, and a feedback loop. The LLM acts as the reasoning engine; tools extend what the agent can *do* in the real world.',
  'The key design decision is the **orchestration strategy**: single-agent vs multi-agent, synchronous ReAct loop vs async event-driven pipeline.',
]

export const agentLifecycleMarkdown: string[] = [
  `## Agent Lifecycle

1. **Goal Intake** — The user submits a natural-language goal. The orchestrator parses intent, identifies required capabilities, and selects relevant tools from the registry.
2. **Context Retrieval** — The memory module performs a semantic search over stored embeddings to surface prior facts, tool outputs, or conversation history relevant to the current goal.
3. **Planning** — The planner prompts the LLM with the goal plus retrieved context. The LLM returns an ordered action plan — either as structured JSON or a chain-of-thought trace.
4. **Tool Execution** — The tool router dispatches each planned action to the executor. Tools include web search, code sandboxes, browser control, file I/O, and external APIs.
5. **Evaluation & Loop** — The evaluator checks whether the execution result satisfies the success criteria. If not, it feeds failure context back to the orchestrator and triggers a new planning iteration.
6. **Response Delivery** — Once the evaluator confirms success, the final artefact (answer, code diff, report) is formatted and returned to the user. Results are optionally persisted to memory.`,
]

// ─── Bullets: key agent capabilities (Section-Bullets.md) ────────────────────

export const agentCapabilityBullets: BulletItem[] = [
  {
    text: 'Tool use — call external APIs, run code, browse the web',
    children: [
      { text: 'Web search (Tavily, Brave, Google)' },
      { text: 'Code execution (sandboxed interpreter)' },
      { text: 'Browser automation (Playwright)' },
    ],
  },
  { text: 'Long-horizon planning via chain-of-thought or ReAct' },
  { text: 'Persistent memory across sessions (vector store)' },
  { text: 'Self-evaluation and automatic re-planning on failure' },
  { text: 'Multi-agent coordination (delegating sub-tasks)' },
]

// ─── Tradeoff Sandbox: API pattern (Section-TradeoffSandbox.md) ───────────────

export const apiPatternScenarios: TradeoffScenario[] = [
  {
    id: 'api-pattern',
    title: 'API Communication Pattern',
    description: 'Evaluate communication patterns for real-time and batch workloads.',
    metrics: [
      { id: 'latency', label: 'Low Latency', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'throughput', label: 'Throughput', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      { id: 'complexity', label: 'Complexity', baseValue: 30, min: 0, max: 100, direction: 'lower' },
      { id: 'cost', label: 'Cost Efficiency', baseValue: 50, min: 0, max: 100, direction: 'higher' },
    ],
    steps: [
      {
        id: 'realtime-comm',
        title: 'Real-time Communication',
        description: 'You need to build a chat application where messages must appear instantly for all connected users.',
        recommended: 'websocket',
        choices: [
          {
            id: 'rest',
            label: 'REST API',
            description: 'Use HTTP request-response pattern for each message.',
            metrics: { latency: -20, throughput: -10, complexity: -10, cost: 5 },
            pros: [
              { title: 'Simple to implement', description: 'Straightforward HTTP calls' },
              { title: 'Built-in caching', description: 'HTTP caching reduces server load' },
            ],
            cons: [
              { title: 'Higher latency', description: 'Each message requires a new HTTP round-trip' },
              { title: 'Requires polling', description: 'Client must poll for new messages' },
            ],
            whenToUse: 'Useful when message frequency is low and real-time delivery is not critical.',
          },
          {
            id: 'websocket',
            label: 'WebSocket',
            description: 'Use persistent full-duplex connection for instant message delivery.',
            metrics: { latency: 25, throughput: 20, complexity: 15, cost: -5 },
            pros: [
              { title: 'Real-time delivery', description: 'Messages arrive instantly without polling' },
              { title: 'Low latency', description: 'Persistent connection eliminates HTTP overhead' },
              { title: 'Efficient for frequent messages', description: 'Single connection handles bidirectional traffic' },
            ],
            cons: [
              { title: 'Complex server setup', description: 'Requires WebSocket server infrastructure' },
              { title: 'Connection management', description: 'Must handle reconnects and state' },
            ],
            whyThisFits: 'WebSocket provides full-duplex, persistent connections ideal for low-latency bidirectional messaging required in real-time chat.',
          },
        ],
      },
      {
        id: 'batch-processing',
        title: 'Batch Data Processing',
        description: 'You need to process large datasets periodically, such as generating daily reports from database exports.',
        recommended: 'rest',
        choices: [
          {
            id: 'rest',
            label: 'REST API',
            description: 'Use batch endpoints to submit and poll for processing results.',
            metrics: { latency: -5, throughput: 15, complexity: -15, cost: 15 },
            pros: [
              { title: 'Simple to implement', description: 'Standard HTTP methods' },
              { title: 'Built-in caching', description: 'HTTP caching reduces server load' },
              { title: 'Easy to monitor', description: 'Standard HTTP tools for debugging' },
            ],
            cons: [
              { title: 'Requires polling', description: 'Must poll endpoint for completion status' },
              { title: 'Not ideal for streaming', description: 'Batch results, not incremental updates' },
            ],
            whyThisFits: 'REST with batch endpoints is simpler to implement and debug for periodic, non-real-time data processing where low latency is not required.',
            whenToUse: 'Best for periodic batch jobs where results are needed within minutes, not milliseconds.',
          },
          {
            id: 'websocket',
            label: 'WebSocket',
            description: 'Use persistent connection to receive real-time processing updates.',
            metrics: { latency: 15, throughput: 5, complexity: 15, cost: -10 },
            pros: [
              { title: 'Real-time progress', description: 'Live updates as processing advances' },
              { title: 'Lower polling overhead', description: 'Push model eliminates repeated requests' },
              { title: 'Immediate results', description: 'Results delivered as soon as available' },
            ],
            cons: [
              { title: 'Complex server setup', description: 'Requires WebSocket server infrastructure' },
              { title: 'Connection management', description: 'Must handle reconnects and state' },
              { title: 'Overkill for periodic jobs', description: 'Adds complexity for infrequent tasks' },
            ],
          },
        ],
      },
    ],
  },
]

// ─── Taxonomy Browser (Section-TaxonomyBrowser.md) ───────────────────────────

export const taxonomyCategories: TaxonomyCategory[] = [
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: Brain as unknown as ComponentType<any>,
    title: 'Reasoning & Planning',
    subtitle: 'Core Intelligence',
    description: 'The agent decomposes goals into actionable plans, reasons through chain-of-thought, and adapts strategies when encountering obstacles.',
    details: 'Planning encompasses ReAct loops, tree-of-thought search, and self-refinement patterns.',
    analogy: 'Like a project manager breaking down an epic into sprint tasks and adjusting when blockers appear.',
    primaryFocus: 'Goal decomposition and step-by-step execution',
    inScope: ['Chain-of-thought', 'ReAct loops', 'Self-correction'],
    outOfScope: ['Raw text generation without planning'],
    color: 'mauve',
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: Zap as unknown as ComponentType<any>,
    title: 'Tool Use & Execution',
    subtitle: 'Action Layer',
    description: 'The agent selects and invokes external tools — web search, code execution, API calls — to extend its capabilities beyond text generation.',
    details: 'Tool routing matches task requirements to available capabilities, then dispatches execution through a sandboxed runtime.',
    analogy: 'Like a developer choosing the right CLI tool or API for each sub-task in a deployment pipeline.',
    primaryFocus: 'Tool selection, argument generation, and result processing',
    inScope: ['Web search', 'Code sandbox', 'API calls', 'Browser automation'],
    outOfScope: ['Hardware control', 'Physical world interaction'],
    color: 'peach',
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: Shield as unknown as ComponentType<any>,
    title: 'Memory & Context',
    subtitle: 'State Management',
    description: 'The agent maintains short-term context within a session and retrieves relevant long-term knowledge from a vector store.',
    details: 'Memory includes conversation history, tool output caching, and semantic retrieval of stored facts.',
    analogy: 'Like a researcher with sticky notes for current work and a reference library for background knowledge.',
    primaryFocus: 'Context window management and semantic retrieval',
    inScope: ['Conversation history', 'Vector DB retrieval', 'Embedding storage'],
    outOfScope: ['Real-time streaming state sync'],
    color: 'blue',
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: Workflow as unknown as ComponentType<any>,
    title: 'Self-Evaluation',
    subtitle: 'Quality Assurance',
    description: 'The agent evaluates its own output against success criteria, identifies failures, and triggers re-planning when goals are not met.',
    details: 'Self-evaluation uses structured critique prompts, rubric-based scoring, and automated success checks.',
    analogy: 'Like a code review process where the author checks their own pull request before submitting.',
    primaryFocus: 'Output validation and failure recovery',
    inScope: ['Success criteria checking', 'Rubric scoring', 'Re-planning triggers'],
    outOfScope: ['Human-in-the-loop approval'],
    color: 'green',
  },
]

// ─── Flowchart Schema (Section-Flowchart.md: 4 views) ────────────────────────

export const agentSchema: UnifiedFlowchartSchema = {
  entities: {
    'user': {
      title: 'User',
      desc: 'The human (or client system) initiating goals or receiving results.',
      viewTypes: {
        EVENT_STORMING: TYPES.USER,
        SYS_ARCH: TYPES.USER,
        DATA_FLOW: TYPES.USER,
        SWIMLANES: TYPES.USER,
      }
    },
    'orchestrator': {
      title: 'Orchestrator',
      desc: 'Coordinating component running the core planning and execution loops.',
      viewTypes: {
        EVENT_STORMING: TYPES.AGGREGATE,
        SYS_ARCH: TYPES.SERVICE,
        DATA_FLOW: TYPES.SERVICE,
        SWIMLANES: TYPES.SERVICE,
      }
    },
    'planner': {
      title: 'Planner',
      desc: 'Formulates multi-step actions (e.g. CoT, ReAct plan) dynamically.',
      viewTypes: {
        EVENT_STORMING: TYPES.COMMAND,
        SYS_ARCH: TYPES.SERVICE,
        DATA_FLOW: TYPES.PROCESS,
        SWIMLANES: TYPES.PROCESS,
      }
    },
    'memory': {
      title: 'Memory Storage',
      desc: 'Retrieves conversational logs and semantic vectors (long-term database).',
      viewTypes: {
        EVENT_STORMING: TYPES.DATABASE,
        SYS_ARCH: TYPES.DATABASE,
        DATA_FLOW: TYPES.DATABASE,
        SWIMLANES: TYPES.DATABASE,
      }
    },
    'tools': {
      title: 'Tool Router',
      desc: 'Selects appropriate external APIs or scripts for a given task.',
      viewTypes: {
        EVENT_STORMING: TYPES.POLICY,
        SYS_ARCH: TYPES.SERVICE,
        DATA_FLOW: TYPES.PROCESS,
        SWIMLANES: TYPES.PROCESS,
      }
    },
    'llm': {
      title: 'LLM Engine',
      desc: 'Large language model performing prompt parsing and reasoning.',
      viewTypes: {
        EVENT_STORMING: TYPES.EXTERNAL,
        SYS_ARCH: TYPES.EXTERNAL,
        DATA_FLOW: TYPES.EXTERNAL,
        SWIMLANES: TYPES.EXTERNAL,
      }
    },
    'executor': {
      title: 'Tool Executor',
      desc: 'Executes actions (HTTP search, sandboxed script, API requests).',
      viewTypes: {
        EVENT_STORMING: TYPES.COMMAND,
        SYS_ARCH: TYPES.SERVICE,
        DATA_FLOW: TYPES.PROCESS,
        SWIMLANES: TYPES.PROCESS,
      }
    },
    'evaluator': {
      title: 'Evaluator',
      desc: 'Tests execution outputs against success conditions.',
      viewTypes: {
        EVENT_STORMING: TYPES.DECISION,
        SYS_ARCH: TYPES.SERVICE,
        DATA_FLOW: TYPES.DECISION,
        SWIMLANES: TYPES.DECISION,
      }
    },
    'output': {
      title: 'Final Response',
      desc: 'The verified markdown output returned to the caller.',
      viewTypes: {
        EVENT_STORMING: TYPES.DATA_OBJECT,
        SYS_ARCH: TYPES.DATA_OBJECT,
        DATA_FLOW: TYPES.DATA_OBJECT,
        SWIMLANES: TYPES.DATA_OBJECT,
      }
    },
    'evt_goal': {
      title: 'Goal Dispatched',
      desc: 'User goal received by the orchestrator.',
      viewTypes: { EVENT_STORMING: TYPES.EVENT }
    },
    'evt_plan_ready': {
      title: 'Plan Generated',
      desc: 'Multi-step execution plan written to working memory.',
      viewTypes: { EVENT_STORMING: TYPES.EVENT }
    },
    'evt_tool_call': {
      title: 'Tool Route Chosen',
      desc: 'Router selected tool and arguments.',
      viewTypes: { EVENT_STORMING: TYPES.EVENT }
    },
    'evt_executed': {
      title: 'Tool Output Captured',
      desc: 'Output retrieved from sandbox execution.',
      viewTypes: { EVENT_STORMING: TYPES.EVENT }
    },
    'evt_done': {
      title: 'Goal Satisfied',
      desc: 'Evaluation passes, ready to reply.',
      viewTypes: { EVENT_STORMING: TYPES.EVENT }
    },
    'evt_fail': {
      title: 'Goal Not Satisfied',
      desc: 'Evaluation fails, requiring re-planning.',
      viewTypes: { EVENT_STORMING: TYPES.EVENT }
    },
    'pol_retry': {
      title: 'Re-Planning Rule',
      desc: 'Policy to feed error logs back to the orchestrator.',
      viewTypes: { EVENT_STORMING: TYPES.POLICY }
    }
  },
  relations: [
    { id: 'r_es_1', from: 'user', to: 'evt_goal', views: ['EVENT_STORMING'] },
    { id: 'r_es_2', from: 'evt_goal', to: 'planner', views: ['EVENT_STORMING'] },
    { id: 'r_es_3', from: 'planner', to: 'orchestrator', views: ['EVENT_STORMING'] },
    { id: 'r_es_4', from: 'orchestrator', to: 'evt_plan_ready', views: ['EVENT_STORMING'] },
    { id: 'r_es_5', from: 'evt_plan_ready', to: 'tools', views: ['EVENT_STORMING'] },
    { id: 'r_es_6', from: 'tools', to: 'llm', views: ['EVENT_STORMING'] },
    { id: 'r_es_7', from: 'llm', to: 'evt_tool_call', views: ['EVENT_STORMING'] },
    { id: 'r_es_8', from: 'evt_tool_call', to: 'executor', views: ['EVENT_STORMING'] },
    { id: 'r_es_9', from: 'executor', to: 'evt_executed', views: ['EVENT_STORMING'] },
    { id: 'r_es_10', from: 'evt_executed', to: 'evaluator', views: ['EVENT_STORMING'] },
    { id: 'r_es_11', from: 'evaluator', to: 'evt_done', views: ['EVENT_STORMING'] },
    { id: 'r_es_12', from: 'evaluator', to: 'evt_fail', views: ['EVENT_STORMING'] },
    { id: 'r_es_13', from: 'evt_fail', to: 'pol_retry', views: ['EVENT_STORMING'] },
    { id: 'r_es_14', from: 'pol_retry', to: 'planner', views: ['EVENT_STORMING'], dashed: true },
    { id: 'r_es_15', from: 'evt_done', to: 'output', views: ['EVENT_STORMING'] },
    { id: 'r_es_16', from: 'orchestrator', to: 'memory', views: ['EVENT_STORMING'] },

    { id: 'r_sa_1', from: 'user', to: 'orchestrator', views: ['SYS_ARCH'] },
    { id: 'r_sa_2', from: 'orchestrator', to: 'memory', views: ['SYS_ARCH'] },
    { id: 'r_sa_3', from: 'orchestrator', to: 'planner', views: ['SYS_ARCH'] },
    { id: 'r_sa_4', from: 'orchestrator', to: 'tools', views: ['SYS_ARCH'] },
    { id: 'r_sa_5', from: 'tools', to: 'llm', views: ['SYS_ARCH'] },
    { id: 'r_sa_6', from: 'tools', to: 'executor', views: ['SYS_ARCH'] },
    { id: 'r_sa_7', from: 'executor', to: 'evaluator', views: ['SYS_ARCH'] },
    { id: 'r_sa_8', from: 'evaluator', to: 'orchestrator', views: ['SYS_ARCH'] },
    { id: 'r_sa_9', from: 'evaluator', to: 'output', views: ['SYS_ARCH'] },
    { id: 'r_sa_10', from: 'output', to: 'user', views: ['SYS_ARCH'] },

    { id: 'r_df_1', from: 'user', to: 'orchestrator', views: ['DATA_FLOW'] },
    { id: 'r_df_2', from: 'orchestrator', to: 'memory', views: ['DATA_FLOW'] },
    { id: 'r_df_3', from: 'memory', to: 'planner', views: ['DATA_FLOW'] },
    { id: 'r_df_4', from: 'planner', to: 'llm', views: ['DATA_FLOW'] },
    { id: 'r_df_5', from: 'llm', to: 'tools', views: ['DATA_FLOW'] },
    { id: 'r_df_6', from: 'tools', to: 'executor', views: ['DATA_FLOW'] },
    { id: 'r_df_7', from: 'executor', to: 'evaluator', views: ['DATA_FLOW'] },
    { id: 'r_df_8', from: 'evaluator', to: 'output', views: ['DATA_FLOW'] },
    { id: 'r_df_9', from: 'output', to: 'user', views: ['DATA_FLOW'] },

    { id: 'r_sl_1', from: 'user', to: 'orchestrator', views: ['SWIMLANES'] },
    { id: 'r_sl_2', from: 'orchestrator', to: 'memory', views: ['SWIMLANES'] },
    { id: 'r_sl_3', from: 'memory', to: 'llm', views: ['SWIMLANES'] },
    { id: 'r_sl_4', from: 'llm', to: 'tools', views: ['SWIMLANES'] },
    { id: 'r_sl_5', from: 'tools', to: 'executor', views: ['SWIMLANES'] },
    { id: 'r_sl_6', from: 'executor', to: 'evaluator', views: ['SWIMLANES'] },
    { id: 'r_sl_7', from: 'evaluator', to: 'output', views: ['SWIMLANES'] },
    { id: 'r_sl_8', from: 'output', to: 'user', views: ['SWIMLANES'] }
  ],
  views: {
    EVENT_STORMING: {
      name: 'Event Storming',
      icon: 'Component',
      nodes: [
        { id: 'user', x: 100, y: 250 },
        { id: 'evt_goal', x: 240, y: 250 },
        { id: 'planner', x: 380, y: 250 },
        { id: 'orchestrator', x: 520, y: 250 },
        { id: 'memory', x: 520, y: 120 },
        { id: 'evt_plan_ready', x: 660, y: 250 },
        { id: 'tools', x: 800, y: 250 },
        { id: 'llm', x: 940, y: 250 },
        { id: 'evt_tool_call', x: 1080, y: 250 },
        { id: 'executor', x: 1220, y: 250 },
        { id: 'evt_executed', x: 1360, y: 250 },
        { id: 'evaluator', x: 1500, y: 250 },
        { id: 'evt_done', x: 1640, y: 180 },
        { id: 'evt_fail', x: 1640, y: 320 },
        { id: 'pol_retry', x: 1780, y: 320 },
        { id: 'output', x: 1780, y: 180 }
      ],
      groups: [
        { id: 'es_g1', title: 'Cognition & Planning', desc: 'Translates goals into reasoning steps and parses facts.', nodeIds: ['evt_goal', 'planner', 'orchestrator', 'memory', 'evt_plan_ready'], color: 'rgba(140, 170, 238, 0.12)', borderColor: '#8caaee', textColor: '#c6d0f5' },
        { id: 'es_g2', title: 'Action Space Execution', desc: 'Selects, schedules, and executes external integrations.', nodeIds: ['tools', 'llm', 'evt_tool_call', 'executor', 'evt_executed'], color: 'rgba(244, 184, 228, 0.12)', borderColor: '#f4b8e4', textColor: '#c6d0f5' },
        { id: 'es_g3', title: 'Evaluation & Control', desc: 'Verifies safety and performance goals before exit.', nodeIds: ['evaluator', 'evt_done', 'evt_fail', 'pol_retry'], color: 'rgba(229, 200, 144, 0.12)', borderColor: '#e5c890', textColor: '#c6d0f5' }
      ]
    },
    SYS_ARCH: {
      name: 'System Architecture',
      icon: 'Server',
      nodes: [
        { id: 'user', x: 150, y: 250 },
        { id: 'orchestrator', x: 420, y: 250 },
        { id: 'memory', x: 420, y: 100 },
        { id: 'planner', x: 670, y: 100 },
        { id: 'tools', x: 670, y: 250 },
        { id: 'llm', x: 920, y: 180 },
        { id: 'executor', x: 920, y: 320 },
        { id: 'evaluator', x: 1170, y: 250 },
        { id: 'output', x: 1390, y: 250 }
      ],
      groups: [
        { id: 'sa_g1', title: 'Core Agent Scaffolding', desc: 'Runs within the secure orchestration hosting container.', nodeIds: ['orchestrator', 'memory', 'planner', 'tools', 'evaluator'], color: 'rgba(129, 200, 190, 0.12)', borderColor: '#81c8be', textColor: '#c6d0f5' }
      ]
    },
    DATA_FLOW: {
      name: 'Data Flow (DFD)',
      icon: 'Share2',
      nodes: [
        { id: 'user', x: 100, y: 250 },
        { id: 'orchestrator', x: 280, y: 250 },
        { id: 'memory', x: 460, y: 250 },
        { id: 'planner', x: 640, y: 250 },
        { id: 'llm', x: 820, y: 250 },
        { id: 'tools', x: 1000, y: 250 },
        { id: 'executor', x: 1180, y: 250 },
        { id: 'evaluator', x: 1360, y: 250 },
        { id: 'output', x: 1540, y: 250 }
      ],
      groups: []
    },
    SWIMLANES: {
      name: 'Activity Swimlanes',
      icon: 'Layers',
      nodes: [
        { id: 'user', x: 150, y: 100 },
        { id: 'orchestrator', x: 380, y: 250 },
        { id: 'memory', x: 580, y: 250 },
        { id: 'llm', x: 780, y: 250 },
        { id: 'tools', x: 980, y: 250 },
        { id: 'executor', x: 980, y: 400 },
        { id: 'evaluator', x: 1180, y: 250 },
        { id: 'output', x: 1180, y: 100 }
      ],
      groups: [
        { id: 'sl_l1', isLane: true, title: 'Human Interface', desc: 'User boundaries.', y: 50, h: 100, color: 'rgba(239, 159, 118, 0.12)' },
        { id: 'sl_l2', isLane: true, title: 'Cognitive Loop', desc: 'State tracking, planning, routing and validation.', y: 150, h: 200, color: 'rgba(153, 209, 219, 0.12)' },
        { id: 'sl_l3', isLane: true, title: 'Sandbox Actions', desc: 'Side-effects execution layer.', y: 350, h: 100, color: 'rgba(186, 187, 241, 0.12)' }
      ]
    }
  },
  journeys: [
    {
      id: 'happy-path',
      label: 'Agentic Problem Solving Loop',
      description: 'Follow the execution plan as it transitions from the orchestrator through the LLM, resolves tools, and returns the response.',
      steps: [
        { nodeIds: ['user', 'evt_goal'], description: 'User submits a goal: "Research top 3 competitors and summarise."' },
        { nodeIds: ['planner', 'orchestrator', 'memory', 'evt_plan_ready'], description: 'Cognition & Planning — Planner creates step list (search, scrape, summarise), Orchestrator tracks progression, Memory fetches context vectors.' },
        { nodeIds: ['tools', 'llm', 'evt_tool_call', 'executor', 'evt_executed'], description: 'Action Space Execution — Tool Router selects API, LLM Engine synthesizes query arguments, Executor runs in secure sandbox.' },
        { nodeIds: ['evaluator', 'evt_done', 'output'], description: 'Evaluation (Happy Path) — Evaluator validates quality goals met, final output formatted and delivered to User.' },
        { nodeIds: ['evaluator', 'evt_fail', 'pol_retry', 'planner'], description: 'Evaluation (Fail Branch) — Evaluator detects failure, Re-Planning Rule triggers, Planner generates new plan and loops back.' },
      ]
    }
  ]
}


