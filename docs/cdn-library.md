# Loom Sections CDN Library

Standalone React component library for rendering interactive learning sections from JSON data. Load via CDN, provide OKF JSON, get rendered sections.

## Quick Start

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Learning Page</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/loom-learning-sections@1.0.7/loom-sections.css">
  <style>
    /* Center the container and add padding */
    #loom-root {
      max-width: 860px;
      margin: 0 auto;
      padding: 16px;
    }
  </style>
</head>
<body>
  <!-- Theme selector widget mounts here -->
  <div id="theme-picker" style="max-width: 860px; margin: 16px auto; display: flex; justify-content: flex-end;"></div>
  
  <!-- Container where Loom Sections will render -->
  <div id="loom-root"></div>

  <script src="https://cdn.jsdelivr.net/npm/loom-learning-sections@1.0.7/loom-sections.umd.js"></script>
  <script>
    const okfSections = [
      {
        type: "text",
        props: {
          title: "Welcome",
          paragraphs: [
            "# Hello World\nThis is your first learning page.",
            "Add more paragraphs here."
          ]
        }
      },
      {
        type: "bullets",
        props: {
          title: "Key Points",
          items: [
            { text: "First concept" },
            { text: "Second concept", children: [{ text: "Sub-point A" }, { text: "Sub-point B" }] }
          ]
        }
      }
    ];

    // 1. Render sections
    LoomSections.render(document.getElementById("loom-root"), okfSections, {
      title: "My Learning Topic",
      theme: "frappe"
    });

    // 2. Render theme selector
    LoomSections.renderThemeSelector(
      document.getElementById("theme-picker"),
      document.getElementById("loom-root"),
      { position: "inline" }
    );
  </script>
</body>
</html>
```

## API Reference

### `LoomSections.render(container, sections, options?)`

Render sections into a DOM container.

| Parameter | Type | Description |
|---|---|---|
| `container` | `HTMLElement` | DOM element to render into |
| `sections` | `SectionConfig[]` | Array of section configurations |
| `options` | `RenderOptions` | Optional — title, theme (see [RenderOptions](#renderoptions)) |

```javascript
LoomSections.render(document.getElementById("root"), sections, {
  title: "My Learning Topic",
  theme: "frappe",
});
```

Returns a cleanup function. Call it to unmount:

```javascript
const cleanup = LoomSections.render(el, sections, { theme: "mocha" });
cleanup(); // unmounts React root and removes injected theme styles
```

### `RenderOptions`

```typescript
interface RenderOptions {
  title?: string
  theme?: BuiltInTheme | Record<string, string>
}

type BuiltInTheme = 'frappe' | 'latte' | 'mocha' | 'macchiato'
```

| Field | Type | Description |
|---|---|---|
| `title` | `string` | When provided, the library renders a styled gradient header above the sections containing this text. |
| `theme` | `BuiltInTheme \| Record<string, string>` | Preset name or partial CSS token map. Applied as a scoped `<style>` tag tied to the container element. |

---

### `LoomSections.renderThemeSelector(widgetContainer, sectionsContainer, options?)`

Mount a floating colour-swatch picker that lets users switch between themes live.
Swapping a theme only replaces the scoped `<style>` tag — no React remount.

| Parameter | Type | Description |
|---|---|---|
| `widgetContainer` | `HTMLElement` | DOM element to mount the picker into |
| `sectionsContainer` | `HTMLElement` | The **same** container passed to `render()` — the picker retargets its theme here |
| `options` | `ThemeSelectorOptions` | Optional — which themes to show, where to position the widget |

```javascript
// 1. Render sections first
LoomSections.render(document.getElementById("loom-root"), sections, {
  title: "My Learning Topic",
  theme: "frappe",
});

