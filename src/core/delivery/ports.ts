/**
 * Hexagonal Ports for OKF Delivery & Storage
 *
 * Defines the formal boundary between the core learning engine and
 * host-specific infrastructure adapters. Per docs/agents/domain.md
 * Section 2.C, three Delivery & Storage Contexts exist:
 *
 *   1. InRepoOKFStorageContext — file system / Vite dev-server I/O
 *   2. SingleHTMLEmbedContext  — standalone widget in static HTML
 *   3. OKFFolderWebAppRuntimeContext — full SPA topic rendering
 *
 * Ports define _what_ the core needs. Adapters define _how_ a given
 * host environment fulfills that need.
 */

import type { ReactNode } from 'react'
import type { OKFSectionMeta, OKFSectionData, OKFBundled } from '../learning-engine/composition/okf/types'
import type { SectionConfig } from '../learning-engine/registry'
import type { ValidationResult } from '../learning-engine/validation/gateway'

// ============================================================================
// Storage Port — read/write/list of OKF section files
// ============================================================================
/**
 * Formal interface for OKF file storage operations.
 *
 * Concrete adapters:
 *   - InRepoStorageAdapter  (Vite dev-server disk writes + fetch reads)
 *   - SingleHTMLEmbedAdapter (in-memory or inline config, no disk)
 *   - Headless CLI adapter  (Node.js fs)
 */
export interface OKFStoragePort {
  /**
   * Read a single OKF section from storage.
   *
   * @param topicId - Topic folder identifier (e.g. "demo", "motorcycle")
   * @param sectionFolder - Section subfolder name (e.g. "intro", "quiz-basics")
   * @returns Parsed meta, data, and raw body text
   */
  readSection(
    topicId: string,
    sectionFolder: string,
  ): Promise<{ meta: OKFSectionMeta; data: OKFSectionData; body: string }>

  /**
   * Persist an OKF section back to storage.
   *
   * @param topicId - Topic folder identifier
   * @param sectionFolder - Section subfolder name
   * @param data - Structured section payload
   * @param rawText - Reconstructed YAML/Markdown source with frontmatter
   */
  saveSection(
    topicId: string,
    sectionFolder: string,
    data: OKFSectionData,
    rawText: string,
  ): Promise<void>

  /**
   * Read a topic hex map campaign definition (e.g. from public/hexmaps/<topicId>.yaml).
   *
   * @param topicId - Topic identifier
   * @returns Raw YAML string of the hex map
   */
  readHexMap(topicId: string): Promise<string>

  /**
   * Save a topic hex map campaign definition back to storage.
   *
   * @param topicId - Topic identifier
   * @param rawYaml - Updated hex map YAML source
   */
  saveHexMap?(topicId: string, rawYaml: string): Promise<void>

  /**
   * List all available topic identifiers.
   *
   * @returns Array of topic folder names (e.g. ["demo", "motorcycle"])
   */
  listTopics(): Promise<string[]>
}

// ============================================================================
// Runtime Port — load, render, and validate within a host environment
// ============================================================================
/**
 * Formal interface for OKF runtime delivery — loading topic bundles,
 * rendering sections as React nodes, and validating payloads.
 *
 * Concrete adapters:
 *   - WebAppRuntimeAdapter (SPA with router, lazy-loaded sections)
 *   - SingleHTMLEmbedAdapter (static HTML, eagerly-registered sections)
 *   - DevServerRuntimeAdapter (hot-module-reload aware)
 */
export interface OKFRuntimePort {
  /**
   * Load the complete bundle for a topic (all sections).
   *
   * @param topicId - Topic folder identifier
   * @returns Ordered array of bundled sections with meta and data
   */
  loadTopicBundle(topicId: string): Promise<OKFBundled>

  /**
   * Render a single section configuration as a React node.
   *
   * Bridge between the core SectionContract and the host's React
   * rendering pipeline. The adapter resolves the SectionConfig
   * against the registered component for that section type.
   *
   * @param config - Section type and props
   * @param sectionIndex - Optional zero-based index for data attributes
   * @returns Renderable ReactNode
   */
  renderSection(config: SectionConfig, sectionIndex?: number): ReactNode

  /**
   * Validate a section data payload through the 3-Tier Validation
   * Gateway (YAML syntax, Zod schema, semantic reference integrity).
   *
   * @param data - Raw section data to validate
   * @param metaType - Optional section type hint from meta frontmatter
   * @returns Validation result with status, payload, and diagnostics
   */
  validatePayload(data: unknown, metaType?: string): ValidationResult<OKFSectionData>
}

// ============================================================================
// Host Environment — identifies which adapter set is active
// ============================================================================

export type HostEnvironment = 'webapp-spa' | 'single-html-embed' | 'dev-server'

/**
 * Describes a fully-wired delivery context: one storage port + one
 * runtime port bound to a specific host environment.
 *
 * Used by the CoreLearningEngineContext to dispatch I/O and rendering
 * without knowing host-specific details.
 */
export interface OKFDeliveryContext {
  host: HostEnvironment
  storage: OKFStoragePort
  runtime: OKFRuntimePort
}
