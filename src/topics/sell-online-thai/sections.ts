import type { SectionConfig } from '../../core/registry'
import {
  introParagraphs,
  ecosystemParagraphs,
  platformComparisonScenarios,
  sellingJourneySchema,
  sellingChecklistBullets,
  sellingCategories,
} from './data'

export const sellOnlineSections: SectionConfig[] = [
  {
    type: 'text',
    props: {
      title: 'บทนำ',
      heading: 'การขายของออนไลน์แบบครบวงจร',
      paragraphs: introParagraphs,
    },
  },
  {
    type: 'flowchart',
    props: {
      title: 'ระบบขายของออนไลน์',
      schema: sellingJourneySchema,
    },
  },
  {
    type: 'text',
    props: {
      title: 'โครงสร้างระบบ',
      paragraphs: ecosystemParagraphs,
    },
  },
  {
    type: 'bullets',
    props: {
      title: 'Checklist การขายของออนไลน์',
      ordered: false,
      items: sellingChecklistBullets,
    },
  },
  {
    type: 'tradeoff-sandbox',
    props: {
      title: 'เปรียบเทียบแพลตฟอร์มและกลยุทธ์',
      scenarios: platformComparisonScenarios,
    },
  },
  {
    type: 'taxonomy-browser',
    props: {
      title: 'หมวดหมู่ธุรกิจออนไลน์',
      categories: sellingCategories,
    },
  },
]
