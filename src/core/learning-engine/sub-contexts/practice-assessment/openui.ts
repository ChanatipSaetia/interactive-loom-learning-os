/**
 * OpenUI Lang vocabulary for the Practice & Assessment subdomain.
 *
 *   root = Quiz("Knowledge Check", [q1])
 *   q1 = QuizQuestion("q1", "What is X?", [QuizChoice("a", "Y", true, "Because…")])
 */
import { z } from 'zod'
import { byId, call, defineOUIComponent, defineOUISection, idOf, refOrId, refTo, sectionTail, sectionTailProps, type LoomOUIComponent } from '../openui-kernel'
import type {
  ConceptEdgeType,
  ConceptMapSectionData,
  ConceptNodeType,
  FlashcardsSectionData,
  QuizQuestion as QuizQuestionData,
  QuizSectionData,
  WordTermType,
} from './schema'

// --- Quiz ---

export const QuizChoice = defineOUIComponent({
  name: 'QuizChoice',
  description: 'One answer option of a quiz question, with the explanation shown after answering.',
  props: z.object({
    id: z.string(),
    text: z.string(),
    correct: z.boolean(),
    explanation: z.string(),
  }),
})

export const QuizQuestion = defineOUIComponent({
  name: 'QuizQuestion',
  description: 'A multiple-choice question. Mark exactly one choice as correct.',
  props: z.object({
    id: z.string(),
    question: z.string(),
    choices: z.array(QuizChoice.ref),
    hint: z.string().optional(),
  }),
})

export const Quiz: LoomOUIComponent = defineOUISection({
  name: 'Quiz',
  sectionType: 'quiz',
  description: 'Knowledge-check section of multiple-choice questions.',
  props: z.object({
    title: z.string(),
    questions: z.array(QuizQuestion.ref),
    ...sectionTailProps,
  }),
  toData: (p) => ({ type: 'quiz', questions: p.questions as unknown as QuizQuestionData[] }),
  fromData: (data: QuizSectionData, meta) => call(Quiz, {
    title: meta.title ?? '',
    questions: data.questions.map((q) => call(QuizQuestion, {
      id: q.id,
      question: q.question,
      choices: q.choices.map((c) => call(QuizChoice, { id: c.id, text: c.text, correct: c.correct, explanation: c.explanation })),
      hint: q.hint,
    }, q.id)),
    ...sectionTail(meta),
  }),
})

// --- Flashcards ---

export const Dialogue = defineOUIComponent({
  name: 'Dialogue',
  description: 'Example exchange showing a term in use: what the user says, what the AI thinks, and its follow-up question.',
  props: z.object({
    user: z.string(),
    aiThoughts: z.string(),
    aiQuestion: z.string(),
  }),
})

export const Flashcard = defineOUIComponent({
  name: 'Flashcard',
  description: 'A vocabulary flip card: the term on the front, definitions on the back.',
  props: z.object({
    id: z.string(),
    word: z.string(),
    pronunciation: z.string(),
    category: z.string(),
    shortDefinition: z.string(),
    detailedDefinition: z.string(),
    whyItMatters: z.string(),
    image: z.string().optional(),
    dialogue: Dialogue.ref.optional(),
  }),
})

export const Flashcards: LoomOUIComponent = defineOUISection({
  name: 'Flashcards',
  sectionType: 'flashcards',
  description: 'Deck of flip cards for key vocabulary.',
  props: z.object({
    title: z.string(),
    cards: z.array(Flashcard.ref),
    ...sectionTailProps,
  }),
  toData: (p) => ({ type: 'flashcards', terms: p.cards as unknown as WordTermType[] }),
  fromData: (data: FlashcardsSectionData, meta) => call(Flashcards, {
    title: meta.title ?? '',
    cards: data.terms.map((t) => call(Flashcard, {
      id: t.id,
      word: t.word,
      pronunciation: t.pronunciation,
      category: t.category,
      shortDefinition: t.shortDefinition,
      detailedDefinition: t.detailedDefinition,
      whyItMatters: t.whyItMatters,
      image: t.image,
      dialogue: t.dialogue ? call(Dialogue, { user: t.dialogue.user, aiThoughts: t.dialogue.aiThoughts, aiQuestion: t.dialogue.aiQuestion }) : undefined,
    }, t.id)),
    ...sectionTail(meta),
  }),
})

// --- Concept Map ---

export const Concept = defineOUIComponent({
  name: 'Concept',
  description: 'A node in a concept map.',
  props: z.object({
    id: z.string(),
    title: z.string(),
    category: z.string().optional(),
  }),
})

export const ConceptLink = defineOUIComponent({
  name: 'ConceptLink',
  description: 'A labelled relation between two concepts (references or concept IDs).',
  props: z.object({
    from: refOrId(Concept),
    to: refOrId(Concept),
    label: z.string().optional(),
  }),
  toData: (p) => ({ from: idOf(p.from), to: idOf(p.to), label: p.label }),
})

export const ConceptMap: LoomOUIComponent = defineOUISection({
  name: 'ConceptMap',
  sectionType: 'concept-map',
  description: 'Knowledge graph of concepts and the relations between them.',
  props: z.object({
    title: z.string(),
    concepts: z.array(Concept.ref),
    links: z.array(ConceptLink.ref),
    ...sectionTailProps,
  }),
  toData: (p) => ({
    type: 'concept-map',
    nodes: byId(p.concepts as unknown as ConceptNodeType[]),
    edges: p.links as unknown as ConceptEdgeType[],
  }),
  fromData: (data: ConceptMapSectionData, meta) => call(ConceptMap, {
    title: meta.title ?? '',
    concepts: Object.entries(data.nodes).map(([id, n]) => call(Concept, { id, title: n.title ?? n.label ?? id, category: n.category }, id)),
    links: data.edges.map((e) => call(ConceptLink, { from: refTo(Concept, e.from), to: refTo(Concept, e.to), label: e.label })),
    ...sectionTail(meta),
  }),
})

export const practiceAssessmentOUIComponents = [
  Quiz, QuizQuestion, QuizChoice,
  Flashcards, Flashcard, Dialogue,
  ConceptMap, Concept, ConceptLink,
]
