/**
 * Master Core Aggregator & Runtime Context (`CoreLearningEngineContext`)
 *
 * Top-level facade over two independently-usable bounded sub-contexts:
 *   1. Validation Gateway — pure ingestion & 3-tier validation (no React).
 *      Import directly: `src/core/learning-engine/validation`
 *   2. Composition Engine — page/section assembly & UI integration (React).
 *      Import directly: `src/core/learning-engine/composition`
 */

// ─── Validation Gateway Context (pure, headless-capable) ───────────────
export * from './validation'

// ─── Core Section Sub-Contexts — Section Contract (schemas, events, renderers) ───
export * from './sub-contexts'

// ─── Composition Engine Context (React-bound) ─────────────────────────
export * from './composition'

// ─── Section & Page Registry (composition-bound) ──────────────────────
export * from './registry'
