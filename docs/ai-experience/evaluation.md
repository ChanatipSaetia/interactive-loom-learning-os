# Reproducible AI experience evaluation

Run `npm ci`, `npm run evaluate:offline`. The harness uses fixed synthetic source, plan, provenance and event fixtures, runs OUI and narration validation, actually renders/answers a quiz through Viewer, applies a targeted edit and revalidates it, measures context recall and guide size, and runs separate two-client MCP continuity tests. Output: ignored `artifacts/ai-experience-evaluation.json`; failures preserve Vitest exit status. It runs outside the Worker and makes no model calls.

The report's characters are JavaScript string lengths, not tokens or network bytes. Dependency-aware retrieval includes only the selected component reference; full and section-filtered guides also contain workflow prose. The size comparison shows payload selection, not equal-content answer quality. Context dependency recall is measured against known fixture statement IDs. Reported retrieval latency is a single local observation, not a production percentile or service-level guarantee. One successful targeted repair is deliberately exercised; it is not an observed model repair rate. Compilation, rendering and an answer event are asserted independently. Provenance linkage checks only declared sources/objectives, not whether sources are true or sufficient.

## External model and human evaluation (not run offline)

Use the same fixture tasks and log actual provider-reported input/output/repair tokens, latency, model/version, repair attempts, prompt variant and final validation/render result. Do not substitute character counts for token usage. Compare create, edit, continue and cross-client handoff across assistants using learner-authorized storage. Use public/redacted fixtures; never log credentials or learner transcripts.

Human review must separately assess factual grounding against retrieved sources, teaching quality, objective achievement, narration clarity and cross-assistant continuity in real clients. Offline success does not establish these. Costs, live host research, source availability, real OAuth/Drive authorization and real learners remain outside the deterministic suite.

`src/evaluation/metrics.ts` summarizes externally supplied measurements; missing token counts remain explicitly unobserved via token observation metadata. No expensive evaluation executes inside the Worker.

After `npm run build:worker`, run `npm run check:worker` for a real local workerd startup and HTTP smoke check using the repository-pinned Wrangler. It never deploys. The packaging test also simulates forbidden module-scope random/timer/fetch operations before importing the Worker.
