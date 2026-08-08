/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import {
  validateOKFSection,
  validateOKFSectionFile,
  formatValidationReport,
  formatValidationAsPrompt,
  KNOWN_SECTION_TYPES,
} from '../../../../../src/core/learning-engine/validation/gateway'
import type { ValidationDiagnostic } from '../../../../../src/core/learning-engine/validation/types'

// ============================================================================
// Tier 1: YAML Syntax & Frontmatter
// ============================================================================

describe('Tier 1 - YAML Syntax', () => {
  it('detects invalid YAML indentation', () => {
    const result = validateOKFSection('type: text\n  paragraphs: [bad indent]')
    expect(result.status).toBe('error')
    expect(result.diagnostics.length).toBeGreaterThanOrEqual(1)
    expect(result.diagnostics[0].tier).toBe(1)
    expect(result.diagnostics[0].fixHint).toBeDefined()
  })

  it('detects broken YAML syntax', () => {
    const result = validateOKFSection('type: text\nparagraphs:\n  - [unclosed bracket')
    expect(result.status).toBe('error')
    const syntaxError = result.diagnostics.find((d) => d.tier === 1)
    expect(syntaxError).toBeDefined()
    expect(syntaxError!.message).toContain('YAML Syntax Error')
  })

  it('returns empty payload on syntax error', () => {
    const result = validateOKFSection('  - [unclosed bracket')
    expect(result.status).toBe('error')
    expect(result.payload).toEqual({})
  })

  it('parses valid YAML without frontmatter', () => {
    const result = validateOKFSection('type: text\nparagraphs: ["hello"]')
    expect(result.diagnostics.filter((d) => d.tier === 1).length).toBe(0)
  })
})

describe('Tier 1 - Frontmatter', () => {
  it('extracts type hint from frontmatter', () => {
    const yamlWithFm = '---\ntype: text\n---\nparagraphs: ["hello world"]'
    const result = validateOKFSectionFile(yamlWithFm)
    expect(result.status).toBe('valid')
    expect(result.diagnostics.length).toBe(0)
  })

  it('detects unclosed frontmatter', () => {
    const result = validateOKFSection('---\ntype: text\nparagraphs: ["hello"]')
    expect(result.status).toBe('error')
    const fmError = result.diagnostics.find((d) => d.tier === 1)
    expect(fmError).toBeDefined()
  })
})

// ============================================================================
// Tier 2: Structural Schema (Zod)
// ============================================================================

