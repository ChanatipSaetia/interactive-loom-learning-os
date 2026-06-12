import type { BulletItem } from '../../../sections/bullets'

export const introParagraphs: string[] = [
  'Domain-Driven Design (DDD) is a software development methodology that centers everything around the **business domain**. The core idea: the software model must reflect real-world business concepts so accurately that developers and domain experts use the **same language** — in code, in conversation, and in documentation.',
  'DDD has two layers, and most teams get the order wrong. **Strategic Design** is where 80% of the value lives: discover subdomains, draw Bounded Context boundaries, build context maps. **Tactical Design** provides the building blocks to implement a model inside a Bounded Context.',
  'As Eric Evans admitted, his original book led people to believe tactical patterns were the heart of DDD. They\'re not. Strategic Design is.',
]

export const twoLayersParagraphs: string[] = [
  '**Strategic Design** comes first: discover subdomains, draw Bounded Context boundaries, build a context map, and establish a ubiquitous language. This is where you decide *what* to model and *where* the boundaries are.',
  '**Tactical Design** provides the building blocks inside each Bounded Context: `Entity` (identity-based objects), `Value Object` (immutable, attribute-defined), `Aggregate` (consistency boundary), `Repository`, `Domain Service`, and `Domain Event`.',
  'The order matters: tactical patterns without strategic boundaries produce a beautiful model with no guardrails — the shared model becomes a battleground where every team\'s needs accumulate into an incoherent mess.',
]

export const subdomainParagraphs: string[] = [
  'Not all parts of a domain deserve equal investment. **Core Domain** is what makes the business competitive — apply full DDD with a rich model, your best people, and continuous iteration.',
  '**Supporting Subdomain** is necessary but not differentiating — apply moderate DDD with tactical patterns and a clean model. **Generic Subdomain** is common functionality available off the shelf — buy, don\'t build.',
  'Example: for an insurance company, claims processing is **Core**, policy management is **Supporting**, and email notifications are **Generic** (use a third-party service).',
]

export const antiPatternBullets: BulletItem[] = [
  {
    text: 'Folder-Driven Development',
    children: [
      { text: 'Team reorganizes into `domain/entities`, `domain/value-objects`, `domain/aggregates` — without Event Storming or domain experts' },
      { text: 'Business logic still lives in controllers. The `Order` entity has getters, setters, and zero behavior.' },
    ],
  },
  {
    text: 'God Aggregate',
    children: [
      { text: 'One aggregate containing everything: Order + Customer + Payment + Invoice + Fulfillment + Refunds + Coupons' },
      { text: 'Kills performance, concurrency, and cohesion. One transaction for all modifications.' },
    ],
  },
  {
    text: 'Anemic Domain Model',
    children: [
      { text: 'Entities with only getters and setters. All validation and business logic lives in services.' },
      { text: 'Defeats the purpose of DDD — the model should express the domain, not the service layer.' },
    ],
  },
  {
    text: 'Value Object with Identity',
    children: [
      { text: 'A "value object" with an `id` field and setters — not immutable, not attribute-defined.' },
      { text: 'It\'s an entity wearing a costume. Two identical addresses are unequal because different IDs.' },
    ],
  },
  {
    text: 'Domain Service Does Everything',
    children: [
      { text: '200 methods: calculateDiscount, validateShipping, sendEmail, updateInventory, generateInvoice...' },
      { text: 'Most belong on entities. A Domain Service should be rare, stateless, and truly cross-aggregate.' },
    ],
  },
  {
    text: 'DDD on CRUD',
    children: [
      { text: 'Conference room booking: "can\'t double-book" is the only rule. Team builds 25 classes with full DDD machinery.' },
      { text: 'Infrastructure complexity exceeds domain complexity by 10x. Junior devs spend more time on patterns than shipping.' },
    ],
  },
  {
    text: 'Tactical Without Strategic',
    children: [
      { text: 'Beautiful model with entities, VOs, aggregates — but no Bounded Context boundaries.' },
      { text: 'Every team shares the same `Customer` class. Six months later it has 60 fields and 200 lines of conditional logic.' },
    ],
  },
  {
    text: 'One-Time Task',
    children: [
      { text: 'Event storming at kickoff, beautiful context map on the wall, then never revisited.' },
      { text: 'Month 6: new feature doesn\'t fit the model. Developers force it in. The model is already stale.' },
    ],
  },
]