// 2. Mount the theme picker inline next to the status badge
LoomSections.renderThemeSelector(
  document.getElementById("theme-picker"),
  document.getElementById("loom-root"),
  { position: "inline" }   // or "top-right" | "top-left" | "bottom-right" | "bottom-left"
);
```

Returns a cleanup function that unmounts the widget:

```javascript
const cleanupPicker = LoomSections.renderThemeSelector(pickerEl, rootEl);
cleanupPicker(); // unmounts only the picker; sections remain
```

### `ThemeSelectorOptions`

```typescript
interface ThemeSelectorOptions {
  themes?: Array<
    BuiltInTheme |
    { name: string; label: string; tokens: Record<string, string> }
  >
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline'
}
```

| Field | Type | Description |
|---|---|---|
| `themes` | `Array<…>` | Which themes to show. Default: all four built-in Catppuccin flavours. Custom entries use `name`/`label`/`tokens`. |
| `position` | `string` | `'inline'` renders inside the container; other values use `position: fixed` at the named viewport corner. Default: `'top-right'`. |

---

### `LoomSections.registerSection(type, componentFactory)`

Register a custom section type.

| Parameter | Type | Description |
|---|---|---|
| `type` | `string` | Section type identifier (e.g., `"my-custom"`) |
| `componentFactory` | `function(props) => HTMLElement` | Factory that returns a DOM element from props |

```javascript
LoomSections.registerSection("my-custom", (props) => {
  const el = document.createElement("div");
  el.className = "my-custom-section";
  el.innerHTML = `<h2>${props.title}</h2><p>${props.body}</p>`;
  return el;
});
```

### `SectionConfig`

```typescript
interface SectionConfig {
  type: string;           // Section type identifier
  props: Record<string, unknown>;  // Props passed to the section component
}
```

## Section Types

### `text`

Render markdown paragraphs with optional scroll animation.

```json
{
  "type": "text",
  "props": {
    "title": "Section Title",
    "heading": "Optional Subtitle",
    "paragraphs": ["# Heading\nParagraph text with **markdown**.", "Another paragraph."],
    "animate": true
  }
}
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | No | Section title |
| `heading` | `string` | No | Optional subtitle |
| `paragraphs` | `string[]` | Yes | Markdown-formatted paragraphs |
| `animate` | `boolean` | No | Enable scroll reveal animation (default: `false`) |

---

### `bullets`

Render a list of bullet items with optional nested children. Supports ordered and unordered lists.

```json
{
  "type": "bullets",
  "props": {
    "title": "Key Concepts",
    "ordered": false,
    "items": [
      { "text": "First point" },
      { "text": "Second point", "children": [{ "text": "Sub-point A" }, { "text": "Sub-point B" }] }
    ],
    "animate": true
  }
}
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | No | Section title |
| `ordered` | `boolean` | No | Use numbered list (default: `false`) |
| `items` | `BulletItem[]` | Yes | List items |
| `animate` | `boolean` | No | Enable animations (default: `false`) |

`BulletItem`:

| Field | Type | Required | Description |
|---|---|---|---|
| `text` | `string` | Yes | Item text |
| `children` | `BulletItem[]` | No | Nested sub-items |

---

### `flowchart`

Complex interactive flowchart with multiple views: Event Storming, System Architecture, Data Flow, Swimlanes, Sequence, State Machine.

```json
{
  "type": "flowchart",
  "props": {
    "title": "Order Processing Flow",
    "schema": {
      "actors": {
        "customer": { "title": "Customer", "desc": "End user placing orders" }
      },
      "systems": {
        "order-service": { "title": "Order Service", "desc": "Handles order lifecycle", "type": "aggregate" },
        "payment-gateway": { "title": "Payment Gateway", "desc": "External payment processor", "type": "external" }
      },
      "steps": [
        {
          "type": "linear",
          "id": "step-1",
          "initiatedBy": "customer",
          "policy": "Validate order details",
          "command": "CreateOrder",
          "handledBy": "order-service",
          "resultEvents": [{ "id": "order-created", "title": "Order Created", "desc": "Order successfully created" }]
        }
      ],
      "journeys": [
        {
          "id": "order-journey",
          "label": "Order Journey",
          "description": "Full order lifecycle",
          "steps": [{ "stepId": "step-1", "name": "Create Order", "description": "Customer creates an order" }]
        }
      ]
    }
  }
}
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | No | Section title |
| `schema` | `FlowchartSchema` | Yes | Flowchart data structure |

`FlowchartSchema`:

| Field | Type | Required | Description |
|---|---|---|---|
| `actors` | `Record<string, ActorDecl>` | Yes | Actor definitions keyed by ID |
| `systems` | `Record<string, SystemDecl>` | Yes | System definitions keyed by ID |
| `steps` | `FlowStep[]` | Yes | Linear or branch steps |
| `journeys` | `FlowJourney[]` | Yes | Named journeys grouping steps |

`ActorDecl`: `{ title: string, desc: string }`

