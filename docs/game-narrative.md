# The Loom Chronicles — Narrative of the Game

> A story version of the game's lore, derived strictly from the code:
> `src/core/supporting/gamification/` (types, game-config, game-rules, campaign components)
> and the realm maps in `public/hexmaps/*.yaml`.

---

## Prologue: The Weaving and the Unraveling

Long ago, all knowledge was one continuous **Loom** — a vast tapestry where every idea was threaded to
every other idea: why empires fall, how pixels glow, why people come back, how systems scale.

But the Loom is under siege. From the gaps between understanding rises **Chaos** — the entropy of
forgotten things. It has no army and needs none. It simply waits in the places a learner revisits
without truly learning, and it grows there. Every idle re-read, every retreat to the safety of the
Capital, feeds it. When Chaos is young, monsters bite as they were bred to bite. When Chaos runs hot,
they are *enraged* — striking up to half again as hard, wreathed in the 🔥 Chaos Buff. Even the
magical decryption vaults lash out harder at those who fail their puzzles, the backlash swelling
toward double its base force at full Corruption (Chaos 100).

Chaos's true weapon, however, is not violence. It is **healing decay**. The sanctuaries that mend a
wandering Architect mend them a little less each visit — full grace the first time, half the second,
a bare fifth the third, until the fount gives only a trickle. The Loom is forgetting how to restore
you.

Against this stands one figure at a time: the **Architect** — a learner-caravan rolling from realm to
realm in a wagon on a long dark road, armed with nothing but answered questions.

---

## The Architecture of the World

The world is not a continent. It is a set of **Realms**, one for each domain of knowledge, and each
Realm is a lattice of glowing hexes radiating from a single hub.

At the center of every Realm stands its **Capital** — the Citadel of Motivation, the Architecture
Citadel, the WebGL Citadel, the Great Hall of Time (มหาศาลากาลเวลา), or the Kamado Citadel (มหานครเปลวไฟเซรามิก). The Capital is home, shop, and
starting hub; leaving it begins the run, returning in defeat ends it.

From the Capital, **branching tracks of hexes unfurl**, allowing the Architect to **freely explore parallel paths** (e.g. Legal & Governance Systems, Production & Technology, Food Science & Thermodynamics, or Geopolitical Conflicts). Each path is an open frontier:

- **Reading Sanctuaries & Archive Spires** — sacred havens, categorized libraries, and layered architectural Lego stacks where the Architect studies, recovers hit points, and discovers foundational relics.
- **Concept Monoliths** — standing stones of vocabulary and knowledge graphs, where names are learned so that later things can be *said*.
- **Simulation Nexuses** — humming engines and Event Storming flowcharts where the Architect runs the world's dilemmas and watches consequences unfold.
- **Trade-off Workshops** — forges where no answer is free, and every strength is bought with a weakness.
- **Observatory Galleries** — quiet towers for seeing visual frameworks and architectural diagrams whole.
- **Quiz Encounters** — the wild battlegrounds. Monsters literally feed on the reader's uncertainty; the only sword is a correct answer derived from what was studied.
- **Reflection Decryption Vaults** — ancient locks of sequence and meaning. Set the runes in order before the Runic Countdown Ring drains, and win a time-blessed reward; hesitate, and the vault's magic backlashes.

And at the heart of every Realm: the **Boss Lair**, sealed until all mandatory knowledge relics are collected.

---

## The Relics and Mandatory Knowledge

Across the branching paths of the realm, **Key Items** reside inside sanctuaries, archives, simulation nexuses, or battle encounters. They represent the **mandatory milestones** of that domain:

- In the **Chronos Realm**, the *Hourglass of Chronos* (Ancient River Valleys), the *Seal of the Historian* (Classical Law & Charters), the *Astrolabe of Truth* (Renaissance & Industrial Flow), and the *Compass of Chronos* (Cold War Deterrence) must all be claimed.
- In the **Realm of the Kamado Flame**, the *Aegis of Airflow & Thermal Mass* (Ceramic Anatomy), the *Scroll of Reverse Sear Mastery* (Grilling Taxonomies), and the *Gem of Maillard & Smoke Chemistry* (Food Science) are required to dissolve the seal on the *Overcooked Smoke Dragon's Lair*.
- A Boss Lair's seal will not break for brute force alone — it opens only when the Architect holds every mandatory relic of understanding. The Dragon of your specialization cannot be felled by anything you failed to learn in this Realm.

Within the Lair itself, collected relics transform into tactical weapons:
- Any shield, aegis, amulet, ward, or barrier can be raised to **nullify the next boss attack completely**.
- Any blade, crystal, or astrolabe can be unleashed for **40 points of true damage**.

---

## Procedural Roguelike Generation

Every time an expedition collapses in defeat or a new campaign begins, the Loom **procedurally re-rolls the realm's layout**. The radiant hexes re-scatter across the cosmos, creating fresh visual paths, while preserving the sacred topology: the Capital at the center, the Boss adjacent at distance 1, and every challenge guarding its sanctuary.

---

## The Oath of Pulses

No Architect walks the Realms forever. At the start of each run, the Capital's wardens grant a small pool of **Sanctuary Pulses** — five for a true Architect, eight for an Apprentice, three for a Master, and two for the Grandmaster. Each pulse is one deliberate act of rest: an active healing tick bought against the dark.

| Oath | The World's Bargain |
|---|---|
| 🌱 **Apprentice** | Monsters strike 30% lighter, Chaos creeps at half pace, 8 Pulses. |
| ⚔️ **Architect** | The world as it is, +20% insight (EXP), 5 Pulses. |
| 🔥 **Master** | Wounds bite half again as deep, Chaos runs, 3 Pulses, +60% insight. |
| ☠️ **Grandmaster** | Double damage, raging Chaos, 2 Pulses, +120% insight. |

---

## Victory, Defeat, and the Seals of Deed

Fall in a Realm — let your HP reach zero — and the expedition collapses. *The monsters have overrun your expedition; you retreat to the Realm Capital.* The map re-rolls, and the wagon turns around.

Clear the Lair, and the announcement is simple and total:

> **"Realm Liberated!** You defeated the Architecture Boss and restored balance to this learning realm!"

Liberation pins **Seals of Deed** (badges) to your cloak that you carry between all Realms forever: Topic Completion, Flawless Victory (0 damage taken), Mastery Clear, and Tactical Craftsman. Your character — level, attributes, badges, and history — persists across every world.

*What will you refuse to let Chaos take?*
