/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * SingleHTMLEmbedAdapter — concrete OKFStoragePort + OKFRuntimePort for
 * standalone single-HTML embeds (CDN-distributed widget bundles).
 *
 * Storage: in-memory only (no disk I/O — standalone scripts have no fs access).
 * Runtime: fetches bundles via browser fetch, renders through an eagerly-filled
 * component registry, and validates payloads through the 3-Tier ValidationGateway.
 *
 * Decouples the embed widget from the full SPA app shell (router, lazy-loading,
 * dev-server middleware) while preserving backward-compatible public API.
 */
import { Suspense, type ComponentType, type ReactNode } from 'react'
import type { OKFStoragePort, OKFRuntimePort } from '../ports'
import type { OKFSectionMeta, OKFSectionData, OKFBundled } from '../../okf/types'
import type { SectionConfig } from '../../registry'
import type { ValidationResult } from '../../validation/gateway'
import { Registry } from '../../registry/generic-registry'
import { loadOKFBundle } from '../../okf/reader'
import { bundleToSections } from '../../okf/sections'
import { validateOKFSection } from '../../validation/gateway'
import { deriveSchema } from '../../subdomains/process-simulation/components/flowchart/abstract-flow/derive'
import { SectionErrorBoundary } from '../../../components/common/SectionErrorBoundary'

// ============================================================================
// Eager Component Registry — populated at module load for standalone embeds
// ============================================================================

/**
 * Global registry of eagerly-registered section components.
 * Unlike the SPA's lazy-loaded SectionRegistry, this registry holds
 * direct ComponentType references suitable for UMD/standalone builds.
 */
const embedRegistry = new Registry<ComponentType<any>>()

/**
 * Register a section component type with the embed adapter.
 * Call once at module initialization or when adding custom sections.
 */
export function registerEmbedSection(type: string, component: ComponentType<any>): void {
  embedRegistry.register(type, component)
}

/**
 * Clear all registered section components. Useful for testing.
 */
export function clearEmbedRegistry(): void {
  embedRegistry.clear()
}

// ============================================================================
// Storage Port — in-memory only, no disk I/O
// ============================================================================

/**
 * In-memory storage backing for the standalone embed.
 *
 * Sections are stored in-memory when set programmatically via the adapter.
 * `readSection` looks up from the in-memory bundle cache. `saveSection`
 * and `listTopics` are no-ops that throw since standalone scripts lack
 * file-system access and dev-server middleware.
 */
class EmbedInMemoryStorage implements OKFStoragePort {
  private bundles = new Map<string, OKFBundled>()

  /**
   * Set the in-memory bundle for a topic (called after loadTopicBundle).
   * Enables `readSection` lookups from the cache.
   */
  setBundle(topicId: string, bundle: OKFBundled): void {
    this.bundles.set(topicId, bundle)
  }

  /**
   * Read a single section from the in-memory bundle cache.
   *
   * @throws Error if section not found or topic bundle not loaded.
   */
  async readSection(
    topicId: string,
    sectionFolder: string,
  ): Promise<{ meta: OKFSectionMeta; data: OKFSectionData; body: string }> {
    const bundle = this.bundles.get(topicId)
    if (!bundle) {
      throw new Error(`Topic "${topicId}" not loaded in embed storage. Call loadTopicBundle first.`)
    }
    const section = bundle.find((s) => s.sectionFolder === sectionFolder)
    if (!section) {
      throw new Error(`Section "${sectionFolder}" not found in topic "${topicId}"`)
    }
    return {
      meta: section.meta,
      data: section.data,
      body: section.sectionBody ?? '',
    }
  }

  /**
   * Save is not supported in standalone embed — no disk I/O or dev-server.
   * @throws Error with guidance to use download API instead.
   */
  async saveSection(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _topicId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _sectionFolder: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _data: OKFSectionData,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _rawText: string,
  ): Promise<void> {
    throw new Error(
      'saveSection is not available in standalone embed mode. ' +
      'Use downloadFiles() to export edited section files locally.',
    )
  }

  /**
   * List topics from loaded in-memory bundles.
   * For full topic discovery, use the webapp-spa adapter instead.
   */
  async listTopics(): Promise<string[]> {
    return [...this.bundles.keys()]
  }
}

// ============================================================================
// Section Rendering — flowchart schema adaptation + error boundary
// ============================================================================

/**
 * Adapt raw SectionConfig props for component rendering.
 *
 * Applies flowchart schema derivation (abstract flow → full schema) when
 * the config contains legacy abstract flow data without entities/relations.
 */
