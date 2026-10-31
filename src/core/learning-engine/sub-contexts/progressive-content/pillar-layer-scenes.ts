import { brief, type Beat } from '../present-kernel'
import { placePillarBlocks } from './pillar-layer-layout'
import type { PillarLayerSectionData } from './schema'

export interface PillarLayerScene extends Beat {
  layerIndex?: number
  group?: string
}

/** Shared by beat derivation and rendering so narration and visible focus cannot drift. */
export function pillarLayerPlan(section?: PillarLayerSectionData) {
  const layers = section?.layers ?? []
  const placed = placePillarBlocks(layers, section?.matrix_blocks ?? [])
  const simpleStack = placed.every((p) => p.rowSpan === 1 && !p.clipPath)
  const scenes: PillarLayerScene[] = []
  for (let layerIndex = layers.length - 1; layerIndex >= 0; layerIndex--) {
    const layer = layers[layerIndex]
    const items = placed.filter((p) => p.layerIdx === layerIndex)
    const grouped = simpleStack && items.some((p) => p.block.group)
    const groups = grouped ? [...new Set(items.map((p) => p.block.group || layer.title))] : [undefined]
    groups.forEach((group, i) => scenes.push({
      // Preserve layerN's authored layer identity while changing playback order.
      id: `layer${layerIndex + 1}${i ? `.group${i + 1}` : ''}`,
      about: group ? `${brief(layer.title)}: ${brief(group)}` : `Layer ${layerIndex + 1}: ${brief(layer.title)}`,
      layerIndex,
      group,
    }))
  }
  if (layers.length) scenes.push({ id: 'overview', about: 'The whole stack: how the layers build on one another' })
  return { placed, simpleStack, scenes }
}
