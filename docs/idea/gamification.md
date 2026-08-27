# Gamification Concept & Design Specification

> **Goal**: Motivate learners to engage deeply with new content and systematically review past topics through a tabletop-inspired hex-map progression system.

---

## 1. High-Level Purpose

1. **Active Focus**: Drive deep engagement while learning new and complex technical concepts.
2. **Mental Model Alignment**: Ensure learner comprehension aligns with core domain concepts and AI-generated materials.
3. **Long-Term Retention**: Encourage periodic return visits to review and reinforce memory using spaced repetition mechanics.

---

## 2. Desired Learner Journey

1. **Topic Selection**: The learner selects a topic map to explore.
2. **Deep Content Consumption**: The learner consumes foundational materials without skimming:
   - Grasp key terminology and align mental models with AI definitions.
   - Understand relationships between core concepts.
   - Master step-by-step procedures and system flows.
   - Comprehend multi-layered system architectures.
3. **Comprehension Verification**:
   - Answer interactive quiz questions.
   - Complete reflection sequences.
   - Synthesize key takeaways.
4. **Trade-off Exploration**: Experiment with scenario variables and evaluate architectural trade-offs.
5. **Spaced Review**: Periodically revisit completed maps to refresh memory and maintain mastery.

---

## 3. Learning Friction & Pain Points ("Boring Parts")

Traditional e-learning platforms often suffer from key friction points that gamification aims to eliminate:

| Friction Point | Problem | Gamified Solution |
| :--- | :--- | :--- |
| **No Initial Agency** | Course paths feel passive and rigid. | Interactive hex-map navigation with choice of paths. |
| **Cognitive Fatigue** | Skimming or skipping dense reading sections. | Mandatory sanctuary hexes that grant character healing. |
| **Monotonous Quizzes** | Repetitive multiple-choice tests feel tedious. | Monster battles where correct answers damage enemies. |
| **Dreaded Spaced Review** | Reviewing old topics feels like a chore. | City defense raids and boss prep that require past items. |

---

## 4. Core Game Mechanics & Map Architecture

### 4.1 Character Attributes

Learners control a character with customizable attributes that directly influence gameplay during challenges:

- 🛡️ **Armor**: Reduces health damage taken from incorrect quiz answers.
- ⚡ **Evasion**: Grants a passive chance to dodge damage completely and immediately retry a missed question.
- 💡 **Intelligence**: Grants a passive chance to reveal the correct answer or highlight the correct sequence item (requires a follow-up challenge to finalize).

### 4.2 Topic Map Structure (Hex Grid)

Each topic is represented as a **Hexagonal Map** containing cities, wilderness, and a final boss lair:

- **Objective**: Protect all cities from monster attacks, gather required skills/items across hexes, and defeat the topic **Boss**.
- **Progress Tracking**: Boss requirements (skills and key items) are displayed on the topic progress bar.
- **Boss Battle**: Unlocked once all requisite items/skills are collected from the map hexes.

---

## 5. Hex Node Types & OKF Section Mapping

Each hex on the map corresponds to a specific **OKF (Open Knowledge Format) Section Type**:

```
 [ Intro / Capital ]  --->  [ Reading / City ]  --->  [ Challenge / Monster ]  --->  [ Trade-off Workshop ]
  (Main Overview)            (Healing Sanctuary)        (Quiz / Reflection)            (Stat Buff Crafting)
```

### 1. Intro Hex (`intro` / Main Capital)
- **Role**: Starting point of the topic map.
- **Function**: Reveals the map layout, identifies which monsters drop specific items, and shows challenge difficulty tiers (corresponding to topic section order).

### 2. Reading Hexes (`text`, `bullets`, `taxonomy-browser` / Cities & Sanctuaries)
- **Role**: Foundational learning content.
- **Function**:
  - Mandatory to read on the first visit to unlock adjacent hexes.
  - Grants character **HP Healing** for taking the time to read and understand the material.
  - Re-visiting reading hexes provides diminishing healing returns to prevent abuse.

### 3. Mission & Defense Hexes (`quiz`, `reflection-sequence` / Monster Encounters)
- **Role**: Knowledge verification and city defense.
- **Quiz Battles (`quiz`)**: Monsters (e.g., Goblins) attack a city.
  - **Correct Answer**: Deals damage to the monster.
  - **Wrong Answer**: Character loses HP (mitigated by Armor; an Evasion dodge prevents the damage and lets the player retry the question).
  - **Victory**: Defeating the monster secures the city and awards a key item.
  - **Defeat**: If the monster is not defeated, the event closes and the monster's HP resets for the next attempt.
