# Supporting Subdomains & Section Form Editor Realignment Log (Option A Strategy)

> **Context:** Architectural consolidation aligning `src/` with Strategic & Tactical DDD specification ([`docs/agents/domain.md`](../docs/agents/domain.md)).
> **Strategy Selected:** **Option A — Subdomain Form Editor Encapsulation**
> **Date:** 2026-07-31

---

## 1. Architecture & Subdomain Division (Option A)

Under **Option A**, each Core Subdomain fully encapsulates its section **Schemas**, **Events**, **View Renderers**, **Help Modals**, AND **Form Editors**:

```
src/core/subdomains/
├── process-simulation/       (Core Subdomain: Renderers, Help Modals, Form Editors)
│   ├── components/
│   │   ├── flowchart/        (index.tsx, FlowchartHelpModal.tsx, FlowchartFormEditor.tsx)
│   │   └── scenario/         (index.tsx, ScenarioHelpModal.tsx, ScenarioFormEditor.tsx)
│   ├── schema.ts
│   ├── events.ts
│   └── index.ts
│
├── tradeoff-sandbox/         (Core Subdomain: Renderers, Help Modals, Form Editors)
│   ├── components/
│   │   ├── tradeoff-sandbox/ (index.tsx, TradeoffHelpModal.tsx, TradeoffSandboxFormEditor.tsx)
│   │   ├── formula-sandbox/  (index.tsx, FormulaHelpModal.tsx, FormulaSandboxFormEditor.tsx)
│   │   └── decision-tree/    (index.tsx, DecisionTreeHelpModal.tsx, DecisionTreeFormEditor.tsx)
│   ├── schema.ts
│   ├── events.ts
│   └── index.ts
│
├── reflection-synthesis/     (Core Subdomain: Renderers, Help Modals, Form Editors)
│   ├── components/
│   │   ├── reflection-sequence/ (index.tsx, ReflectionSequenceHelpModal.tsx, ReflectionSequenceFormEditor.tsx)
│   │   └── reflection-template/ (index.tsx, ReflectionTemplateHelpModal.tsx, ReflectionTemplateFormEditor.tsx)
│   ├── schema.ts
│   ├── events.ts
│   └── index.ts
│
├── progressive-content/      (Core Subdomain: Renderers, Help Modals, Form Editors)
│   ├── components/
│   │   ├── text/             (index.tsx, TextHelpModal.tsx, TextFormEditor.tsx)
│   │   ├── intro/            (index.tsx, IntroHelpModal.tsx, IntroFormEditor.tsx)
│   │   ├── bullets/          (index.tsx, BulletsHelpModal.tsx, BulletsFormEditor.tsx)
│   │   └── taxonomy-browser/ (index.tsx, TaxonomyHelpModal.tsx, TaxonomyBrowserFormEditor.tsx)
│   ├── schema.ts
│   ├── events.ts
│   └── index.ts
│
├── practice-assessment/      (Core Subdomain: Renderers, Help Modals, Form Editors)
│   ├── components/
│   │   ├── quiz/             (index.tsx, QuizHelpModal.tsx, QuizFormEditor.tsx)
│   │   ├── flashcards/       (index.tsx, FlashcardsHelpModal.tsx, FlashcardsFormEditor.tsx)
│   │   └── concept-map/      (index.tsx, ConceptMapHelpModal.tsx, ConceptMapFormEditor.tsx)
│   ├── schema.ts
│   ├── events.ts
│   └── index.ts
│
└── supporting/               (3 Supporting Subdomains)
    ├── index.ts              (Central Barrel Export for Supporting Subdomains)
    │
    ├── authoring-editor/     (✏️ Content Authoring Shell Subdomain)
    │   ├── components/       (EditorPanel.tsx, VisualFormEditor.tsx, RawYAMLEditor.tsx, DynamicSchemaForm.tsx)
    │   ├── hooks/            (useSectionEditorBuffer.ts)
    │   ├── services/         (okfSave.ts)
    │   └── index.ts          (Public API contract)
    │
    ├── catalog-discovery/    (📚 Catalog & Topic Discovery Subdomain)
    │   ├── components/       (OverviewPage.tsx, overview.css)
    │   ├── hooks/            (useTopicFiltering.ts)
    │   └── index.ts          (Public API contract)
    │
    └── learner-progress/     (📊 Learning Progress Tracking Subdomain)
        ├── context.tsx        (LearnerProgressContext & Provider)
        ├── storage.ts        (Local Storage persistence adapter)
        ├── types.ts          (Progress state & event types)
        └── index.ts          (Public API contract)
```

