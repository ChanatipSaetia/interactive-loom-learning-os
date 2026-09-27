# Interactive User Manuals

Teach people to use IT systems and software through safe simulations, without touching the real, restricted system

## Start
* [Interactive User Manuals](sections/intro/section.md) — topic briefing and roadmap

## Why Simulate?
* [Why Learners Can't Touch the Real System](sections/access-barriers/section.md) — Least-privilege access control means trainees often have no account or role that allows the actions they must learn
* [The Fidelity Ladder](sections/fidelity-ladder/section.md) — Simulation fidelity rises from static annotated screenshots, to click-through walkthroughs, to interactive simulations with fake data, to a full sandbox environment
* [Why Simulate Check](sections/quiz-why/section.md) — Starter quiz section.

## Ways to Build It
* [Implementation Approaches](sections/approach-catalog/section.md) — Annotated screenshot or video guides are the cheapest to create but are passive: learners watch and never practise
* [Tools for Each Approach](sections/tool-kit/section.md) — Scribe, Tango and Guidde auto-generate step-by-step screenshot guides from a recorded session; Snagit and Loom cover manual screenshots and video
* [Trade-off Sandbox: Fidelity vs Upkeep](sections/approach-tradeoffs/section.md) — The main trade-off axes are build cost, realism, maintenance effort per UI release, who can update it (authors vs developers) and how much can be automated as code or with AI
* [Pick Your Approach](sections/approach-decision/section.md) — Starter decision-tree section.
* [Approach Check](sections/quiz-approaches/section.md) — Starter quiz section.

## Keeping It Alive
* [Upkeep Cost Calculator](sections/upkeep-cost/section.md) — Yearly upkeep effort is roughly releases per year × screens changed per release × minutes to update one screen
* [Maintainability Practices](sections/upkeep-practices/section.md) — Generate simulations from a single source of truth, such as the design-system components or a shared script of steps, instead of hand-copying screens
* [As Code & With AI](sections/code-and-ai/section.md) — UI clones and training sandboxes are naturally 'as code': components, MSW handlers, tour steps, Terraform and seed scripts live in git, get reviewed in pull requests and run in CI
* [Scenario: The Menu Moved](sections/scenario-release/section.md) — Starter scenario section.
* [Order the Upkeep Loop](sections/reflection-upkeep/section.md) — Starter reflection-sequence section.

## Designing for Learning
* [Watch → Try → Test](sections/watch-try-test/section.md) — A good simulation offers three modes: Watch (demo), Try (guided practice with hints) and Test (unguided assessment)
* [How It All Connects](sections/concept-map/section.md) — Starter concept-map section.
* [Glossary](sections/glossary/section.md) — Starter flashcards section.
* [Plan Your Simulation](sections/plan-your-sim/section.md) — Starter reflection-template section.
* [Principles for Building Simulations](sections/creation-principles/section.md) — Organise the manual around real job tasks (e.g. 'approve a leave request'), not a tour of every screen and menu
* [From Task to Simulation](sections/build-process/section.md) — Start with task analysis: watch an expert do the real task and write down every step, decision and common mistake
* [Principles Check](sections/quiz-principles/section.md) — Starter quiz section.