function adaptSectionProps(config: SectionConfig): Record<string, unknown> {
  if (config.type === 'flowchart') {
    const rawSchema = config.props?.schema || (config.props as any)?.flow
    if (rawSchema && !rawSchema.entities && (rawSchema.actors || rawSchema.steps || rawSchema.systems)) {
      try {
        return {
          ...config.props,
          schema: deriveSchema(rawSchema),
        }
      } catch (e) {
        console.error('Failed to auto-derive flowchart schema:', e)
      }
    }
  }
  return config.props
}

/**
 * Render a single section as a wrapped ReactNode with error boundary
 * and suspense fallback — identical to SPA rendering behavior.
 */
function renderEmbedSection(config: SectionConfig, sectionIndex?: number): ReactNode {
  const Component = embedRegistry.get(config.type)
  if (!Component) {
    return (
      <div className="section-missing" data-section-type={config.type}>
        Section type not registered: {config.type}
      </div>
    )
  }

  const adaptedProps = adaptSectionProps(config)

  return (
    <div className="section-wrapper" data-section-type={config.type} data-section-index={sectionIndex ?? 0}>
      <SectionErrorBoundary sectionName={config.type}>
        <Suspense fallback={<div className="section-loading">Loading section...</div>}>
          <Component sectionIndex={sectionIndex ?? 0} {...adaptedProps} />
        </Suspense>
      </SectionErrorBoundary>
    </div>
  )
}

// ============================================================================
// Runtime Port — bundle loading, rendering, validation
// ============================================================================

class EmbedRuntime implements OKFRuntimePort {
  private storage: EmbedInMemoryStorage

  constructor(storage: EmbedInMemoryStorage) {
    this.storage = storage
  }

  /**
   * Load the complete topic bundle via fetch (delegating to cached reader).
   * Stores the bundle in in-memory storage for subsequent readSection calls.
   */
  async loadTopicBundle(topicId: string): Promise<OKFBundled> {
    const bundle = await loadOKFBundle(topicId)
    this.storage.setBundle(topicId, bundle)
    return bundle
  }

  /**
   * Render a single section config as a ReactNode through the eagerly-filled
   * embed component registry, with flowchart schema adaptation.
   */
  renderSection(config: SectionConfig, sectionIndex?: number): ReactNode {
    return renderEmbedSection(config, sectionIndex)
  }

  /**
   * Validate a section data payload through the 3-Tier ValidationGateway.
   * Converts object payloads to JSON string for gateway ingestion, then
   * returns the standardized ValidationResult.
   */
  validatePayload(data: unknown, metaType?: string): ValidationResult<OKFSectionData> {
    const result = validateOKFSection(
      typeof data === 'string' ? data : JSON.stringify(data),
      metaType,
    )
    return {
      ...result,
      payload: result.payload as unknown as OKFSectionData,
    }
  }

  /**
   * Convert a loaded bundle to SectionConfig[] for rendering.
   * Delegates to the shared bundleToSections utility.
   */
  bundleToSectionConfigs(bundle: OKFBundled): SectionConfig[] {
    return bundleToSections(bundle)
  }
}

// ============================================================================
// Public Adapter Instance — dual-port implementation
// ============================================================================

/**
 * Combined storage + runtime adapter for standalone single-HTML embeds.
 *
 * Usage:
 *   const adapter = new SingleHTMLEmbedAdapter()
 *   // Register built-in sections once
 *   adapter.registerComponent('intro', IntroSection)
 *   // Load and render
 *   const bundle = await adapter.runtime.loadTopicBundle('demo')
 *   const sections = adapter.runtime.bundleToSectionConfigs(bundle)
 *   const node = adapter.runtime.renderSection(sections[0])
 *   // Validate
 *   const result = adapter.runtime.validatePayload(someData, 'quiz')
 */
export class SingleHTMLEmbedAdapter {
  readonly storage: OKFStoragePort
  readonly runtime: OKFRuntimePort

  constructor() {
    this.storage = new EmbedInMemoryStorage()
    this.runtime = new EmbedRuntime(this.storage as EmbedInMemoryStorage)
  }

  /**
   * Register a section component with the embed registry.
   */
  registerComponent(type: string, component: ComponentType<any>): void {
    registerEmbedSection(type, component)
  }

  /**
   * Clear all registered components. Primarily for testing.
   */
  clearComponents(): void {
    clearEmbedRegistry()
  }
}

/**
 * Pre-initialized singleton for use by libs/loom-sections.tsx.
 * Components are registered at module load time.
 */
export const singleEmbedAdapter = new SingleHTMLEmbedAdapter()
