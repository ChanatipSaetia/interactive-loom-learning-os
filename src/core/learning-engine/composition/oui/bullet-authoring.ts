/** Shared guidance for authoring bots, the writer skill and its published references. */
import { BULLET_ICON_NAMES } from '../../sub-contexts/progressive-content/schema'

export const BULLET_AUTHORING_EXAMPLE = `root = Bullets("A productive first day", [access, goal])
access = Bullet("Prepare **access** before day one", [accounts, permissions], "key")
accounts = Bullet("Check **accounts** before Monday", null, "clock")
permissions = Bullet("Verify repository **permissions**", null, "shield")
goal = Bullet("Agree on the **first goal**", [task], "target")
task = Bullet("Pair with a **teammate** for the first task", null, "users")
`

export const BULLET_NARRATION_EXAMPLE = `root = Narration([
  NarrationStep("title", "A little preparation makes the first day productive."),
  NarrationStep("item1", "Start by removing access blockers before the newcomer arrives."),
  NarrationStep("item1.child1", "Testing an account early leaves time to fix sign-in problems.", [Highlight("accounts")]),
  NarrationStep("item1.child2", "Signing in is only half the check: the account must also be allowed to open the project."),
  NarrationStep("item2", "Once access works, give the newcomer one clear outcome to aim for."),
  NarrationStep("item2.child1", "Working with a teammate connects that goal to a real task and gives questions somewhere to go.")
])
`

export const BULLET_AUTHORING_GUIDE = `## Bullet Composition

- Use Bullets for a checklist or a real hierarchy of points. Keep each parent a short headline and put its supporting details in child Bullet calls. Do not invent nesting just to change the layout. For an explanation that needs a diagram, comparison, chart or mixed content, choose a suitable standard OpenUI composition instead of a wall of prose.
- Choose a meaningful icon for each parent or sub-item when it helps recognition. Icons are independent: a child does not inherit its parent's icon. Reuse the same icon for the same meaning across a topic, rather than assigning a different decorative icon to every row.
- The only supported icon names are ${BULLET_ICON_NAMES.map((name) => `\`${name}\``).join(', ')}. Think access → key, timing → clock, safety → shield, people → users, goal → target, data/trend → chart, implementation → code, insight → lightbulb, verification → check, grouping → list. These names stay in English even in translated lessons. Do not invent icon names, use emoji as the icon argument, or assume every Lucide icon is supported.
- The signature is \`Bullet(text, children?, icon?)\`. To set a leaf's icon, skip children with \`null\`: \`Bullet("Prepare **access**", null, "key")\`. Icons are optional; existing content falls back to a checklist for parents and a branching arrow for sub-items. The same selection appears in Read and Present, and can be changed in Studio's Icon dropdown.
- Emphasize a few important words with \`**bold phrases**\` inside any parent or sub-item string. Leave the rest normal; do not bold whole paragraphs. Only inline bold is supported here: links, HTML and other Markdown are not a way to format a Bullet. Keep any extra explanation short enough to scan.
- Let Present measure and paginate the rendered content. Several points can share a page; narration reveals and highlights them in order, leaving earlier points visible. Do not create one section per bullet to force one point per page or script a fixed page count. Large groups continue with ancestor context; single-page lists omit their bottom agenda.
- Narration IDs describe points, not pages: \`title\`, then \`item1\`, \`item1.child1\`, \`item1.child1.child1\`, \`item1.child2\`, … in depth-first order, then \`item2\`, …. Write a step for every point even when they share a page. Explain the point's reason or an example instead of reading its headline verbatim; update narration when the hierarchy changes.

Example section (\`sections/first-day.oui\`):

\`\`\`
${BULLET_AUTHORING_EXAMPLE}\`\`\`

Matching narration (\`sections/first-day.narrate.oui\`):

\`\`\`
${BULLET_NARRATION_EXAMPLE}\`\`\``
