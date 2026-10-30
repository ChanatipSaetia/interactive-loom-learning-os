import { ChartNoAxesCombined, Check, Clock, Code, CornerDownRight, KeyRound, Lightbulb, ListChecks, ShieldCheck, Target, Users } from 'lucide-react'
import type { z } from 'zod'
import type { BulletIconSchema } from '../../schema'

const icons = { list: ListChecks, check: Check, shield: ShieldCheck, clock: Clock, key: KeyRound, lightbulb: Lightbulb, target: Target, users: Users, chart: ChartNoAxesCombined, code: Code }

export type BulletIconName = z.infer<typeof BulletIconSchema>

export function BulletIcon({ name, nested = false, size }: { name?: BulletIconName; nested?: boolean; size?: number }) {
  const Icon = name ? icons[name] ?? ListChecks : nested ? CornerDownRight : ListChecks
  return <Icon aria-hidden size={size ?? (nested ? 18 : 28)} strokeWidth={1.8} />
}