describe('Tier 2 - Schema Validation', () => {
  it('rejects unknown section type', () => {
    const result = validateOKFSection('type: unknown-type\nfoo: bar')
    expect(result.status).toBe('error')
    const schemaError = result.diagnostics.find((d) => d.tier === 2 && d.field === 'type')
    expect(schemaError).toBeDefined()
    expect(schemaError!.message).toContain('Unknown section type')
  })

  it('detects missing type field', () => {
    const result = validateOKFSection('paragraphs: ["hello"]')
    expect(result.status).toBe('error')
    const typeError = result.diagnostics.find((d) => d.tier === 2 && d.field === 'type')
    expect(typeError).toBeDefined()
  })

  it('validates text section with correct schema', () => {
    const result = validateOKFSection('type: text\nparagraphs: ["Hello world", "Second para"]')
    expect(result.status).toBe('valid')
    expect(result.diagnostics.length).toBe(0)
  })

  it('detects missing required field in text section', () => {
    const result = validateOKFSection('type: text')
    expect(result.status).toBe('error')
    const fieldError = result.diagnostics.find(
      (d) => d.tier === 2 && d.field === 'paragraphs'
    )
    expect(fieldError).toBeDefined()
  })

  it('detects wrong field type in text section', () => {
    const result = validateOKFSection('type: text\nparagraphs: "not an array"')
    expect(result.status).toBe('error')
    const fieldError = result.diagnostics.find(
      (d) => d.tier === 2 && d.field === 'paragraphs'
    )
    expect(fieldError).toBeDefined()
    expect(fieldError!.fixHint).toBeDefined()
  })

  it('validates intro section with nested required fields', () => {
    const result = validateOKFSection(`
type: intro
what:
  summary: "What is OKF"
why:
  summary: "Why it matters"
`.trim())
    expect(result.status).toBe('valid')
    expect(result.diagnostics.length).toBe(0)
  })

  it('detects missing nested field in intro section', () => {
    const result = validateOKFSection('type: intro\nwhat:\n  definition: "test"')
    expect(result.status).toBe('error')
    const summaryError = result.diagnostics.find(
      (d) => d.tier === 2 && d.field?.includes('what.summary')
    )
    expect(summaryError).toBeDefined()
  })

  it('validates quiz section schema', () => {
    const result = validateOKFSection(`
type: quiz
questions:
  - id: q1
    question: "What is 2+2?"
    choices:
      - id: a
        text: "4"
        correct: true
        explanation: "Correct"
`.trim())
    expect(result.status).toBe('valid')
    expect(result.diagnostics.length).toBe(0)
  })

  it('validates concept-map section with record nodes', () => {
    const result = validateOKFSection(`
type: concept-map
nodes:
  n1:
    id: n1
    title: "Node 1"
    category: "cat1"
edges: []
`.trim())
    expect(result.status).toBe('valid')
    expect(result.diagnostics.length).toBe(0)
  })

  it('rejects non-object section data', () => {
    const result = validateOKFSection('["just", "an", "array"]')
    expect(result.status).toBe('error')
    expect(result.diagnostics.some((d) => d.tier >= 2)).toBe(true)
  })

  it('validates formula-sandbox section', () => {
    const result = validateOKFSection(`
type: formula-sandbox
variables:
  - id: x
    label: "X"
    min: 0
    max: 100
    step: 1
    defaultValue: 50
metrics:
  - id: m1
    label: "M1"
    formula: "\${x}"
    description: "Test metric"
`.trim())
    expect(result.status).toBe('valid')
  })

  it('validates reflection-sequence section', () => {
    const result = validateOKFSection(`
type: reflection-sequence
challenges:
  - prompt: "Order these"
    items:
      - id: step1
        text: "First step"
    solution: ["step1"]
`.trim())
    expect(result.status).toBe('valid')
  })

  it('validates reflection-template section', () => {
    const result = validateOKFSection(`
type: reflection-template
challenges:
  - prompt: "Fill the blanks"
    template: "The {zone1} is {zone2}"
    chips:
      - id: chip1
        text: "Option A"
      - id: chip2
        text: "Option B"
    solution:
      zone1: chip1
      zone2: chip2
`.trim())
    expect(result.status).toBe('valid')
  })

  it('validates flashcards section', () => {
    const result = validateOKFSection(`
type: flashcards
terms:
  - id: t1
    word: "Hello"
    pronunciation: "/həˈloʊ/"
    category: "greeting"
    shortDefinition: "A greeting"
    detailedDefinition: "A common greeting"
    whyItMatters: "Universal greeting"
`.trim())
    expect(result.status).toBe('valid')
  })

  it('validates taxonomy-browser section', () => {
    const result = validateOKFSection(`
type: taxonomy-browser
categories:
  - icon: "📦"
    title: "Category 1"
    subtitle: "Sub 1"
    description: "Desc"
    details: "Details"
    analogy: "Analogy"
    primaryFocus: "Focus"
    inScope: ["in"]
    outOfScope: ["out"]
    color: "#ff0000"
`.trim())
    expect(result.status).toBe('valid')
  })

  it('validates image-gallery section', () => {
    const result = validateOKFSection(`
type: image-gallery
items:
  - id: img1
    url: "/img1.png"
    caption: "Image 1"
`.trim())
    expect(result.status).toBe('valid')
  })

  it('validates tradeoff-sandbox section', () => {
    const result = validateOKFSection(`
type: tradeoff-sandbox
scenarios:
  - id: s1
    title: "Scenario 1"
    description: "Desc"
    metrics:
      - id: m1
        label: "Metric 1"
        baseValue: 50
    steps:
      - id: step1
        title: "Step 1"
        description: "Step desc"
        choices:
          - id: c1
            label: "Choice A"
            description: "Desc A"
            metrics: { m1: 60 }
            pros: [{ title: "Good", description: "It is good" }]
            cons: [{ title: "Bad", description: "It is bad" }]
`.trim())
    expect(result.status).toBe('valid')
  })

  it('validates decision-tree section', () => {
    const result = validateOKFSection(`
type: decision-tree
id: dt1
title: "Tree 1"
root: start
nodes:
  start:
    id: start
    prompt: "Start?"
    choices:
      - id: opt1
        text: "Yes"
        next: end
  end:
    id: end
    leaf:
      recommendation: "Done"
      explanation: "You are done"
`.trim())
    expect(result.status).toBe('valid')
  })

  it('validates bullets section', () => {
    const result = validateOKFSection(`
type: bullets
items:
  - text: "First bullet"
`.trim())
    expect(result.status).toBe('valid')
  })

  it('validates scenario section', () => {
    const result = validateOKFSection(`
type: scenario
id: sc1
title: "Scenario 1"
intro: "Welcome"
nodes:
  start:
    id: start
    prompt: "Start?"
    choices:
      - id: c1
        text: "Go"
        next: end
  end:
    id: end
    outcome:
      verdict: "Good"
      lesson: "Learned"
      rating: a
startNode: start
`.trim())
    expect(result.status).toBe('valid')
  })
})

