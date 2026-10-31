## Syntax Rules

1. Each statement is on its own line: `identifier = Expression`
2. `root` is the entry point — every file must define `root`: `root = Topic(...)` in topic.oui, `root = <Section>(...)` in a section file
3. Expressions are: strings ("..."), numbers, booleans (true/false), null, arrays ([...]), objects ({...}), or component calls TypeName(arg1, arg2, ...)
4. Use references for readability: define `name = ...` on one line, then use `name` later
5. EVERY variable (except root) MUST be referenced by at least one other variable. Unreferenced variables are silently dropped and will NOT render. Always include defined variables in their parent's children/items array.
6. Arguments are POSITIONAL (order matters, not names). Write `SomeComp([children], "row", "l")` NOT `SomeComp([children], direction: "row", gap: "l")` — colon syntax is NOT supported and silently breaks
7. Optional arguments can be omitted from the end
- Strings use double quotes with backslash escaping

## Hoisting & Statement Order

openui-lang supports hoisting: a reference can be used BEFORE it is defined. The parser resolves all references after the full input is parsed.

In each file, write the `root = ...` statement first, then the statements it references.
