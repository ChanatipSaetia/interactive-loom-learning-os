import type { HexCampaignData } from './schema'
import type { ValidationDiagnostic } from '../../learning-engine/validation/types'

/**
 * Tier 3 Semantic Validation for Hex Map Campaigns
 *
 * Validates:
 * 1. Axial coordinate uniqueness (no two nodes on same (q, r)).
 * 2. Presence of at least one Capital node.
 * 3. Boss solvability (required items must be dropped by existing nodes).
 * 4. Node ID uniqueness.
 */
export function validateHexMapTier3(
  campaign: HexCampaignData,
  availableSectionIds?: string[]
): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = []

  // 1. Check Node ID Uniqueness
  const seenIds = new Set<string>()
  for (const node of campaign.nodes) {
    if (seenIds.has(node.id)) {
      diagnostics.push({
        tier: 3,
        field: `nodes[${node.id}]`,
        message: `Duplicate hex node ID '${node.id}'.`,
        fixHint: `Ensure each hex node has a globally unique ID within the campaign.`,
      })
    }
    seenIds.add(node.id)
  }

  // 2. Capital Node Check
  const hasCapital = campaign.nodes.some((n) => n.type === 'capital')
  if (!hasCapital) {
    diagnostics.push({
      tier: 3,
      field: 'nodes',
      message: `Hex campaign must declare at least one 'capital' starting node.`,
      fixHint: `Add a node with type: 'capital' as the starting safe haven.`,
    })
  }

  // 3. Check Dependency References (parentId, unlockedBy, dependsOn)
  for (const node of campaign.nodes) {
    const rawDeps = [
      ...(node.parentId ? [node.parentId] : []),
      ...(node.unlockedBy || []),
      ...(node.dependsOn || []),
    ]
    for (const depId of rawDeps) {
      if (depId === node.id) {
        diagnostics.push({
          tier: 3,
          field: `nodes[${node.id}].dependencies`,
          message: `Hex node '${node.id}' cannot declare itself as a dependency.`,
          fixHint: `Set dependency/parentId to a valid prerequisite node ID (e.g. sanctuary or capital).`,
        })
      } else if (!seenIds.has(depId)) {
        diagnostics.push({
          tier: 3,
          field: `nodes[${node.id}].dependencies`,
          message: `Hex node '${node.id}' references non-existent dependency '${depId}'.`,
          fixHint: `Ensure prerequisite ID '${depId}' matches an existing node ID in the campaign.`,
        })
      }
    }
  }

  // 4. Boss Solvability & Key Item Validation Check
  const droppedItemIds = new Set<string>()
  for (const node of campaign.nodes) {
    if (node.type === 'boss_lair' && node.rewards && node.rewards.length > 0) {
      diagnostics.push({
        tier: 3,
        field: `nodes[${node.id}].rewards`,
        message: `Boss lair encounter '${node.id}' must not declare dropped key item rewards; it only consumes prerequisite key items.`,
        fixHint: `Remove key item rewards from the boss encounter. Place rewards on challenge or sanctuary nodes.`,
      })
    }

    if (node.type !== 'boss_lair' && node.rewards) {
      for (const reward of node.rewards) {
        droppedItemIds.add(reward.id)
      }
    }
  }

  for (const node of campaign.nodes) {
    if (node.type === 'boss_lair' && node.requiredItems) {
      const requiredItemIds = new Set(node.requiredItems)

      for (const reqItem of node.requiredItems) {
        if (!droppedItemIds.has(reqItem)) {
          diagnostics.push({
            tier: 3,
            field: `nodes[${node.id}].requiredItems`,
            message: `Boss lair requires item '${reqItem}', but no node in the campaign drops this item.`,
            fixHint: `Add a reward with id '${reqItem}' to a quiz_encounter or reflection_decryption node.`,
          })
        }
      }

      for (const droppedId of droppedItemIds) {
        if (!requiredItemIds.has(droppedId)) {
          diagnostics.push({
            tier: 3,
            field: `nodes[${node.id}].requiredItems`,
            message: `Dropped key item '${droppedId}' is not required by boss lair '${node.id}'. All dropped key items must be required by the climax boss encounter.`,
            fixHint: `Add '${droppedId}' to requiredItems on boss lair node '${node.id}'.`,
          })
        }
      }
    }
  }

  // 5. Section Reference Resolution Check (if available sections provided)
  if (availableSectionIds && availableSectionIds.length > 0) {
    for (const node of campaign.nodes) {
      if (node.sectionRef && !availableSectionIds.includes(node.sectionRef)) {
        diagnostics.push({
          tier: 3,
          field: `nodes[${node.id}].sectionRef`,
          message: `Referenced section '${node.sectionRef}' not found in topic sections [${availableSectionIds.join(', ')}].`,
          fixHint: `Ensure the section directory exists in public/okf/${campaign.topicId}/sections/${node.sectionRef}/.`,
        })
      }
    }
  }

  // 6. Section Reference Uniqueness Check (prevent duplicate encounters/sections across nodes)
  const seenSectionRefs = new Map<string, string>()
  for (const node of campaign.nodes) {
    if (node.sectionRef) {
      if (seenSectionRefs.has(node.sectionRef)) {
        const prevNodeId = seenSectionRefs.get(node.sectionRef)!
        diagnostics.push({
          tier: 3,
          field: `nodes[${node.id}].sectionRef`,
          message: `Duplicate sectionRef '${node.sectionRef}' on node '${node.id}' (already bound to node '${prevNodeId}'). Each campaign encounter/sanctuary must bind to a unique section.`,
          fixHint: `Ensure each hex node references a unique OKF section or omit sectionRef from climax encounters.`,
        })
      } else {
        seenSectionRefs.set(node.sectionRef, node.id)
      }
    }
  }

  // 7. Full Section Coverage Check (ensure all OKF sections in the topic are mapped to nodes)
  if (availableSectionIds && availableSectionIds.length > 0) {
    const mappedSectionRefs = new Set(campaign.nodes.map((n) => n.sectionRef).filter(Boolean))
    const missingSections = availableSectionIds.filter((sec) => !mappedSectionRefs.has(sec))
    if (missingSections.length > 0) {
      diagnostics.push({
        tier: 3,
        field: 'nodes',
        message: `Hex campaign is missing mappings for ${missingSections.length} OKF section(s): [${missingSections.join(', ')}]. All topic sections must be accessible on the campaign map.`,
        fixHint: `Add sanctuary, challenge, or workshop nodes mapping to ${missingSections.map((s) => `'${s}'`).join(', ')}.`,
      })
    }
  }

  return diagnostics
}
