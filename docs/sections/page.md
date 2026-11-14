# Authored pages

A topic is an ordered sequence of sections. **One section is one authored page**:

```oui
root = Page("Compare approaches", comparison, "Match the same attributes.")
comparison = Table([
  Col("Approach", ["A", "B"]),
  Col("Benefit", ["Simple setup", "More control"]),
])
```

`Page(title, body, heading?, lead?)` owns page metadata. Its body uses one shared catalog:
text, layouts, controls, visuals and prebuilt activities. There is no authored
section type or `// @openui` library directive. Topic, Catalog and Narration remain
separate document roles.

Use one main visual or activity with supporting explanation. A slider and its
chart may together form one activity. Put a separate assessment on another page:

```oui
root = Page("Check understanding", Quiz("Check understanding", [question]))
question = QuizQuestion("q1", "Which approach gives more control?", [a, b])
a = QuizChoice("a", "A", false, "A emphasizes simple setup.")
b = QuizChoice("b", "B", true, "B trades simplicity for more control.")
```

The focus rule is guidance. Competing main activities produce an actionable review
warning; component count does not reject otherwise valid content. Syntax, schema
and reference failures remain errors.

## Names and contracts

Upstream names retain their public meanings. `Text` and `ImageGallery` are upstream
components. `TextContent` handles Markdown prose; `Text` handles short lines and metrics.
`LessonText` is removed. `LearningGallery` is a prebuilt captioned learning
activity; compare it with the `ImageGallery` preview grid by the desired behavior. The visual `Callout` is upstream; the narration effect is
`NarrationCallout(target, text)`. Loom's `Svg(markup, caption?)` remains an extension.

Retrieve exact contracts by component name. The parser, editor and authoring tools
share the same catalog; library selection is unnecessary. Internal learning data
and renderer dispatch remain domain-specific implementation details.

## Read and Present

One content contract may have different Read and Present renderers. Taxonomy
keeps interactive cards and detailed dialogs in Read; Present automatically shows
an overview and category focus scenes from the same category data.

Present stays hands-free. One page may have multiple internal scenes/beats and
authored narration. Playback controls allow pause, rewind and skip; activities
do not introduce learner-completion gates. Demonstrations start from authored
defaults, use separate state and never count as learner assessment attempts.
Returning to Read retains the learner's controls and answers until the topic is
replaced or refreshed. Arbitrary UI-state persistence across reloads is not added.

Page-local reactive variables and input bindings work without a model call.
Query/Mutation host tool connections are deferred.

## Migration and delivery

Old OUI sections must be converted explicitly:

```sh
npm run oui:migrate -- path/to/topic
npm run oui:migrate -- --write path/to/topic
```

The first command reports conversions; `--write` applies them. Keep a backup of
external exports. Conversion preserves named statements, wraps content in Page,
renames colliding calls and updates native-page root narration pointers. Retired
`LessonText` becomes a column `Stack` of `TextContent` blocks. Its heading and
Lead move to Page metadata; paragraph narration keeps `pN`/`pN.partK` beats.
Paragraph effect paths move from `paragraphs[N]` to `children[N].text`. Nested retired wrappers require an explicit composition and narration review;
unsupported cases produce a migration error rather than silently changing their beats.
The component discovery catalog is version 2 and exposes component names and
learning behavior, without an authored section-type discriminator.
Review diagnostics after conversion; old content is not a second runtime dialect.

Studio, Viewer, the main app and MCP use the unified pages. Full OpenUI rendering
in the lightweight single-file embed is deferred.

## AI planning contract

A page is a compositional learning unit, not a wrapper around a section type.
`TopicPlan.sections` retains section IDs and ordering, but every entry requires
`components`: the canonical names of the main activity and supporting components.
There are no `representation` or `library` fields in the plan. For example:

```json
{
  "id": "comparison",
  "title": "Compare approaches",
  "objectiveRefs": ["compare"],
  "components": ["Stack", "Table", "TextContent"],
  "activity": "Compare matching attributes and explain the tradeoff",
  "rationale": "The table aligns attributes; supporting prose explains qualifications.",
  "presentation": {
    "target": "both",
    "strategy": "Read keeps the comparison visible; Present focuses each attribute."
  }
}
```

Reviews inspect the composition. Supporting prose beside a table is not a
prose-only page. Flowchart view guidance and chart evidence guidance apply when
those components occur anywhere in the planned composition. Artifact alignment
checks that declared components are reachable from `root`; unused declarations
cannot satisfy a plan. These checks do not establish teaching quality.

Plans using the retired section-type fields must be rewritten with component
lists before validation. Internal renderer and domain types remain implementation
details and do not constrain a page to one component family.

## Progressive syntax and composition guidance

The entry point and eight authoring stages are unchanged. Read the relevant
capability summaries first, explain the choice and feasible alternatives in the
existing plan `rationale`, validate the plan, and retrieve only selected component
contracts. `capabilities/selection.md` compares learner tasks across the catalog;
it does not require a component mix, a sandbox, or extra TopicPlan fields. Label
conceptual models and illustrative data; a local reactive demonstration is not
execution or benchmarking of an external framework.

