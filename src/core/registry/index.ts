import type { ComponentType } from 'react'

export interface SectionConfig {
  type: string
  props: Record<string, unknown>
}

export class SectionRegistry {
  private static instances = new Map<string, ComponentType<unknown>>()

  public static register(type: string, component: ComponentType<unknown>): void {
    this.instances.set(type, component)
  }

  public static get(type: string): ComponentType<unknown> | undefined {
    return this.instances.get(type)
  }

  public static list(): string[] {
    return Array.from(this.instances.keys())
  }

  public static clear(): void {
    this.instances.clear()
  }
}
