import type { SectionConfig } from '../../core/registry'
import {
  orderSchema,
  ecommerceOrdersParagraphs,
  ecommerceOrdersLifecycleMarkdown,
  ecommerceOrdersCapabilityBullets,
} from './data'

export const ecommerceOrdersSections: SectionConfig[] = [
  {
    type: 'text',
    props: {
      title: 'E-Commerce Automated Order Processing',
      heading: 'Checkout, Payment, and Fraud Detection Pipeline',
      paragraphs: ecommerceOrdersParagraphs,
    },
  },
  {
    type: 'flowchart',
    props: {
      title: 'Order Processing Pipeline',
      schema: orderSchema,
    },
  },
  {
    type: 'text',
    props: {
      title: 'Order Lifecycle',
      paragraphs: [ecommerceOrdersLifecycleMarkdown],
    },
  },
  {
    type: 'bullets',
    props: {
      title: 'Pipeline Capabilities',
      ordered: false,
      items: ecommerceOrdersCapabilityBullets,
    },
  },
]
