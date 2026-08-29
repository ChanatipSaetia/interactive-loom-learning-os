import { z } from 'zod'

export const HexNodeTypeSchema = z.enum([
  'capital',
  'reading_sanctuary',
  'archive_spire',
  'simulation_nexus',
  'concept_monolith',
  'observatory_gallery',
  'quiz_encounter',
  'reflection_decryption',
  'tradeoff_workshop',
  'boss_lair',
])

export const HexGridCoordinateSchema = z.object({
  q: z.number().int(),
  r: z.number().int(),
})

export const ItemRewardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  icon: z.string().optional().default('✨'),
  description: z.string().optional().default(''),
})

export const MonsterDataSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().optional().default('goblin'),
  maxHp: z.number().int().positive().default(30),
  currentHp: z.number().int().optional(),
  damage: z.number().int().positive().default(10),
  icon: z.string().optional().default('👾'),
})

export const HexNodeDataSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    type: HexNodeTypeSchema,
    status: z.enum(['locked', 'unlocked', 'cleared']).default('locked'),
    sectionRef: z.string().optional(),
    description: z.string().optional().default(''),
    monster: MonsterDataSchema.optional(),
    rewards: z.array(ItemRewardSchema).optional().default([]),
    requiredItems: z.array(z.string()).optional(),
    healingAmount: z.number().optional().default(40),
    buff: z
      .object({
        stat: z.enum(['armor', 'evasion', 'intelligence']),
        value: z.number(),
        label: z.string(),
      })
      .optional(),
    tradeoffMapping: z.record(z.string(), z.string()).optional(),
  })
  .refine(
    (node) => {
      if (node.type === 'boss_lair') {
        return !node.rewards || node.rewards.length === 0
      }
      return true
    },
    {
      message: 'Boss lair encounters must not declare any key item rewards; they only consume prerequisite key items.',
      path: ['rewards'],
    }
  )

export const HexCampaignSchema = z.object({
  topicId: z.string().min(1),
  topicTitle: z.string().min(1),
  capitalId: z.string().optional().default('capital'),
  nodes: z.array(HexNodeDataSchema).min(1),
})

export type HexCampaignData = z.infer<typeof HexCampaignSchema>
export type HexNodeData = z.infer<typeof HexNodeDataSchema>
export type HexGridCoordinate = z.infer<typeof HexGridCoordinateSchema>
export type ItemReward = z.infer<typeof ItemRewardSchema>
export type MonsterData = z.infer<typeof MonsterDataSchema>
