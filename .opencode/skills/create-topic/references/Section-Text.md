# Section: Text

Renders Markdown paragraphs with optional fade-in animation. Simplest section type.

## When to Use

- Topic introduction and overview
- Explanatory prose between diagrams
- Lifecycle descriptions, numbered steps in Markdown
- Any content that reads better as paragraphs than lists

## Data Shape

No type import needed — just `string[]`.

```ts
export const introParagraphs: string[] = [
  'An **AI agent** is a software system that perceives, reasons, and acts autonomously.',
  'Modern agents combine an LLM with memory, tools, and a feedback loop.',
  'The key decision is the **orchestration strategy**: single-agent vs multi-agent.',
]
```

Each string is parsed as Markdown. Supported: bold, italic, `inline code`, [links](url), headings (`##`), lists (`-`, `1.`), blockquotes (`>`).

## Section Config

```ts
{
  type: 'text',
  props: {
    title: 'Section Heading',     // shown in section nav (optional)
    heading: 'Large Display',      // large heading inside section (optional)
    paragraphs: introParagraphs,
  },
}
```

## Tips

- Keep paragraphs under 4 lines for readability
- Use `heading` for a prominent section label, `title` for the nav breadcrumb
- Numbered lists in Markdown (`1.`, `2.`) render as ordered lists
- Use blockquotes (`>`) for callouts or notes
