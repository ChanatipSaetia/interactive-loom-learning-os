import { describe, it, expect } from 'vitest'
import {
  TextSectionSchema,
  IntroSectionSchema,
  BulletsSectionSchema,
  TaxonomyBrowserSectionSchema,
  ImageGallerySectionSchema,
  BulletItemSchema,
  TaxonomyCategorySchema,
  GalleryItemSchema,
  IntroRoadmapStepSchema,
} from '../../../../../../src/core/learning-engine/sub-contexts/progressive-content/schema'

describe('TextSectionSchema', () => {
  it('validates correct text section data', () => {
    const valid = {
      type: 'text',
      paragraphs: ['First paragraph', 'Second paragraph with **bold** text'],
    }
    const result = TextSectionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects wrong type literal', () => {
    const invalid = {
      type: 'intro',
      paragraphs: ['text'],
    }
    const result = TextSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects missing paragraphs', () => {
    const invalid = {
      type: 'text',
    }
    const result = TextSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('accepts empty paragraphs array', () => {
    const valid = {
      type: 'text',
      paragraphs: [],
    }
    const result = TextSectionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })
})

describe('IntroSectionSchema', () => {
  it('validates correct intro section data', () => {
    const valid = {
      type: 'intro',
      title: 'Topic Title',
      subtitle: 'Topic subtitle',
      estimatedTime: '30 min',
      moduleCount: 5,
      what: {
        definition: 'A concept definition',
        summary: 'What this covers',
        bullets: ['Point 1', 'Point 2'],
        tags: ['tag1', 'tag2'],
      },
      why: {
        summary: 'Why it matters',
        impact: 'Key impact',
      },
      roadmap: [
        {
          sectionId: 'sec-1',
          title: 'Step 1',
          type: 'text',
          description: 'First step',
        },
      ],
    }
    const result = IntroSectionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('validates intro with minimal required fields', () => {
    const valid = {
      type: 'intro',
      what: {
        summary: 'What this covers',
      },
      why: {
        summary: 'Why it matters',
      },
    }
    const result = IntroSectionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects wrong type literal', () => {
    const invalid = {
      type: 'text',
      what: { summary: 'text' },
      why: { summary: 'text' },
    }
    const result = IntroSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects missing required what.summary', () => {
    const invalid = {
      type: 'intro',
      what: {},
      why: { summary: 'text' },
    }
    const result = IntroSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects missing required why.summary', () => {
    const invalid = {
      type: 'intro',
      what: { summary: 'text' },
      why: {},
    }
    const result = IntroSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('IntroRoadmapStepSchema', () => {
  it('validates required roadmap step fields', () => {
    const valid = {
      title: 'Step 1',
      type: 'text',
      description: 'Description',
    }
    const result = IntroRoadmapStepSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts optional sectionId', () => {
    const valid = {
      sectionId: 'sec-1',
      title: 'Step 1',
      type: 'text',
      description: 'Description',
    }
    const result = IntroRoadmapStepSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const invalid = {
      title: 'Step 1',
    }
    const result = IntroRoadmapStepSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('BulletsSectionSchema', () => {
  it('validates correct bullets section data', () => {
    const valid = {
      type: 'bullets',
      items: [
        { text: 'Top level item' },
        {
          text: 'Parent item',
          children: [
            { text: 'Nested child' },
            {
              text: 'Deep child',
              children: [{ text: 'Deeply nested' }],
            },
          ],
        },
      ],
    }
    const result = BulletsSectionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects wrong type literal', () => {
    const invalid = {
      type: 'text',
      items: [{ text: 'item' }],
    }
    const result = BulletsSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects missing items', () => {
    const invalid = {
      type: 'bullets',
    }
    const result = BulletsSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('accepts empty items array', () => {
    const valid = {
      type: 'bullets',
      items: [],
    }
    const result = BulletsSectionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })
})

describe('BulletItemSchema', () => {
  it('validates required text field', () => {
    const valid = { text: 'Item text' }
    const result = BulletItemSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts nested children', () => {
    const valid = {
      text: 'Parent',
      children: [{ text: 'Child' }],
    }
    const result = BulletItemSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects missing text', () => {
    const invalid = {}
    const result = BulletItemSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('TaxonomyBrowserSectionSchema', () => {
  it('validates correct taxonomy browser data', () => {
    const valid = {
      type: 'taxonomy-browser',
      categories: [
        {
          icon: 'Circle',
          title: 'Category 1',
          subtitle: 'Subtitle 1',
          description: 'Description 1',
          details: 'Deep details 1',
          analogy: 'Analogy 1',
          primaryFocus: 'Focus 1',
          inScope: ['scope1', 'scope2'],
          outOfScope: ['out1'],
          color: 'blue',
        },
      ],
    }
    const result = TaxonomyBrowserSectionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects wrong type literal', () => {
    const invalid = {
      type: 'intro',
      categories: [],
    }
    const result = TaxonomyBrowserSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects missing categories', () => {
    const invalid = {
      type: 'taxonomy-browser',
    }
    const result = TaxonomyBrowserSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('TaxonomyCategorySchema', () => {
  it('validates all required category fields', () => {
    const valid = {
      icon: 'Circle',
      title: 'Cat',
      subtitle: 'Sub',
      description: 'Desc',
      details: 'Details',
      analogy: 'Analog',
      primaryFocus: 'Focus',
      inScope: ['s1'],
      outOfScope: ['o1'],
      color: 'blue',
    }
    const result = TaxonomyCategorySchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const invalid = {
      icon: 'Circle',
      title: 'Cat',
    }
    const result = TaxonomyCategorySchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it.each(['rose', 'violet', '#89b4fa', 'var(--ctp-blue)'])('rejects out-of-palette color %s', (color) => {
    const result = TaxonomyCategorySchema.safeParse({
      icon: 'Circle',
      title: 'Cat',
      subtitle: 'Sub',
      description: 'Desc',
      details: 'Details',
      analogy: 'Analog',
      primaryFocus: 'Focus',
      inScope: ['s1'],
      outOfScope: ['o1'],
      color,
    })
    expect(result.success).toBe(false)
  })

  it.each(['blue', 'peach', 'pink', 'mauve', 'green', 'teal', 'sky', 'lavender', 'yellow', 'red'])(
    'accepts theme accent color %s',
    (color) => {
      const result = TaxonomyCategorySchema.safeParse({
        icon: 'Circle',
        title: 'Cat',
        subtitle: 'Sub',
        description: 'Desc',
        details: 'Details',
        analogy: 'Analog',
        primaryFocus: 'Focus',
        inScope: ['s1'],
        outOfScope: ['o1'],
        color,
      })
      expect(result.success).toBe(true)
    }
  )
})

describe('ImageGallerySectionSchema', () => {
  it('validates correct image gallery data', () => {
    const valid = {
      type: 'image-gallery',
      items: [
        {
          id: 'img-1',
          url: '/images/photo.jpg',
          caption: 'A beautiful photo',
          credit: 'Photographer Name',
        },
        {
          id: 'img-2',
          url: '/images/diagram.png',
          caption: 'System diagram',
        },
      ],
    }
    const result = ImageGallerySectionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts optional credit field', () => {
    const valid = {
      type: 'image-gallery',
      items: [
        {
          id: 'img-1',
          url: '/images/photo.jpg',
          caption: 'Photo',
        },
      ],
    }
    const result = ImageGallerySectionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects wrong type literal', () => {
    const invalid = {
      type: 'bullets',
      items: [],
    }
    const result = ImageGallerySectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects missing items', () => {
    const invalid = {
      type: 'image-gallery',
    }
    const result = ImageGallerySectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('GalleryItemSchema', () => {
  it('validates required gallery item fields', () => {
    const valid = {
      id: 'img-1',
      url: '/images/photo.jpg',
      caption: 'Photo',
    }
    const result = GalleryItemSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts optional credit', () => {
    const valid = {
      id: 'img-1',
      url: '/images/photo.jpg',
      caption: 'Photo',
      credit: 'Author',
    }
    const result = GalleryItemSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects missing url', () => {
    const invalid = {
      id: 'img-1',
      caption: 'Photo',
    }
    const result = GalleryItemSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})
