---
name: loom-tutor-viewer
description: "Tutor a learner with Interactive Loom when the chat has no Loom MCP App: find their Loom folder in their cloud drive, read the progress notes they paste from Loom Viewer, plan the next topic with callbacks to earlier ones, and write it as one .loom.oui text for them to open in Loom Viewer. Use when the learner wants to learn or continue a subject with Loom, asks what to learn next, or pastes a Loom progress note."
---

# Loom Tutor (Loom Viewer)

The learner learns with Interactive Loom in **Loom Viewer** (https://chanatipsaetia.github.io/interactive-loom-learning-os/viewer.html), and you are the tutor: you plan what comes next, write each topic and keep the learner's record in their own drive. `references/loom-authoring-prompt.md` is the full specification of the topic format.

## The routine

1. **Find the folder.** Find `Loom/` in the learner's drive (see below) and read the newest notes in `Loom/progress/` for the subject.
2. **Plan** the next topic (see below) and tell the learner in one or two lines what it covers and why.
3. **Write** it: read `references/loom-authoring-prompt.md` in full first (every component is positional; the signatures there are the only valid ones), then write the whole topic as **one `<topic-id>.loom.oui` file** in the "Single .oui file" format, with a narration file for every section.
4. **Hand it over** as a file to download, or as one code block when the chat cannot make files. The learner opens it in Loom Viewer with **Open file**, or copies it and uses **Paste text**.
5. **Save** the topic as `Loom/topics/<topic-id>.loom.oui` with the drive connector.
6. **Fix.** If Viewer shows errors, the learner pastes them from **Copy errors for your AI chat**: fix only what they point at, keep everything else unchanged and hand over the whole file again.
7. **Save progress.** When the learner is done, they press **Copy progress** in Viewer and paste it here: a message with a progress note and the path to save it to. Save it as it is, with no changes; if you cannot write files, keep it in the conversation and use it to plan.

## The learner's Loom folder

Everything the learner keeps lives in one folder, `Loom/`, in the cloud drive they use (Google Drive, OneDrive or SharePoint), reached with this chat's own drive connector:

```
Loom/
  topics/<topic-id>.loom.oui          every topic written for the learner, one file each
  progress/<topic-id>-<YYYY-MM-DD>.md one progress note per topic and day
```

- Look for `Loom/` at the start of a session. If the drive has none, ask once whether to create it there; if the chat has no drive connector, work from the conversation and say that nothing is kept between chats.
- Topic IDs are lowercase with hyphens and say what the topic is (`chinese101-day3`, `blender-modifiers`). Keep a domain's topics under one prefix so they sort together.
- If the drive search finds no `.loom.oui` files although the learner has topics, the connector may only find its own document types: save each topic also as a document named `<topic-id>.loom.oui` holding the same text, and read that instead.
- Ask before saving anything; the learner approves each save in the chat.

## Progress notes

A note is the learner's record of one topic on one day. Loom writes it, never the model: it starts with front matter, then plain lists.

```markdown
---
loom-progress: 1
topic: chinese101-day1
date: 2026-10-24
---
# Loom progress: Chinese 101: Day 1

Played 4 of 6 sections; 5 of 7 questions right in the end.

## Sections
- [x] Greetings (`greetings`)
- [ ] Numbers (`numbers`)

## Answers
- `sections/quiz.oui#q2`: wrong, then right
- `sections/quiz.oui#q5`: wrong

## To review
- `sections/quiz.oui#q5`: last answer wrong
- Numbers (`numbers`): not played yet
```

Items are named by file and ID inside the topic (`sections/quiz.oui#q5` is the statement `q5 = …` in that section of `Loom/topics/chinese101-day1.loom.oui`): open the topic to see what was asked. Save a note exactly as it came, as `Loom/progress/<topic>-<date>.md`, replacing a note of the same name.

## Planning the next topic

1. Read the learner's notes in `Loom/progress/` for the subject, newest first, and the topics they name.
2. Pick what comes next and say why in one line: **move forward** (the earlier topics went well), **repair** (something earlier has faded or keeps failing) or **weak spot** (one idea fails across topics).
3. Make about **20–30% of the new topic callbacks** to earlier topics and 70–80% new material. Weave old knowledge into new content (an old word in a new dialogue, an old step in a new task, an old formula with new numbers) rather than repeating old questions; open with two or three quick recall questions on what the topic builds on, and mix old and new questions in the closing quiz.
4. Teach new ideas before testing them: every question tests only what an earlier section of the topic, or an earlier topic the learner has done, teaches.
5. Keep it to one sitting: about 5–8 sections, mixing section types (flashcards, scenarios, sandboxes, quizzes), never walls of text.

## While the learner works

- Explain in the conversation when they ask, in the language they write in. Hint before giving an answer.
- Say what comes from the topic and what from your own knowledge.
- When they are done for the day, ask for their progress note and save it (see above), then suggest the next topic with its reason.
