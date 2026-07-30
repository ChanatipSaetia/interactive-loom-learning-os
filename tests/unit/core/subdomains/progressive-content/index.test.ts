import { describe, it, expect } from 'vitest'
import * as ProgressiveContentSubdomain from '../../../../../src/core/subdomains/progressive-content'

describe('ProgressiveContent Bounded Context Entry Point', () => {
  it('exports all Zod schemas', () => {
    expect(ProgressiveContentSubdomain.TextSectionSchema).toBeDefined()
    expect(ProgressiveContentSubdomain.IntroSectionSchema).toBeDefined()
    expect(ProgressiveContentSubdomain.BulletsSectionSchema).toBeDefined()
    expect(ProgressiveContentSubdomain.TaxonomyBrowserSectionSchema).toBeDefined()
    expect(ProgressiveContentSubdomain.ImageGallerySectionSchema).toBeDefined()
  })

  it('exports all section components', () => {
    expect(ProgressiveContentSubdomain.TextSection).toBeDefined()
    expect(ProgressiveContentSubdomain.IntroSection).toBeDefined()
    expect(ProgressiveContentSubdomain.BulletsSection).toBeDefined()
    expect(ProgressiveContentSubdomain.TaxonomyBrowserSection).toBeDefined()
    expect(ProgressiveContentSubdomain.ImageGallerySection).toBeDefined()
  })

  it('schemas are zod objects', () => {
    expect(ProgressiveContentSubdomain.TextSectionSchema._def).toBeDefined()
    expect(ProgressiveContentSubdomain.IntroSectionSchema._def).toBeDefined()
    expect(ProgressiveContentSubdomain.BulletsSectionSchema._def).toBeDefined()
    expect(ProgressiveContentSubdomain.TaxonomyBrowserSectionSchema._def).toBeDefined()
    expect(ProgressiveContentSubdomain.ImageGallerySectionSchema._def).toBeDefined()
  })
})
