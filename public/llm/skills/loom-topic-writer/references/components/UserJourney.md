## Focused component contracts

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main learner action with complementary cards, images, text, charts and reference links where useful; these compose one page, not separate content modes. Proactively include visual examples for visual subjects and visible sources for researched claims. See contracts/media-composition.md (installed skills: references/planning/media-composition.md). Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Include useful learner-visible reference links for deeper reading, with descriptive labels and supplied or checked destinations; keep the core lesson self-contained. See contracts/learner-references.md (installed skills: references/core/learner-references.md). Before adding image sources, read contracts/images.md and runtime.md (installed skills: references/core/images.md); a reachable HTTPS URL may still be blocked by the MCP host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

UserJourney(title: string, person: string, goal: string, stages: JourneyStage[], heading?: string, lead?: Lead) — A person’s experience across product or service stages. Read explores stages; Present walks goals, actions, responses and optional friction and outcomes without an Event Storming diagram.
  - title: Section title, shown in the topic outline and as the section header.
  - person: Person or role experiencing the journey.
  - goal: Overall goal across the journey.
  - stages: Ordered JourneyStage references. Works for physical products, software and services.
  - heading: Optional sub-heading shown under the section title.
  - lead: Optional Lead(...) intro card: what the section shows, why it matters, what comes next.
JourneyStage(name: string, goal: string, action: string, response: string, friction?: string, recovery?: string, outcome?: string) — One stage of a person’s experience: their goal, action, product response, and optional friction, recovery and outcome.
  - name: Short stage name used in the journey rail.
  - goal: What the person wants to accomplish in this stage.
  - action: What the person actually does.
  - response: What the product, service or staff visibly does in response.
  - friction: Optional difficulty or unmet need; do not invent research findings.
  - recovery: Optional way to address the authored friction; requires friction.
  - outcome: Optional resulting state or next step; do not assume success.
Lead(what?: string, why?: string, next?: string) — Short lead-in shown above a section: what it shows, why it matters, and what comes next.
  - what: What this section shows, in one sentence.
  - why: Why it matters to the learner.
  - next: What the learner should do or look for next.

### UserJourney: teaching purpose

- Introduce: Explain a procedure or experience through a person’s goals, actions, responses and friction; it can introduce a subject through a concrete experience.
- Explore: Inspect stages and their context, identify friction and compare authored improvements; Present guides the journey.
- Evidence: Stage selection does not show that the learner can diagnose friction or explain an improvement.
- Limits: Keep the person’s experience distinct from internal system execution. Ground claims about users in evidence, or label the journey illustrative. Use Flowchart for system handoffs.

## User Journeys

Use UserJourney to describe a person's experience of physical products, software or services. Use Flowchart for underlying mechanisms or system interactions, and Scenario for branching choices. A journey is an ordered experience, not an Event Storming diagram.

- Write UserJourney(title, person, goal, stages) and JourneyStage(name, goal, action, response, friction?, recovery?, outcome?). Only the first four stage fields are required. Skip an optional field with null when setting a later one.
- Describe visible user actions and product or service responses. Friction and outcome are optional: do not manufacture problems, success, thoughts or emotions. Label proposed experiences as illustrative in the topic description or section Lead; distinguish them from research findings.
- Recovery requires friction. No custom HTML, layout, image generation, IDs or backend is needed.
- Read shows a selectable stage rail and all details of the chosen stage. Present opens with the overall goal and stage rail, then shows one moment per beat: goal, action, response, optional friction with recovery, optional outcome. Stages split into readable pages, grouping at most two moments with a target of 42 words. Moments on the current page reveal progressively; the next page replaces those details. Only the current moment gets focus and narration. The active stage appears once as the prominent heading, with a slider showing only the immediate previous and next stages. Read and Present support neighbor clicks, horizontal swipes and arrow keys on the slider. The stage title is not repeated inside the panel. Page boundaries do not change beat IDs. The overall goal and stage rail remain visible for orientation.
- Narration starts with title and overview, followed by stage1.goal, stage1.action, stage1.response, and stage1.friction / stage1.outcome only when authored. Repeat for each stage. Reordering stages changes their numbered beat IDs; update narration accordingly. Point effects at named stages or their fields, such as "visit.action" and "visit.recovery". A beat without authored narration reads its visible text.

Example (illustrative, not customer research):

```
root = Page("Choosing a motorcycle", UserJourney("Choosing a motorcycle", "Maya", "Find a motorcycle for a daily commute", [compare, visit]))
compare = JourneyStage("Compare options", "Find a suitable shortlist", "Maya compares riding position, parking needs and costs.", "The website explains practical differences between models.")
visit = JourneyStage("Visit the dealer", "Check the fit in person", "With the dealer supporting a stationary motorcycle, Maya checks the riding position.", "The dealer explains the controls and alternatives.", "The first model feels uncomfortable.", "Compare another suitable model before deciding.", "Maya leaves with a clearer shortlist, without being pressured to buy.")
```


## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.

### UserJourney presentation beats
`title`, then `overview`, then `stage1.goal`, `stage1.action`, `stage1.response`, optional `stage1.friction` (including recovery) and `stage1.outcome`; repeat for stage2, stage3, …
