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
