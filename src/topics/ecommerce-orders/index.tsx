import { SectionRenderer } from '../../components/layout/TopicShell'
import { ecommerceOrdersSections } from './sections'

export default function EcommerceOrdersTopic() {
  return (
    <div className="ecommerce-orders-topic" data-testid="ecommerce-orders-topic">
      {ecommerceOrdersSections.map((section, idx) => (
        <SectionRenderer key={idx} config={section} />
      ))}
    </div>
  )
}
