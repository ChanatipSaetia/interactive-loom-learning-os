import { z } from 'zod'
import { call, defineOUIComponent, defineOUISection, sectionFields, sectionTail, sectionTailProps, type LoomOUIComponent } from '../openui-kernel'
import { BREAKDOWN_COLORS, type BreakdownTreeSectionData } from './breakdown-tree'

export const BreakdownNode = defineOUIComponent({
  name: 'BreakdownNode', description: 'A named part of a measurable whole; parent IDs define the hierarchy.',
  props: z.object({ id: z.string(), title: z.string(), value: z.number().min(0), parent: z.string().optional(), description: z.string().optional(), color: z.enum(BREAKDOWN_COLORS).optional() }),
  fields: {
    id: 'Node ID, unique within this tree.', title: 'Short name for this part.', value: 'Quantity in the shared unit, or a conditional probability from 0 to 1 in probability mode; root probability is 1.',
    parent: 'Optional parent node ID; exactly one node omits parent and becomes the root.', description: 'Optional explanation for Read details and narration.', color: 'Optional theme accent for the node; descendants inherit their parent accent unless overridden.',
  },
})
export const BreakdownTree: LoomOUIComponent = defineOUISection({
  name: 'BreakdownTree', sectionType: 'breakdown-tree', description: 'A whole divided into measurable parts: costs, counts, time allocation or conditional probability. Calculates each part’s share of its parent and the whole, validates totals, and explains one split per presentation beat.',
  props: z.object({ title: z.string(), nodes: z.array(BreakdownNode.ref), mode: z.enum(['quantity', 'probability']).optional(), unit: z.string().optional(), description: z.string().optional(), takeaway: z.string().optional(), ...sectionTailProps }),
  fields: {
    ...sectionFields, nodes: 'All nodes, with one root and parent IDs linking every other node to it.', mode: 'Optional "quantity" (default): children sum to their parent; "probability": each sibling set sums to 1 and path probabilities multiply.', unit: 'One unit for all quantities, such as USD, grams or requests; leave empty in probability mode.',
    description: 'Optional context, source and assumptions; label constructed figures as illustrative.', takeaway: 'Optional conclusion shown on the final summary beat.',
  },
  toData: (p) => ({ type: 'breakdown-tree', title: p.title, nodes: p.nodes, mode: p.mode ?? 'quantity', unit: p.unit ?? '', description: p.description, takeaway: p.takeaway }),
  fromData: (data: BreakdownTreeSectionData, meta) => call(BreakdownTree, { title: meta.title || data.title || '', nodes: data.nodes.map((n) => call(BreakdownNode, n, n.id)), mode: data.mode, unit: data.unit, description: data.description, takeaway: data.takeaway, ...sectionTail(meta) }),
})
export const breakdownTreeOUIComponents = [BreakdownTree, BreakdownNode]