export const decisionGuideParagraphs: string[] = [
  'Before committing to DDD, ask three questions: **(1) Do we have domain experts who can collaborate?** Without them, DDD is fiction. **(2) Is the complexity in domain rules or infrastructure?** DDD solves domain complexity, not GPU scheduling or cache invalidation. **(3) Will this system outlive its initial implementation?** DDD value compounds over time.',
  'The litmus test: **"Can I explain the business rules of this system in more than 3 sentences?"** If no, you need CRUD, not DDD.',
  'If yes, write those sentences down and share them with a domain expert. If they say "yes, but you\'re missing five things," you\'ve found your domain. Now DDD is worth the investment.',
]

export const entityVsVoParagraphs: string[] = [
  'The most common DDD mistake is confusing **Entity** with **Value Object**. The test: if its properties change, is it still the same thing? Order #123 with one item is the same order as Order #123 with ten items — that\'s an **Entity** (identity-based). Money(100, "USD") changed to Money(150, "USD") is a **different object** — that\'s a **Value Object** (attribute-based).',
  '| | **Entity** | **Value Object** |',
  '|---|---|---|',
  '| **Defined by** | Identity (an ID) | Attributes (what it is) |',
  '| **Immutable?** | No — changes over time | Yes — replace, never mutate |',
  '| **Equality** | Same ID = same object | Same values = same object |',
  '| **Lifecycle** | Created → modified → deleted | Created → used → discarded |',
  '| **Example** | `Order`, `User` | `Money(100, "USD")`, `Address` |',
  'Child **Entities** have their own ID within an aggregate (like `OrderItem` inside `Order`). Value Object **attributes** have no ID (like `ShippingAddress` inside `Order`). All value objects are attributes, but not all attributes are value objects — a value object must be immutable, have value-based equality, and carry domain-specific behavior.',
]

export const aggregateRulesParagraphs: string[] = [
  'The Aggregate is the most important tactical pattern. Four rules: **(1) One root** — external code can only reference the aggregate root, never the children. **(2) Invariants** — the root enforces all rules; every method validates that invariants hold. **(3) One transaction** — one database transaction = one aggregate. **(4) Keep thin** — loading the entire aggregate should be under 10ms.',
  'The sizing rule: **make the aggregate as small as possible** while still enforcing all invariants. If two things never change together, they should not be in the same aggregate. Reference other aggregates by ID, not by object reference. Use eventual consistency between aggregates, not immediate consistency.',
  'History handling: under high-throughput, **externalize history to domain events** instead of storing it inside the aggregate. A god aggregate with `ExecutionHistory[50]` grows massive. A thin aggregate with events (TaskSubmitted, TaskAttemptFailed, TaskSucceeded) stays fixed-size and enables perfect debugging through replay.',
]

export const splitSignalParagraphs: string[] = [
  'The **"Same Word, Different Model" test** is the primary signal for splitting bounded contexts. If "Document" in Indexing means `docId, title, content, status, ingestedAt` but in Ranking means `docId, rawScore`, you have two different models wearing the same name — that\'s the split signal.',
  'Other signals: **invariants interfere** (Indexing\'s "must be indexed before searchable" conflicts with Analytics\' logging needs), **different evolution speed** (Ranking changes weekly, User Accounts change monthly), and **one team can work without the other** (Ranking researchers improving models without touching user accounts).',
  'The definition test: **"If I share this model across two teams, will they start disagreeing about what a concept means?"** If yes → new bounded context. If no → can share.',
]

export const dddAndBeyondParagraphs: string[] = [
  'DDD maps naturally to microservices: **one bounded context = one microservice** (or a small group). Context maps become API contracts or message schemas. Domain events become integration events on a message bus. Anti-Corruption Layers become adapter services or API gateways.',
  'DDD is **not tied to object-oriented programming**. Evans confirmed: **Functional DDD** uses immutable data structures and pure functions that return new aggregate state. **Actor model** has actors maintain aggregate state consistently. **Event Sourcing + CQRS** stores state transitions as events and separates read/write models.',
  '| **Pros** | **Cons** |',
  '|---|---|',
  '| Code mirrors business reality | Heavy upfront investment in workshops |',
  '| Teams work independently | Learning curve: entities, aggregates, events |',
  '| Boundaries prevent ripple effects | More code: factories, repositories, VOs |',
  '| Model evolves with understanding | Requires active domain expert participation |',
  '| Natural microservices fit | Overkill for simple CRUD |',
  '| Ubiquitous language reduces miscommunication | "Folder-Driven Development" is common |',
]
