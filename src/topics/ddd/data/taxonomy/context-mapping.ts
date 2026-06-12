import {
  Handshake,
  Share2,
  Shield,
  ArrowRight,
  Repeat,
  Globe,
  FileText,
  GitBranch,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'

export const partnershipCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Handshake as unknown as ComponentType<any>,
  title: 'Partnership',
  subtitle: 'Context Mapping Pattern',
  description: 'Two teams collaborate closely; models evolve together bidirectionally. High communication, low code coupling.',
  details: 'Partnership is a bilateral relationship where both teams invest in understanding each other\'s models. They hold joint modeling sessions, agree on shared terminology at the seam, and evolve their models together. This pattern works best with small teams that communicate frequently and share aligned business goals.',
  analogy: 'Like two research labs sharing a whiteboard.',
  primaryFocus: 'Bidirectional model alignment through close collaboration.',
  inScope: [
    'Bidirectional collaboration',
    'Joint modeling sessions',
    'Co-evolving terminology',
  ],
  outOfScope: [
    'Large team count',
    'Diverging priorities',
  ],
  color: 'sky',
}

export const sharedKernelCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Share2 as unknown as ComponentType<any>,
  title: 'Shared Kernel',
  subtitle: 'Context Mapping Pattern',
  description: 'Two contexts share a small subset of the model. Both teams co-own the shared concepts.',
  details: 'A Shared Kernel identifies the minimal set of concepts, terminology, and data structures that two bounded contexts need to share. Both teams co-own and jointly maintain this shared submodel. The kernel must remain small and stable — if the shared portion grows too large or changes frequently, the pattern breaks down.',
  analogy: 'Like two countries sharing a border treaty.',
  primaryFocus: 'Minimal, co-owned shared submodel between contexts.',
  inScope: [
    'Small shared submodel',
    'Both teams co-own',
    'Stable concepts',
  ],
  outOfScope: [
    'Frequently changing shared parts',
    'One-sided dependencies',
  ],
  color: 'green',
}

export const aclCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Shield as unknown as ComponentType<any>,
  title: 'Anti-Corruption Layer',
  subtitle: 'Context Mapping Pattern',
  description: 'Downstream builds a translation layer to protect its model from upstream contamination. High code investment, low coupling.',
  details: 'An Anti-Corruption Layer sits between your bounded context and an upstream system with an incompatible model. It translates upstream concepts into your domain language: mapping identities, adapting protocols, normalizing errors. The ACL protects your model from being corrupted by upstream design decisions, giving you freedom to evolve independently.',
  analogy: 'Like a diplomat translating between cultures so neither contaminates the other.',
  primaryFocus: 'Model translation to protect downstream context from upstream design.',
  inScope: [
    'Model translation',
    'Identity mapping',
    'Protocol adaptation',
    'Error normalization',
  ],
  outOfScope: [
    'Stable, well-designed upstream',
    'Systems you control',
  ],
  color: 'mauve',
}

export const customerSupplierCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: ArrowRight as unknown as ComponentType<any>,
  title: 'Customer/Supplier',
  subtitle: 'Context Mapping Pattern',
  description: 'Upstream provides; downstream depends. Contract-driven relationship with directional dependency.',
  details: 'The Customer/Supplier pattern formalizes a directional dependency between contexts. The supplier team provides a capability, the customer team consumes it. They negotiate an API contract, and the customer monitors the supplier\'s changelog for breaking changes. Unlike Partnership, this is not bidirectional — the customer adapts to the supplier, not the other way around.',
  analogy: 'Like a restaurant depending on a farmer\'s produce schedule.',
  primaryFocus: 'Directional dependency with explicit API contract.',
  inScope: [
    'Directional dependency',
    'API contract',
    'Changelog monitoring',
  ],
  outOfScope: [
    'Mutual influence',
  ],
  color: 'peach',
}

export const conformistCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Repeat as unknown as ComponentType<any>,
  title: 'Conformist',
  subtitle: 'Context Mapping Pattern',
  description: 'Downstream adopts upstream\'s model entirely. No translation. Low code investment, high coupling.',
  details: 'In the Conformist pattern, the downstream context deliberately adopts the upstream model without any translation or adaptation. This is a conscious trade-off: you accept tight coupling to ship fast with minimal code. It works best as a short-term strategy for small teams, but sacrifices long-term flexibility.',
  analogy: 'Like speaking entirely in the customer\'s language.',
  primaryFocus: 'Adopting upstream model as-is for speed over independence.',
  inScope: [
    'Fast ship',
    'Small team',
    'Short-term strategy',
  ],
  outOfScope: [
    'Long-term flexibility',
    'Multiple upstream providers',
  ],
  color: 'yellow',
}

export const ohsCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Globe as unknown as ComponentType<any>,
  title: 'Open Host Service',
  subtitle: 'Context Mapping Pattern',
  description: 'Upstream publishes a well-defined protocol for all consumers. Self-serve adoption with a stable API.',
  details: 'An Open Host Service is a generalization of the Supplier pattern for many consumers. The upstream context publishes a stable, well-documented API that any team can adopt without negotiation. The protocol is explicit, versioned, and backward-compatible. All consumers operate under the same rules defined by the service.',
  analogy: 'Like a restaurant with a published menu.',
  primaryFocus: 'Well-defined, versioned protocol for many independent consumers.',
  inScope: [
    'Many consumers',
    'Well-defined API',
    'Self-serve adoption',
  ],
  outOfScope: [
    'Few consumers',
    'Unstable protocol',
  ],
  color: 'blue',
}

export const publishedLanguageCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: FileText as unknown as ComponentType<any>,
  title: 'Published Language',
  subtitle: 'Context Mapping Pattern',
  description: 'Shared interchange format (Protobuf, JSON Schema, EDI) that all contexts agree to use for communication.',
  details: 'A Published Language is a formal, versioned interchange format that multiple bounded contexts use to communicate. Examples include Protobuf schemas, JSON Schema definitions, or EDI documents. The language is framework-agnostic and serves as the contract between contexts. All participants must support the same version of the language.',
  analogy: 'Like ISO standards for shipping containers.',
  primaryFocus: 'Formal, versioned interchange format shared across contexts.',
  inScope: [
    'Versioned format',
    'Multiple consumers',
    'Framework-agnostic',
  ],
  outOfScope: [
    'Single consumer',
    'Tight coupling acceptable',
  ],
  color: 'pink',
}

export const separateWaysCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: GitBranch as unknown as ComponentType<any>,
  title: 'Separate Ways',
  subtitle: 'Context Mapping Pattern',
  description: 'No integration. Contexts operate independently with complete decoupling.',
  details: 'Separate Ways is the deliberate decision to build no integration between two bounded contexts. They operate independently, release independently, and accept eventual consistency or no consistency at all. This pattern is appropriate when real-time accuracy is not required and the cost of integration outweighs the benefit.',
  analogy: 'Like two companies that occasionally share press releases.',
  primaryFocus: 'Complete decoupling with independent operation and releases.',
  inScope: [
    'Complete decoupling',
    'Eventually consistent',
    'Independent releases',
  ],
  outOfScope: [
    'Real-time accuracy needed',
  ],
  color: 'lavender',
}
