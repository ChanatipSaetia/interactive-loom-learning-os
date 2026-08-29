import { describe, it, expect } from 'vitest'
import {
  computeHexGridCoordinates,
  getAutoFlowConnections,
  isCapitalVisited,
  isKeyItemLocationRevealed,
  getRevealedKeyItemNodes,
  axialDistance,
  getNodeDependencies,
} from '../../../../../src/core/supporting/gamification/layout'
import { HexNodeData } from '../../../../../src/core/supporting/gamification/types'

describe('Hex Grid Auto-Layout Engine (layout.ts)', () => {
  it('assigns origin (0, 0) to the capital root node', () => {
    const nodes: HexNodeData[] = [
      {
        id: 'capital-0',
        title: 'Capital',
        type: 'capital',
        status: 'unlocked',
        description: 'Root Node',
      },
    ]

    const coords = computeHexGridCoordinates(nodes)
    expect(coords.get('capital-0')).toEqual({ q: 0, r: 0 })
  })

  it('always places the boss lair immediately adjacent to the hub (axial distance = 1)', () => {
    const nodes: HexNodeData[] = [
      { id: 'capital-0', title: 'Capital', type: 'capital', status: 'unlocked', description: 'Cap' },
      { id: 'sanctuary-1', title: 'Sanctuary 1', type: 'reading_sanctuary', status: 'unlocked', description: 'S1' },
      { id: 'boss-1', title: 'Dragon', type: 'boss_lair', status: 'locked', description: 'Boss' },
    ]

    const coords = computeHexGridCoordinates(nodes)
    const capCoord = coords.get('capital-0')!
    const bossCoord = coords.get('boss-1')!

    expect(capCoord).toEqual({ q: 0, r: 0 })
    expect(bossCoord).toBeDefined()
    expect(axialDistance(capCoord, bossCoord)).toBe(1)
  })

  it('scatters sanctuaries with possible gaps from the hub and places challenges adjacent to their sanctuary (distance = 1)', () => {
    const nodes: HexNodeData[] = [
      { id: 'capital-0', title: 'Capital', type: 'capital', status: 'cleared', description: 'Cap' },
      { id: 'sanctuary-1', title: 'Sanctuary 1', type: 'reading_sanctuary', status: 'unlocked', description: 'S1' },
      {
        id: 'quiz-1',
        title: 'Quiz 1',
        type: 'quiz_encounter',
        status: 'locked',
        unlockedBy: ['sanctuary-1'],
        description: 'Quiz 1',
      },
      { id: 'sanctuary-2', title: 'Spire 2', type: 'archive_spire', status: 'unlocked', description: 'S2' },
      {
        id: 'reflection-1',
        title: 'Reflection 1',
        type: 'reflection_decryption',
        status: 'locked',
        dependsOn: ['sanctuary-2'],
        description: 'R1',
      },
      { id: 'forge-1', title: 'Forge 1', type: 'tradeoff_workshop', status: 'unlocked', description: 'F1' },
      { id: 'boss-1', title: 'Dragon', type: 'boss_lair', status: 'locked', description: 'Boss' },
    ]

    const coords = computeHexGridCoordinates(nodes, { seed: 42 })

    const capCoord = coords.get('capital-0')!
    const s1Coord = coords.get('sanctuary-1')!
    const q1Coord = coords.get('quiz-1')!
    const s2Coord = coords.get('sanctuary-2')!
    const r1Coord = coords.get('reflection-1')!
    const f1Coord = coords.get('forge-1')!
    const bossCoord = coords.get('boss-1')!

    // Capital at (0, 0)
    expect(capCoord).toEqual({ q: 0, r: 0 })

    // Boss adjacent to hub (distance = 1)
    expect(axialDistance(capCoord, bossCoord)).toBe(1)

    // Sanctuaries and forges placed on map with distance gap from hub (distance >= 3, not adjacent to hub)
    expect(axialDistance(capCoord, s1Coord)).toBeGreaterThanOrEqual(3)
    expect(axialDistance(capCoord, s2Coord)).toBeGreaterThanOrEqual(3)
    expect(axialDistance(capCoord, f1Coord)).toBeGreaterThanOrEqual(3)

    // Sanctuaries & Forges have distance gaps between each other (distance >= 2)
    expect(axialDistance(s1Coord, s2Coord)).toBeGreaterThanOrEqual(2)
    expect(axialDistance(s1Coord, f1Coord)).toBeGreaterThanOrEqual(2)
    expect(axialDistance(s2Coord, f1Coord)).toBeGreaterThanOrEqual(2)

    // Challenges placed immediately adjacent (distance = 1) to their parent sanctuary
    expect(axialDistance(s1Coord, q1Coord)).toBe(1)
    expect(axialDistance(s2Coord, r1Coord)).toBe(1)

    // All coordinates must be unique
    const coordKeys = Array.from(coords.values()).map((c) => `${c.q},${c.r}`)
    const uniqueKeys = new Set(coordKeys)
    expect(uniqueKeys.size).toBe(nodes.length)
  })

  it('generates flow connections from schema dependencies (unlockedBy / dependsOn / parentId)', () => {
    const nodes: HexNodeData[] = [
      { id: 'capital-0', title: 'Capital', type: 'capital', status: 'cleared', description: 'Cap' },
      { id: 'sanctuary-1', title: 'Haven 1', type: 'reading_sanctuary', unlockedBy: ['capital-0'], status: 'unlocked', description: 'Haven' },
      { id: 'quiz-1', title: 'Goblin', type: 'quiz_encounter', dependsOn: ['sanctuary-1'], status: 'locked', description: 'Quiz' },
      { id: 'boss-1', title: 'Dragon', type: 'boss_lair', status: 'locked', description: 'Boss' },
    ]

    const connections = getAutoFlowConnections(nodes)

    expect(connections).toContainEqual({ fromId: 'capital-0', toId: 'sanctuary-1' })
    expect(connections).toContainEqual({ fromId: 'sanctuary-1', toId: 'quiz-1' })
    expect(connections).toContainEqual({ fromId: 'capital-0', toId: 'boss-1' })
  })

  it('correctly evaluates game system rule: isCapitalVisited', () => {
    const unvisitedNodes: HexNodeData[] = [
      { id: 'capital-0', title: 'Capital', type: 'capital', status: 'unlocked', description: 'Cap' },
    ]
    const visitedNodes: HexNodeData[] = [
      { id: 'capital-0', title: 'Capital', type: 'capital', status: 'cleared', description: 'Cap' },
    ]

    expect(isCapitalVisited(unvisitedNodes)).toBe(false)
    expect(isCapitalVisited(visitedNodes)).toBe(true)
  })

  it('correctly evaluates game system rule: isKeyItemLocationRevealed and getRevealedKeyItemNodes', () => {
    const unvisitedNodes: HexNodeData[] = [
      { id: 'capital-0', title: 'Capital', type: 'capital', status: 'unlocked', description: 'Cap' },
      {
        id: 'quiz-1',
        title: 'Challenge',
        type: 'quiz_encounter',
        status: 'locked',
        description: 'Quiz',
        rewards: [{ id: 'shield', name: 'Shield', icon: '🛡️', description: 'Shield item' }],
      },
    ]

    expect(isKeyItemLocationRevealed(unvisitedNodes, unvisitedNodes[1])).toBe(false)
    expect(getRevealedKeyItemNodes(unvisitedNodes)).toHaveLength(0)

    const visitedNodes: HexNodeData[] = [
      { id: 'capital-0', title: 'Capital', type: 'capital', status: 'cleared', description: 'Cap' },
      {
        id: 'quiz-1',
        title: 'Challenge',
        type: 'quiz_encounter',
        status: 'locked',
        description: 'Quiz',
        rewards: [{ id: 'shield', name: 'Shield', icon: '🛡️', description: 'Shield item' }],
      },
    ]

    expect(isKeyItemLocationRevealed(visitedNodes, visitedNodes[1])).toBe(true)
    expect(getRevealedKeyItemNodes(visitedNodes)).toEqual([visitedNodes[1]])
  })

  it('correctly extracts node dependencies via getNodeDependencies', () => {
    const nodeA: HexNodeData = { id: 'a', title: 'A', type: 'reading_sanctuary', status: 'unlocked', description: '', parentId: 'cap' }
    const nodeB: HexNodeData = { id: 'b', title: 'B', type: 'quiz_encounter', status: 'locked', description: '', unlockedBy: ['a'] }
    const nodeC: HexNodeData = { id: 'c', title: 'C', type: 'tradeoff_workshop', status: 'locked', description: '', dependsOn: ['b'] }

    expect(getNodeDependencies(nodeA)).toEqual(['cap'])
    expect(getNodeDependencies(nodeB)).toEqual(['a'])
    expect(getNodeDependencies(nodeC)).toEqual(['b'])
  })
})
