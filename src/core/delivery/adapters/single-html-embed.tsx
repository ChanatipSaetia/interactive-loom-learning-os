/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * SingleHTMLEmbedAdapter — concrete OKFStoragePort + OKFRuntimePort for
 * standalone single-HTML embeds (CDN-distributed widget bundles).
 *
 * Storage: read-only HTTP (no disk I/O — standalone scripts have no fs access).
 * Runtime: loads bundles through the Composition Engine's loader, renders through
 * an eagerly-filled component registry, and validates payloads through the
 * 3-Tier ValidationGateway.
 *
 * Decouples the embed widget from the full SPA app shell (router, lazy-loading,
 * dev-server middleware) while preserving backward-compatible public API.
 */
import { Suspense, type ComponentType, type ReactNode } from 'react'
import type { OKFStoragePort, OKFRuntimePort } from '../ports'
import type { OKFSectionData, OKFBundled } from '../../learning-engine/composition/okf/types'
import type { SectionConfig } from '../../learning-engine/registry'
import type { SectionFiles, ValidationResult } from '../../learning-engine/validation/gateway'
import { Registry } from '../../learning-engine/registry/generic-registry'
import { loadOKFBundle } from '../../learning-engine/composition/okf/loader'
import { toSectionConfigs } from '../../learning-engine/composition/okf/section-config'
import { validateOKFSection } from '../../learning-engine/validation/gateway'
import { SectionErrorBoundary } from '../../ui-system/primitives/SectionErrorBoundary'
import { InRepoStorageAdapter } from './in-repo-storage'
import { ValidatedSection } from '../web-app-shell/ValidatedSection'

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
// Storage Port — read-only HTTP, no disk I/O
// ============================================================================

/**
 * Read-only storage for the standalone embed. Reads OKF files over HTTP from
 * the page's OKF base URL (`window.__OKF_BASE_OVERRIDE__`, set by
 * `LoomSections.loadAndRenderOKF`). Saving is not available: standalone
 * scripts have no file-system access or dev-server middleware.
 */
class EmbedReadOnlyStorage implements OKFStoragePort {
  private http = new InRepoStorageAdapter()

  listSections(topicId: string): Promise<string[]> {
    return this.http.listSections(topicId)
  }

  readSectionFiles(topicId: string, sectionFolder: string): Promise<SectionFiles> {
    return this.http.readSectionFiles(topicId, sectionFolder)
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

  async readHexMap(topicId: string): Promise<string> {
    throw new Error(`Hex maps are not available in standalone embed mode (topic "${topicId}").`)
  }

  listTopics(): Promise<string[]> {
    return this.http.listTopics()
  }
}

// ============================================================================
// Section Rendering — validation outcome + error boundary
// ============================================================================

/**
 * Render a single section as a wrapped ReactNode with error boundary
 * and suspense fallback — identical to SPA rendering behavior.
 */
function renderEmbedSection(config: SectionConfig, sectionIndex?: number): ReactNode {
  if (config.validation?.status === 'error') {
    return (
      <div className="section-wrapper" data-section-type={config.type} data-section-index={sectionIndex ?? 0}>
        <ValidatedSection config={config}>{null}</ValidatedSection>
      </div>
    )
  }
  const Component = embedRegistry.get(config.type)
  if (!Component) {
    return (
      <div className="section-missing" data-section-type={config.type}>
        Section type not registered: {config.type}
      </div>
    )
  }

  return (
    <div className="section-wrapper" data-section-type={config.type} data-section-index={sectionIndex ?? 0}>
      <ValidatedSection config={config}>
        <SectionErrorBoundary sectionName={config.type}>
          <Suspense fallback={<div className="section-loading">Loading section...</div>}>
            <Component sectionIndex={sectionIndex ?? 0} {...config.props} />
          </Suspense>
        </SectionErrorBoundary>
      </ValidatedSection>
    </div>
  )
}

// ============================================================================
// Runtime Port — bundle loading, rendering, validation
// ============================================================================

class EmbedRuntime implements OKFRuntimePort {
  constructor(private storage: OKFStoragePort) {}

  /**
   * Load the complete topic bundle through the Composition Engine's loader.
   */
  async loadTopicBundle(topicId: string): Promise<OKFBundled> {
    return loadOKFBundle(topicId, this.storage)
  }

  /**
   * Render a single section config as a ReactNode through the eagerly-filled
   * embed component registry.
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
   * Delegates to the shared toSectionConfigs mapping.
   */
  bundleToSectionConfigs(bundle: OKFBundled): SectionConfig[] {
    return toSectionConfigs(bundle)
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
    this.storage = new EmbedReadOnlyStorage()
    this.runtime = new EmbedRuntime(this.storage)
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
