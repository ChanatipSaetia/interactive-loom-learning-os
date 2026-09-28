// ============================================================================
// OKF JSON Schema Manifest
// ============================================================================
// Declares the JSON Schema generated for every OKF YAML data file shape.
// Each target describes the PER-FILE INPUT shape — exactly what the file
// contributes to the section schema input via its sub-context `layout.ts`
// (singleFile / collection / fixedFiles) — never the transformed render shape.
//
// Consumed by:
//   - scripts/generate-okf-schemas.ts (CLI: `npm run okf:schemas`)
//   - tests/unit/scripts/okf-schemas.test.ts (drift test)
// ============================================================================

import { z } from 'zod'
import type { ZodType } from 'zod'

import { KNOWN_SECTION_TYPES } from '../src/core/learning-engine/validation/gateway'

import {
  IntroSectionSchema,
  BulletsSectionSchema,
  TaxonomyBrowserSectionSchema,
  TaxonomyCategorySchema,
  ImageGallerySectionSchema,
  PillarLayerSectionSchema,
} from '../src/core/learning-engine/sub-contexts/progressive-content/schema'
import {
  FlowchartFlowSchema,
  ScenarioSectionSchema,
} from '../src/core/learning-engine/sub-contexts/process-simulation/schema'
import {
  TradeoffSandboxSectionSchema,
  TradeoffScenarioSchema,
  FormulaSandboxSectionSchema,
  DecisionTreeSectionSchema,
} from '../src/core/learning-engine/sub-contexts/tradeoff-sandbox/schema'
import {
  ReflectionSequenceSectionSchema,
  ReflectionTemplateSectionSchema,
} from '../src/core/learning-engine/sub-contexts/reflection-synthesis/schema'
import {
  QuizSectionSchema,
  FlashcardsSectionSchema,
  ConceptMapSectionSchema,
} from '../src/core/learning-engine/sub-contexts/practice-assessment/schema'

import { HexCampaignSchema } from '../src/core/generic/hex-map/schema'
import { TopicBriefSchema } from '../src/core/learning-engine/validation/topic-brief'

export interface OkfSchemaTarget {
  /** Output path relative to the repository root. */
  outPath: string
  /** Schema title (surfaces in editor hover UI). */
  title: string
  /** Human description of which file this schema describes. */
  description: string
  /** Section type this file belongs to ('hexmap' / 'frontmatter' for non-section files). */
  sectionType: string
  schema: ZodType
}

/**
 * `section.md` frontmatter shape (mirrors `SectionMeta` in
 * `src/core/learning-engine/validation/types.ts`; `resource` is optional and
 * defaults to '.', which selects the layout's default file).
 */
export const SectionFrontmatterSchema = z.object({
  type: z.enum([...KNOWN_SECTION_TYPES].sort() as [string, ...string[]]),
  title: z.string().optional(),
  heading: z.string().optional(),
  ordered: z.boolean().optional(),
  resource: z.string().optional(),
  intro: z
    .object({
      what: z.string().optional(),
      why: z.string().optional(),
      next: z.string().optional(),
    })
    .optional(),
})

// Helpers ------------------------------------------------------------------

/**
 * Input shape of a `singleFile(file)` layout: the data file is the section object
 * minus `type` (from frontmatter). Rebuilt from the raw shape because Zod 4
 * refuses `.omit()` on schemas with refinements — refinements are not
 * representable in JSON Schema, so nothing is lost.
 */
function wholeFile(schema: z.ZodObject): ZodType {
  const shape = { ...schema.shape }
  delete shape.type
  return z.object(shape as z.ZodRawShape)
}

/** Input shape of a `singleFile(file, key)` / `collection(key)` array file: the section schema's `key` field. */
function keyedFile(schema: z.ZodObject, key: string): ZodType {
  return (schema.shape as Record<string, ZodType>)[key]
}

// Manifest ------------------------------------------------------------------

