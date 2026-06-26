import '@testing-library/jest-dom'

// Mock IntersectionObserver for framer-motion viewport hooks (useInView, whileInView)
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null
  readonly rootMargin: string = '0px'
  readonly thresholds: ReadonlyArray<number> = [0]
  private callbacks: IntersectionObserverCallback[] = []

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.callbacks = [callback]
    if (options) {
      this.root = options.root ?? null
      this.rootMargin = options.rootMargin ?? '0px'
      this.thresholds = (Array.isArray(options.threshold)
        ? options.threshold
        : [options.threshold ?? 0]) as ReadonlyArray<number>
    }
  }

  observe(target: Element) {
    const entries: IntersectionObserverEntry[] = [{
      isIntersecting: true,
      intersectionRatio: 1,
      boundingClientRect: new DOMRect(),
      intersectionRect: new DOMRect(),
      rootBounds: null,
      target,
      time: 0,
    }]
    this.callbacks.forEach((cb) => cb(entries, this))
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  unobserve(_target: Element) {}
  disconnect() {
    this.callbacks = []
  }

  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: class ResizeObserver {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    observe(_target: Element) {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    unobserve(_target: Element) {}
    disconnect() {}
  },
})
