import { SectionRenderer } from '../../components/layout/TopicShell'
import { TopicRegistry } from '../../core/topic-registry'
import { shopeeBuyerSections } from './sections'

export default function ShopeeBuyerJourney() {
  return (
    <div className="shopee-buyer-journey" data-testid="shopee-buyer-journey">
      {shopeeBuyerSections.map((section, idx) => (
        <SectionRenderer key={idx} config={section} />
      ))}
    </div>
  )
}

TopicRegistry.register('shopee-buyer-journey', ShopeeBuyerJourney)
