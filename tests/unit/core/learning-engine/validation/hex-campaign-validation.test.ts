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
    sectionRef: "quiz"
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
})
