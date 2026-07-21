import React, { useState } from 'react'
import { Target, Lightbulb, Compass, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import type { OKFSectionIntro } from '../../core/okf/types'
import './section-intro-card.css'

export interface SectionIntroCardProps {
  intro: OKFSectionIntro
  title?: string
  type?: string
}

export const SectionIntroCard: React.FC<SectionIntroCardProps> = ({ intro, title, type }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'what' | 'why' | 'next'>('all')

  if (!intro || (!intro.what && !intro.why && !intro.next)) {
    return null
  }

  return (
    <div className="section-intro-container" data-testid="section-intro-card">
      <div className="section-intro-header">
        <div className="section-intro-badge">
          <Sparkles className="section-intro-badge-icon" size={14} />
          <span className="section-intro-badge-text">SECTION BRIEFING</span>
          {type && <span className="section-intro-type-tag">{type}</span>}
        </div>

        {title && <h4 className="section-intro-title">{title}</h4>}

        <div className="section-intro-controls">
          <div className="section-intro-tab-group" role="tablist">
            <button
              className={`section-intro-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
              title="Show all 3 points"
            >
              All
            </button>
            {intro.what && (
              <button
                className={`section-intro-tab tab-what ${activeTab === 'what' ? 'active' : ''}`}
                onClick={() => setActiveTab('what')}
              >
                What
              </button>
            )}
            {intro.why && (
              <button
                className={`section-intro-tab tab-why ${activeTab === 'why' ? 'active' : ''}`}
                onClick={() => setActiveTab('why')}
              >
                Why
              </button>
            )}
            {intro.next && (
              <button
                className={`section-intro-tab tab-next ${activeTab === 'next' ? 'active' : ''}`}
                onClick={() => setActiveTab('next')}
              >
                What's Next
              </button>
            )}
          </div>

          <button
            className="section-intro-toggle"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand briefing' : 'Collapse briefing'}
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="section-intro-body">
          <div className={`section-intro-grid active-filter-${activeTab}`}>
            {intro.what && (activeTab === 'all' || activeTab === 'what') && (
              <div className="section-intro-item card-what" data-testid="section-intro-what">
                <div className="section-intro-item-header">
                  <div className="section-intro-icon-wrapper icon-what">
                    <Target size={16} />
                  </div>
                  <span className="section-intro-item-label">WHAT YOU'LL LEARN</span>
                </div>
                <p className="section-intro-item-text">{intro.what}</p>
              </div>
            )}

            {intro.why && (activeTab === 'all' || activeTab === 'why') && (
              <div className="section-intro-item card-why" data-testid="section-intro-why">
                <div className="section-intro-item-header">
                  <div className="section-intro-icon-wrapper icon-why">
                    <Lightbulb size={16} />
                  </div>
                  <span className="section-intro-item-label">WHY IT MATTERS</span>
                </div>
                <p className="section-intro-item-text">{intro.why}</p>
              </div>
            )}

            {intro.next && (activeTab === 'all' || activeTab === 'next') && (
              <div className="section-intro-item card-next" data-testid="section-intro-next">
                <div className="section-intro-item-header">
                  <div className="section-intro-icon-wrapper icon-next">
                    <Compass size={16} />
                  </div>
                  <span className="section-intro-item-label">WHAT'S COVERED AFTER THIS</span>
                </div>
                <p className="section-intro-item-text">{intro.next}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
