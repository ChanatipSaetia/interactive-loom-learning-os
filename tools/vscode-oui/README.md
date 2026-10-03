# Loom OpenUI Lang — VS Code extension

Editor support for Interactive Loom content written in OpenUI Lang (`.oui`):

- **Syntax highlighting** (TextMate grammar `source.oui`, also usable with Shiki)
- **Autocomplete**: components accepted at the cursor's argument position, compatible
  references, declared IDs (`handledBy: "orders"`, scenario `next`, …), enum values,
  `$state`, `@builtins`, and section/topic names from disk inside `SectionRef("…")` /
  `TopicRef("…")`. Component completions insert a snippet with every required argument.
- **Signature help**: highlights which positional argument you are typing.
- **Hover**: component docs, and for any argument the parameter it fills
  (e.g. `Step › command: string`).
- **Go to definition** for references and ID strings, plus an **outline** of statements.
- **Diagnostics** from the Loom 3-tier Validation Gateway (same checks as the app).

Every feature comes from the shared language service in
`src/core/supporting/authoring-editor/oui-language/`, which is generated from the Loom
OpenUI component library. Rebuild the extension after changing that library.

## Install

```bash
cd tools/vscode-oui
npm install
npm run package          # → loom-openui-lang-<version>.vsix
code --install-extension loom-openui-lang-*.vsix
```

The repository root must have its dependencies installed (`npm install` at the root),
because the bundle pulls in `zod`, `@openuidev/lang-core` and `js-yaml` from there.

## Develop

```bash
npm run build      # bundle src/extension.ts → dist/extension.js
npm run typecheck
npm test           # grammar tokenization + extension smoke tests
```