- **Magic Decryption (`reflection-sequence`)**: Time-limited puzzle encounters.
  - **Success (Within Time Limit)**: Decrypts monster magic and awards key items.
  - **Failure**: Character takes damage after submitting answer
  - **Timeout**: The event resets after timeout.

### 4. Trade-off Workshop Hexes (`tradeoff-sandbox` / Weapon Crafting)
- **Role**: Interactive experimentation and attribute tuning.
- **Function**: Adjusting system metrics and evaluating trade-offs crafts temporary weapon/equipment buffs (e.g., extra Armor or Evasion) for the current topic journey.

---

## 6. Map Dynamics, Health & Progression

### 6.1 System Chaos
Each topic campaign tracks a **System Chaos** level (0–100, starts at 0) representing the growing instability of the realm when the learner idles in safe zones instead of advancing:

- **Accumulation**: Re-visiting a safe-haven hex (intro/capital or reading city) for the 2nd time or later raises Chaos by `+15 × difficulty chaosMultiplier` (Easy ×0.5, Normal ×1.0, Hard ×1.5, Nightmare ×2.0), capped at 100.
- **Relief**: Resting at a Reading Sanctuary reduces Chaos by 10, but rest healing is reduced by 0.25 per Chaos level (minimum 5 HP restored).
- **Sanctuary Healing dampening**: Time-based tick healing (10 HP / 10s × visit multiplier, min 2) is further reduced by `floor(Chaos × 0.05)`.
- **Enraged Monsters**: Monster damage scales by `1 + Chaos × 0.005` (up to **+50%** at 100 Chaos). Encounters at Chaos ≥ 20 display a 🔥 Chaos Buff tag in the combat log.
- **Magic Backlash**: Failed or timed-out `reflection-sequence` decryption suffers backlash damage scaled by `1 + Chaos × 0.01` (up to **+100%** at 100 Chaos). Section-failure damage is amplified the same way.

### 6.2 Health Risk
- **Zero HP (Defeat)**: Losing all health resets the current topic campaign, failing the city defense mission and requiring a restart.

### 6.3 Leveling & Attributes
- Clearing hexes and completing topics awards **Experience Points (EXP)**.
- Leveling up grants **Attribute Points** that learners can allocate to Armor, Evasion, or Intelligence.

### 6.3 Dynamic Difficulty Settings
Learners can choose a difficulty setting per topic:
- **Higher Difficulty**: Monsters deal higher damage, attribute passive triggers occur less frequently, and System Chaos accumulates faster from safe-haven revisits (higher `chaosMultiplier`).
- **Higher Rewards**: Yields bonus EXP, unique badges, and faster leveling.

### 6.4 Badges & Achievements

- 🏅 **Completion Badge**: Awarded upon clearing a topic for the first time.
- ⭐ **Flawless Victory Badge**: Awarded for clearing a topic without losing any health.
- ⚔️ **Mastery Badge**: Earned by clearing topics on higher difficulty settings.
- 🔄 **Review Streak Badge**: Earned by successfully defending multiple previously cleared cities during periodic reviews.

---

## 7. Motivation Theory Alignment (Self-Determination Theory)

The gamification design directly leverages the three pillars of **Self-Determination Theory (SDT)**:

```
                  ┌────────────────────────────────────────┐
                  │    Self-Determination Theory (SDT)     │
                  └───────────────────┬────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
  ┌───────────┐                 ┌───────────┐                 ┌───────────┐
  │ Autonomy  │                 │  Mastery  │                 │  Purpose  │
  └─────┬─────┘                 └─────┬─────┘                 └─────┬─────┘
        │                             │                             │
  • Path choice                 • Stat growth                 • Protect cities
  • Topic selection             • Boss battles                • Clear the realm
  • Strategic skips             • Difficulty tiers            • Meaningful lore
```

1. **Autonomy**:
   - Learners choose their path across the city hex map.
   - Learners select which topics to learn or review.
   - Learners decide whether to engage with optional trade-off workshops (balancing stat buffs against time spent).

2. **Mastery**:
   - Character attributes (Armor, Evasion, Intelligence) visibly grow through learning.
   - Quizzes and reflection puzzles provide immediate feedback and skill validation.
   - Difficulty tiers challenge advanced learners to prove deep topic mastery.

3. **Purpose**:
   - Contextualizes abstract technical learning into a meaningful quest: defending cities and freeing the realm from monsters through acquired knowledge.


