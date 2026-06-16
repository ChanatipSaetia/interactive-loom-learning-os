import type { ComponentType } from 'react'
import { Registry } from './generic-registry'

export interface SectionConfig {
  type: string
  props: Record<string, unknown>
}

export const SectionRegistry = new Registry<ComponentType<unknown>>()