// ============================================================================
// Tier 3: Semantic Reference Integrity
// ============================================================================

describe('Tier 3 - Semantic Reference Integrity', () => {
  it('detects broken startNode in scenario', () => {
    const result = validateOKFSection(`
type: scenario
id: sc1
title: "Test"
intro: "Intro"
nodes:
  nodeA:
    id: nodeA
startNode: nodeB
`.trim())
    expect(result.status).toBe('warning')
    const brokenRef = result.diagnostics.find(
      (d) => d.tier === 3 && d.field === 'startNode'
    )
    expect(brokenRef).toBeDefined()
    expect(brokenRef!.message).toContain('nodeB')
    expect(brokenRef!.fixHint).toContain('nodeA')
  })

  it('detects broken choice.next in scenario', () => {
    const result = validateOKFSection(`
type: scenario
id: sc1
title: "Test"
intro: "Intro"
nodes:
  start:
    id: start
    choices:
      - id: c1
        text: "Go"
        next: nonexistent
  end:
    id: end
startNode: start
`.trim())
    const brokenRef = result.diagnostics.find(
      (d) => d.tier === 3 && d.field?.includes('next')
    )
    expect(brokenRef).toBeDefined()
    expect(brokenRef!.message).toContain('nonexistent')
  })

  it('detects broken root node in decision-tree', () => {
    const result = validateOKFSection(`
type: decision-tree
id: dt1
title: "Test"
root: missing
nodes:
  actual:
    id: actual
    leaf:
      recommendation: "OK"
      explanation: "OK"
`.trim())
    const brokenRef = result.diagnostics.find(
      (d) => d.tier === 3 && d.field === 'root'
    )
    expect(brokenRef).toBeDefined()
  })

  it('detects broken choice.next in decision-tree', () => {
    const result = validateOKFSection(`
type: decision-tree
id: dt1
title: "Test"
root: start
nodes:
  start:
    id: start
    choices:
      - id: c1
        text: "Go"
        next: missing
  end:
    id: end
    leaf:
      recommendation: "OK"
      explanation: "OK"
`.trim())
    const brokenRef = result.diagnostics.find(
      (d) => d.tier === 3 && d.field?.includes('next')
    )
    expect(brokenRef).toBeDefined()
  })

  it('detects broken entity reference in flowchart relations', () => {
    const result = validateOKFSection(`
type: flowchart
entities:
  entityA:
    title: "A"
    desc: "Desc A"
relations:
  - id: r1
    from: entityA
    to: entityB
views: {}
journeys: []
`.trim())
    const brokenRef = result.diagnostics.find(
      (d) => d.tier === 3 && d.field?.includes('to')
    )
    expect(brokenRef).toBeDefined()
    expect(brokenRef!.message).toContain('entityB')
  })

  it('detects broken entity reference in flowchart journeys', () => {
    const result = validateOKFSection(`
type: flowchart
entities:
  entityA:
    title: "A"
    desc: "Desc A"
relations: []
journeys:
  - id: j1
    label: "J1"
    steps:
      - nodeIds: [entityA, entityB]
        title: "Step 1"
        reason: "Reason"
views: {}
`.trim())
    const brokenRef = result.diagnostics.find(
      (d) => d.tier === 3 && d.field?.includes('nodeIds')
    )
    expect(brokenRef).toBeDefined()
    expect(brokenRef!.message).toContain('entityB')
  })

  it('detects unconnected actor and system nodes in flowchart', () => {
    const result = validateOKFSection(`
type: flowchart
entities:
  user1:
    title: "User"
    desc: "Human actor"
    type: "Actor"
  sys1:
    title: "Payment Gateway"
    desc: "External payment system"
    type: "Aggregate"
  evt1:
    title: "Order Placed"
    desc: "Order event"
    type: "Event"
relations:
  - id: r1
    from: user1
    to: evt1
views: {}
journeys: []
`.trim())
    expect(result.status).toBe('warning')
    const sysError = result.diagnostics.find(
      (d) => d.tier === 3 && d.field === 'entities.sys1'
    )
    expect(sysError).toBeDefined()
    expect(sysError!.message).toContain('System node "sys1"')
    expect(sysError!.message).toContain('is not connected to any Event node')
    expect(sysError!.fixHint).toContain('Connect system node "sys1"')

    // user1 is connected to evt1, so no diagnostic for user1
    const userError = result.diagnostics.find(
      (d) => d.tier === 3 && d.field === 'entities.user1'
    )
    expect(userError).toBeUndefined()
  })

  it('passes flowchart when all actor and system nodes connect to an event', () => {
    const result = validateOKFSection(`
type: flowchart
entities:
  user1:
    title: "User"
    desc: "Human actor"
    type: "Actor"
  sys1:
    title: "Payment System"
    desc: "Payment"
    type: "Aggregate"
  evt1:
    title: "Payment Completed"
    desc: "Event"
    type: "Event"
relations:
  - id: r1
    from: user1
    to: sys1
  - id: r2
    from: sys1
    to: evt1
views: {}
journeys: []
`.trim())
    expect(result.status).toBe('valid')
    const connErrors = result.diagnostics.filter(
      (d) => d.tier === 3 && d.message?.includes('not connected to any Event node')
    )
    expect(connErrors.length).toBe(0)
  })

  it('detects unconnected system in raw abstract-flow format', () => {
    const result = validateOKFSection(`
type: flowchart
flow:
  actors:
    user:
      title: "User"
      desc: "User actor"
  systems:
    payment:
      title: "Payment Engine"
      desc: "Handles payments"
      type: "aggregate"
    isolated_sys:
      title: "Isolated System"
      desc: "Not in any step"
      type: "external"
  steps:
    - id: step1
      type: linear
      initiatedBy: user
      policy: "Process Payment"
      command: "Pay"
      handledBy: payment
      resultEvents:
        - id: paid
          title: "Payment Received"
`.trim())
    expect(result.status).toBe('warning')
    const isoError = result.diagnostics.find(
      (d) => d.tier === 3 && d.field === 'entities.isolated_sys'
    )
    expect(isoError).toBeDefined()
    expect(isoError!.message).toContain('Isolated System')
    expect(isoError!.message).toContain('not connected to any Event node')
  })

  it('detects broken edge references in concept-map', () => {
    const result = validateOKFSection(`
type: concept-map
nodes:
  n1:
    id: n1
    title: "Node 1"
    category: "cat"
edges:
  - from: n1
    to: n2
`.trim())
    const brokenRef = result.diagnostics.find(
      (d) => d.tier === 3 && d.field?.includes('to')
    )
    expect(brokenRef).toBeDefined()
    expect(brokenRef!.message).toContain('n2')
  })

  it('detects variable min > max in formula-sandbox', () => {
    const result = validateOKFSection(`
type: formula-sandbox
variables:
  - id: x
    label: "X"
    min: 100
    max: 10
    step: 1
    defaultValue: 50
metrics:
  - id: m1
    label: "M1"
    formula: "1"
    description: "Test"
`.trim())
    const boundsError = result.diagnostics.find(
      (d) => d.tier === 3 && d.message?.includes('min')
    )
    expect(boundsError).toBeDefined()
  })

  it('detects defaultValue outside bounds in formula-sandbox', () => {
    const result = validateOKFSection(`
type: formula-sandbox
variables:
  - id: x
    label: "X"
    min: 0
    max: 10
    step: 1
    defaultValue: 100
metrics:
  - id: m1
    label: "M1"
    formula: "1"
    description: "Test"
`.trim())
    const boundsError = result.diagnostics.find(
      (d) => d.tier === 3 && d.field?.includes('defaultValue')
    )
    expect(boundsError).toBeDefined()
  })

  it('detects formula referencing unknown variable', () => {
    const result = validateOKFSection(`
type: formula-sandbox
variables:
  - id: x
    label: "X"
    min: 0
    max: 100
    step: 1
    defaultValue: 50
metrics:
  - id: m1
    label: "M1"
    formula: "\${x} + \${y}"
    description: "Uses unknown y"
`.trim())
    const refError = result.diagnostics.find(
      (d) => d.tier === 3 && d.message?.includes('unknown variable')
    )
    expect(refError).toBeDefined()
    expect(refError!.message).toContain('y')
  })

  it('detects broken solution reference in reflection-sequence', () => {
    const result = validateOKFSection(`
type: reflection-sequence
challenges:
  - prompt: "Order these"
    items:
      - id: item1
        text: "First"
    solution: [item1, missingItem]
`.trim())
    const refError = result.diagnostics.find(
      (d) => d.tier === 3 && d.field?.includes('solution')
    )
    expect(refError).toBeDefined()
    expect(refError!.message).toContain('missingItem')
  })

  it('detects broken chip reference in reflection-template solution', () => {
    const result = validateOKFSection(`
type: reflection-template
challenges:
  - prompt: "Fill"
    template: "Test {zone1}"
    chips:
      - id: chip1
        text: "A"
    solution:
      zone1: missingChip
`.trim())
    const refError = result.diagnostics.find(
      (d) => d.tier === 3 && d.field?.includes('solution')
    )
    expect(refError).toBeDefined()
    expect(refError!.message).toContain('missingChip')
  })

  it('detects missing solution key for template placeholder in reflection-template', () => {
    const result = validateOKFSection(`
type: reflection-template
challenges:
  - prompt: "Fill"
    template: "Test {zone1} and {zone2}"
    chips:
      - id: chip1
        text: "A"
    solution:
      zone1: chip1
`.trim())
    const missingErr = result.diagnostics.find(
      (d) => d.tier === 3 && d.message?.includes('zone2')
    )
    expect(missingErr).toBeDefined()
    expect(missingErr!.message).toContain('missing from solution')
  })

  it('detects extra solution key not present in template in reflection-template', () => {
    const result = validateOKFSection(`
type: reflection-template
challenges:
  - prompt: "Fill"
    template: "Test {zone1}"
    chips:
      - id: chip1
        text: "A"
    solution:
      zone1: chip1
      extraZone: chip1
`.trim())
    const extraErr = result.diagnostics.find(
      (d) => d.tier === 3 && d.message?.includes('extraZone')
    )
    expect(extraErr).toBeDefined()
    expect(extraErr!.message).toContain('not present in template')
  })
})

