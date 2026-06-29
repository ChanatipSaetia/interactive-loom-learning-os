import type { SectionConfig } from '../../core/registry'
import {
  motorcycleIntroParagraphs,
  motorcycleQuestionsParagraphs,
  maintenanceBullets,
  motorcycleFlashcards,
  motorcycleTradeoffs,
  engineSchema,
  brakeSchema,
  problemTaxonomy,
} from './data'

export const motorcycleSections: SectionConfig[] = [
  // 1. Intro — set context
  {
    type: 'text',
    props: {
      title: 'บทนำ (Introduction)',
      heading: 'พื้นฐานที่ไบค์เกอร์ควรรู้',
      paragraphs: motorcycleIntroParagraphs,
    },
  },
  // 2. Vocabulary — teach key terms before they appear in diagrams
  {
    type: 'flashcards',
    props: {
      title: 'คำศัพท์ที่ต้องรู้ (Vocabulary)',
      terms: motorcycleFlashcards,
    },
  },
  // 3. Core explanation — explain concepts after vocabulary is established
  {
    type: 'bullets',
    props: {
      title: 'การบำรุงรักษาพื้นฐาน (Basic Maintenance)',
      ordered: false,
      items: maintenanceBullets,
    },
  },
  // 4. How it works — flowchart relies on vocabulary and concepts above
  {
    type: 'flowchart',
    props: {
      title: 'ระบบเครื่องยนต์และเชื้อเพลิง (Engine & Fuel Systems)',
      schema: engineSchema,
    },
  },
  {
    type: 'flowchart',
    props: {
      title: 'ระบบเบรก (Brake System)',
      schema: brakeSchema,
    },
  },
  // 5. Explore trade-offs — experiment after understanding the mechanisms
  {
    type: 'tradeoff-sandbox',
    props: {
      title: 'เปรียบเทียบตัวเลือก (Tradeoffs)',
      scenarios: motorcycleTradeoffs,
    },
  },
  // 6. Taxonomy — clarify confusing problem categories
  {
    type: 'taxonomy-browser',
    props: {
      title: 'แยกประเภทปัญหา (Problem Taxonomy)',
      categories: problemTaxonomy,
    },
  },
  // 7. Conclusion — reinforce with actionable questions
  {
    type: 'text',
    props: {
      title: 'สรุป (Conclusion)',
      heading: 'คำถามที่ควรถามช่าง',
      paragraphs: motorcycleQuestionsParagraphs,
    },
  },
]