---

## 2. Execution Status

| Phase | Description | Status |
|---|---|---|
| **Phase 1** | Core Subdomain Form Editors Migration (Option A) | ✅ COMPLETED |
| **Phase 2** | Learner Progress Tracking Migration (`learner-progress`) | ✅ COMPLETED |
| **Phase 3** | Catalog & Topic Discovery Migration (`catalog-discovery`) | ✅ COMPLETED |
| **Phase 4** | Content Authoring Host Shell Migration (`authoring-editor`) | ✅ COMPLETED |
| **Phase 5** | Central Barrel Export, Documentation & Final Verification | ✅ COMPLETED |

---

## 3. Option A Form Editor Location Mapping

| Section Type | Source Location | Target Subdomain Location |
|---|---|---|
| `flowchart` | `src/components/editor/forms/FlowchartFormEditor.tsx` | `src/core/subdomains/process-simulation/components/flowchart/FlowchartFormEditor.tsx` |
| `scenario` | `src/components/editor/forms/ScenarioFormEditor.tsx` | `src/core/subdomains/process-simulation/components/scenario/ScenarioFormEditor.tsx` |
| `tradeoff-sandbox` | `src/components/editor/forms/TradeoffSandboxFormEditor.tsx` | `src/core/subdomains/tradeoff-sandbox/components/tradeoff-sandbox/TradeoffSandboxFormEditor.tsx` |
| `formula-sandbox` | `src/components/editor/forms/FormulaSandboxFormEditor.tsx` | `src/core/subdomains/tradeoff-sandbox/components/formula-sandbox/FormulaSandboxFormEditor.tsx` |
| `decision-tree` | `src/components/editor/forms/DecisionTreeFormEditor.tsx` | `src/core/subdomains/tradeoff-sandbox/components/decision-tree/DecisionTreeFormEditor.tsx` |
| `reflection-sequence` | `src/components/editor/forms/ReflectionSequenceFormEditor.tsx` | `src/core/subdomains/reflection-synthesis/components/reflection-sequence/ReflectionSequenceFormEditor.tsx` |
| `reflection-template` | `src/components/editor/forms/ReflectionTemplateFormEditor.tsx` | `src/core/subdomains/reflection-synthesis/components/reflection-template/ReflectionTemplateFormEditor.tsx` |
| `text` | `src/components/editor/forms/TextFormEditor.tsx` | `src/core/subdomains/progressive-content/components/text/TextFormEditor.tsx` |
| `intro` | `src/components/editor/forms/IntroFormEditor.tsx` | `src/core/subdomains/progressive-content/components/intro/IntroFormEditor.tsx` |
| `bullets` | `src/components/editor/forms/BulletsFormEditor.tsx` | `src/core/subdomains/progressive-content/components/bullets/BulletsFormEditor.tsx` |
| `taxonomy-browser` | `src/components/editor/forms/TaxonomyBrowserFormEditor.tsx` | `src/core/subdomains/progressive-content/components/taxonomy-browser/TaxonomyBrowserFormEditor.tsx` |
| `quiz` | `src/components/editor/forms/QuizFormEditor.tsx` | `src/core/subdomains/practice-assessment/components/quiz/QuizFormEditor.tsx` |
| `flashcards` | `src/components/editor/forms/FlashcardsFormEditor.tsx` | `src/core/subdomains/practice-assessment/components/flashcards/FlashcardsFormEditor.tsx` |
| `concept-map` | `src/components/editor/forms/ConceptMapFormEditor.tsx` | `src/core/subdomains/practice-assessment/components/concept-map/ConceptMapFormEditor.tsx` |
| `dynamic-schema` | `src/components/editor/forms/DynamicSchemaForm.tsx` | `src/core/subdomains/supporting/authoring-editor/components/DynamicSchemaForm.tsx` |

