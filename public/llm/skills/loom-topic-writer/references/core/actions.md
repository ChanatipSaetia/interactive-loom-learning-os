## Action — Button Behavior

Action([@steps...]) wires button clicks to operations. Steps are @-prefixed built-in actions. Steps execute in order.
Buttons without an explicit Action prop automatically send their label to the assistant (equivalent to Action([@ToAssistant(label)])).

Available steps:
- @ToAssistant("message") — Send a message to the assistant (for conversational buttons like "Tell me more", "Explain this")
- @OpenUrl("https://...") — Navigate to a URL

Example — simple nav:
```
viewBtn = Button("View", Action([@OpenUrl("https://example.com")]))
```

- Action can be assigned to a variable or inlined: Button("Go", onSubmit) and Button("Go", Action([...])) both work

Page-local state actions work without a model call. Query/Mutation host connections are deferred; do not assume a host handles assistant-conversation actions.
