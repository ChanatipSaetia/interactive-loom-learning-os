import React from 'react'
import { Sparkles, Target, Lightbulb, MapPin, Clock, Layers, ArrowRight, CheckCircle2, BookOpen } from 'lucide-react'
import type { OKFIntroRoadmapStep } from '../../core/okf/types'
import './intro.css'

export interface IntroSectionProps {
  title?: string
  subtitle?: string
  estimatedTime?: string
  moduleCount?: number
  what?: {
    definition?: string
    summary: string
    bullets?: string[]
    tags?: string[]
  }
  why?: {
    summary: string
    impact?: string
  }
  roadmap?: OKFIntroRoadmapStep[]
}

const IntroSection: React.FC<IntroSectionProps> = ({
  title,
  subtitle,
  estimatedTime,
  moduleCount,
  what,
  why,
  roadmap = [],
}) => {
  const handleScrollToSection = (sectionId?: string) => {
    if (!sectionId) return
    const el = document.getElementById(sectionId) || document.querySelector(`[data-section-type="${sectionId}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const hasHeroHeader = Boolean(title || subtitle || estimatedTime || (moduleCount !== undefined && moduleCount > 0))

  return (
    <div className="topic-intro-section" data-testid="intro-section">
      {/* Optional Hero Header - only rendered if title/subtitle/badges are provided */}
      {hasHeroHeader && (
        <div className="topic-intro-hero">
          <div className="topic-intro-badges">
            <div className="topic-intro-badge chapter-badge">
              <Sparkles size={14} className="sparkle-pulse" />
              <span>OVERVIEW</span>
            </div>

            {estimatedTime && (
              <div className="topic-intro-badge meta-badge">
                <Clock size={13} />
                <span>{estimatedTime}</span>
              </div>
            )}

            {moduleCount !== undefined && moduleCount > 0 && (
              <div className="topic-intro-badge meta-badge">
                <Layers size={13} />
                <span>{moduleCount} Modules</span>
              </div>
            )}
          </div>

          {title && <h1 className="topic-intro-title" data-testid="intro-title">{title}</h1>}
          {subtitle && <p className="topic-intro-subtitle" data-testid="intro-subtitle">{subtitle}</p>}
        </div>
      )}

      {/* Row 1: DEFINITION CARD (Full Width Row) */}
      {what?.definition && (
        <div className="topic-intro-definition-row">
          <div className="topic-intro-block pillar-definition" data-testid="intro-definition">
            <div className="pillar-header">
              <div className="pillar-icon-box icon-definition">
                <BookOpen size={18} />
              </div>
              <h3 className="pillar-title">CONCEPT DEFINITION & MEANING</h3>
            </div>

            <p className="pillar-definition-text">{what.definition}</p>
          </div>
        </div>
      )}

      {/* Row 2: WHAT & WHY CARDS (2-Column Grid) */}
      {(what || why) && (
        <div className="topic-intro-pillars">
          {/* WHAT BLOCK */}
          {what && (
            <div className="topic-intro-block pillar-what" data-testid="intro-what-card">
              <div className="pillar-header">
                <div className="pillar-icon-box icon-what">
                  <Target size={18} />
                </div>
                <h3 className="pillar-title">WHAT THIS COVERS</h3>
              </div>

              <p className="pillar-summary">{what.summary}</p>

              {what.bullets && what.bullets.length > 0 && (
                <ul className="pillar-bullets">
                  {what.bullets.map((item, idx) => (
                    <li key={idx}>
                      <CheckCircle2 size={14} className="bullet-icon" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {what.tags && what.tags.length > 0 && (
                <div className="pillar-tags">
                  {what.tags.map((tag, idx) => (
                    <span key={idx} className="pillar-tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* WHY BLOCK */}
          {why && (
            <div className="topic-intro-block pillar-why" data-testid="intro-why-card">
              <div className="pillar-header">
                <div className="pillar-icon-box icon-why">
                  <Lightbulb size={18} />
                </div>
                <h3 className="pillar-title">WHY IT MATTERS</h3>
              </div>

              <p className="pillar-summary">{why.summary}</p>

              {why.impact && (
                <div className="pillar-impact-box">
                  <span className="impact-label">KEY TAKEAWAY</span>
                  <p className="impact-text">{why.impact}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Row 3: LEARNING ROADMAP PREVIEW */}
      {roadmap && roadmap.length > 0 && (
        <div className="topic-intro-roadmap" data-testid="intro-roadmap">
          <div className="roadmap-header">
            <MapPin size={18} className="roadmap-icon" />
            <h3 className="roadmap-title">WHAT WILL BE COVERED AFTER THIS</h3>
            <span className="roadmap-subtitle">Interactive Learning Path</span>
          </div>

          <div className="roadmap-pipeline">
            {roadmap.map((step, idx) => (
              <div
                key={idx}
                className="roadmap-step-card"
                onClick={() => handleScrollToSection(step.sectionId || step.type)}
                role="button"
                tabIndex={0}
              >
                <div className="step-number">{idx + 1}</div>
                <div className="step-content">
                  <div className="step-meta">
                    <span className="step-type-pill">{step.type}</span>
                  </div>
                  <h4 className="step-title">{step.title}</h4>
                  <p className="step-desc">{step.description}</p>
                </div>
                <ArrowRight size={16} className="step-arrow" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default IntroSection
