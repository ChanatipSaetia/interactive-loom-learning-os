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
 * Automatically computes flow connections based on the 4.2 Node Type & Dependency Hierarchy:
 *   - Capital -> Entry Sanctuaries & Entry Challenges
 *   - Sanctuaries -> Invading Monster Challenges & Workshops
 *   - Challenges -> Downstream Sanctuaries, Workshops & Boss Lair
 */
export function getAutoFlowConnections(nodes: HexNodeData[]): Array<{ fromId: string; toId: string }> {
  const connections: Array<{ fromId: string; toId: string }> = []
  const capital = nodes.find((n) => n.type === 'capital')
  const sanctuaries = nodes.filter((n) => n.type === 'reading_sanctuary')
  const workshops = nodes.filter((n) => n.type === 'tradeoff_workshop')
  const challenges = nodes.filter((n) => n.type === 'quiz_encounter' || n.type === 'reflection_decryption')
  const boss = nodes.find((n) => n.type === 'boss_lair')

  if (!capital) return connections

  // Split sanctuaries into primary entry sanctuaries (first 3) and deep sanctuaries (dependent on challenges)
  const entrySanctuaries = sanctuaries.slice(0, Math.min(3, sanctuaries.length))
  const deepSanctuaries = sanctuaries.slice(Math.min(3, sanctuaries.length))

  // 1. Capital connects to Entry Sanctuaries
  entrySanctuaries.forEach((sanctuary) => {
    connections.push({ fromId: capital.id, toId: sanctuary.id })
  })

  // 2. Entry Sanctuaries connect to Invading Challenges & Workshops
  entrySanctuaries.forEach((sanctuary, index) => {
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

  // 3. Deep Sanctuaries connect from Challenges (Challenges -> Deep Sanctuaries)
  deepSanctuaries.forEach((sanctuary, index) => {
    if (challenges.length > 0) {
      const parentChallenge = challenges[index % challenges.length]
      connections.push({ fromId: parentChallenge.id, toId: sanctuary.id })
    } else {
      connections.push({ fromId: capital.id, toId: sanctuary.id })
    }
  })

  // 4. Distribute any remaining unmapped challenges
  challenges.forEach((challenge, index) => {
    if (!connections.some((c) => c.toId === challenge.id)) {
      const parentSanctuary = sanctuaries[index % Math.max(1, sanctuaries.length)]
      if (parentSanctuary) {
        connections.push({ fromId: parentSanctuary.id, toId: challenge.id })
      } else {
        connections.push({ fromId: capital.id, toId: challenge.id })
      }
    }
  })

  // 5. Outer Challenges & Deep Sanctuaries connect to Boss Lair
  if (boss) {
    challenges.forEach((challenge) => {
      if (!connections.some((c) => c.fromId === challenge.id && c.toId === boss.id)) {
        connections.push({ fromId: challenge.id, toId: boss.id })
      }
    })
    deepSanctuaries.forEach((sanctuary) => {
      if (!connections.some((c) => c.fromId === sanctuary.id && c.toId === boss.id)) {
        connections.push({ fromId: sanctuary.id, toId: boss.id })
      }
    })
  }

  return connections
}

/**
 * Game System Rule: Returns true if the main Capital city in the campaign has been visited & cleared.
 */
export function isCapitalVisited(nodes: HexNodeData[]): boolean {
  return nodes.some((n) => n.type === 'capital' && n.status === 'cleared')
}

/**
 * Game System Rule: Key Item locations and reward previews are revealed on map tiles and in the inspector
 * only after the main Capital city is cleared or if the node itself has been cleared.
 */
export function isKeyItemLocationRevealed(nodes: HexNodeData[], node: HexNodeData): boolean {
  return (isCapitalVisited(nodes) || node.status === 'cleared') && !!node.rewards && node.rewards.length > 0
}

/**
 * Game System Rule: Retrieves all nodes with revealed key item locations when the Capital city is cleared.
 */
export function getRevealedKeyItemNodes(nodes: HexNodeData[]): HexNodeData[] {
  if (!isCapitalVisited(nodes)) return []
  return nodes.filter((n) => n.rewards && n.rewards.length > 0)
}

/**
 * Automatically computes axial hex coordinates (q, r) using flow-graph traversal:
 *   - Nodes are placed in immediate adjacent hex slots (distance = 1) directly next to their prerequisite parent node.
 */
export function computeHexGridCoordinates(nodes: HexNodeData[]): Map<string, HexGridCoordinate> {
  const coordMap = new Map<string, HexGridCoordinate>()
  const occupiedCoords = new Set<string>()

  if (nodes.length === 0) return coordMap

  const capitalNode = nodes.find((n) => n.type === 'capital') || nodes[0]
  const bossNode = nodes.find((n) => n.type === 'boss_lair')
  const autoConns = getAutoFlowConnections(nodes)

  // 1. Root Capital at center (0, 0)
  coordMap.set(capitalNode.id, { q: 0, r: 0 })
  occupiedCoords.add(coordKey(0, 0))

  // Helper: Find closest free hex slot adjacent to baseCoord
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

  // 2. Breadth-First Flow Graph Traversal from Capital
  const queue: string[] = [capitalNode.id]
  const visited = new Set<string>([capitalNode.id])

  while (queue.length > 0) {
    const parentId = queue.shift()!
    const parentCoord = coordMap.get(parentId)!
    const parentOutwardAngle = Math.atan2(parentCoord.r + parentCoord.q / 2, parentCoord.q * 1.5)

    // Find all unplaced child nodes attached to parentId
    const childConnections = autoConns.filter((c) => c.fromId === parentId)

    childConnections.forEach((conn, index) => {
      const childNode = nodes.find((n) => n.id === conn.toId)
      if (childNode && !coordMap.has(childNode.id)) {
        const angleOffset = ((index - (childConnections.length - 1) / 2) * Math.PI) / 3
        const targetAngle = parentId === capitalNode.id
          ? (index * 2 * Math.PI) / Math.max(1, childConnections.length) - Math.PI / 2
          : parentOutwardAngle + angleOffset

        const slot = findFreeSlot(parentCoord, targetAngle)
        coordMap.set(childNode.id, slot)
        occupiedCoords.add(coordKey(slot.q, slot.r))
      }

      if (childNode && !visited.has(childNode.id)) {
        visited.add(childNode.id)
        queue.push(childNode.id)
      }
    })
  }

  // 3. Place Boss Lair if unplaced at top perimeter
  if (bossNode && !coordMap.has(bossNode.id)) {
    const parentConns = autoConns.filter((c) => c.toId === bossNode.id)
    const primaryParent = parentConns.length > 0 ? nodes.find((n) => n.id === parentConns[0].fromId) : null
    const baseCoord = primaryParent ? coordMap.get(primaryParent.id) || { q: 0, r: 0 } : { q: 0, r: 0 }
    const slot = findFreeSlot(baseCoord, -Math.PI / 2)
    coordMap.set(bossNode.id, slot)
    occupiedCoords.add(coordKey(slot.q, slot.r))
  }

  // 4. Fallback for unplaced nodes
  nodes.forEach((node) => {
    if (!coordMap.has(node.id)) {
      const slot = findFreeSlot({ q: 0, r: 0 })
      coordMap.set(node.id, slot)
      occupiedCoords.add(coordKey(slot.q, slot.r))
    }
  })

  return coordMap
}
