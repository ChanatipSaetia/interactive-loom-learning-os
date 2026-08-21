import type { HexCampaignSourcePort } from '../ports'
import type { HexCampaignData } from '../../../generic/hex-map'
import { validateHexCampaign } from '../../../learning-engine/validation/gateway'
import type { OKFStoragePort } from '../../../delivery/ports'

export class ValidationGatewayCampaignAdapter implements HexCampaignSourcePort {
  constructor(
    private storage: OKFStoragePort,
    private availableSectionIds?: string[]
  ) {}

  async loadCampaign(topicId: string): Promise<HexCampaignData> {
    const rawYaml = await this.storage.readHexMap(topicId)
    const result = validateHexCampaign(rawYaml, this.availableSectionIds)

    if (result.status === 'error') {
      const firstError = result.diagnostics.find((d) => d.tier === 1 || d.tier === 2)
      throw new Error(`Failed to validate hex map campaign for "${topicId}": ${firstError?.message || 'Invalid campaign schema'}`)
    }

    return result.payload
  }

  async saveCampaign(topicId: string, campaign: HexCampaignData): Promise<void> {
    if (this.storage.saveHexMap) {
      // Basic YAML serialization or save
      const yaml = await import('js-yaml')
      const rawYaml = yaml.dump(campaign)
      await this.storage.saveHexMap(topicId, rawYaml)
    }
  }
}
