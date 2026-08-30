import { HexNodeData, HexGridCoordinate } from './types'

// 6 unit neighbor directions in axial hex grid
export const HEX_DIRECTIONS: HexGridCoordinate[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
]

export function coordKey(q: number, r: number): string {
  return `${q},${r}`
}

/**
 * Calculates the axial Manhattan distance between two hex coordinates.
 */
export function axialDistance(a: HexGridCoordinate, b: HexGridCoordinate): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2
}

export function isSanctuary(type?: string): boolean {
  return (
    type === 'reading_sanctuary' ||
    type === 'archive_spire' ||
    type === 'simulation_nexus' ||
    type === 'concept_monolith' ||
    type === 'observatory_gallery'
  )
}

export function isSanctuaryOrForge(type?: string): boolean {
  return isSanctuary(type)
}

/**
 * Helper to extract declared dependency IDs for a node from schema fields
 * (unlockedBy, dependsOn, parentId).
 */
export function getNodeDependencies(node: HexNodeData): string[] {
  const deps = new Set<string>()
  if (node.parentId) deps.add(node.parentId)
  if (node.unlockedBy && Array.isArray(node.unlockedBy)) {
    node.unlockedBy.forEach((d) => deps.add(d))
  }
  if (node.dependsOn && Array.isArray(node.dependsOn)) {
    node.dependsOn.forEach((d) => deps.add(d))
  }
  return Array.from(deps)
}

/**
 * Computes flow connections directly from the hex schema dependencies:
 *   - Explicit dependencies (unlockedBy / dependsOn / parentId) define flow edges.
 *   - Challenge nodes without explicit dependencies default to their preceding sanctuary.
 *   - Boss Lair connects from Capital (and preceding challenges).
 *   - Sanctuaries without explicit dependencies connect from Capital.
 */
export function getAutoFlowConnections(nodes: HexNodeData[]): Array<{ fromId: string; toId: string }> {
  const connections: Array<{ fromId: string; toId: string }> = []
  const capital = nodes.find((n) => n.type === 'capital')
  if (!capital && nodes.length === 0) return connections

  const capitalId = capital?.id || nodes[0]?.id

  nodes.forEach((node, index) => {
    if (node.type === 'capital') return

    const declaredDeps = getNodeDependencies(node)
    if (declaredDeps.length > 0) {
      declaredDeps.forEach((depId) => {
        if (!connections.some((c) => c.fromId === depId && c.toId === node.id)) {
          connections.push({ fromId: depId, toId: node.id })
        }
      })
      return
    }

    // Default / fallback dependencies when not explicitly declared in schema
    if (node.type === 'boss_lair') {
      if (!connections.some((c) => c.fromId === capitalId && c.toId === node.id)) {
        connections.push({ fromId: capitalId, toId: node.id })
      }
      return
    }

    if (node.type === 'quiz_encounter' || node.type === 'reflection_decryption') {
      // Find the nearest sanctuary before this node in the node list
      let parentSanctuary: HexNodeData | undefined
      for (let i = index - 1; i >= 0; i--) {
        if (isSanctuary(nodes[i].type)) {
          parentSanctuary = nodes[i]
          break
        }
      }
      const parentId = parentSanctuary?.id || capitalId
      if (!connections.some((c) => c.fromId === parentId && c.toId === node.id)) {
        connections.push({ fromId: parentId, toId: node.id })
      }
      return
    }

    if (node.type === 'tradeoff_workshop') {
      let parent: HexNodeData | undefined
      for (let i = index - 1; i >= 0; i--) {
        if (isSanctuary(nodes[i].type) || nodes[i].type === 'quiz_encounter') {
          parent = nodes[i]
          break
        }
      }
      const parentId = parent?.id || capitalId
      if (!connections.some((c) => c.fromId === parentId && c.toId === node.id)) {
        connections.push({ fromId: parentId, toId: node.id })
      }
      return
    }

    // Default for sanctuaries: connect from Capital
    if (!connections.some((c) => c.fromId === capitalId && c.toId === node.id)) {
      connections.push({ fromId: capitalId, toId: node.id })
    }
  })

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
 * Generates all hex coordinates at distance `radius` from (0, 0).
 */
function getHexRing(radius: number): HexGridCoordinate[] {
  if (radius === 0) return [{ q: 0, r: 0 }]
  const ring: HexGridCoordinate[] = []
  let hex: HexGridCoordinate = {
    q: HEX_DIRECTIONS[4].q * radius,
    r: HEX_DIRECTIONS[4].r * radius,
  }

  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < radius; j++) {
      ring.push({ ...hex })
      hex = {
        q: hex.q + HEX_DIRECTIONS[i].q,
        r: hex.r + HEX_DIRECTIONS[i].r,
      }
    }
  }
  return ring
}

