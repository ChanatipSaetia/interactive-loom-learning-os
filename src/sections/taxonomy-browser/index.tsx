import { SectionRegistry } from '../../core/registry'
import type { ComponentType } from 'react'
import './taxonomy-browser.css'

export interface TaxonomyCategory {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: ComponentType<any>
  title: string
  subtitle: string
  description: string
  details: string
  analogy: string
  primaryFocus: string
  inScope: string[]
  outOfScope: string[]
  color: string
}

export interface TaxonomyBrowserSectionProps {
  title?: string
  categories: TaxonomyCategory[]
}

const colorAccentMap: Record<string, string> = {
  blue: 'var(--ctp-blue)',
  peach: 'var(--ctp-peach)',
  pink: 'var(--ctp-pink)',
  mauve: 'var(--ctp-mauve)',
  green: 'var(--ctp-green)',
  teal: 'var(--ctp-teal)',
  sky: 'var(--ctp-sky)',
  lavender: 'var(--ctp-lavender)',
  yellow: 'var(--ctp-yellow)',
  red: 'var(--ctp-red)',
}

function TaxonomyBrowserSection({ title, categories }: TaxonomyBrowserSectionProps) {
  return (
    <div className="taxonomy-browser-section" data-testid="taxonomy-browser-section">
      {title && (
        <h3 className="taxonomy-browser-title" data-testid="taxonomy-browser-title">
          {title}
        </h3>
      )}
      <div className="taxonomy-browser-grid" data-testid="taxonomy-browser-grid">
        {categories.map((cat, idx) => {
          const Icon = cat.icon
          const accent = colorAccentMap[cat.color] ?? 'var(--ctp-blue)'
          return (
            <div
              key={idx}
              className="taxonomy-browser-card"
              data-testid={`taxonomy-browser-card-${idx}`}
              style={{ borderTopColor: accent }}
            >
              <div className="taxonomy-browser-card-icon" data-testid={`taxonomy-browser-icon-${idx}`}>
                <Icon style={{ color: accent }} size={20} strokeWidth={1.5} />
              </div>
              <div className="taxonomy-browser-card-body">
                {cat.subtitle && (
                  <p className="taxonomy-browser-subtitle" data-testid={`taxonomy-browser-subtitle-${idx}`}>
                    {cat.subtitle}
                  </p>
                )}
                <h4 className="taxonomy-browser-card-title" data-testid={`taxonomy-browser-card-title-${idx}`}>
                  {cat.title}
                </h4>
                <p className="taxonomy-browser-description" data-testid={`taxonomy-browser-description-${idx}`}>
                  {cat.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

SectionRegistry.register('taxonomy-browser', TaxonomyBrowserSection as ComponentType<unknown>)

export default TaxonomyBrowserSection
