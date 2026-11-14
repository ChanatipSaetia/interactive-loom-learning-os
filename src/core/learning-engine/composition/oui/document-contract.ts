/** Root assignments are source syntax, distinct from component signatures. */
export const DOCUMENT_ROOT_RULES: Record<string, string> = {
  Topic: 'Manifest rules: topic.oui must contain exactly one root = Topic(...) statement. Topic lists SectionRef names in learning order; it is not a Page. A bare Topic(...) call is invalid source.',
  Page: 'Page source rules: sections/<name>.oui must contain exactly one root = Page(...) statement. Its body composes the selected components; a bare Page(...) call is invalid source.',
  Narration: 'Narration rules: sections/<name>.narrate.oui must contain exactly one root = Narration(...) statement. Its steps target documented beats in the matching page; it is not a Page. A bare Narration(...) call is invalid source.',
}

export const MINIMAL_TOPIC_EXAMPLE = `// @loom-topic greeting
// === topic.oui ===
root = Topic("A greeting", "Language", "Read one greeting.", [SectionRef("hello")])
// === sections/hello.oui ===
root = Page("Hello", TextContent("Hello is a greeting."))
// === sections/hello.narrate.oui ===
root = Narration([NarrationStep("p1", "Read the greeting.")])`

export const DOCUMENT_SYNTAX_GUIDE = `# Source syntax and document roles

Read when: writing a new topic, or repairing a root/parse error. A signature such as Topic(title, category, ...) documents a component; it is not a complete source statement. Every virtual file in a bundle needs its own named root assignment. Do not rely on an implicit root.

${Object.values(DOCUMENT_ROOT_RULES).join('\n\n')}

Use named assignments for helper statements too. Keep exact positional arguments, use null only to skip optional arguments, and keep references in the correct virtual file. Do not wrap the file contents in Markdown fences when saving a .loom.oui artifact.

A complete, compilable bundle:

\`\`\`oui
${MINIMAL_TOPIC_EXAMPLE}
\`\`\`

Before delivery, check every virtual file for exactly one root assignment and the correct document role. Then compile the complete topic and narration where validation is available; finding root assignments alone does not establish validity. Hosted MCP leaves compilation to the player/browser; do not describe unchecked source as verified.`