function hexAngle(coord: HexGridCoordinate): number {
  return Math.atan2(coord.r + coord.q / 2, coord.q * (Math.sqrt(3) / 2))
}

export interface HexLayoutOptions {
  seed?: number
  random?: () => number
  topicId?: string
  savedCoordinates?: Record<string, HexGridCoordinate>
}

export const HEX_LAYOUT_STORAGE_PREFIX = 'loom_hex_layout_'

export function stringToSeed(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) || 123456789
}

export function getStoredCampaignCoordinates(topicId: string): Record<string, HexGridCoordinate> | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  try {
    // 1. Try dedicated layout storage key
    const dedicated = localStorage.getItem(`${HEX_LAYOUT_STORAGE_PREFIX}${topicId}`)
    if (dedicated) {
      const parsed = JSON.parse(dedicated)
      if (parsed && typeof parsed === 'object') return parsed
    }
    // 2. Try campaign state storage key
    const campaignRaw = localStorage.getItem(`loom_gamification_campaign_${topicId}`)
    if (campaignRaw) {
      const parsedCampaign = JSON.parse(campaignRaw)
      if (parsedCampaign?.nodeCoordinates && typeof parsedCampaign.nodeCoordinates === 'object') {
        return parsedCampaign.nodeCoordinates
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null
}

export function saveCampaignCoordinates(topicId: string, coordinates: Record<string, HexGridCoordinate>): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    localStorage.setItem(`${HEX_LAYOUT_STORAGE_PREFIX}${topicId}`, JSON.stringify(coordinates))
    // Also sync into campaign state if present
    const campaignRaw = localStorage.getItem(`loom_gamification_campaign_${topicId}`)
    if (campaignRaw) {
      const parsed = JSON.parse(campaignRaw)
      parsed.nodeCoordinates = coordinates
      localStorage.setItem(`loom_gamification_campaign_${topicId}`, JSON.stringify(parsed))
    }
  } catch (e) {
    console.warn(`Failed to save hex coordinates for ${topicId} to localStorage:`, e)
  }
}

export function ensureFixedCampaignCoordinates(
  topicId: string,
  nodes: HexNodeData[],
  savedCoordinates?: Record<string, HexGridCoordinate>,
  forceRegenerate: boolean = false
): Record<string, HexGridCoordinate> {
  if (!forceRegenerate) {
    const stored = savedCoordinates || getStoredCampaignCoordinates(topicId)

    // Check if all nodes are present in stored
    if (stored && nodes.length > 0 && nodes.every((n) => stored[n.id])) {
      return stored
    }
  }

  return regenerateCampaignCoordinates(topicId, nodes)
}

/**
 * Procedurally generates a fresh, randomized campaign layout on demand (e.g. on new campaign start or restart).
 */
export function regenerateCampaignCoordinates(
  topicId: string,
  nodes: HexNodeData[],
  customSeed?: number
): Record<string, HexGridCoordinate> {
  const seed = customSeed !== undefined
    ? customSeed
    : Math.floor(Math.random() * 2147483647)

  const computedMap = computeHexGridCoordinates(nodes, {
    seed,
    topicId,
  })

  const result: Record<string, HexGridCoordinate> = {}
  computedMap.forEach((coord, id) => {
    result[id] = coord
  })

  saveCampaignCoordinates(topicId, result)
  return result
}

