# PixiJS Filters & Post-Processing Shaders

Master GPU-accelerated post-processing, custom GLSL fragment shaders, multi-pass convolution blurs, displacement maps, and high-performance FilterSystem architecture in PixiJS.

## Module 1: Foundations & Vocabulary
* [Introduction to PixiJS Filters](sections/intro/section.md) — Overview, rationale, and learning roadmap for post-processing effects
* [Filter Pipeline & System Map](sections/concept-map/section.md) — Structural map of FilterSystem, Containers, RenderTargets, Uniforms, and GPU Framebuffers
* [Essential Filter Terminology](sections/flashcards/section.md) — Key terms (FilterSystem, RenderTarget Pool, Fragment Shader, Uniforms, Padding, Kawase Blur)
* [Shader & Uniform Vocabulary Quiz](sections/quiz-vocabulary/section.md) — Recall check on filter uniforms, samplers, padding, and matrix transformations
* [Filter Setup & Creation Sequencing](sections/reflection-foundations/section.md) — Chronological challenge ordering the steps to author and attach custom GLSL filters

## Module 2: Taxonomies & Pipeline Mechanics
* [Filter Categories & Shader Effects](sections/taxonomy-browser/section.md) — Taxonomies of Blurs, Color Grading, Coordinate Warping, and Stylized Shaders
* [The FilterSystem Architecture & Lifecycle](sections/text-core/section.md) — In-depth breakdown of offscreen render targets, padding bounds, uniform matrices, and batch breaks
* [Filter Execution & Render Pipeline](sections/flowchart/section.md) — Event Storming process diagram of single-pass and multi-pass filter execution
* [Filter Pipeline Lifecycle Sequencing](sections/reflection-pipeline/section.md) — Reorder runtime frame execution stages from bounds calculation to target recycling
* [Multi-Pass Convolution Sequencing](sections/reflection-multipass/section.md) — Sequence the ping-pong convolution stages of separable 2-pass blurs
* [Bitmap Caching & Texture Baking Sequencing](sections/reflection-caching/section.md) — Sequence the stages of caching static filtered containers with cacheAsBitmap

## Module 3: Decision Making, Performance & Assessment
* [Filter Selection & Performance Advisor](sections/decision-tree/section.md) — Diagnostic Q&A for selecting optimal filter implementations
* [Post-Processing Performance Trade-offs](sections/tradeoff-sandbox/section.md) — Balancing FPS, draw calls, VRAM, and visual fidelity across platforms
* [Performance & Optimization Quiz](sections/quiz-optimization/section.md) — Assessment on batch breaking, Kawase vs Gaussian blur, and half-resolution scaling
* [Master Filter Architecture Assessment](sections/quiz-boss/section.md) — Comprehensive assessment on cacheAsBitmap, displacement mapping, and RenderTarget pooling
