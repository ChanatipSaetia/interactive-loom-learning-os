import type { ComponentType, LazyExoticComponent } from 'react'
import { lazy } from 'react'
import { Registry } from './generic-registry'

export interface SectionConfig {
  type: string
  props: Record<string, unknown>
}

type SectionLoader = () => Promise<{ default: ComponentType<any> }>

const LazySectionRegistry = new Registry<LazyExoticComponent<ComponentType<any>>>()

export const SectionRegistry = {
  register(type: string, loader: SectionLoader) {
    const LazySection = lazy(loader as any)
    LazySectionRegistry.register(type, LazySection as any)
  },
  get(type: string) {
    return LazySectionRegistry.get(type)
  },
  list() {
    return LazySectionRegistry.list()
  },
  clear() {
    LazySectionRegistry.clear()
  },
}