// ============================================================================
// ValidationResult Structure & Status
// ============================================================================

describe('ValidationResult structure', () => {
  it('returns valid status for correct section', () => {
    const result = validateOKFSection('type: text\nparagraphs: ["OK"]')
    expect(result.status).toBe('valid')
    expect(result.diagnostics).toEqual([])
    expect(result.payload).toBeDefined()
  })

  it('returns warning status for semantic-only errors', () => {
    const result = validateOKFSection(`
type: scenario
id: s1
title: "T"
intro: "I"
nodes:
  a:
    id: a
startNode: missing
`.trim())
    expect(result.status).toBe('warning')
    expect(result.diagnostics.every((d) => d.tier === 3)).toBe(true)
  })

  it('returns error status for tier 1 errors', () => {
    const result = validateOKFSection('  - [unclosed bracket')
    expect(result.status).toBe('error')
    expect(result.diagnostics.some((d) => d.tier === 1)).toBe(true)
  })

  it('returns error status for tier 2 errors', () => {
    const result = validateOKFSection('type: text\nparagraphs: "not array"')
    expect(result.status).toBe('error')
    expect(result.diagnostics.some((d) => d.tier === 2)).toBe(true)
  })

  it('includes fixHint on diagnostics', () => {
    const result = validateOKFSection('type: text')
    expect(result.diagnostics.some((d) => d.fixHint !== undefined)).toBe(true)
  })

  it('payload contains lastValidData fallback', () => {
    const result = validateOKFSection(`
type: scenario
id: s1
title: "T"
intro: "I"
nodes:
  a:
    id: a
startNode: missing
`.trim())
    expect(result.payload).toBeDefined()
    expect(typeof result.payload).toBe('object')
    expect((result.payload as any).type).toBe('scenario')
  })
})