`SystemDecl`: `{ title: string, desc: string, type: "aggregate" \| "external", stateMachine?: { states: string[], transitions: [{ from: string, to: string, event: string }] } }`

`FlowStep` (linear):
```json
{
  "type": "linear",
  "id": "step-id",
  "initiatedBy": "actor-id",
  "policy": "Business rule",
  "command": "CommandName",
  "handledBy": "system-id",
  "delegatesTo": "other-system-id",
  "resultEvents": [{ "id": "event-id", "title": "Event Title", "desc": "Description" }],
  "continuesAs": "next-step-id"
}
```

`FlowStep` (branch):
```json
{
  "type": "branch",
  "id": "branch-id",
  "event": "Branching Event",
  "branches": [
    {
      "id": "branch-a",
      "label": "Path A",
      "dashed": false,
      "policy": "Rule for A",
      "command": "CommandA",
      "handledBy": "system-a",
      "resultEvents": [],
      "continuesAs": "next-step-id"
    }
  ]
}
```

`FlowJourney`: `{ id: string, label: string, description: string, steps: [{ stepId: string, name: string, description: string, processGroup?: "planning" | "execution" | "evaluation" | "escalation" }] }`

---

### `tradeoff-sandbox`

Interactive trade-off exploration with sliders, choices, and metric visualization.

```json
{
  "type": "tradeoff-sandbox",
  "props": {
    "title": "Architecture Tradeoffs",
    "scenarios": [
      {
        "id": "scenario-1",
        "title": "Monolith vs Microservices",
        "description": "Compare architectural approaches",
        "metrics": [
          { "id": "complexity", "label": "Complexity", "baseValue": 5, "min": 1, "max": 10, "direction": "lower" },
          { "id": "scalability", "label": "Scalability", "baseValue": 5, "min": 1, "max": 10, "direction": "higher" }
        ],
        "steps": [
          {
            "id": "step-1",
            "title": "Deployment Strategy",
            "description": "Choose how to deploy",
            "recommended": "choice-a",
            "choices": [
              {
                "id": "choice-a",
                "label": "Monolith",
                "description": "Single deployable unit",
                "metrics": { "complexity": 3, "scalability": 4 },
                "pros": [{ "title": "Simpler", "description": "Easier to develop and test" }],
                "cons": [{ "title": "Harder to scale", "description": "Must scale entire app" }],
                "whyThisFits": "Good for small teams",
                "whenToUse": "When team is under 10 developers"
              },
              {
                "id": "choice-b",
                "label": "Microservices",
                "description": "Independently deployable services",
                "metrics": { "complexity": 8, "scalability": 9 },
                "pros": [{ "title": "Scalable", "description": "Scale individual services" }],
                "cons": [{ "title": "Complex", "description": "Distributed system challenges" }],
                "whyThisFits": "Good for large teams",
                "whenToUse": "When team exceeds 10 developers"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | No | Section title |
| `scenarios` | `TradeoffScenario[]` | Yes | Trade-off scenarios |

`TradeoffScenario`:
| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique identifier |
| `title` | `string` | Yes | Scenario title |
| `description` | `string` | Yes | Scenario description |
| `metrics` | `MetricDef[]` | Yes | Metrics to track |
| `steps` | `TradeoffStep[]` | Yes | Decision steps |

`MetricDef`: `{ id: string, label: string, baseValue: number, min?: number, max?: number, direction?: "higher" \| "lower" }`

`TradeoffStep`: `{ id: string, title: string, description: string, recommended?: string, choices: TradeoffChoice[] }`

`TradeoffChoice`: `{ id: string, label: string, description: string, metrics: Record<string, number>, pros: [{ title: string, description: string }], cons: [{ title: string, description: string }], whyThisFits?: string, whenToUse?: string }`

---

### `taxonomy-browser`

Browse categories with icons, expandable details, and scope definitions.

```json
{
  "type": "taxonomy-browser",
  "props": {
    "title": "Domain Concepts",
    "categories": [
      {
        "icon": "BookOpen",
        "title": "Concept A",
        "subtitle": "Core concept",
        "description": "Brief description",
        "details": "Expanded details with more information.",
        "analogy": "Like a library for data",
        "primaryFocus": "What this focuses on",
        "inScope": ["Related area 1", "Related area 2"],
        "outOfScope": ["Unrelated area"],
        "color": "#89b4fa"
      }
    ]
  }
}
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | No | Section title |
| `categories` | `TaxonomyCategory[]` | Yes | Category definitions |

