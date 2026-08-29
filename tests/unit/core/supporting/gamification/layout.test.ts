import { describe, it, expect } from 'vitest'
import {
  computeHexGridCoordinates,
  getAutoFlowConnections,
  isCapitalVisited,
  isKeyItemLocationRevealed,
  getRevealedKeyItemNodes,
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

  it('computes unique 4.2 hex coordinates for Sanctuaries and Workshops without unlockedBy dependencies', () => {
    const nodes: HexNodeData[] = [
      {
        id: 'capital-0',
        title: 'Capital',
        type: 'capital',
        status: 'cleared',
        description: 'Root Node',
      },
      {
        id: 'sanctuary-1',
        title: 'Sanctuary 1',
        type: 'reading_sanctuary',
        status: 'unlocked',
        description: 'Sanctuary 1',
      },
      {
        id: 'quiz-1',
        title: 'Quiz 1',
        type: 'quiz_encounter',
        status: 'unlocked',
        description: 'Quiz 1',
      },
    ]

    const coords = computeHexGridCoordinates(nodes)

    expect(coords.get('capital-0')).toEqual({ q: 0, r: 0 })

    const sanctuaryCoord = coords.get('sanctuary-1')!
    const quizCoord = coords.get('quiz-1')!

    expect(sanctuaryCoord).toBeDefined()
    expect(quizCoord).toBeDefined()

    const sanctuaryKey = `${sanctuaryCoord.q},${sanctuaryCoord.r}`
    const quizKey = `${quizCoord.q},${quizCoord.r}`
    expect(sanctuaryKey).not.toBe(quizKey)
    expect(sanctuaryKey).not.toBe('0,0')
  })

  it('generates automatic 4.2 flow connections (Capital -> Sanctuaries -> Challenges/Workshops -> Boss)', () => {
    const nodes: HexNodeData[] = [
      { id: 'capital-0', title: 'Capital', type: 'capital', status: 'cleared', description: 'Cap' },
      { id: 'sanctuary-1', title: 'Haven 1', type: 'reading_sanctuary', status: 'unlocked', description: 'Haven' },
      { id: 'quiz-1', title: 'Goblin', type: 'quiz_encounter', status: 'locked', description: 'Quiz' },
      { id: 'boss-1', title: 'Dragon', type: 'boss_lair', status: 'locked', description: 'Boss' },
    ]

    const connections = getAutoFlowConnections(nodes)

    expect(connections).toContainEqual({ fromId: 'capital-0', toId: 'sanctuary-1' })
    expect(connections).toContainEqual({ fromId: 'sanctuary-1', toId: 'quiz-1' })
    expect(connections).toContainEqual({ fromId: 'quiz-1', toId: 'boss-1' })
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

  it('connects and fogs all sanctuary variants (archive_spire, simulation_nexus, concept_monolith, observatory_gallery) correctly', () => {
    const nodes: HexNodeData[] = [
      { id: 'capital-0', title: 'Capital', type: 'capital', status: 'cleared', description: 'Cap' },
      { id: 'spire-1', title: 'Spire', type: 'archive_spire', status: 'unlocked', description: 'Archive' },
      { id: 'nexus-1', title: 'Nexus', type: 'simulation_nexus', status: 'unlocked', description: 'Sim' },
      { id: 'monolith-1', title: 'Monolith', type: 'concept_monolith', status: 'unlocked', description: 'Concept' },
      { id: 'quiz-1', title: 'Quiz', type: 'quiz_encounter', status: 'locked', description: 'Quiz' },
      { id: 'boss-1', title: 'Boss', type: 'boss_lair', status: 'locked', description: 'Boss' },
    ]

    const conns = getAutoFlowConnections(nodes)
    expect(conns).toContainEqual({ fromId: 'capital-0', toId: 'spire-1' })
    expect(conns).toContainEqual({ fromId: 'capital-0', toId: 'nexus-1' })
    expect(conns).toContainEqual({ fromId: 'capital-0', toId: 'monolith-1' })
    expect(conns).toContainEqual({ fromId: 'spire-1', toId: 'quiz-1' })
    expect(conns).toContainEqual({ fromId: 'quiz-1', toId: 'boss-1' })
  })
})