// ============================================================================
// Context & Formatting
// ============================================================================

describe('ValidationContext', () => {
  it('accepts context parameter', () => {
    const result = validateOKFSection(
      'type: unknown\nfoo: bar',
      undefined,
      { topicId: 'test', sectionName: 'sec1', file: 'sec1/data.yaml' }
    )
    expect(result.diagnostics.length).toBeGreaterThan(0)
  })
})

describe('formatValidationReport', () => {
  it('produces valid JSON', () => {
    const result = validateOKFSection('type: text')
    const report = formatValidationReport(result)
    const parsed = JSON.parse(report)
    expect(parsed.status).toBe('error')
    expect(Array.isArray(parsed.diagnostics)).toBe(true)
  })
})

describe('formatValidationAsPrompt', () => {
  it('produces markdown with tier markers', () => {
    const result = validateOKFSection('type: text')
    const prompt = formatValidationAsPrompt(result)
    expect(prompt).toContain('[Tier 2]')
    expect(prompt).toContain('Suggested Fix')
  })

  it('returns clean message for valid sections', () => {
    const result = validateOKFSection('type: text\nparagraphs: ["OK"]')
    const prompt = formatValidationAsPrompt(result)
    expect(prompt).toContain('No validation errors')
  })
})

describe('KNOWN_SECTION_TYPES', () => {
  it('contains all expected section types', () => {
    expect(KNOWN_SECTION_TYPES.has('text')).toBe(true)
    expect(KNOWN_SECTION_TYPES.has('intro')).toBe(true)
    expect(KNOWN_SECTION_TYPES.has('flowchart')).toBe(true)
    expect(KNOWN_SECTION_TYPES.has('scenario')).toBe(true)
    expect(KNOWN_SECTION_TYPES.has('quiz')).toBe(true)
    expect(KNOWN_SECTION_TYPES.has('flashcards')).toBe(true)
    expect(KNOWN_SECTION_TYPES.has('concept-map')).toBe(true)
    expect(KNOWN_SECTION_TYPES.has('tradeoff-sandbox')).toBe(true)
    expect(KNOWN_SECTION_TYPES.has('formula-sandbox')).toBe(true)
    expect(KNOWN_SECTION_TYPES.has('decision-tree')).toBe(true)
    expect(KNOWN_SECTION_TYPES.has('reflection-sequence')).toBe(true)
    expect(KNOWN_SECTION_TYPES.has('reflection-template')).toBe(true)
    expect(KNOWN_SECTION_TYPES.has('taxonomy-browser')).toBe(true)
    expect(KNOWN_SECTION_TYPES.has('image-gallery')).toBe(true)
    expect(KNOWN_SECTION_TYPES.has('pillar-layer')).toBe(true)
    expect(KNOWN_SECTION_TYPES.has('bullets')).toBe(true)
  })

  it('has 16 section types', () => {
    expect(KNOWN_SECTION_TYPES.size).toBe(16)
  })
})

