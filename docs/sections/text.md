# Prose in a learning page

Use `TextContent` from the shared component catalog for Markdown prose.
`Text` is a short line or metric. `LessonText` is retired. There is no authored
text section type; see [page contracts](page.md).

```oui
root = Page("What a cache keeps", Stack([opening, qualification]))
opening = TextContent("A cache keeps a reusable copy near its consumer.")
qualification = TextContent("Freshness rules determine when that copy can be reused.")
```

Read displays ordinary Markdown blocks. Present derives `p1`, `p2`, … from a
prose-only body, with `pN.partK` continuations for long blocks. Named statement
targets such as `opening.text` support narration effects. A mixed page uses
ordinary layout beats and the scenes of its prebuilt activities. Use prose when
connected explanation serves the goal; inspect Table, Steps, diagrams and other
candidates when they preserve the knowledge structure more clearly.

Convert existing source explicitly with `npm run oui:migrate -- --write <path>`.
See the page contract for metadata and narration migration.
