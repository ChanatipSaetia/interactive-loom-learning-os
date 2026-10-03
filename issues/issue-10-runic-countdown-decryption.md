# Issue 10: Timed Runic Countdown Ring & Magic Decryption Overlay (`<RunicCountdownRing>`)

## What to build
Build a floating circular countdown timer overlay docked atop `ReflectionSequenceSection` during `reflection_decryption` encounters. Renders a glowing color-shifting timer ring (Cyan $\rightarrow$ Amber $\rightarrow$ Red), visually decrypts scrambled runes into clear English text upon step completion, and triggers spell fizzle penalties on timeout.

## Acceptance criteria
- [ ] Active countdown timer counts down within the drawer viewport.
- [ ] Successful ordering triggers rune decryption particle animations and awards quest rewards (*Port Blade*).
- [ ] Timer expiration triggers character damage and sequence reset.
- [ ] Unit tests verify countdown timing, expiration penalties, and decryption events.

## Blocked by
- Issue 7 (Docked Encounter Drawer Viewport Framework)