describe('Tier 3 - Layer Spatial Validation', () => {
  const validLayerYaml = `---
type: pillar-layer
title: Valid Layer Grid
layers:
  - id: l-services
    title: Services
  - id: l-infra
    title: Infrastructure
matrix_blocks:
  - title: Block A
    layer_id: l-services
    col_span: 1
    row_span: 1
  - title: Block B
    layer_id: l-infra
    col_span: 1
    row_span: 1
---
`

  it('validates a correct non-overlapping layer grid', () => {
    const result = validateOKFSection(validLayerYaml)
    expect(result.status).toBe('valid')
    expect(result.diagnostics).toHaveLength(0)
  })

  it('detects unallocated grid gaps when a cell is empty', () => {
    const gapYaml = `---
type: pillar-layer
layers:
  - id: l-services
    title: Services
  - id: l-infra
    title: Infrastructure
matrix_blocks:
  - title: Block A
    layer_id: l-services
    col_span: 1
---
`
    const result = validateOKFSection(gapYaml)
    expect(result.status).toBe('error')
    expect(result.diagnostics.some((d: ValidationDiagnostic) => d.message.includes('GRID_GAP_UNALLOCATED'))).toBe(true)
  })

  it('detects unknown layer_id references', () => {
    const badRefYaml = `---
type: pillar-layer
layers:
  - id: l-services
    title: Services
matrix_blocks:
  - title: Bad Block
    layer_id: unknown-layer
---
`
    const result = validateOKFSection(badRefYaml)
    expect(result.status).toBe('error')
    expect(result.diagnostics.some((d: ValidationDiagnostic) => d.message.includes('INVALID_LAYER_REF'))).toBe(true)
  })

  it('detects 2D rectangle collision between overlapping blocks', () => {
    const overlapYaml = `---
type: pillar-layer
layers:
  - id: l-services
    title: Services
matrix_blocks:
  - title: Block 1
    layer_id: l-services
    col_span: 1
    row_span: 2
  - title: Block 2
    layer_id: l-services
    col_span: 1
    row_span: 1
---
`
    const result = validateOKFSection(overlapYaml)
    expect(result.status).toBe('error')
    expect(result.diagnostics.some((d: ValidationDiagnostic) => d.message.includes('BLOCK_OVERLAP_CONFLICT'))).toBe(true)
    const diag = result.diagnostics.find((d: ValidationDiagnostic) => d.message.includes('BLOCK_OVERLAP_CONFLICT'))
    expect(diag?.fixHint).toBeDefined()
  })
})

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge cases', () => {
  it('handles empty string', () => {
    const result = validateOKFSection('')
    expect(result.status).toBe('error')
  })

  it('handles null YAML', () => {
    const result = validateOKFSection('null')
    expect(result.status).toBe('error')
  })

  it('handles scalar YAML', () => {
    const result = validateOKFSection('just a string')
    expect(result.status).toBe('error')
  })

  it('validates flowchart with broken state machine initialState', () => {
    const result = validateOKFSection(`
type: flowchart
entities:
  engine:
    title: "Engine"
    desc: "Engine entity"
    stateMachine:
      states:
        - id: idle
          label: "Idle"
          color: "#000"
      initialState: running
relations: []
journeys: []
views: {}
`.trim())
    const smError = result.diagnostics.find(
      (d) => d.tier === 3 && d.message?.includes('initialState')
    )
    expect(smError).toBeDefined()
  })
})
