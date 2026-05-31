import type { ComponentType } from 'react'

export class TopicRegistry {
  private static instances = new Map<string, ComponentType>()

  public static register(id: string, component: ComponentType): void {
    this.instances.set(id, component)
  }

  public static get(id: string): ComponentType | undefined {
    return this.instances.get(id)
  }

  public static list(): string[] {
    return Array.from(this.instances.keys())
  }

  public static clear(): void {
    this.instances.clear()
  }
}