`TaxonomyCategory`:
| Field | Type | Required | Description |
|---|---|---|---|
| `icon` | `string` | Yes | Lucide React icon name (e.g., `"BookOpen"`, `"Zap"`, `"Shield"`) |
| `title` | `string` | Yes | Category title |
| `subtitle` | `string` | No | Short subtitle |
| `description` | `string` | Yes | Brief description shown in card |
| `details` | `string` | No | Expanded details (shown on click) |
| `analogy` | `string` | No | Analogy for understanding |
| `primaryFocus` | `string` | No | What the category focuses on |
| `inScope` | `string[]` | No | Items in scope |
| `outOfScope` | `string[]` | No | Items out of scope |
| `color` | `string` | No | Hex color for accent |

**Icon names**: Use any [Lucide React](https://lucide.dev/icons/) icon name (PascalCase), e.g., `BookOpen`, `Zap`, `Shield`, `Code`, `Globe`, `Settings`, `Layers`, `Target`.

---

### `flashcards`

Interactive flashcard glossary with term definitions.

```json
{
  "type": "flashcards",
  "props": {
    "title": "Glossary",
    "terms": [
      {
        "id": "term-1",
        "word": "Aggregate",
        "pronunciation": "/ˈæɡrɪɡeɪt/",
        "category": "Domain",
        "shortDefinition": "A cluster of entities treated as a single unit",
        "detailedDefinition": "In DDD, an aggregate is a boundary that defines a consistency scope...",
        "whyItMatters": "Understanding aggregates prevents consistency violations",
        "image": "/images/aggregate-diagram.png"
      }
    ]
  }
}
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | No | Section title |
| `terms` | `WordTerm[]` | Yes | Glossary terms |

`WordTerm`:
| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique identifier |
| `word` | `string` | Yes | Term/word |
| `pronunciation` | `string` | No | IPA pronunciation |
| `category` | `string` | No | Category label |
| `image` | `string` | No | Image URL |
| `shortDefinition` | `string` | Yes | Brief definition (front of card) |
| `detailedDefinition` | `string` | No | Full definition (back of card) |
| `whyItMatters` | `string` | No | Why this term matters |
| `dialogue` | `{ user: string, aiThoughts: string, aiQuestion: string }` | No | Interactive dialogue |

---

### `quiz`

Multiple-choice quiz with scoring and explanations.

```json
{
  "type": "quiz",
  "props": {
    "title": "Knowledge Check",
    "questions": [
      {
        "id": "q1",
        "question": "What is an Aggregate in DDD?",
        "choices": [
          { "id": "a", "text": "A collection of unrelated entities", "correct": false, "explanation": "Aggregates group related entities." },
          { "id": "b", "text": "A consistency boundary around related entities", "correct": true, "explanation": "Correct! Aggregates enforce consistency within their boundary." },
          { "id": "c", "text": "A database table", "correct": false, "explanation": "An aggregate is a domain concept, not a persistence detail." }
        ],
        "hint": "Think about consistency boundaries."
      }
    ]
  }
}
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | No | Section title |
| `questions` | `QuizQuestion[]` | Yes | Quiz questions |

`QuizQuestion`:
| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique identifier |
| `question` | `string` | Yes | Question text |
| `choices` | `QuizChoice[]` | Yes | Answer choices |
| `hint` | `string` | No | Hint text |

`QuizChoice`: `{ id: string, text: string, correct: boolean, explanation: string }`

---

### `concept-map`

Interactive node-edge visualization of concept relationships.

```json
{
  "type": "concept-map",
  "props": {
    "title": "Concept Map",
    "nodes": {
      "ddd": { "id": "ddd", "title": "Domain-Driven Design", "category": "methodology" },
      "aggregate": { "id": "aggregate", "title": "Aggregate", "category": "pattern" },
      "entity": { "id": "entity", "title": "Entity", "category": "building-block" }
    },
    "edges": [
      { "from": "ddd", "to": "aggregate", "label": "defines" },
      { "from": "aggregate", "to": "entity", "label": "contains" }
    ]
  }
}
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | No | Section title |
| `nodes` | `Record<string, ConceptNode>` | Yes | Nodes keyed by ID |
| `edges` | `ConceptEdge[]` | Yes | Edges connecting nodes |

`ConceptNode`: `{ id: string, title: string, category: string }`

`ConceptEdge`: `{ from: string, to: string, label?: string }`

---

### `scenario`

Branching narrative scenario with choices and outcomes.

```json
{
  "type": "scenario",
  "props": {
    "id": "sc-1",
    "title": "Deployment Scenario",
    "intro": "You're deploying a new feature. What approach do you take?",
    "startNode": "start",
    "nodes": {
      "start": {
        "id": "start",
        "prompt": "Your team needs to deploy a hotfix. The system is under heavy load.",
        "choices": [
          { "id": "c1", "text": "Deploy immediately during peak hours", "next": "risky-deploy" },
          { "id": "c2", "text": "Wait for maintenance window", "next": "safe-deploy" }
        ]
      },
      "risky-deploy": {
        "id": "risky-deploy",
        "outcome": {
          "verdict": "Risky move",
          "lesson": "Deploying during peak can cause cascading failures.",
          "rating": "c"
        }
      },
      "safe-deploy": {
        "id": "safe-deploy",
        "outcome": {
          "verdict": "Safe choice",
          "lesson": "Using maintenance windows reduces deployment risk.",
          "rating": "a"
        }
      }
    }
  }
}
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Scenario ID |
| `title` | `string` | Yes | Scenario title |
| `intro` | `string` | Yes | Introduction text |
| `startNode` | `string` | Yes | ID of starting node |
| `nodes` | `Record<string, ScenarioNode>` | Yes | Nodes keyed by ID |

`ScenarioNode`:
| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Node ID |
| `prompt` | `string` | No | Prompt text (for choice nodes) |
| `choices` | `ScenarioChoice[]` | No | Choices (mutually exclusive with `outcome`) |
| `outcome` | `ScenarioOutcome` | No | Outcome (mutually exclusive with `choices`) |

`ScenarioChoice`: `{ id: string, text: string, next: string }` — `next` is the ID of the next node.

`ScenarioOutcome`: `{ verdict: string, lesson: string, rating: "a" \| "b-plus" \| "b-minus" \| "c" }`

---

### `decision-tree`

Structured decision guide with recommended paths.

```json
{
  "type": "decision-tree",
  "props": {
    "id": "dt-1",
    "title": "Database Selection",
    "root": "root",
    "nodes": {
      "root": {
        "id": "root",
        "prompt": "What type of data will you store?",
        "choices": [
          { "id": "c1", "text": "Structured data with relationships", "next": "relational", "recommended": true, "rationale": "Best for data integrity" },
          { "id": "c2", "text": "Flexible, evolving schema", "next": "nosql", "rationale": "Good for rapid iteration" }
        ]
      },
      "relational": {
        "id": "relational",
        "leaf": {
          "recommendation": "Use PostgreSQL",
          "explanation": "PostgreSQL offers ACID compliance and strong relationships.",
          "tradeoffs": ["Slower writes at scale", "Schema migrations required"]
        }
      },
      "nosql": {
        "id": "nosql",
        "leaf": {
          "recommendation": "Use MongoDB",
          "explanation": "MongoDB provides flexible schemas and horizontal scaling.",
          "tradeoffs": ["No native joins", " eventual consistency"]
        }
      }
    }
  }
}
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Decision tree ID |
| `title` | `string` | Yes | Title |
| `root` | `string` | Yes | Root node ID |
| `nodes` | `Record<string, DecisionTreeNode>` | Yes | Nodes keyed by ID |

`DecisionTreeNode`:
| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Node ID |
| `prompt` | `string` | No | Decision prompt |
| `choices` | `DecisionChoice[]` | No | Choices (mutually exclusive with `leaf`) |
| `leaf` | `DecisionLeaf` | No | Leaf outcome (mutually exclusive with `choices`) |

`DecisionChoice`: `{ id: string, text: string, next: string, rationale?: string, recommended?: boolean }`

`DecisionLeaf`: `{ recommendation: string, explanation: string, tradeoffs?: string[] }`

---

### `image-gallery`

Image gallery with captions and credits.

```json
{
  "type": "image-gallery",
  "props": {
    "title": "Visual Reference",
    "items": [
      { "id": "img-1", "url": "https://example.com/image1.png", "caption": "Architecture diagram", "credit": "Source: documentation" },
      { "id": "img-2", "url": "https://example.com/image2.png", "caption": "Data flow visualization" }
    ]
  }
}
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | No | Section title |
| `items` | `GalleryItem[]` | Yes | Gallery items |

`GalleryItem`: `{ id: string, url: string, caption: string, credit?: string }`

---

### `formula-sandbox`

Interactive formula calculator with variable sliders and computed metrics.

```json
{
  "type": "formula-sandbox",
  "props": {
    "variables": [
      { "id": "users", "label": "Active Users", "min": 100, "max": 100000, "step": 100, "defaultValue": 10000 },
      { "id": "requestsPerUser", "label": "Requests per User", "min": 1, "max": 1000, "step": 10, "defaultValue": 50 }
    ],
    "metrics": [
      {
        "id": "total-requests",
        "label": "Total Requests/sec",
        "formula": "users * requestsPerUser",
        "description": "Estimated total requests per second",
        "analogy": "Think of it as water flowing through pipes"
      },
      {
        "id": "servers-needed",
        "label": "Servers Needed",
        "formula": "Math.ceil((users * requestsPerUser) / 1000)",
        "description": "Number of servers to handle the load",
        "inScope": ["Web servers", "API servers"],
        "outOfScope": ["Database servers", "CDN nodes"]
      }
    ]
  }
}
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `variables` | `FormulaVariable[]` | Yes | Sliders for user input |
| `metrics` | `FormulaMetric[]` | Yes | Computed metrics |

`FormulaVariable`: `{ id: string, label: string, min: number, max: number, step: number, defaultValue: number }`

`FormulaMetric`:
| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Metric ID |
| `label` | `string` | Yes | Display label |
| `formula` | `string` | Yes | JS expression using variable IDs |
| `description` | `string` | Yes | Metric description |
| `analogy` | `string` | No | Analogy for understanding |
| `inScope` | `string[]` | No | Items included in calculation |
| `outOfScope` | `string[]` | No | Items excluded from calculation |

**Formula expressions**: Use JavaScript expressions. Variable IDs are available as variables. You can use `Math.ceil()`, `Math.floor()`, `Math.sqrt()`, arithmetic operators, etc.

---

### `reflection-sequence`

Drag-and-drop sequencing challenge where users order items.

```json
{
  "type": "reflection-sequence",
  "props": {
    "challenges": [
      {
        "prompt": "Order these steps in the request lifecycle:",
        "items": [
          { "id": "1", "text": "Request received", "icon": "inbox" },
          { "id": "2", "text": "Validation", "icon": "check" },
          { "id": "3", "text": "Processing", "icon": "cpu" },
          { "id": "4", "text": "Response sent", "icon": "send" }
        ],
        "solution": ["1", "2", "3", "4"]
      }
    ]
  }
}
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `challenges` | `ReflectionSequenceChallenge[]` | Yes | Sequencing challenges |

`ReflectionSequenceChallenge`:
| Field | Type | Required | Description |
|---|---|---|---|
| `prompt` | `string` | Yes | Challenge instruction |
| `items` | `{ id: string, text: string, icon?: string }[]` | Yes | Items to sequence |
| `solution` | `string[]` | Yes | Correct order of item IDs |

---

### `reflection-template`

Fill-in-the-blank challenge with draggable chips.

```json
{
  "type": "reflection-template",
  "props": {
    "challenges": [
      {
        "prompt": "Complete the CQRS pattern description:",
        "template": "In CQRS, the {command} side writes data and the {query} side reads data.",
        "chips": [
          { "id": "command", "text": "Command" },
          { "id": "query", "text": "Query" }
        ],
        "solution": { "command": "Command", "query": "Query" },
        "explanation": "CQRS separates write operations (Commands) from read operations (Queries)."
      }
    ]
  }
}
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `challenges` | `ReflectionTemplateChallenge[]` | Yes | Template challenges |

`ReflectionTemplateChallenge`:
| Field | Type | Required | Description |
|---|---|---|---|
| `prompt` | `string` | Yes | Challenge instruction |
| `template` | `string` | Yes | Template with `{placeholder}` slots |
| `chips` | `{ id: string, text: string }[]` | Yes | Draggable answer chips |
| `solution` | `Record<string, string>` | Yes | Mapping of placeholder → correct chip text |
| `explanation` | `string` | No | Explanation shown after completion |

---

## Theming

Pass a `theme` in `RenderOptions` to apply colour palette overrides to the render container without touching global CSS.

### Built-in presets

| Preset | Palette | Background | Typical use |
|---|---|---|---|
| `"frappe"` | Catppuccin Frappé | `#303446` (dark grey-blue) | Default — matches the Loom app |
| `"mocha"` | Catppuccin Mocha | `#1e1e2e` (darker) | Deep dark mode |
| `"macchiato"` | Catppuccin Macchiato | `#24273a` (blue-dark) | Mid dark mode |
| `"latte"` | Catppuccin Latte | `#eff1f5` (light) | Light mode |

```javascript
LoomSections.render(container, sections, { theme: "mocha" });
```

### Custom token map

Pass a partial `Record<string, string>` to override individual CSS custom properties:

```javascript
LoomSections.render(container, sections, {
  theme: {
    "--ctp-base": "#0d1117",
    "--ctp-mantle": "#090c10",
    "--ctp-blue": "#58a6ff",
    "--ctp-text": "#e6edf3",
  },
});
```

> [!NOTE]
> The injected `<style>` is scoped to the container element (`#container-id { … }`), so
> multiple independent `render()` calls on the same page each get their own isolated theme.
> The style tag is automatically removed when the cleanup function returned by `render()` is called.

---

## CSS Theme Variables

The library uses Catppuccin Frappé theme. Override these CSS custom properties:

```css
:root {
  /* Catppuccin Frappé palette */
  --ctp-rosewater: #f2dcd5;
  --ctp-flamingo: #f4b8e4;
  --ctp-pink: #f7b2ce;
  --ctp-mauve: #d7b2fe;
  --ctp-red: #e78284;
  --ctp-maroon: #ea999c;
  --ctp-peach: #ef9f76;
  --ctp-yellow: #e5c890;
  --ctp-green: #a6d189;
  --ctp-teal: #81c8be;
  --ctp-sky: #99d1db;
  --ctp-sapphire: #85c1dc;
  --ctp-blue: #8caaee;
  --ctp-lavender: #babbf1;
  --ctp-text: #c6d0f5;
  --ctp-subtext1: #b5bfe2;
  --ctp-subtext0: #a5adce;
  --ctp-overlay2: #949cbb;
  --ctp-overlay1: #838ba7;
  --ctp-overlay0: #737994;
  --ctp-surface2: #626880;
  --ctp-surface1: #51576d;
  --ctp-surface0: #414559;
  --ctp-base: #303446;
  --ctp-mantle: #292c3c;
  --ctp-crust: #232634;

  /* Semantic aliases */
  --font-body: system-ui, -apple-system, sans-serif;
}
```

## Embedded Data vs. External Local JSON

When building a static learning page using this library, you have two options for structuring your curriculum data:

1. **Option A: External JSON File (Recommended)** - Store the JSON database in a separate file (e.g. `curriculum.json`) in the same folder and load it dynamically using `fetch()`.
2. **Option B: Embedded Inline JS** - Declare the array of sections directly in a script tag inside the HTML file.

---

### Option A: External JSON File (Recommended)
This approach keeps your content and structural layouts strictly separate.

#### 1. Setup the Directory Structure
Create a folder for your project and place the HTML and JSON files side-by-side:
```
my-learning-project/
├── index.html
└── curriculum.json
```

#### 2. Create the JSON File (`curriculum.json`)
Create `curriculum.json` in the same directory and define the array of sections:
```json
[
  {
    "type": "text",
    "props": {
      "title": "Welcome",
      "paragraphs": ["# Hello World\nWelcome to interactive learning!"]
    }
  }
]
```

#### 3. Fetch and Render in HTML (`index.html`)
Use a modern ES module script block (`type="module"`) to fetch the JSON file locally relative to the page and render it using the library:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Loom App</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/loom-learning-sections@1.0.7/loom-sections.css">
  <style>
    #loom-root {
      max-width: 860px;
      margin: 0 auto;
      padding: 16px;
    }
  </style>
