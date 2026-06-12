import { Key, Hash, Layers, Database, Cpu, Bell, Hammer } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'

export const entityCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Key as unknown as ComponentType<any>,
  title: 'Entity',
  subtitle: 'Tactical Building Block',
  description: 'An object with identity that persists over time. Two entities are equal if they share the same identifier, regardless of attribute differences.',
  details: 'Entities represent domain concepts with a distinct identity that remains constant throughout their lifecycle. An Order with ID #123 is the same order whether it contains one item or ten. Entity equality is based on identity, not on the values of their attributes. They follow a lifecycle: created, modified, deleted.',
  analogy: 'Like a person — even if they change their name, hair, or address, they\'re still the same person.',
  primaryFocus: 'Identity-based distinction across time and state changes.',
  inScope: [
    'Identity-based equality',
    'Lifecycle: created → modified → deleted',
    'Encapsulates domain rules',
  ],
  outOfScope: [
    'Attribute-based equality',
    'Immutable replacement',
  ],
  color: 'blue',
}

export const valueObjectCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Hash as unknown as ComponentType<any>,
  title: 'Value Object',
  subtitle: 'Tactical Building Block',
  description: 'An immutable object defined entirely by its attributes. No identity. Two value objects are equal if all their attributes match.',
  details: 'Value objects have no conceptual identity — they are interchangeable. Money(100, "USD") equals Money(100, "USD") regardless of where each instance was created. They are immutable: you never mutate them, you replace them. They encapsulate domain-specific behavior and validation about their attributes.',
  analogy: 'Like a dollar bill — two $100 bills with the same value are interchangeable.',
  primaryFocus: 'Attribute-based equality and immutability.',
  inScope: [
    'Attribute-based equality',
    'Immutable — replace, never mutate',
    'Has domain-specific behavior',
  ],
  outOfScope: [
    'Has an ID field',
    'Has setters/mutators',
  ],
  color: 'green',
}

export const aggregateCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Layers as unknown as ComponentType<any>,
  title: 'Aggregate',
  subtitle: 'Tactical Building Block',
  description: 'A cluster of entities and value objects treated as one unit. One root enforces all invariants. One transaction per aggregate.',
  details: 'Aggregates define consistency boundaries. Everything inside changes together in a single transaction. Only the aggregate root is accessible from outside — external references point to the root, never to child entities. The root enforces all invariants across the entire cluster.',
  analogy: 'Like a document and its pages — you edit the document, not individual pages.',
  primaryFocus: 'Consistency boundary and single entry point.',
  inScope: [
    'One entry point (root)',
    'Enforces all invariants',
    'One database transaction',
  ],
  outOfScope: [
    'Direct child access',
    'Cross-aggregate mutations',
  ],
  color: 'mauve',
}

export const repositoryCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Database as unknown as ComponentType<any>,
  title: 'Repository',
  subtitle: 'Tactical Building Block',
  description: 'A collection-like interface for persisting and loading aggregates. Hides storage details behind a clean API.',
  details: 'Repositories provide a memory-like collection interface for aggregate root access. They offer methods like findById(), save(), and delete(). The repository hides whether data lives in a database, cache, or remote service. It never exposes methods that bypass entity behavior — like updateStatus() that skips the entity\'s own status-changing logic.',
  analogy: 'Like a library — you check out and return books, you don\'t edit the catalog directly.',
  primaryFocus: 'Collection-like persistence and retrieval of aggregate roots.',
  inScope: [
    'findById()',
    'save()',
    'delete()',
  ],
  outOfScope: [
    'updateStatus() — bypasses entity',
  ],
  color: 'sky',
}

export const domainServiceCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Cpu as unknown as ComponentType<any>,
  title: 'Domain Service',
  subtitle: 'Tactical Building Block',
  description: 'Stateless logic that doesn\'t naturally belong to any single entity. Orchestrates operations that span multiple aggregates.',
  details: 'When domain logic involves multiple aggregates or doesn\'t fit cleanly on one entity, a domain service hosts that logic. It is stateless, calls entity methods rather than bypassing them, and orchestrates cross-aggregate operations. It does not handle infrastructure concerns or queries — those belong to application services and query handlers.',
  analogy: 'Like a referee — orchestrates the game but isn\'t a player.',
  primaryFocus: 'Stateless, cross-aggregate domain logic that doesn\'t belong on one entity.',
  inScope: [
    'Cross-aggregate orchestration',
    'Stateless operations',
    'Calls entity methods, doesn\'t bypass them',
  ],
  outOfScope: [
    'Logic that belongs on one entity',
    'Query/infrastructure concerns',
  ],
  color: 'peach',
}

export const domainEventCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Bell as unknown as ComponentType<any>,
  title: 'Domain Event',
  subtitle: 'Tactical Building Block',
  description: 'Something meaningful that happened, named in past tense. Published after a state change to drive system reactions.',
  details: 'Domain events capture significant occurrences within the domain. They are named in past tense (OrderPlaced, PaymentFailed) and are immutable once published. Other parts of the system react to events without creating tight coupling. Events carry the facts about what happened, not the current state or future predictions.',
  analogy: 'Like a news headline — reports what happened, not what will happen.',
  primaryFocus: 'Immutable record of a significant domain occurrence.',
  inScope: [
    'Past tense names',
    'Immutable once published',
    'Drives system reactions',
  ],
  outOfScope: [
    'Current state',
    'Future predictions',
  ],
  color: 'pink',
}

export const factoryCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Hammer as unknown as ComponentType<any>,
  title: 'Factory',
  subtitle: 'Tactical Building Block',
  description: 'Encapsulates complex object creation. Ensures invariants hold from the moment the object is born.',
  details: 'Factories handle complex construction logic that doesn\'t belong in a simple constructor. They validate invariants at creation time, handle branching creation paths, and coordinate with other objects to produce a valid result. Use a factory when construction requires more than a straightforward parameter list.',
  analogy: 'Like a quality control station — ensures products meet standards before they leave.',
  primaryFocus: 'Complex construction with guaranteed initial invariants.',
  inScope: [
    'Complex construction logic',
    'Validates from birth',
    'Handles branching creation',
  ],
  outOfScope: [
    'Simple constructor calls',
    'Post-creation validation',
  ],
  color: 'yellow',
}
