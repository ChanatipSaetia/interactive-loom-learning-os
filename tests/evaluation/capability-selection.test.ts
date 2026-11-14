// Authored protocol/representation cases. No external model selection or learning outcome claim.
// @ts-expect-error Node fs types are not installed in this repository
import { mkdirSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { Client, InMemoryTransport } from '@modelcontextprotocol/client'
import { THREE_SPLINE_REQUEST, TEXT_HEAVY_REPRO_PLAN, TEXT_HEAVY_REPRO_OUI } from '../fixtures/ai-experience/text-selection'
import { THREE_SPLINE_PLAN, THREE_SPLINE_FILES, THREE_SPLINE_OUI, RENDER_FLOW } from '../fixtures/ai-experience/three-spline'
import { getCapabilityIndex } from '../../src/core/learning-engine/composition/oui/capability-catalog'
import { reviewTopicPlan, validateTopicPlan } from '../../src/core/learning-engine/composition/oui/topic-plan'
import { getAuthoringGuide } from '../../src/core/learning-engine/composition/oui/authoring-guide'
import { getAuthoringContract } from '../../src/core/learning-engine/composition/oui/authoring-contract'
import { createLoomServer } from '../../src/mcp/server'
import { checkTopic, checkSection } from '../../src/mcp/check'
import { sectionBeatsOf } from '../../src/core/learning-engine/validation/oui-gateway'
import { resolveTopicContext } from '../../src/core/supporting/authoring-editor/assistant/context-graph'
import { compileOUISection } from '../../src/core/learning-engine/composition/oui/compile'
import { deriveSchema } from '../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/abstract-flow/derive'
import { autoDeriveViews } from '../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/derivations'
import type { AbstractFlow } from '../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/abstract-flow/types'

const text = (result: unknown) => (result as { content: Array<{ text: string }> }).content.map((part) => part.text).join('')

describe('capability-aware authored regression corpus', () => {
  it('validates a comprehensive Three.js/Spline plan and exact contracts without section quotas', () => {
    expect(validateTopicPlan(THREE_SPLINE_PLAN)).toEqual([])
    expect(reviewTopicPlan(THREE_SPLINE_PLAN)).toEqual([])
    const result = checkTopic(THREE_SPLINE_OUI, THREE_SPLINE_PLAN)
    expect(result.report).toBeNull()
    expect(result.planAlignment?.status).toBe('aligned')
    for (const section of THREE_SPLINE_PLAN.sections) {
      const beats = sectionBeatsOf(THREE_SPLINE_FILES[`sections/${section.id}.oui`])!.map((beat) => beat.id)
      const narration = THREE_SPLINE_FILES[`sections/${section.id}.narrate.oui`]
      for (const beat of beats) expect(narration, `${section.id}/${beat}`).toContain(`NarrationStep("${beat}"`)
    }
    const guideSizes: number[] = []
    let version: string | undefined
    for (const section of THREE_SPLINE_PLAN.sections) {
      const source = THREE_SPLINE_FILES[`sections/${section.id}.oui`]
      const context = resolveTopicContext({ files: { [`sections/${section.id}.oui`]: source }, roots: [`sections/${section.id}.oui`] })
      expect(context.truncated).toBe(false)
      for (const library of ['loom', 'openui'] as const) {
        const components = context.componentReferences.filter((reference) => reference.library === library).map((reference) => reference.name)
        if (!components.length) continue
        const guide = getAuthoringContract({ detail: 'focused', components, library, knownContractVersion: version })
        expect(guide.diagnostics).toEqual([])
        expect(guide.contracts).not.toContain('Unknown components')
        guideSizes.push(guide.measurement.estimatedTokens)
        version = guide.contractVersion
      }
    }
    mkdirSync('artifacts', { recursive: true })
    writeFileSync('artifacts/ai-capability-selection.json', JSON.stringify({
      kind: 'authored-regression-not-model-output', topicId: THREE_SPLINE_PLAN.topicId,
      structuralObjectiveCoverage: 1, firstPassOuiAndNarrationValid: result.ok, repairs: 0,
      discoveryEstimatedTokens: Math.ceil(JSON.stringify(getCapabilityIndex()).length / 4), focusedContractEstimatedTokens: guideSizes,
      estimateMethod: 'characters/4; not provider billing',
      semanticRepresentationFit: null, supportedObjectiveRate: null, learnerAssessment: 'not-measured',
      budgetExemption: 'Comprehensive lesson: Flowchart dependency contracts can exceed short-topic focused budgets; all required model contracts retained. OpenUI generic content alternatives are selected separately, with compact section rules included.',
      externalModelSelection: 'not-run', mobileLayout: 'requires-browser-harness',
    }, null, 2) + '\n')
  })
  it.each(['sequence', 'architecture', 'data-flow'])('uses %s to teach a distinct aspect of the same linear process', (view) => {
    const source = RENDER_FLOW(view)
    expect(checkSection(source, 'sections/pipeline.oui').diagnostics).toEqual([])
    const payload = compileOUISection(source).value!
    const schema = autoDeriveViews(deriveSchema((payload.data as { flow: AbstractFlow }).flow))
    const key = { sequence: 'SEQUENCE', architecture: 'SYS_ARCH', 'data-flow': 'DATA_FLOW' }[view]!
    expect(schema.views?.[key as keyof typeof schema.views]?.nodes.length).toBeGreaterThan(0)
    expect(JSON.stringify(schema)).toContain('Rendered frame')
  })
  it('validates purposeful same-beat narration view transitions and diagnoses unsupported modeling', () => {
    const narration = THREE_SPLINE_FILES['sections/pipeline.narrate.oui']
    expect(checkSection(narration, 'sections/pipeline.narrate.oui', RENDER_FLOW()).diagnostics).toEqual([])
    const unmodeled = narration.replace(/"sequence"/g, '"state-machine"')
    expect(checkSection(unmodeled, 'sections/pipeline.narrate.oui', RENDER_FLOW()).diagnostics.some((d) => d.field === 'view' && d.message.includes('StateMachine'))).toBe(true)
    expect(checkSection(narration.replace(/"sequence"/g, '"gantt"'), 'sections/pipeline.narrate.oui', RENDER_FLOW()).valid).toBe(false)
    const noData = RENDER_FLOW('data-flow').replace(', "Rendered frame"', '')
    expect(checkSection(noData, 'sections/pipeline.oui').diagnostics.some((d) => d.field === 'initialView')).toBe(true)
    const dataNarration = 'root = Narration([NarrationStep("step1", "Follow the payload", null, "data-flow")])'
    expect(checkSection(dataNarration, 'sections/pipeline.narrate.oui', noData).diagnostics.some((d) => d.field === 'view')).toBe(true)
    expect(checkSection(dataNarration, 'sections/pipeline.narrate.oui', RENDER_FLOW()).diagnostics).toEqual([])
  })
  it('requires real authored states and transitions, without requiring every process to have them', () => {
    const stateful = RENDER_FLOW('state-machine')
      .replace('"Draws the scene", "service")', '"Draws the scene", "service", StateMachine([MachineState("idle", "Idle", "blue"), MachineState("drawn", "Drawn", "green")], "idle"))')
      .replace('"Frame drawn", null, null,', '"Frame drawn", null, "drawn",')
    expect(checkSection(stateful, 'sections/pipeline.oui').diagnostics).toEqual([])
    expect(checkSection(stateful.replace('null, "drawn",', 'null, "invented",'), 'sections/pipeline.oui').diagnostics.some((d) => d.field?.endsWith('.enters'))).toBe(true)
    expect(checkSection(stateful.replace('null, "drawn",', 'null, null,'), 'sections/pipeline.oui').diagnostics.some((d) => d.message.includes('no Event.enters'))).toBe(true)
    expect(checkSection(RENDER_FLOW('architecture'), 'sections/pipeline.oui').diagnostics).toEqual([])
  })
  it('detects an all-prose substitution and keeps appropriate prose and Bullets valid', () => {
    const unjustified = structuredClone(THREE_SPLINE_PLAN)
    unjustified.sections = unjustified.sections.map((section) => ({ ...section, components: ['LessonText'], rationale: undefined, presentation: undefined, assessment: undefined }))
    expect(validateTopicPlan(unjustified)).toEqual([])
    expect(reviewTopicPlan(unjustified).some((d) => d.code === 'UNJUSTIFIED_TEXT_SELECTION')).toBe(true)
    expect(checkTopic(THREE_SPLINE_OUI, unjustified).planAlignment?.status).toBe('mismatch')
    const prose = { ...THREE_SPLINE_PLAN, sections: THREE_SPLINE_PLAN.sections.map((section) => ({ ...section, components: ['LessonText'], rationale: 'Connected prose preserves nuanced qualifications that a factual table would hide.' })) }
    expect(reviewTopicPlan(prose).some((d) => d.code === 'UNJUSTIFIED_TEXT_SELECTION')).toBe(false)
  })
  it('recovers focused retrieval failures through the selected legacy guide without changing representation', async () => {
    const [a, b] = InMemoryTransport.createLinkedPair()
    await createLoomServer().connect(b)
    const client = new Client({ name: 'retrieval-fallback-fixture', version: '1' })
    await client.connect(a)
    try {
      const failed = JSON.parse(text(await client.callTool({ name: 'read_reference', arguments: { path: 'components/MissingTable.md' } })))
      expect(failed.error).toBe('REFERENCE_NOT_FOUND')
      expect(failed.entry).toBe('loom://references/index.md')
      const retry = JSON.parse(text(await client.callTool({ name: 'read_reference', arguments: { path: 'components/Table.md' } })))
      expect(retry.content).toContain('Table(')
      expect(retry.content).not.toContain('QuizQuestion(')
      expect(checkSection(THREE_SPLINE_FILES['sections/comparison.oui'], 'sections/comparison.oui').valid).toBe(true)
      const missing = getAuthoringContract({ detail: 'focused', sections: ['openui'] })
      expect(missing.diagnostics[0].code).toBe('OPENUI_COMPONENTS_REQUIRED')
    } finally { await client.close() }
  })
})


it('exposes the user-request Text-selection loophole separately from OUI validity', () => {
  const check = checkTopic(TEXT_HEAVY_REPRO_OUI, TEXT_HEAVY_REPRO_PLAN)
  expect(check.ok).toBe(true)
  expect(check.planAlignment?.status).toBe('aligned')
  const diagnostics = reviewTopicPlan(TEXT_HEAVY_REPRO_PLAN)
  expect(diagnostics.filter((d) => d.code === 'UNJUSTIFIED_TEXT_SELECTION')).toHaveLength(2)
  expect(reviewTopicPlan(THREE_SPLINE_PLAN)).toEqual([])
  mkdirSync('artifacts', { recursive: true })
  writeFileSync('artifacts/ai-text-selection-regression.json', JSON.stringify({
    request: THREE_SPLINE_REQUEST, origin: 'authored-reproduction-from-user-request',
    ouiValid: check.ok, structuralAlignment: check.planAlignment?.status,
    advisoryDiagnostics: diagnostics, complementaryPlanAdvisories: reviewTopicPlan(THREE_SPLINE_PLAN),
    externalModelRun: false, liveAssistantSelection: 'not-measured',
    caveat: 'This reproduces deterministic acceptance and review propagation, not the original assistant trace or autonomous model selection.',
  }, null, 2) + '\n')
})


it('compares the same request with list-heavy and composition-aware plans and measures selected OpenUI contracts', () => {
  const listPlan = { ...TEXT_HEAVY_REPRO_PLAN, sections: TEXT_HEAVY_REPRO_PLAN.sections.map((section) => ({ ...section, components: ['Bullets'], rationale: 'Bullets are simple and clear.' })) }
  const listReview = reviewTopicPlan(listPlan)
  expect(listReview.filter((diagnostic) => diagnostic.code === 'LIST_STRUCTURE_REVIEW')).toHaveLength(2)
  expect(reviewTopicPlan(THREE_SPLINE_PLAN)).toEqual([])
  const source = THREE_SPLINE_FILES['sections/spatial.oui']
  const narration = THREE_SPLINE_FILES['sections/spatial.narrate.oui']
  expect(checkSection(source, 'sections/spatial.oui').diagnostics).toEqual([])
  expect(checkSection(narration, 'sections/spatial.narrate.oui', source).diagnostics).toEqual([])
  const names = ['Stack', 'Card', 'CardHeader', 'TextContent']
  const focused = getAuthoringContract({ detail: 'focused', library: 'openui', components: names })
  const legacy = getAuthoringGuide([], names, 'openui')
  expect(focused.measurement.estimatedTokens).toBeLessThan(2000)
  const selected = focused.contracts.split('\n').filter((line) => /^[A-Z]\w*\(/.test(line)).map((line) => line.split('(')[0])
  expect(selected).toEqual(['Card', 'CardHeader', 'Stack', 'TextContent'])
  mkdirSync('artifacts', { recursive: true })
  writeFileSync('artifacts/ai-openui-selection-regression.json', JSON.stringify({
    origin: 'authored-user-request-reproduction', request: THREE_SPLINE_REQUEST,
    listReview, complementaryPlanReview: reviewTopicPlan(THREE_SPLINE_PLAN),
    selectedComponents: selected, firstFocusedResponseEstimatedTokens: focused.measurement.estimatedTokens,
    selectedContractBodyEstimatedTokens: Math.ceil(focused.contracts.length / 4), legacyAllAllowedBodyEstimatedTokens: Math.ceil(legacy.length / 4),
    estimateMethod: 'characters/4, not provider billing', ouiAndNarrationValid: true,
    externalModelRun: false, semanticSelectionQuality: 'not-measured',
  }, null, 2) + '\n')
})
