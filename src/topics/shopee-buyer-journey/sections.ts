import type { SectionConfig } from '../../core/registry'
import {
  introParagraphs,
  journeyParagraphs,
  buyerJourneySchema,
  paymentScenarios,
  takeawayBullets,
} from './data'

// Pattern: text → flowchart → tradeoff-sandbox → bullets

export const shopeeBuyerSections: SectionConfig[] = [
  {
    type: 'text',
    props: {
      title: 'บทนำ Shopee Thailand',
      heading: 'E-Commerce อันดับ 1 ของไทย',
      paragraphs: introParagraphs,
    },
  },
  {
    type: 'flowchart',
    props: {
      title: 'Buyer Journey',
      schema: buyerJourneySchema,
    },
  },
  {
    type: 'text',
    props: {
      title: 'รายละเอียดขั้นตอน',
      paragraphs: journeyParagraphs,
    },
  },
  {
    type: 'tradeoff-sandbox',
    props: {
      title: 'เปรียบเทียบวิธีชำระเงิน',
      scenarios: paymentScenarios,
    },
  },
  {
    type: 'bullets',
    props: {
      title: 'สรุป',
      ordered: false,
      items: takeawayBullets,
    },
  },
]
