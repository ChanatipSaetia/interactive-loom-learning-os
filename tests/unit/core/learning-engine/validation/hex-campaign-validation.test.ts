import { describe, it, expect } from 'vitest'
import { validateHexCampaign } from '../../../../../src/core/learning-engine/validation/gateway'

describe('Hex Campaign 3-Tier Validation Gateway', () => {
  const validCampaignYaml = `
topicId: "demo"
topicTitle: "Demo Architecture Realm"
capitalId: "capital"
nodes:
  - id: "capital"
    title: "Capital City"
    type: "capital"
    coordinates: { q: 0, r: 0 }
    status: "unlocked"
    sectionRef: "intro"
  - id: "goblin-camp"
    title: "Goblin Camp"
    type: "quiz_encounter"
    coordinates: { q: 0, r: -1 }
    status: "locked"
    sectionRef: "quiz"
    monster:
      id: "goblin"
      name: "Dependency Goblin"
      type: "goblin"
      maxHp: 30
      damage: 10
    rewards:
      - id: "adapter-shield"
        name: "Adapter Shield"
  - id: "dragon-lair"
    title: "Dragon Boss"
    type: "boss_lair"
    coordinates: { q: 0, r: -2 }
    status: "locked"
    requiredItems:
      - "adapter-shield"
`

  it('validates a correct Hex Campaign YAML across all 3 tiers', () => {
    const result = validateHexCampaign(validCampaignYaml, ['intro', 'quiz'])
    expect(result.status).toBe('valid')
    expect(result.diagnostics).toHaveLength(0)
    expect(result.payload.topicId).toBe('demo')
    expect(result.payload.nodes).toHaveLength(3)
  })

  it('catches duplicate node IDs (Tier 3)', () => {
    const duplicateIdYaml = `
topicId: "demo"
topicTitle: "Demo Realm"
nodes:
  - id: "capital"
    title: "Capital"
    type: "capital"
  - id: "capital"
    title: "Duplicate Capital"
    type: "reading_sanctuary"
`
    const result = validateHexCampaign(duplicateIdYaml)
    expect(result.status).toBe('warning')
    expect(result.diagnostics.some((d) => d.tier === 3 && d.message.includes("Duplicate hex node ID 'capital'"))).toBe(true)
  })

  it('catches missing capital starting node (Tier 3)', () => {
    const noCapitalYaml = `
topicId: "demo"
topicTitle: "Demo Realm"
nodes:
  - id: "goblin-camp"
    title: "Goblin Camp"
    type: "quiz_encounter"
    coordinates: { q: 0, r: 1 }
`
    const result = validateHexCampaign(noCapitalYaml)
    expect(result.status).toBe('warning')
    expect(result.diagnostics.some((d) => d.message.includes('capital'))).toBe(true)
  })

  it('catches unsolvable boss requirements (Tier 3)', () => {
    const unsolvableBossYaml = `
topicId: "demo"
topicTitle: "Demo Realm"
nodes:
  - id: "capital"
    title: "Capital"
    type: "capital"
    coordinates: { q: 0, r: 0 }
  - id: "boss"
    title: "Boss"
    type: "boss_lair"
    coordinates: { q: 0, r: -1 }
    requiredItems:
      - "non-existent-blade"
`
    const result = validateHexCampaign(unsolvableBossYaml)
    expect(result.status).toBe('warning')
    expect(result.diagnostics.some((d) => d.message.includes("requires item 'non-existent-blade'"))).toBe(true)
  })

  it('catches dropped items not required by the boss encounter (Tier 3)', () => {
    const orphanItemYaml = `
topicId: "demo"
topicTitle: "Demo Realm"
nodes:
  - id: "capital"
    title: "Capital"
    type: "capital"
    sectionRef: "intro"
  - id: "goblin-camp"
    title: "Goblin Camp"
    type: "quiz_encounter"
    sectionRef: "quiz"
    rewards:
      - id: "shield"
        name: "Shield"
      - id: "orphan-blade"
        name: "Orphan Blade"
  - id: "boss"
    title: "Boss"
    type: "boss_lair"
    requiredItems:
      - "shield"
`
    const result = validateHexCampaign(orphanItemYaml, ['intro', 'quiz'])
    expect(result.status).toBe('warning')
    expect(result.diagnostics.some((d) => d.tier === 3 && d.message.includes("Dropped key item 'orphan-blade' is not required by boss lair 'boss'"))).toBe(true)
  })

  it('catches invalid sectionRef (Tier 3)', () => {
    const invalidRefYaml = `
topicId: "demo"
topicTitle: "Demo Realm"
nodes:
  - id: "capital"
    title: "Capital"
    type: "capital"
    coordinates: { q: 0, r: 0 }
    sectionRef: "missing-section"
`
    const result = validateHexCampaign(invalidRefYaml, ['intro', 'quiz'])
    expect(result.status).toBe('warning')
    expect(result.diagnostics.some((d) => d.message.includes("Referenced section 'missing-section' not found"))).toBe(true)
  })

  it('catches duplicate sectionRef across nodes (Tier 3)', () => {
    const duplicateRefYaml = `
topicId: "demo"
topicTitle: "Demo Realm"
nodes:
  - id: "capital"
    title: "Capital"
    type: "capital"
    sectionRef: "intro"
  - id: "goblin-camp"
    title: "Goblin Camp"
    type: "quiz_encounter"
    sectionRef: "quiz"
  - id: "orc-camp"
    title: "Orc Camp"
    type: "quiz_encounter"
    sectionRef: "quiz"
`
    const result = validateHexCampaign(duplicateRefYaml, ['intro', 'quiz'])
    expect(result.status).toBe('warning')
    expect(result.diagnostics.some((d) => d.tier === 3 && d.message.includes("Duplicate sectionRef 'quiz'"))).toBe(true)
  })

  it('catches missing OKF section coverage (Tier 3)', () => {
    const incompleteCampaignYaml = `
topicId: "demo"
topicTitle: "Demo Realm"
nodes:
  - id: "capital"
    title: "Capital"
    type: "capital"
    sectionRef: "intro"
  - id: "goblin-camp"
    title: "Goblin Camp"
    type: "quiz_encounter"
    sectionRef: "quiz"
`
    const result = validateHexCampaign(incompleteCampaignYaml, ['intro', 'quiz', 'flowchart', 'tradeoffs'])
    expect(result.status).toBe('warning')
    expect(result.diagnostics.some((d) => d.tier === 3 && d.message.includes('missing mappings for 2 OKF section(s)'))).toBe(true)
  })

  it('prohibits key item rewards declared in boss_lair encounter', () => {
    const bossWithRewardsYaml = `
topicId: "demo"
topicTitle: "Demo Realm"
nodes:
  - id: "capital"
    title: "Capital"
    type: "capital"
  - id: "boss"
    title: "Boss"
    type: "boss_lair"
    rewards:
      - id: "illegal-key-item"
        name: "Illegal Item"
`
    const result = validateHexCampaign(bossWithRewardsYaml)
    expect(result.status).toBe('warning')
    expect(result.diagnostics.some((d) => d.message.includes('must not declare any key item rewards') || d.message.includes('must not declare dropped key item rewards'))).toBe(true)
  })

  it('validates campaigns with new reading variants (archive_spire, simulation_nexus, concept_monolith, observatory_gallery)', () => {
    const multiVariantYaml = `
topicId: "demo"
topicTitle: "Demo Multi-Variant Realm"
nodes:
  - id: "capital"
    title: "Capital"
    type: "capital"
    sectionRef: "intro"
  - id: "spire"
    title: "Taxonomy Archive"
    type: "archive_spire"
    sectionRef: "taxonomy"
  - id: "nexus"
    title: "Simulation Nexus"
    type: "simulation_nexus"
    sectionRef: "flowchart"
  - id: "monolith"
    title: "Concept Monolith"
    type: "concept_monolith"
    sectionRef: "concept-map"
  - id: "gallery"
    title: "Observatory Gallery"
    type: "observatory_gallery"
    sectionRef: "gallery"
`
    const result = validateHexCampaign(multiVariantYaml, ['intro', 'taxonomy', 'flowchart', 'concept-map', 'gallery'])
    expect(result.status).toBe('valid')
    expect(result.payload.nodes).toHaveLength(5)
  })
})

