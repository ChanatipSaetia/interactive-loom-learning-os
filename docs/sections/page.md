# Authored pages

A topic is an ordered sequence of sections. **One section is one authored page**:

```oui
root = Page("Compare approaches", comparison, "Match the same attributes.")
comparison = Table([
  Col("Approach", ["A", "B"]),
  Col("Benefit", ["Simple setup", "More control"]),
])
```

`Page(title, body, heading?)` owns page metadata. Its body uses one shared catalog:
public OpenUI components and Loom learning components. There is no authored
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
components. `LessonText` and `LearningGallery` preserve Loom-specific prose and
gallery behavior. The visual `Callout` is upstream; the narration effect is
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
renames colliding Loom calls and updates native-page root narration pointers.
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
  "components": ["Stack", "Table", "LessonText"],
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