`contracts/syntax.md` is a focused reference linked from the reference-retrieval
and generation stages. Each virtual file needs exactly one named `root`
assignment: Topic for the manifest, Page for a section, and Narration for its
script. Bare top-level calls such as `Topic(...)` or `Page(...)` are not complete
source statements. The syntax reference includes a compilable complete bundle;
role-specific references must not teach Page as the root of a manifest or script.
Check roots and document roles, then run compiler/narration validation when
available. Root presence alone is not successful validation.

## Component discovery by purpose

The progressive entry and eight workflow stages stay unchanged. Capability
discovery groups peer candidates by learner task: explain, compare, follow a
process, explore relationships, interpret quantities, choose, inspect images or
practise. Table, TradeoffSandbox, Steps, Flowchart and TextContent each have a
focused capability leaf and exact contract. There is no standard-versus-Loom
branch and no preference for a prebuilt component. A prebuilt activity packages
reusable behavior and presentation scenes; select it only when those serve the
learning goal. Compare contextual decisions with factual lookup, meaningful
interaction with decoration, and measured data with illustrative models.

A prose-only TextContent body or column Stack of TextContent blocks receives
paragraph presentation scenes. Read uses the normal Markdown components, including
their size options. Mixed pages retain component-specific activity scenes and
ordinary layout beats. Page lead metadata belongs to the title beat; it does not
create an extra paragraph or shift existing narration.

## Teaching procedures, categories and individual concepts

For a procedure, choose from Steps, Bullets and Flowchart according to whether
the learner should execute instructions, check prerequisites or understand step
connections. A linear procedure can benefit from a Flowchart. Follow its existing
model contract and use supported participants and events; do not invent them to
activate a diagram. ReflectionSequence optionally assesses reconstructing an
already-taught order. These are peer choices, not a required lesson sequence.

TaxonomyBrowser can introduce a subject through meaningful kinds, examples and
distinctions. Explain overlaps; use parent-child relationships only when they
are meaningful. Its current contract is flat, so do not invent nested category
fields. Compare Table or grouped cards for a compact overview, ConceptMap for
relationships, and DecisionTree for identification rules. Category browsing does
not demonstrate classification skill.

Flashcards can teach concepts on first encounter and support later recall. Keep
one focused term or question and a coherent explanation per card, with a concise
example, dialogue or common mistake when helpful. Use the existing word and
definition fields. TextContent develops connected explanations; TaxonomyBrowser
organizes kinds. Read supports recall and reveal; Present demonstrates the card.
Flips record exposure, not correctness or mastery.

These rules are shared by planning and focused component references. Progressive
navigation still reads relevant capabilities before the selected contracts; no
new tool, mode, mandatory assessment or component quota is introduced.

## Teaching purposes across the catalog

Every component reference describes four things: what it can introduce, what
learners can explore, what their response can demonstrate, and the limits of the
representation. Read the relevant purpose and contract; do not retrieve every
component reference to plan a lesson. The six tools and eight workflow stages
remain unchanged. Installed writer skills use the same component-name contracts.

| Candidate | Teaching purpose and boundary |
|---|---|
| ConceptMap | Introduce concepts and explain labelled relationships; a displayed map is not an automatic matching assessment. |
| PillarLayer | Explain foundations and dependencies, using meaningful layers rather than decorative stacks. |
| UserJourney | Teach a person's goals, actions, responses and friction, including introductions through a concrete experience. |
| Timeline | Interpret measured start times, duration, overlap and waiting with verified or labelled illustrative values. |
| BreakdownTree | Explain quantities or conditional probabilities through a defensible measurable whole and branches. |
| FormulaSandbox | Predict and explore an authored formula's outputs; explain units, assumptions and valid ranges. |
| DecisionTree | Explain explicit diagnostic or selection criteria; reaching a recommendation does not prove diagnostic skill. |
| Scenario | Introduce and explain through situations, decisions, consequences and feedback; outcomes remain authored possibilities. |
| Quiz | Apply taught knowledge and learn from answer-specific feedback; correctness concerns the authored question. |
| ReflectionTemplate | Scaffold reasoning with supplied concepts; constrained completion is narrower than independent explanation. |
| Images, galleries and Svg | Teach recognition, examples and spatial mechanisms with legible, supported labels and evidence boundaries. |
| Charts and tables | Expose patterns and matched attributes; preserve comparability, units and data provenance. |
| Text and code | Develop explanations and concrete implementation examples; display alone does not execute or assess code. |
| Cards and layouts | Organize one learning activity; layout novelty and component counts do not demonstrate learning. |
| Controls | Connect meaningful inputs to authored feedback; clicks do not imply grading, external execution or saving. |

Document roots, narration effects and model/data helpers have explicit supporting
roles in their focused references. They inherit the owning activity's behavior;
their presence does not create a separate learning activity or evidence. Read
responses and Present demonstrations remain distinct, and no representation,
assessment, interaction count or lesson sequence is mandatory.
