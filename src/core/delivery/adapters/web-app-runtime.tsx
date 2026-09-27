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
import type { OKFRuntimePort, OKFStoragePort } from '../ports'
import type { OKFSectionData, OKFBundled } from '../../learning-engine/composition/okf/types'
import type { SectionConfig } from '../../learning-engine/registry'
import type { ValidationResult } from '../../learning-engine/validation/gateway'
import { SectionRegistry } from '../../learning-engine/registry'
import { loadOKFBundle } from '../../learning-engine/composition/okf/loader'
import { ValidatedSection } from '../web-app-shell/ValidatedSection'
import { validateOKFSection } from '../../learning-engine/validation/gateway'

function renderSectionElement(config: SectionConfig): ReactNode {
  if (config.validation?.status === 'error') {
    return <ValidatedSection config={config}>{null}</ValidatedSection>
  }
  const Component = SectionRegistry.get(config.type)
  if (!Component) {
    return (
      <div className="section-missing" data-section-type={config.type}>
        Section type not registered: {config.type}
      </div>
    )
  }
  return (
    <ValidatedSection config={config}>
      <Component {...config.props} />
    </ValidatedSection>
  )
}

export class WebAppRuntimeAdapter implements OKFRuntimePort {
  constructor(private storage: OKFStoragePort) {}

  /**
   * Load the complete topic bundle through the Composition Engine's loader.
   */
  async loadTopicBundle(topicId: string): Promise<OKFBundled> {
    return loadOKFBundle(topicId, this.storage)
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
