# PixiJS — 2D WebGL/WebGPU Rendering Engine

Master hardware-accelerated 2D graphics, hierarchical scene graphs, automatic draw-call batching, and high-performance WebGL/WebGPU pipelines.

## Module 1: Foundations & Vocabulary
* [Introduction](sections/intro/section.md) — Overview, rationale, and learning roadmap
* [Architecture & Scene Graph Map](sections/concept-map/section.md) — Structural map of Application, Stage, Container, Sprite, and Renderer
* [Application Startup Sequencing](sections/reflection-foundations/section.md) — Chronological sequencing of the PixiJS startup lifecycle
* [Essential Terminology](sections/flashcards/section.md) — Key terms (Batching, Ticker, World Transforms, ParticleContainer)
* [Essential Vocabulary Quiz](sections/quiz-vocabulary/section.md) — Recall check on Textures, BaseTextures, and Ticker deltaTime

## Module 2: Display Objects & Decision Making
* [Display Object Taxonomies](sections/taxonomy-browser/section.md) — Comparing Containers, Sprites, Vector Graphics, Text, and Shaders
* [Display Object Selection Guide](sections/decision-tree/section.md) — Diagnostic Q&A for selecting optimal display primitives
* [Display Object & Selection Quiz](sections/quiz-taxonomies/section.md) — Assessment on Container vs ParticleContainer, BitmapText, and Graphics baking

## Module 3: Render Pipeline & Frame Execution
* [The PixiJS Render Pipeline](sections/text-core/section.md) — In-depth explanation of transform propagation, batching, and memory lifecycle
* [Transform Pipeline Sequencing](sections/reflection-transforms/section.md) — Ordering local-to-world matrix propagation steps
* [60 FPS Frame Render Loop](sections/flowchart/section.md) — Event Storming process diagram of the frame execution pipeline
* [Render Loop Sequencing](sections/reflection-sequence/section.md) — Chronological process ordering challenge

## Module 4: Performance Strategy & Memory Optimization
* [Rendering Architecture Trade-offs](sections/tradeoff-sandbox/section.md) — Balancing FPS, draw calls, and memory footprint
* [Performance & Memory Optimization Quiz](sections/quiz-optimization/section.md) — Checkpoint on texture destruction and filter offscreen cost
