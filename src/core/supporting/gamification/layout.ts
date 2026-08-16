import { HexNodeData, HexGridCoordinate } from './types'

// 6 unit neighbor directions in axial hex grid
const HEX_DIRECTIONS: HexGridCoordinate[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
]

function coordKey(q: number, r: number): string {
  return `${q},${r}`
}

/**
 * Automatically computes flow connections based on the 4.2 Node Type Hierarchy:
 *   1. Capital -> Reading Sanctuaries (Havens)
 *   2. Reading Sanctuaries -> Invading Monster Challenges & Workshops
 *   3. Monster Challenges & Workshops -> Boss Lair
 */
export function getAutoFlowConnections(nodes: HexNodeData[]): Array<{ fromId: string; toId: string }> {
  const connections: Array<{ fromId: string; toId: string }> = []
  const capital = nodes.find((n) => n.type === 'capital')
  const sanctuaries = nodes.filter((n) => n.type === 'reading_sanctuary')
  const workshops = nodes.filter((n) => n.type === 'tradeoff_workshop')
  const challenges = nodes.filter((n) => n.type === 'quiz_encounter' || n.type === 'reflection_decryption')
  const boss = nodes.find((n) => n.type === 'boss_lair')

  if (capital) {
    sanctuaries.forEach((sanctuary) => {
      connections.push({ fromId: capital.id, toId: sanctuary.id })
    })
  }

  sanctuaries.forEach((sanctuary, index) => {
    // Pair workshops and invading challenges to sanctuaries
    if (workshops.length > 0) {
      const workshop = workshops[index % workshops.length]
      if (!connections.some((c) => c.fromId === sanctuary.id && c.toId === workshop.id)) {
        connections.push({ fromId: sanctuary.id, toId: workshop.id })
      }
    }
    if (challenges.length > 0) {
      const challenge = challenges[index % challenges.length]
      if (!connections.some((c) => c.fromId === sanctuary.id && c.toId === challenge.id)) {
        connections.push({ fromId: sanctuary.id, toId: challenge.id })
      }
    }
  })

  // Distribute remaining challenges across sanctuaries if more challenges exist than sanctuaries
  challenges.forEach((challenge, index) => {
    const parentSanctuary = sanctuaries[index % Math.max(1, sanctuaries.length)]
    if (parentSanctuary && !connections.some((c) => c.toId === challenge.id)) {
      connections.push({ fromId: parentSanctuary.id, toId: challenge.id })
    }
  })

  if (boss) {
    challenges.forEach((challenge) => {
      connections.push({ fromId: challenge.id, toId: boss.id })
    })
    if (challenges.length === 0 && workshops.length > 0) {
      workshops.forEach((workshop) => {
        connections.push({ fromId: workshop.id, toId: boss.id })
      })
    }
  }

  return connections
}

/**
 * Automatically computes axial hex coordinates (q, r) placing invading Monster Challenges
 * and Workshops in immediate adjacent hex slots directly next to their target Sanctuary (Haven).
 */
export function computeHexGridCoordinates(nodes: HexNodeData[]): Map<string, HexGridCoordinate> {
  const coordMap = new Map<string, HexGridCoordinate>()
  const occupiedCoords = new Set<string>()

  if (nodes.length === 0) return coordMap

  const capitalNode = nodes.find((n) => n.type === 'capital') || nodes[0]
  const sanctuaries = nodes.filter((n) => n.type === 'reading_sanctuary')
  const bossNode = nodes.find((n) => n.type === 'boss_lair')
  const autoConns = getAutoFlowConnections(nodes)

  // 1. Ring 0: Capital at center (0, 0)
  coordMap.set(capitalNode.id, { q: 0, r: 0 })
  occupiedCoords.add(coordKey(0, 0))

  // Helper: Find closest free hex slot adjacent to baseCoord sorted by preferred outward angle
  function findFreeSlot(baseCoord: HexGridCoordinate, preferredAngle?: number): HexGridCoordinate {
    let directions = [...HEX_DIRECTIONS]

    if (preferredAngle !== undefined) {
      directions.sort((a, b) => {
        const angleA = Math.atan2(a.r + a.q / 2, a.q * 1.5)
        const angleB = Math.atan2(b.r + b.q / 2, b.q * 1.5)
        return Math.abs(angleA - preferredAngle) - Math.abs(angleB - preferredAngle)
      })
    }

    // Check immediate radius 1 adjacent slots (distance = 1)
    for (const dir of directions) {
      const q = baseCoord.q + dir.q
      const r = baseCoord.r + dir.r
      const key = coordKey(q, r)
      if (!occupiedCoords.has(key)) return { q, r }
    }

    // Check radius 2+ slots if immediate neighbors are full
    for (let radius = 2; radius <= 8; radius++) {
      for (const dir of directions) {
        const q = baseCoord.q + dir.q * radius
        const r = baseCoord.r + dir.r * radius
        const key = coordKey(q, r)
        if (!occupiedCoords.has(key)) return { q, r }
      }
    }

    return { q: 0, r: 0 }
  }

  // 2. Ring 1: Arrange Sanctuaries radially around Capital
  sanctuaries.forEach((sanctuary, index) => {
    const angle = (index * (2 * Math.PI)) / Math.max(1, sanctuaries.length) - Math.PI / 2
    const slot = findFreeSlot({ q: 0, r: 0 }, angle)
    coordMap.set(sanctuary.id, slot)
    occupiedCoords.add(coordKey(slot.q, slot.r))
  })

  // 3. Ring 2: Place Invading Monster Challenges & Workshops directly adjacent to their Sanctuary
  sanctuaries.forEach((sanctuary) => {
    const sanctuaryCoord = coordMap.get(sanctuary.id)!
    const outwardAngle = Math.atan2(sanctuaryCoord.r + sanctuaryCoord.q / 2, sanctuaryCoord.q * 1.5)

    // Find all children (invading monsters & workshops) attached to this sanctuary
    const attachedChildren = nodes.filter((n) =>
      autoConns.some((c) => c.fromId === sanctuary.id && c.toId === n.id)
    )

    attachedChildren.forEach((child, idx) => {
      if (!coordMap.has(child.id)) {
        // Spread invading monsters slightly around the sanctuary's outward angle
        const spreadAngle = outwardAngle + ((idx - (attachedChildren.length - 1) / 2) * Math.PI) / 4
        const slot = findFreeSlot(sanctuaryCoord, spreadAngle)
        coordMap.set(child.id, slot)
        occupiedCoords.add(coordKey(slot.q, slot.r))
      }
    })
  })

  // 4. Ring 3: Place Boss Lair at top perimeter
  if (bossNode && !coordMap.has(bossNode.id)) {
    const slot = findFreeSlot({ q: 0, r: 0 }, -Math.PI / 2)
    coordMap.set(bossNode.id, slot)
    occupiedCoords.add(coordKey(slot.q, slot.r))
  }

  // 5. Fallback for unmapped nodes
  nodes.forEach((node) => {
    if (!coordMap.has(node.id)) {
      const slot = findFreeSlot({ q: 0, r: 0 })
      coordMap.set(node.id, slot)
      occupiedCoords.add(coordKey(slot.q, slot.r))
    }
  })

  return coordMap
}
