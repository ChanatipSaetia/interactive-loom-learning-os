/**
 * WebAppRuntimeAdapter — concrete OKFRuntimePort for the web app SPA.
 *
 * Handles topic bundle loading, section rendering via the SectionRegistry,
 * and payload validation through the 3-Tier Validation Gateway.
 *
 * Used by the CoreLearningEngineContext to dispatch I/O and rendering
 * without knowing host-specific details.
 */
import type { ReactNode } from 'react'
import type { OKFRuntimePort } from '../ports'
import type { OKFSectionData, OKFBundled } from '../../okf/types'
import type { SectionConfig } from '../../registry'
import type { ValidationResult } from '../../validation/gateway'
import { SectionRegistry } from '../../registry'
import { loadOKFBundle } from '../../okf/reader'
import { validateOKFSection } from '../../validation/gateway'

function renderSectionElement(config: SectionConfig): ReactNode {
  const Component = SectionRegistry.get(config.type)
  if (!Component) {
    return (
      <div className="section-missing" data-section-type={config.type}>
        Section type not registered: {config.type}
      </div>
    )
  }
  return <Component {...config.props} />
}

export class WebAppRuntimeAdapter implements OKFRuntimePort {
  /**
   * Load the complete topic bundle by delegating to the cached reader.
   */
  async loadTopicBundle(topicId: string): Promise<OKFBundled> {
    return loadOKFBundle(topicId)
  }

  /**
   * Render a single section configuration as a React node by resolving
   * the type against the SectionRegistry.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  renderSection(config: SectionConfig, _sectionIndex?: number): ReactNode {
    return renderSectionElement(config)
  }

  /**
   * Validate a section data payload through the 3-Tier Validation Gateway.
   */
  validatePayload(data: unknown, metaType?: string): ValidationResult<OKFSectionData> {
    const result = validateOKFSection(
      typeof data === 'string' ? data : JSON.stringify(data),
      metaType
    )
    return {
      ...result,
      payload: result.payload as unknown as OKFSectionData,
    }
  }
}
