import { describe, it, expect } from 'vitest'
import { computeHexGridCoordinates, getAutoFlowConnections } from '../../../../../src/core/supporting/gamification/layout'
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
})
