import type { SectionLayout } from '../../validation/types'
import { collection, markdownParagraphs, singleFile } from '../../validation/layout'

export const ProgressiveContentLayouts: Record<string, SectionLayout> = {
  intro: singleFile('content.yaml'),
  text: markdownParagraphs('content.md', 'paragraphs'),
  bullets: singleFile('items.yaml', 'items'),
  'taxonomy-browser': collection('categories'),
  'image-gallery': singleFile('gallery.yaml', 'items'),
  'pillar-layer': singleFile('matrix.yaml'),
}
