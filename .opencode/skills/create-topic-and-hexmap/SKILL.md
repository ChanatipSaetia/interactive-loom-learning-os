---
name: create-topic-and-hexmap
description: Create or extend an Open Knowledge Format (OKF) learning topic and its tabletop RPG Hex Campaign Map through the brief-driven authoring flow (brief.yaml → okf:new → okf:validate). Use when the user wants to create a new learning topic, add sections or tracks to a topic, build a hex map, author curriculum sections, or design interactive educational campaigns.
---

# Creating Topics & Hex Campaign Maps

Humans and AI agents use **one** authoring flow. The canonical flow, the brief format and the grounding rules live in
[docs/creating-topics.md § Quick start](../../../docs/creating-topics.md#quick-start-the-topic-authoring-flow).
Read that section first and follow it exactly. This skill only adds agent-specific instructions.

## The flow (summary — the doc is authoritative)

1. **Brief**: write `public/okf/<topic-id>/brief.yaml`, or start from `npm run okf:new -- <topic-id> --category <Category> --sections <types>` and redesign it.
2. **Check**: `npm run okf:validate -- --topic=<topic-id> --brief`.
3. **Review (mandatory stop for agents)**: show the user the brief (tracks, sections, key items, boss, teach points) and **wait for approval** before scaffolding or writing content.
4. **Scaffold**: `npm run okf:new -- --from public/okf/<topic-id>/brief.yaml`.
5. **Fill**: replace every stub, add `groundedIn` to every quiz question and reflection-sequence challenge, and rewrite the hex map story.
6. **Gate**: `npm run okf:validate -- --topic=<topic-id>` passes, and you have confirmed every `groundedIn` against the section text.

To extend a topic later, edit the brief and go back to step 2. Never create section folders by hand. `okf:new --from` only adds what is missing.

## Agent-specific rules

- **Designing the brief**
  - Decompose the domain into 2–4 tracks.
  - Give each section the interactive type that fits the knowledge; plain `text` walls are not allowed (see `AGENTS.md` and [docs/sections-reference.md](../../../docs/sections-reference.md)).
  - Mark 2–4 mandatory milestones `keyItem: true`.
  - Make the boss the domain's central failure mode.
- **Write `teaches` before assessments.** Every fact a quiz or reflection-sequence will test must be a `teaches` point of an earlier section in the same track. Then the section content must actually teach it.
- **Do not trust the validator for grounding.** It only checks that `groundedIn` ids resolve. Before reporting done, re-read each assessed section's text and confirm it states the point. List any item you could not confirm.
- **Hex map**
  - Edit only names, lore, monsters and descriptions in the generated map.
  - Keep the `sectionRef` bindings, the key-item rewards and the boss `requiredItems` intact.
  - Rules: [docs/creating-hexmaps.md](../../../docs/creating-hexmaps.md).
- **Flowcharts** follow [docs/event-storming-conventions.md](../../../docs/event-storming-conventions.md).
- **Smoke check (optional, not part of the gate)**: open the topic in the running dev server with the Playwright MCP tools and click through its sections.
- **Report back** with:
  - the files written
  - the `okf:validate` result
  - the grounding confirmation
