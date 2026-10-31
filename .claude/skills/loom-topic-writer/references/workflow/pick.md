# Pointers and comments from Loom Studio and Loom Viewer

People point at parts of a topic with **Pick** in Loom Studio or Loom Viewer and paste what it copies. Each pointer is one line:

```
kafka/sections/quiz-basics.oui:14 #q2.choices[1].explanation
```

- `kafka` is the topic ID and `sections/quiz-basics.oui` the file inside the topic folder. Find the folder that holds `kafka/topic.oui` (in the Interactive Loom repository: `public/content/kafka/`).
- `:14` is only a hint. The anchor after `#` is authoritative: `q2` is the statement `q2 = …`, and the rest follows its props by name and list positions (0-based) into inline components, using the prop names from the signatures in the reference. `#root` means the whole file. If the line does not hold the statement, search the file for `q2 =`.
- `(unsaved)` means the person has unsaved edits in Studio, so the file on disk may not have that statement yet; if it is missing, ask them to save.
- `(in kafka.loom.oui)` means the topic is in that single file: look for it in the workspace. `(from pasted text)` means there is no file; ask the person for the topic text.

What to do depends on the first line:

- **`Comments on the Loom topic "<id>":`** then a list. An indented note under a pointer is a change request for that place: make it, keep everything else unchanged, and follow the checks below. Pointers without a note are context.
- **`Answer about the Loom topic "<id>" (do not change any files):`** then a list and a question. Answer the question from the files; do not edit anything.
- **Pointer lines on their own** are mentions inside the person's own message: read those places and do what the message asks.
