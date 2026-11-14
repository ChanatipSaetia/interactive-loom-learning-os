## Focused component contracts

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main visual/activity plus supporting text. Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Include useful learner-visible reference links for deeper reading, with descriptive labels and supplied or checked destinations; keep the core lesson self-contained. See contracts/learner-references.md (installed skills: references/core/learner-references.md). Before adding image sources, read contracts/images.md and runtime.md (installed skills: references/core/images.md); a reachable HTTPS URL may still be blocked by the MCP host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

Bullets(title: string, items: Bullet[], ordered?: boolean, heading?: string, lead?: Lead) — Linear instructions, prerequisites, checklists, key points and summaries; set `ordered` true for numbered procedures.
  - title: Section title, shown in the topic outline and as the section header.
  - items: The bullets, as Bullet references.
  - ordered: Optional: true numbers a linear procedure or ordered instructions; false keeps bullet points.
  - heading: Optional sub-heading shown under the section title.
  - lead: Optional Lead(...) intro card: what the section shows, why it matters, what comes next.
Bullet(text: string, children?: Bullet[], icon?: "list" | "check" | "shield" | "clock" | "key" | "lightbulb" | "target" | "users" | "chart" | "code") — A bullet point, optionally with nested child bullets.
  - text: Bullet text. Wrap any phrase in **double asterisks** to make it bold, in both top-level and nested bullets (Read and Present).
  - children: Optional nested bullets, as Bullet calls.
  - icon: Optional meaningful icon: list, check, shield, clock, key, lightbulb, target, users, chart, code. Present groups points into pages that fit the stage; sub-items remain visibly nested.
Lead(what?: string, why?: string, next?: string) — Short lead-in shown above a section: what it shows, why it matters, and what comes next.
  - what: What this section shows, in one sentence.
  - why: Why it matters to the learner.
  - next: What the learner should do or look for next.

### Bullets: teaching purpose

- Introduce: Teach procedures: executing instructions, understanding step connections or checking prerequisites.
- Explore: Choose Steps for explained instructions, Bullets for concise checklists and Flowchart for meaningful sequence, dependencies, branches or responsibilities.
- Evidence: Following a demonstration or clicking a checklist does not prove procedural skill. ReflectionSequence can check an already-taught order when appropriate.
- Limits: A linear procedure can justify a diagram; follow the actual selected contract and never invent participants or events to activate Flowchart. No particular mix of these components is required.

## Bullet Composition

- Use Bullets for a checklist or a real hierarchy of points. Keep each parent a short headline and put its supporting details in child Bullet calls. Do not invent nesting just to change the layout. For an explanation that needs a diagram, comparison, chart or mixed content, choose a suitable standard OpenUI composition instead of a wall of prose.
- Choose a meaningful icon for each parent or sub-item when it helps recognition. Icons are independent: a child does not inherit its parent's icon. Reuse the same icon for the same meaning across a topic, rather than assigning a different decorative icon to every row.
- The only supported icon names are `list`, `check`, `shield`, `clock`, `key`, `lightbulb`, `target`, `users`, `chart`, `code`. Think access → key, timing → clock, safety → shield, people → users, goal → target, data/trend → chart, implementation → code, insight → lightbulb, verification → check, grouping → list. These names stay in English even in translated lessons. Do not invent icon names, use emoji as the icon argument, or assume every Lucide icon is supported.
- The signature is `Bullet(text, children?, icon?)`. To set a leaf's icon, skip children with `null`: `Bullet("Prepare **access**", null, "key")`. Icons are optional; existing content falls back to a checklist for parents and a branching arrow for sub-items. The same selection appears in Read and Present, and can be changed in Studio's Icon dropdown.
- Emphasize a few important words with `**bold phrases**` inside any parent or sub-item string. Leave the rest normal; do not bold whole paragraphs. Only inline bold is supported here: links, HTML and other Markdown are not a way to format a Bullet. Keep any extra explanation short enough to scan.
- Let Present measure and paginate the rendered content. Several points can share a page; narration reveals and highlights them in order, leaving earlier points visible. Do not create one section per bullet to force one point per page or script a fixed page count. Large groups continue with ancestor context; single-page lists omit their bottom agenda.
- Narration IDs describe points, not pages: `title`, then `item1`, `item1.child1`, `item1.child1.child1`, `item1.child2`, … in depth-first order, then `item2`, …. Write a step for every point even when they share a page. Explain the point's reason or an example instead of reading its headline verbatim; update narration when the hierarchy changes.

Example section (`sections/first-day.oui`):

```
root = Page("A productive first day", Bullets("A productive first day", [access, goal]))
access = Bullet("Prepare **access** before day one", [accounts, permissions], "key")
accounts = Bullet("Check **accounts** before Monday", null, "clock")
permissions = Bullet("Verify repository **permissions**", null, "shield")
goal = Bullet("Agree on the **first goal**", [task], "target")
task = Bullet("Pair with a **teammate** for the first task", null, "users")
```

Matching narration (`sections/first-day.narrate.oui`):

```
root = Narration([
  NarrationStep("title", "A little preparation makes the first day productive."),
  NarrationStep("item1", "Start by removing access blockers before the newcomer arrives."),
  NarrationStep("item1.child1", "Testing an account early leaves time to fix sign-in problems.", [Highlight("accounts")]),
  NarrationStep("item1.child2", "Signing in is only half the check: the account must also be allowed to open the project."),
  NarrationStep("item2", "Once access works, give the newcomer one clear outcome to aim for."),
  NarrationStep("item2.child1", "Working with a teammate connects that goal to a real task and gives questions somewhere to go.")
])
```

For a procedure, ask whether the learner needs to execute instructions, understand their structure, or practise their order. Steps, Bullets and Flowchart are peer candidates: Steps guides instructions with explanations or code, Bullets supports concise checklists and prerequisites, and Flowchart explains sequence, dependencies, branches, responsibilities and consequences. A linear procedure can justify Flowchart when the connections help explain it; branching or multiple participants are not selection prerequisites. The existing Flowchart contract still applies: model only supported participants, events and relationships; never invent actors or events just to use it.

For creating a Svelte app, Steps can guide installation, project creation and running commands; Flowchart can explain the edit-to-browser-update process. ReflectionSequence can optionally assess reconstructing a taught order. These serve distinct learning needs, not a mandatory sequence or component mix. Present demonstrations and checklist clicks do not prove procedural skill.

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.

### Bullets presentation beats
`title`, then `item1`, `item2`, … one per top-level bullet; nested points get their own beats in depth-first order, progressively revealed on pages measured to fit (parents stay visible): `item1.child1`, `item1.child1.child1`, `item1.child2`, …
