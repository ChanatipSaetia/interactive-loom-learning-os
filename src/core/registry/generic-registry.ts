export class Registry<T> {
  private instances = new Map<string, T>()

  public register(key: string, value: T): void {
    this.instances.set(key, value)
  }

  public get(key: string): T | undefined {
    return this.instances.get(key)
  }

  public list(): string[] {
    return Array.from(this.instances.keys())
  }

  public clear(): void {
    this.instances.clear()
  }
}