</head>
<body style="background-color: #232634; color: #c6d0f5;">
  <div id="theme-picker" style="max-width: 860px; margin: 16px auto; display: flex; justify-content: flex-end;"></div>
  <div id="loom-root"></div>

  <script src="https://cdn.jsdelivr.net/npm/loom-learning-sections@1.0.7/loom-sections.umd.js"></script>
  <script type="module">
    try {
      const response = await fetch('./curriculum.json');
      if (!response.ok) throw new Error('Failed to load JSON');
      const sections = await response.json();
      LoomSections.render(document.getElementById('loom-root'), sections, {
        title: "Stateful Agents",
        theme: "frappe"
      });
      LoomSections.renderThemeSelector(
        document.getElementById('theme-picker'),
        document.getElementById('loom-root'),
        { position: 'inline' }
      );
    } catch (err) {
      console.error('Error loading sections:', err);
    }
  </script>
</body>
</html>
```

> [!IMPORTANT]
> **Local Testing & CORS Restrictions**
> Modern browsers prevent `fetch()` requests when loading pages using the `file://` protocol (e.g. double-clicking the HTML file in explorer/finder).
> To test local JSON loading, you **must** serve the files using a local HTTP server.
> Run one of the following commands in your project folder:
> - Node.js: `npx serve .` or `npx http-server`
> - Python 3: `python3 -m http.server`
> - Python 2: `python -m SimpleHTTPServer`
> Then navigate to the URL shown (usually `http://localhost:3000` or `http://localhost:8000`).

