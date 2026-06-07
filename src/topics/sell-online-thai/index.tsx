import { SectionRenderer } from '../../components/layout/TopicShell'
import { TopicRegistry } from '../../core/topic-registry'
import { sellOnlineSections } from './sections'

export default function SellOnlineThaiTopic() {
  return (
    <div className="sell-online-thai-topic" data-testid="sell-online-thai-topic">
      {sellOnlineSections.map((section, idx) => (
        <SectionRenderer key={idx} config={section} />
      ))}
    </div>
  )
}

TopicRegistry.register('sell-online-thai', SellOnlineThaiTopic)
