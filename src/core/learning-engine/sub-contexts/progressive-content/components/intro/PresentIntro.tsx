import { ArrowRight, BookOpen, CheckCircle2, Clock, Layers, Lightbulb, MapPin, Sparkles, Target } from 'lucide-react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { beatMarks, focus, type PresentRendererProps } from '../../../present-kernel'
import type { IntroPresentData } from '../../present'
import './intro.css'
import '../present.css'

/**
 * Intro in Present mode (introBeats), drawn with the Read intro's cards: the hero with its badges, then
 * the definition and What this covers, then Why it matters, then the roadmap step cards.
 */
export default function PresentIntro({ data, beat }: PresentRendererProps<IntroPresentData>) {
  const mark = beatMarks(beat)
  const pick = usePickAnchors()
  const { what, why, roadmap = [] } = data

  return (
    <div className="topic-intro-section present-intro" data-testid="present-intro">
      <div className="topic-intro-hero">
        <div className="topic-intro-badges" {...mark(0, { motion: 'fade' })}>
          <div className="topic-intro-badge chapter-badge">
            <Sparkles size={14} className="sparkle-pulse" />
            <span>OVERVIEW</span>
          </div>
          {data.estimatedTime && (
            <div className="topic-intro-badge meta-badge">
              <Clock size={13} />
              <span>{data.estimatedTime}</span>
            </div>
          )}
          {!!data.moduleCount && (
            <div className="topic-intro-badge meta-badge">
              <Layers size={13} />
              <span>{data.moduleCount} Modules</span>
            </div>
          )}
        </div>
        {data.title && <h1 className="topic-intro-title" {...mark(0, { motion: 'words' })} {...focus(beat === 0)}><PresentWords text={data.title} /></h1>}
        {data.subtitle && <p className="topic-intro-subtitle" {...mark(0, { motion: 'words', delay: 260 })}><PresentWords text={data.subtitle} /></p>}
      </div>

      {what.definition && (
        <div className="topic-intro-definition-row">
          <div className="topic-intro-block pillar-definition" {...mark(1)} {...pick(what, 'definition')}>
            <div className="pillar-header">
              <div className="pillar-icon-box icon-definition"><BookOpen size={18} /></div>
              <h3 className="pillar-title">CONCEPT DEFINITION & MEANING</h3>
            </div>
            <p className="pillar-definition-text" {...mark(1, { motion: 'words', delay: 160 })}><PresentWords text={what.definition} /></p>
          </div>
        </div>
      )}

      <div className="topic-intro-pillars">
        <div className="topic-intro-block pillar-what" {...mark(1, { delay: what.definition ? 360 : 0 })} {...pick(what)}>
          <div className="pillar-header">
            <div className="pillar-icon-box icon-what"><Target size={18} /></div>
            <h3 className="pillar-title">WHAT THIS COVERS</h3>
          </div>
          <p className="pillar-summary" {...mark(1, { motion: 'words', delay: what.definition ? 500 : 160 })} {...pick(what, 'summary')}><PresentWords text={what.summary} /></p>
          {!!what.bullets?.length && (
            <ul className="pillar-bullets">
              {what.bullets.map((item, i) => (
                <li key={i} {...mark(1, { motion: 'unfold', delay: 700 + i * 80 })} {...pick(what.bullets, i)}>
                  <CheckCircle2 size={14} className="bullet-icon" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
          {!!what.tags?.length && (
            <div className="pillar-tags">
              {what.tags.map((tag, i) => (
                <span key={i} className="pillar-tag" {...mark(1, { motion: 'pop', delay: 900 + i * 60 })} {...pick(what.tags, i)}>{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="topic-intro-block pillar-why" {...mark(2)} {...pick(why)}>
          <div className="pillar-header">
            <div className="pillar-icon-box icon-why"><Lightbulb size={18} /></div>
            <h3 className="pillar-title">WHY IT MATTERS</h3>
          </div>
          <p className="pillar-summary" {...mark(2, { motion: 'words', delay: 160 })} {...pick(why, 'summary')}><PresentWords text={why.summary} /></p>
          {why.impact && (
            <div className="pillar-impact-box" {...mark(2, { delay: 500 })} {...pick(why, 'impact')}>
              <span className="impact-label">KEY TAKEAWAY</span>
              <p className="impact-text" {...mark(2, { motion: 'words', delay: 650 })}><PresentWords text={why.impact} /></p>
            </div>
          )}
        </div>
      </div>

      {roadmap.length > 0 && (
        <div className="topic-intro-roadmap" {...mark(3)}>
          <div className="roadmap-header">
            <MapPin size={18} className="roadmap-icon" />
            <h3 className="roadmap-title">WHAT WILL BE COVERED AFTER THIS</h3>
            <span className="roadmap-subtitle">Interactive Learning Path</span>
          </div>
          <div className="roadmap-pipeline">
            {roadmap.map((step, i) => (
              <div key={i} className="roadmap-step-card" {...mark(3, { delay: 200 + i * 70 })} {...pick(step)}>
                <div className="step-number">{i + 1}</div>
                <div className="step-content">
                  <div className="step-meta"><span className="step-type-pill">{step.type}</span></div>
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