---

### Option B: Embedded Inline JS
Useful for offline testing, single standalone HTML pages, or rapid prototyping without setting up a web server.

#### 1. Setup the Directory Structure
You only need a single HTML file:
```
my-learning-project/
└── index.html
```

#### 2. Declare and Render Inline
Embed the array directly inside your script tag:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Loom App (Embedded)</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/loom-learning-sections@1.0.7/loom-sections.css">
  <style>
    #loom-root {
      max-width: 860px;
      margin: 0 auto;
      padding: 16px;
    }
  </style>
</head>
<body style="background-color: #232634; color: #c6d0f5;">
  <div id="theme-picker" style="max-width: 860px; margin: 16px auto; display: flex; justify-content: flex-end;"></div>
  <div id="loom-root"></div>

  <script src="https://cdn.jsdelivr.net/npm/loom-learning-sections@1.0.7/loom-sections.umd.js"></script>
  <script>
    const okfSections = [
      {
        type: "text",
        props: {
          title: "Introduction",
          paragraphs: ["# Welcome\nThis is loaded from an inline script block."]
        }
      }
    ];

    LoomSections.render(document.getElementById('loom-root'), okfSections, {
      title: "Embedded Lesson",
      theme: "frappe"
    });
    LoomSections.renderThemeSelector(
      document.getElementById('theme-picker'),
      document.getElementById('loom-root'),
      { position: 'inline' }
    );
  </script>
