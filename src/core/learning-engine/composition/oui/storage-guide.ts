/**
 * Where Loom keeps a learner's topics and progress in their own drive: the
 * domain layout (`Loom/<domain-id>/`), its files and the rules a chat's model
 * follows to save and to plan. The Loom MCP servers return it from
 * `get_storage_guide`, and both learner skills (`tutor-skills.ts`) carry it,
 * so the paths are one contract for the app, Loom Viewer and the server on
 * the learner's computer. Dependency-free, so the hosted endpoint can serve
 * it cheaply.
 *
 * The signatures below are the Loom library's own (`library.ts`: Domain,
 * DomainRef, Library); a unit test keeps them in step.
 */

export const DOMAIN_SIGNATURE = 'Domain(title: string, description: string, topics: TopicRef[], goal?: string)'
export const LIBRARY_SIGNATURE = 'Library(domains: DomainRef[])'

export const STORAGE_GUIDE_DESCRIPTION = 'Where to save Loom topics and progress notes in the learner\'s drive, and how to plan the next topic from them: the Loom/<domain-id>/ layout, the files in it and the rules. Call it before saving a topic or a progress note, and before planning what the learner learns next. The paths are a contract that Loom reads: do not invent other folders.'

export function getStorageGuide(): string {
  return `# Where Loom keeps the learner's topics and progress

Learning is grouped by **domain**: one subject area the learner is working through, such as fight animation or home networking. Each domain has its own folder holding its topics and its own progress, so the next topic is planned from that domain's progress alone. These paths are a contract: Loom (its app in the chat, Loom Viewer, and the Loom server on the learner's computer) reads them. Use them exactly; never invent other folder names or layouts.

## Layout

At the top of the learner's drive (**My Drive** in Google Drive, not a shared drive; the root of OneDrive), reached with this chat's drive connector:

\`\`\`
Loom/
  index.oui                              the list of domains
  <domain-id>/
    domain.oui                           the domain: title, goal, topics in learning order
    topics/<topic-id>.loom.oui           one file per topic
    progress/<topic-id>-YYYY-MM-DD.md    one progress note per topic and day
\`\`\`

## IDs

- A **domain ID** is a lowercase slug, by the same rules as topic IDs: lowercase letters, digits, \`-\` and \`_\` (\`fight-animation\`, \`home-networking\`). It never changes; the name shown to the learner is the domain's \`title\` in \`domain.oui\`.
- A **topic ID** is the \`// @loom-topic\` line of the topic. Name the domain on the line after it, so Loom knows where the topic and its progress belong:

\`\`\`
// @loom-topic punch-basics
// @loom-domain fight-animation
// === topic.oui ===
root = Topic("Punch Basics", "Fight Animation", …)
\`\`\`

- Keep each topic's \`Topic\` category the same as its domain's title.

## The files

### \`Loom/index.oui\`

\`\`\`
${LIBRARY_SIGNATURE}
DomainRef(id: string)
\`\`\`

\`\`\`
root = Library([DomainRef("fight-animation"), DomainRef("home-networking")])
\`\`\`

The learner's domains, most recently studied first.

### \`Loom/<domain-id>/domain.oui\`

\`\`\`
${DOMAIN_SIGNATURE}
TopicRef(id: string)
\`\`\`

\`\`\`
root = Domain("Fight Animation", "Animating believable fights in Blender: poses, timing, impact.", [TopicRef("punch-basics"), TopicRef("blocking-a-hit")], "Animate a 10-second fight scene")
\`\`\`

\`topics\` lists the domain's topics in suggested learning order; each \`TopicRef("<topic-id>")\` names \`topics/<topic-id>.loom.oui\`. \`goal\` is what the learner wants to reach, in their words.

### \`Loom/<domain-id>/topics/<topic-id>.loom.oui\`

The whole topic as one \`.loom.oui\` text, exactly as shown to the learner, with its \`// @loom-domain\` line.

### \`Loom/<domain-id>/progress/<topic-id>-YYYY-MM-DD.md\`

Written by Loom, never by you: the app's **Save my progress** and Loom Viewer's **Copy progress** hand you the note and its path. Save it exactly as it came. Its front matter says what it is about:

\`\`\`
---
loom-progress: 1
domain: fight-animation
topic: punch-basics
date: 2026-10-24
---
\`\`\`

then plain lists: the sections played, every answer in order, and what to review. When several notes exist for one topic, the latest date wins.

## Saving

1. **Pick the domain.** Put a topic in an existing domain that fits (read \`Loom/index.oui\` and the domains' titles). If none fits, propose a new domain (its ID, title and the learner's goal) and confirm it with the learner before creating it.
2. **Create what is missing:** the \`Loom/\` folder, \`index.oui\`, the domain folder with its \`domain.oui\`, \`topics/\` and \`progress/\`. Add a new domain's \`DomainRef\` to \`index.oui\`, and a new topic's \`TopicRef\` to its \`domain.oui\` (where it fits in the learning order, usually at the end).
3. **Replace, never duplicate:** a topic with the same topic ID, or a progress note for the same topic and date, replaces the file that is there.
4. **Plain text:** save \`.oui\`, \`.loom.oui\` and \`.md\` files as plain text with exactly these names, with no conversion to Google Docs or Word.
5. Ask before saving; the learner approves each save in the chat. Offer each save rather than wait to be asked: a topic you have just shown, and a progress note as soon as one arrives.

## Planning what comes next in a domain

Read only that domain: its \`domain.oui\` and its \`progress/\` notes (the latest note per topic). Then, with a one-line reason:

- **move forward** to the next topic in \`domain.oui\`'s order that has no note, or whose note shows it unfinished;
- **revisit** sections played only partly, or answers whose latest try was wrong;
- or **extend the goal** with a new topic the domain does not have yet (add it to \`domain.oui\` when you save it).

Other domains' progress does not count, unless the learner asks to connect them.

## Finding files that were moved

Files can be moved by hand. When a path does not hold what you expect, search the drive by content: topics by their \`// @loom-topic\` line (and \`// @loom-domain\`), progress notes by \`loom-progress:\` in their front matter, keeping only those whose \`domain:\` is the domain you are working in. If the drive search finds no \`.loom.oui\` or \`.md\` files at all, the connector may only find its own document types: tell the learner, and keep a document copy of each file under the same name.

## Moving files

Move files only when the learner asks. When a move takes a file out of its domain folder (or into another domain), say so first: Loom plans each domain from its own folder, so a topic or note outside it no longer counts for that domain. Update \`domain.oui\` (and the topic's \`// @loom-domain\` line) to match a move the learner confirms.
`
}
