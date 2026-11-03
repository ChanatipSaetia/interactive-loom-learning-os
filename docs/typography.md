# Learning typography

Learning sections and controls use the shared `--font-ui` family: Noto Serif Thai,
Inter, then system serif fallbacks. Code and notation remain monospace.

The shared weight tokens in `src/styles/variables.css` are:

| Token | Value | Role |
| --- | --- | --- |
| `--weight-body` | 400 | Body text, instructions, options, node names, metrics, captions, counters |
| `--weight-label` | 500 | Card/detail titles, layer names, active tabs, primary actions, dialog titles |
| `--weight-heading` | 600 | Page/section headings, authored bold text, deliberate conclusions |

Read and Present use the same weights. Present changes sizes and layout,
and uses the focus treatment to direct attention rather than heavier body text.

`src/styles/typography.css` owns the cascade for learning content, its controls,
and portaled dialogs. It deliberately overrides legacy component weight utilities,
font shorthands and inline SVG weights. Descendants inherit the role's weight so
heading text stays consistent through nested spans. Exceptions for exercise text
take precedence over its HTML heading tag (for example, quiz questions remain 400).

When adding a section, use semantic headings for UI titles and ordinary text for
exercise content. Register any additional weight exception in the shared stylesheet
instead of introducing another local weight or an `!important` utility.