export const SCHEMA_TARGETS: OkfSchemaTarget[] = [
  // --- practice-assessment ---
  {
    outPath: 'schemas/okf/quiz/questions.schema.json',
    title: 'OKF quiz questions.yaml',
    description: 'Quiz questions (array) — the questions.yaml file of a quiz section.',
    sectionType: 'quiz',
    schema: keyedFile(QuizSectionSchema, 'questions'),
  },
  {
    outPath: 'schemas/okf/flashcards/glossary.schema.json',
    title: 'OKF flashcards glossary.yaml',
    description: 'Flashcard terms (array) — the glossary.yaml file of a flashcards section.',
    sectionType: 'flashcards',
    schema: keyedFile(FlashcardsSectionSchema, 'terms'),
  },
  {
    outPath: 'schemas/okf/concept-map/concepts.schema.json',
    title: 'OKF concept-map concepts.yaml',
    description: 'Concept map nodes and edges — the concepts.yaml file of a concept-map section.',
    sectionType: 'concept-map',
    schema: wholeFile(ConceptMapSectionSchema),
  },
  // --- progressive-content ---
  {
    outPath: 'schemas/okf/intro/content.schema.json',
    title: 'OKF intro content.yaml',
    description: 'Intro what/why/roadmap — the content.yaml file of an intro section.',
    sectionType: 'intro',
    schema: wholeFile(IntroSectionSchema),
  },
  {
    outPath: 'schemas/okf/bullets/items.schema.json',
    title: 'OKF bullets items.yaml',
    description: 'Bullet items (array) — the items.yaml file of a bullets section.',
    sectionType: 'bullets',
    schema: keyedFile(BulletsSectionSchema, 'items'),
  },
  {
    outPath: 'schemas/okf/taxonomy-browser/categories.schema.json',
    title: 'OKF taxonomy-browser categories.yaml',
    description: 'Taxonomy categories (array) — a single-file taxonomy collection declared via resource.',
    sectionType: 'taxonomy-browser',
    schema: keyedFile(TaxonomyBrowserSectionSchema, 'categories'),
  },
  {
    outPath: 'schemas/okf/taxonomy-browser/category-item.schema.json',
    title: 'OKF taxonomy category item',
    description: 'One taxonomy category — a single numbered *.yaml file in a taxonomy-browser collection folder.',
    sectionType: 'taxonomy-browser',
    schema: TaxonomyCategorySchema,
  },
  {
    outPath: 'schemas/okf/image-gallery/gallery.schema.json',
    title: 'OKF image-gallery gallery.yaml',
    description: 'Gallery items (array) — the gallery.yaml file of an image-gallery section.',
    sectionType: 'image-gallery',
    schema: keyedFile(ImageGallerySectionSchema, 'items'),
  },
  {
    outPath: 'schemas/okf/pillar-layer/matrix.schema.json',
    title: 'OKF pillar-layer matrix.yaml',
    description: 'Pillar/layer grid — the matrix.yaml file of a pillar-layer section.',
    sectionType: 'pillar-layer',
    schema: wholeFile(PillarLayerSectionSchema),
  },
  // --- process-simulation (flowchart: fixedFiles under `flow`) ---
  {
    outPath: 'schemas/okf/flowchart/actors.schema.json',
    title: 'OKF flowchart actors.yaml',
    description: 'Declared actors keyed by id — the actors.yaml file of a flowchart section.',
    sectionType: 'flowchart',
    schema: keyedFile(FlowchartFlowSchema, 'actors'),
  },
  {
    outPath: 'schemas/okf/flowchart/systems.schema.json',
    title: 'OKF flowchart systems.yaml',
    description: 'Declared systems keyed by id — the systems.yaml file of a flowchart section.',
    sectionType: 'flowchart',
    schema: keyedFile(FlowchartFlowSchema, 'systems'),
  },
  {
    outPath: 'schemas/okf/flowchart/steps.schema.json',
    title: 'OKF flowchart steps.yaml',
    description: 'Event-storming steps (array) — the steps.yaml file of a flowchart section.',
    sectionType: 'flowchart',
    schema: keyedFile(FlowchartFlowSchema, 'steps'),
  },
  {
    outPath: 'schemas/okf/flowchart/journeys.schema.json',
    title: 'OKF flowchart journeys.yaml',
    description: 'User journeys (array) — the journeys.yaml file of a flowchart section.',
    sectionType: 'flowchart',
    schema: keyedFile(FlowchartFlowSchema, 'journeys'),
  },
  {
    outPath: 'schemas/okf/scenario/scenarios.schema.json',
    title: 'OKF scenario scenarios.yaml',
    description: 'Branching scenario — the scenarios.yaml file of a scenario section.',
    sectionType: 'scenario',
    schema: wholeFile(ScenarioSectionSchema),
  },
  // --- tradeoff-sandbox ---
  {
    outPath: 'schemas/okf/tradeoff-sandbox/scenarios.schema.json',
    title: 'OKF tradeoff-sandbox scenarios.yaml',
    description: 'Tradeoff scenarios (array) — a single-file tradeoff collection declared via resource.',
    sectionType: 'tradeoff-sandbox',
    schema: keyedFile(TradeoffSandboxSectionSchema, 'scenarios'),
  },
  {
    outPath: 'schemas/okf/tradeoff-sandbox/scenario-item.schema.json',
    title: 'OKF tradeoff scenario item',
    description: 'One tradeoff scenario — a single numbered *.yaml file in a tradeoff-sandbox collection folder.',
    sectionType: 'tradeoff-sandbox',
    schema: TradeoffScenarioSchema,
  },
  {
    outPath: 'schemas/okf/formula-sandbox/sandbox.schema.json',
    title: 'OKF formula-sandbox sandbox.yaml',
    description: 'Formula variables and metrics — the sandbox.yaml file of a formula-sandbox section.',
    sectionType: 'formula-sandbox',
    schema: wholeFile(FormulaSandboxSectionSchema),
  },
  {
    outPath: 'schemas/okf/decision-tree/tree.schema.json',
    title: 'OKF decision-tree tree.yaml',
    description: 'Decision tree nodes — the tree.yaml file of a decision-tree section.',
    sectionType: 'decision-tree',
    schema: wholeFile(DecisionTreeSectionSchema),
  },
  // --- reflection-synthesis ---
  {
    outPath: 'schemas/okf/reflection-sequence/sequence.schema.json',
    title: 'OKF reflection-sequence sequence.yaml',
    description: 'Sequencing challenges — the sequence.yaml file of a reflection-sequence section.',
    sectionType: 'reflection-sequence',
    schema: wholeFile(ReflectionSequenceSectionSchema),
  },
  {
    outPath: 'schemas/okf/reflection-template/template.schema.json',
    title: 'OKF reflection-template template.yaml',
    description: 'Sentence-fill challenges — the template.yaml file of a reflection-template section.',
    sectionType: 'reflection-template',
    schema: wholeFile(ReflectionTemplateSectionSchema),
  },
  // --- hex campaign maps ---
  {
    outPath: 'schemas/hexmaps/hex-campaign.schema.json',
    title: 'OKF hex campaign map',
    description: 'Hex campaign map document — public/hexmaps/<topic-id>.yaml.',
    sectionType: 'hexmap',
    schema: HexCampaignSchema,
  },
  // --- topic brief ---
  {
    outPath: 'schemas/okf/topic-brief.schema.json',
    title: 'OKF topic brief',
    description: 'Topic design record — public/okf/<topic-id>/brief.yaml.',
    sectionType: 'brief',
    schema: TopicBriefSchema,
  },
  // --- section.md frontmatter ---
  {
    outPath: 'schemas/okf/section-frontmatter.schema.json',
    title: 'OKF section.md frontmatter',
    description: 'Frontmatter mapping of a section.md file (type, title, resource, intro).',
    sectionType: 'frontmatter',
    schema: SectionFrontmatterSchema,
  },
]

/** Generate every JSON Schema, keyed by output path. */
export function buildAllSchemas(): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const target of SCHEMA_TARGETS) {
    const json = z.toJSONSchema(target.schema, {
      io: 'input',
      target: 'draft-2020-12',
      unrepresentable: 'any',
    }) as Record<string, unknown>
    out[target.outPath] = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $comment: `Generated from Zod by \`npm run okf:schemas\` — do not edit by hand. ${target.description}`,
      title: target.title,
      ...json,
    }
  }
  return out
}
