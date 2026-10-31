# Validate and deliver

- Every SectionRef has one matching section file, and every section file is listed once. Every file has one root, written first; all other statements are reachable from it.
- Use exact positional signatures, with null to skip an optional argument before a later one. Check unique IDs, references and each selected section's semantic rules.
- Teach the facts before assessing them. Mix section types only where they help the learning goal; use specific, grounded content and meaningful visuals.
- Every section has a matching narration file, not listed in topic.oui. Cover every actual beat using the IDs in its section reference; use resolvable targets and explanatory captions in the topic's language. Update narration whenever items or section names change.
- **Inside the Interactive Loom repository**: run `npx vitest run tests/unit/content` and fix every failure.
- **Elsewhere**: open the topic in Loom Viewer (https://chanatipsaetia.github.io/interactive-loom-learning-os/viewer.html) or Loom Studio (https://chanatipsaetia.github.io/interactive-loom-learning-os/studio.html). If you cannot open it, tell the user how. Its **Copy errors for your AI chat** button gives a fix request; fix the reported errors and refresh.
- Inspect Read and Present when a browser is available: check text size, hierarchy, overflow, each narration beat and its focus targets. Distinguish checks you ran from checks the user still needs to run.

Finish with one or two lines: the topic folder or file you wrote and how to open it (Viewer's **Open folder** / Open file, or `npm run dev` in the repository).