function createRng(seed?: number, customRandom?: () => number): () => number {
  if (customRandom) return customRandom
  if (seed === undefined) return Math.random
  let s = Math.abs(seed) % 2147483647
  if (s <= 0) s = 123456789
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/**
 * Computes axial hex coordinates (q, r) based on updated rules:
 * 1. Capital (Hub) is anchored at (0, 0).
 * 2. Boss Lair is ALWAYS immediately adjacent to Hub (distance = 1).
 * 3. Sanctuaries are scattered around the map with possible gaps from hub (radius >= 3).
 * 4. Challenge nodes (quiz, reflection) are placed immediately adjacent to their parent sanctuary (distance = 1).
 * 5. Workshops & remaining nodes are placed near their parent or closest free slot.
 */
export function computeHexGridCoordinates(
  nodes: HexNodeData[],
  options?: HexLayoutOptions
): Map<string, HexGridCoordinate> {
  const coordMap = new Map<string, HexGridCoordinate>()
  const occupiedCoords = new Set<string>()

  if (nodes.length === 0) return coordMap

  // If every node already has assigned coordinates, use them directly
  const allHaveCoords = nodes.every(
    (n) =>
      (n.coordinates && typeof n.coordinates.q === 'number' && typeof n.coordinates.r === 'number') ||
      (options?.savedCoordinates?.[n.id] && typeof options.savedCoordinates[n.id].q === 'number' && typeof options.savedCoordinates[n.id].r === 'number')
  )
  if (allHaveCoords) {
    nodes.forEach((n) => {
      const c = n.coordinates || options?.savedCoordinates?.[n.id]
      coordMap.set(n.id, c!)
    })
    return coordMap
  }

  // Pre-seed already known coordinates
  nodes.forEach((n) => {
    const existing = n.coordinates || options?.savedCoordinates?.[n.id]
    if (existing && typeof existing.q === 'number' && typeof existing.r === 'number') {
      coordMap.set(n.id, existing)
      occupiedCoords.add(coordKey(existing.q, existing.r))
    }
  })

  // Use deterministic seed if none provided to ensure fixed layout across re-renders
  const effectiveSeed =
    options?.seed !== undefined
      ? options.seed
      : stringToSeed(options?.topicId ? `${options.topicId}:${nodes.map((n) => n.id).join(',')}` : nodes.map((n) => n.id).join(','))
  const rng = createRng(effectiveSeed, options?.random)

  const capitalNode = nodes.find((n) => n.type === 'capital') || nodes[0]
  const bossNode = nodes.find((n) => n.type === 'boss_lair')
  const primarySites = nodes.filter((n) => isSanctuary(n.type))
  const challenges = nodes.filter(
    (n) =>
      n.type === 'quiz_encounter' ||
      n.type === 'reflection_decryption' ||
      n.type === 'tradeoff_workshop',
  )
  const autoConns = getAutoFlowConnections(nodes)

  // 1. Hub / Capital at center (0, 0)
  if (!coordMap.has(capitalNode.id)) {
    coordMap.set(capitalNode.id, { q: 0, r: 0 })
    occupiedCoords.add(coordKey(0, 0))
  }


  // Helper: Find closest free hex slot adjacent to baseCoord (distance 1 preferred)
  function findFreeAdjacentSlot(baseCoord: HexGridCoordinate, preferredAngle?: number): HexGridCoordinate {
    const directions = [...HEX_DIRECTIONS]

    if (preferredAngle !== undefined) {
      directions.sort((a, b) => {
        const angleA = hexAngle(a)
        const angleB = hexAngle(b)
        return Math.abs(angleA - preferredAngle) - Math.abs(angleB - preferredAngle)
      })
    } else {
      // Shuffle directions with rng for organic scatter
      directions.sort(() => rng() - 0.5)
    }

    // Check distance = 1 adjacent slots
    for (const dir of directions) {
      const q = baseCoord.q + dir.q
      const r = baseCoord.r + dir.r
      const key = coordKey(q, r)
      if (!occupiedCoords.has(key)) return { q, r }
    }

    // Fallback: check distance = 2..5 slots if immediate neighbors are full
    for (let radius = 2; radius <= 5; radius++) {
      const ring = getHexRing(radius)
      ring.sort((a, b) => {
        if (preferredAngle !== undefined) {
          return Math.abs(hexAngle(a) - preferredAngle) - Math.abs(hexAngle(b) - preferredAngle)
        }
        return rng() - 0.5
      })
      for (const h of ring) {
        const q = baseCoord.q + h.q
        const r = baseCoord.r + h.r
        const key = coordKey(q, r)
        if (!occupiedCoords.has(key)) return { q, r }
      }
    }

    return { q: 0, r: 0 }
  }

  // 2. Boss Lair: ALWAYS immediately adjacent to Hub (distance = 1)
  if (bossNode) {
    // Pick top adjacent direction by default (e.g. { q: 0, r: -1 }) or random adjacent neighbor
    const bossSlot = findFreeAdjacentSlot({ q: 0, r: 0 }, -Math.PI / 2)
    coordMap.set(bossNode.id, bossSlot)
    occupiedCoords.add(coordKey(bossSlot.q, bossSlot.r))
  }

  // 3. Sanctuaries & Forges: Scattered around the map with gaps from hub (radius >= 3) and gaps between each other (distance >= 2)
  const siteCount = primarySites.length
  const placedSiteCoords: HexGridCoordinate[] = []

  primarySites.forEach((site, index) => {
    if (coordMap.has(site.id)) return

    // Distribute base angle around the circle with random jitter
    const baseAngle = (index * 2 * Math.PI) / Math.max(1, siteCount) + (rng() - 0.5) * 0.6 - Math.PI / 2
    // Distribute radii >= 3 (rings 3, 4, 5) to ensure distance gap from hub (not adjacent to hub)
    const availableRadii = [3, 4, 5]
    const chosenRadius = availableRadii[index % availableRadii.length]

    // Find best free slot on the chosen ring (radius >= 3) or nearby outer rings
    let bestSlot: HexGridCoordinate | null = null
    const candidateRings = [chosenRadius, chosenRadius === 3 ? 4 : 3, 5, 6, 7]

    // First pass: look for slot with distance >= 3 from other sanctuaries/forges and >= 3 from hub
    // Second pass (fallback): look for slot with distance >= 2 from other sanctuaries/forges and >= 3 from hub
    for (const minSiteDist of [3, 2]) {
      for (const radius of candidateRings) {
        if (radius < 3) continue // Strictly keep distance >= 3 from hub
        const ring = getHexRing(radius)
        // Sort hexes in the ring by proximity to baseAngle
        ring.sort((a, b) => Math.abs(hexAngle(a) - baseAngle) - Math.abs(hexAngle(b) - baseAngle))

        for (const hex of ring) {
          if (axialDistance({ q: 0, r: 0 }, hex) < 3) continue
          const key = coordKey(hex.q, hex.r)
          if (occupiedCoords.has(key)) continue

          // Ensure distance gap from all previously placed sanctuaries/forges
          const tooCloseToOtherSite = placedSiteCoords.some((sCoord) => axialDistance(sCoord, hex) < minSiteDist)
          if (tooCloseToOtherSite) continue

          // Check that this hex has at least one free adjacent slot for any attached challenge
          const hasFreeNeighbor = HEX_DIRECTIONS.some((dir) => !occupiedCoords.has(coordKey(hex.q + dir.q, hex.r + dir.r)))
          if (hasFreeNeighbor) {
            bestSlot = hex
            break
          }
        }
        if (bestSlot) break
      }
      if (bestSlot) break
    }

    // Fallback search strictly on rings >= 3 with distance >= 2 from other sites
    if (!bestSlot) {
      for (let radius = 3; radius <= 8; radius++) {
        const ring = getHexRing(radius)
        ring.sort((a, b) => Math.abs(hexAngle(a) - baseAngle) - Math.abs(hexAngle(b) - baseAngle))
        for (const hex of ring) {
          if (!occupiedCoords.has(coordKey(hex.q, hex.r))) {
            const tooClose = placedSiteCoords.some((sCoord) => axialDistance(sCoord, hex) < 2)
            if (!tooClose) {
              bestSlot = hex
              break
            }
          }
        }
        if (bestSlot) break
      }
    }

    const finalSlot = bestSlot || { q: 3 + index * 2, r: 0 }
    coordMap.set(site.id, finalSlot)
    occupiedCoords.add(coordKey(finalSlot.q, finalSlot.r))
    placedSiteCoords.push(finalSlot)
  })

  // 4. Challenges: Placed immediately adjacent (distance = 1) to their parent Sanctuary/Forge
  challenges.forEach((challenge) => {
    if (coordMap.has(challenge.id)) return

    // Find parent sanctuary or forge
    const deps = getNodeDependencies(challenge)
    let parentSite: HexNodeData | undefined
    if (deps.length > 0) {
      parentSite = nodes.find((n) => deps.includes(n.id) && isSanctuaryOrForge(n.type))
    }
    if (!parentSite) {
      const parentConn = autoConns.find((c) => c.toId === challenge.id)
      if (parentConn) {
        parentSite = nodes.find((n) => n.id === parentConn.fromId)
      }
    }

    const parentCoord = (parentSite && coordMap.get(parentSite.id)) || { q: 0, r: 0 }
    const outwardAngle = hexAngle(parentCoord) + (rng() - 0.5) * 0.5
    const challengeSlot = findFreeAdjacentSlot(parentCoord, outwardAngle)

    coordMap.set(challenge.id, challengeSlot)
    occupiedCoords.add(coordKey(challengeSlot.q, challengeSlot.r))
  })

  // 5. Fallback for any remaining unplaced nodes
  nodes.forEach((node) => {
    if (!coordMap.has(node.id)) {
      const slot = findFreeAdjacentSlot({ q: 0, r: 0 })
      coordMap.set(node.id, slot)
      occupiedCoords.add(coordKey(slot.q, slot.r))
    }
  })

  return coordMap
}