</body>
</html>
```

### Direct Comparison

| Feature | Option A: External JSON File | Option B: Embedded Inline JS |
|---|---|---|
| **Separation of Concerns** | Excellent. Content (JSON) is completely decoupled from logic/styling (HTML). | Poor. Data array is mixed with HTML markup. |
| **CORS Restriction** | Yes. Requires local web server for local testing. | No. Works directly via double-clicking the HTML file (`file://`). |
| **Ease of Maintenance** | High. Non-developers can modify the curriculum content without touching HTML. | Medium. Need to modify script tags directly inside the HTML file. |
| **Caching** | Excellent. Browser caches the HTML structure and JSON files independently. | Low. Whole HTML must be reloaded and parsed for any minor content update. |


## Troubleshooting

| Problem | Solution |
|---|---|
| Blank page | Check browser console for errors. Verify CDN links are correct and accessible. |
| Sections not rendering | Verify `sections` array matches the schema. Check `type` string matches exactly (e.g., `"flowchart"` not `"Flowchart"`). |
| Missing styles | Ensure the CSS file is loaded: `<link rel="stylesheet" href="...loom-sections.css">` |
| Flowchart not showing | Verify `schema` has all required fields: `actors`, `systems`, `steps`, `journeys`. Each step must reference valid actor/system IDs. |
| Taxonomy icon missing | Use exact PascalCase Lucide icon name (e.g., `"BookOpen"` not `"book-open"` or `"bookopen"`). |
| CORS error on `file://` | Use a local HTTP server instead of opening HTML directly. `npx serve .` works well. |
| Bundle load fails | Check network tab. CDN may be blocked. Verify version tag matches published version. |
