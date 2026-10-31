import { z } from 'zod'
import type { ValidationDiagnostic } from '../../validation/types'

export const BREAKDOWN_COLORS = ['blue', 'teal', 'green', 'mauve', 'peach', 'sky', 'yellow', 'pink', 'lavender'] as const
export const BreakdownNodeSchema = z.object({
  id: z.string().trim().min(1), title: z.string().trim().min(1), value: z.number().finite().min(0),
  parent: z.string().trim().min(1).optional(), description: z.string().optional(), color: z.enum(BREAKDOWN_COLORS).optional(),
})
export const BreakdownTreeSectionSchema = z.object({
  type: z.literal('breakdown-tree'), title: z.string().optional(), nodes: z.array(BreakdownNodeSchema).min(1),
  mode: z.enum(['quantity', 'probability']).default('quantity'), unit: z.string().default(''),
  description: z.string().optional(), takeaway: z.string().optional(),
})
export type BreakdownTreeSectionData = z.infer<typeof BreakdownTreeSectionSchema>
export type BreakdownNode = z.infer<typeof BreakdownNodeSchema>

export function validateBreakdownTree(data: BreakdownTreeSectionData): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = []
  const error = (field: string, message: string, fixHint: string) => diagnostics.push({ tier: 3, field, message, fixHint })
  const ids = new Set<string>()
  const nodes = new Map(data.nodes.map((n) => [n.id, n]))
  const roots = data.nodes.filter((n) => !n.parent)
  if (roots.length !== 1) error('nodes', 'A breakdown tree needs exactly one root.', 'Leave parent empty on one node; give every other node a declared parent ID.')
  data.nodes.forEach((node, i) => {
    if (ids.has(node.id)) error(`nodes[${i}].id`, `Duplicate breakdown node ID "${node.id}".`, 'Use a unique ID for each node.')
    ids.add(node.id)
    if (node.parent && !nodes.has(node.parent)) error(`nodes[${i}].parent`, `Unknown parent "${node.parent}".`, 'Use the ID of a node in this tree.')
    if (node.parent === node.id) error(`nodes[${i}].parent`, 'A node cannot be its own parent.', 'Choose another parent or make this the root.')
    if (data.mode === 'probability' && node.value > 1) error(`nodes[${i}].value`, 'Probability must be between 0 and 1.', 'Write 0.6 for 60%, not 60.')
  })
  const visited = new Set<string>(), visiting = new Set<string>()
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true
    if (visited.has(id)) return false
    visiting.add(id)
    const parent = nodes.get(id)?.parent
    if (parent && nodes.has(parent) && visit(parent)) return true
    visiting.delete(id); visited.add(id)
    return false
  }
  if (data.nodes.some((n) => visit(n.id))) error('nodes', 'Breakdown parents contain a cycle.', 'Connect every node to the single root without circular parents.')
  const approximately = (a: number, b: number) => Number.isFinite(a) && Math.abs(a - b) <= Number.EPSILON * 64 * Math.max(Math.abs(a), Math.abs(b), Number.MIN_VALUE)
  if (data.mode === 'probability' && roots[0] && roots[0].value !== 1) error('nodes', 'The root probability must be 1.', 'Set the root to 1 (100% of the sample space).')
  if (data.mode === 'probability' && data.unit.trim()) error('unit', 'Probability mode uses fractions of 1, not a quantity unit.', 'Leave unit empty; probabilities are displayed as percentages.')
  data.nodes.forEach((parent, i) => {
    const children = data.nodes.filter((n) => n.parent === parent.id)
    if (!children.length) return
    const sum = children.reduce((total, n) => total + n.value, 0)
    const expected = data.mode === 'probability' ? 1 : parent.value
    if (!approximately(sum, expected)) error(`nodes[${i}].value`, `Children of "${parent.title}" sum to ${sum}; expected ${expected}.`, data.mode === 'probability' ? 'Make each complete set of conditional branches sum to 1.' : 'Use one unit throughout and make the children sum to their parent. Add an explicitly authored Other category if needed.')
  })
  return diagnostics
}

export function breakdownModel(data: BreakdownTreeSectionData) {
  const nodes = new Map(data.nodes.map((n) => [n.id, n]))
  const root = data.nodes.find((n) => !n.parent)
  const children = (id: string) => data.nodes.filter((n) => n.parent === id)
  const path = (id: string) => {
    const result: BreakdownNode[] = [], seen = new Set<string>()
    let node = nodes.get(id)
    while (node && !seen.has(node.id)) { seen.add(node.id); result.unshift(node); node = node.parent ? nodes.get(node.parent) : undefined }
    return result
  }
  const metrics = (node: BreakdownNode) => {
    const parent = node.parent ? nodes.get(node.parent) : undefined
    return {
      parentShare: parent ? data.mode === 'probability' ? node.value : parent.value > 0 ? node.value / parent.value : undefined : undefined,
      totalShare: data.mode === 'probability' ? path(node.id).reduce((product, n) => product * n.value, 1) : root && root.value > 0 ? node.value / root.value : undefined,
    }
  }
  const splits: BreakdownNode[] = []
  const visited = new Set<string>()
  const visit = (node: BreakdownNode) => {
    if (visited.has(node.id)) return
    visited.add(node.id)
    const parts = children(node.id)
    if (parts.length) splits.push(node)
    parts.forEach(visit)
  }
  if (root) visit(root)
  return { nodes, root, children, path, metrics, splits }
}

export const breakdownNumber = (value: number) => new Intl.NumberFormat(undefined, { maximumSignificantDigits: 6 }).format(value)
export const breakdownPercent = (fraction?: number) => fraction === undefined ? '—' : new Intl.NumberFormat(undefined, { style: 'percent', maximumSignificantDigits: 3 }).format(fraction)
export function breakdownValue(data: BreakdownTreeSectionData, node: BreakdownNode) {
  if (data.mode === 'probability') return breakdownPercent(breakdownModel(data).metrics(node).totalShare)
  const amount = breakdownNumber(node.value)
  return ['$','€','£','¥'].includes(data.unit) ? `${data.unit}${amount}` : `${amount}${data.unit ? ` ${data.unit}` : ''}`
}
