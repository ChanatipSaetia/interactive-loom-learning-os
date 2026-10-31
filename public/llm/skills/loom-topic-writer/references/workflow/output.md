# Where to write

Always write a **topic folder**, one file per program, using the "Folder of .oui files" format from references/core/formats.md (not the single `.loom.oui` file it defaults to for chats):

```
<topic-id>/
  topic.oui            root = Topic(...) with one SectionRef per section, in reading order
  sections/
    intro.oui          root = Intro(...)
    <name>.oui         one section per file, no // === marker lines
    <name>.narrate.oui the narrator's script for that section in Present mode, one or more steps per beat (see references/core/narration.md)
```

- **Inside the Interactive Loom repository** (it has `public/content/` and `src/core/learning-engine/`): create the folder at `public/content/<topic-id>/`.
- **The user names a folder**: create `<topic-id>/` inside it, or write straight into it if it is already a topic folder (it has `topic.oui`).
- **Anywhere else**: create `<topic-id>/` in the current directory.
- **In a chat app without a project folder** (the Claude app, where files go to an outputs folder for the user to download): write one `<topic-id>.loom.oui` file there instead (the "Single .oui file" format in references/core/formats.md, saved as a file rather than a code block) and hand it to the user; Loom Viewer opens it with Open file or Paste text.
- **Editing an existing topic**: change only the files involved and keep `topic.oui`'s `SectionRef` list in step with the section files. Renaming a section means renaming its file and its `SectionRef`.
- Otherwise write a single `<topic-id>.loom.oui` file only when the user asks for one file; if they give you an existing `.loom.oui` file to change, edit that file.
