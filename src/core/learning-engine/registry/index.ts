import type { ComponentType, LazyExoticComponent } from 'react'
import { lazy } from 'react'
import { Registry } from './generic-registry'

export interface SectionConfig {
  type: string
  props: Record<string, unknown>
}

type SectionLoader = () => Promise<{ default: ComponentType<any> }>

const LazySectionRegistry = new Registry<LazyExoticComponent<ComponentType<any>>>()
/** The loaders behind the lazy components, for callers that load a section module themselves (Present mode). */
const sectionLoaders = new Registry<SectionLoader>()

export const SectionRegistry = {
  register(type: string, loader: SectionLoader) {
    const LazySection = lazy(loader as any)
    LazySectionRegistry.register(type, LazySection as any)
    sectionLoaders.register(type, loader)
  },
  loader(type: string): SectionLoader | undefined {
    return sectionLoaders.get(type)
  },
  get(type: string) {
    return LazySectionRegistry.get(type)
  },
  list() {
    return LazySectionRegistry.list()
  },
  clear() {
    LazySectionRegistry.clear()
    sectionLoaders.clear()
  },
}
