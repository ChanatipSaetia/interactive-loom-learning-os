import type { SectionConfig } from '../../core/registry'
import {
  motorcycleIntroParagraphs,
  motorcycleQuestionsParagraphs,
  maintenanceBullets,
  motorcycleFlashcards,
  motorcycleTradeoffs,
  engineSchema,
  problemTaxonomy,
} from './data'

export const motorcycleSections: SectionConfig[] = [
  {
    type: 'text',
    props: {
      title: 'บทนำ (Introduction)',
      heading: 'พื้นฐานที่ไบค์เกอร์ควรรู้',
      paragraphs: motorcycleIntroParagraphs,
    },
  },
  {
    type: 'flowchart',
    props: {
      title: 'การทำงานของเครื่องยนต์ (Engine Workflow)',
      schema: engineSchema,
    },
  },
  {
    type: 'bullets',
    props: {
      title: 'การบำรุงรักษาพื้นฐาน (Basic Maintenance)',
      ordered: false,
      items: maintenanceBullets,
    },
  },
  {
    type: 'tradeoff-sandbox',
    props: {
      title: 'เปรียบเทียบตัวเลือก (Tradeoffs)',
      scenarios: motorcycleTradeoffs,
    },
  },
  {
    type: 'flashcards',
    props: {
      title: 'คำศัพท์ที่ต้องรู้ (Vocabulary)',
      terms: motorcycleFlashcards,
    },
  },
  {
    type: 'taxonomy-browser',
    props: {
      title: 'แยกประเภทปัญหา (Problem Taxonomy)',
      categories: problemTaxonomy,
    },
  },
  {
    type: 'text',
    props: {
      title: 'สรุป (Conclusion)',
      heading: 'คำถามที่ควรถามช่าง',
      paragraphs: motorcycleQuestionsParagraphs,
    },
  },
]
