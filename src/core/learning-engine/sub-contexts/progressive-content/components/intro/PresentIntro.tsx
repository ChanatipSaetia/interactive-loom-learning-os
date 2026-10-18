import { BookOpen, Clock, Layers, Lightbulb, MapPin, Sparkles, Target } from 'lucide-react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { beatMarks, focus, type PresentRendererProps } from '../../../present-kernel'
import { introBeats, type IntroPresentData } from '../../present'
import './intro.css'
import '../present.css'

/** Bullets of What this covers the stage shows; the rest stay in Read (decision 109). */
const WHAT_BULLETS = 3

/**
 * Intro in Present mode (introBeats), one idea per beat in the Read intro's colours (decision 109):
 * the title and tagline; what it is (the definition, else the summary) with a few of its points; why
 * it matters, ending on the key takeaway; the roadmap as a path of step titles. Each scene replaces
 * the last. Tags, the summary beside a definition and the roadmap's descriptions stay in Read.
 */
export default function PresentIntro({ data, beat }: PresentRendererProps<IntroPresentData>) {
  const mark = beatMarks(beat)
  const pick = usePickAnchors()
  const { what, why, roadmap = [] } = data
  const beats = introBeats(data)
  const last = beats.length - 1
  // Beat numbers by ID: an intro without a title or tagline starts at What
  const n = (id: string) => beats.findIndex((b) => b.id === id)
  const [at0, at1, at2, at3] = [n('title'), n('what'), n('why'), n('roadmap')]
  const scene = (at: number) => mark(at, { motion: 'fade', ...(at < last && { until: at }) })
  const statement = what.definition || what.summary
  const points = (what.bullets ?? []).slice(0, WHAT_BULLETS)

  return (
    <div className="topic-intro-section present-intro present-scenes" data-testid="present-intro">
      {at0 >= 0 && (
        <div className="present-intro-hero" {...scene(at0)}>
          <div className="topic-intro-badges" {...mark(at0, { motion: 'fade', delay: 500 })}>
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
          {data.title && <h1 className="topic-intro-title" {...mark(at0, { motion: 'zoom' })} {...focus(beat === at0)}>{data.title}</h1>}
          {data.subtitle && <p className="topic-intro-subtitle" {...mark(at0, { motion: 'words', delay: 420 })}><PresentWords text={data.subtitle} /></p>}
        </div>
      )}

      <div className="present-intro-scene" {...scene(at1)} {...pick(what)}>
        <div className="pillar-header">
          <div className={`pillar-icon-box ${what.definition ? 'icon-definition' : 'icon-what'}`}>{what.definition ? <BookOpen size={18} /> : <Target size={18} />}</div>
          <h3 className="pillar-title">{what.definition ? 'WHAT IT IS' : 'WHAT THIS COVERS'}</h3>
        </div>
        <p className="present-headline" {...mark(at1, { motion: 'zoom', delay: 160 })} {...focus(beat === at1)} {...pick(what, what.definition ? 'definition' : 'summary')}>{statement}</p>
        {points.length > 0 && (
          <ul className="pillar-bullets present-intro-points">
            {points.map((item, i) => (
              <li key={i} {...mark(at1, { motion: 'unfold', delay: 900 + i * 160 })} {...pick(what.bullets, i)}>
                <span className="present-intro-tick" aria-hidden>{i + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="present-intro-scene is-why" {...scene(at2)} {...pick(why)}>
        <div className="pillar-header">
          <div className="pillar-icon-box icon-why"><Lightbulb size={18} /></div>
          <h3 className="pillar-title">WHY IT MATTERS</h3>
        </div>
        {why.impact ? (
          <>
            <p className="present-lead" {...mark(at2, { motion: 'words', delay: 160 })} {...pick(why, 'summary')}><PresentWords text={why.summary} /></p>
            <div className="pillar-impact-box present-intro-takeaway" {...mark(at2, { motion: 'zoom', delay: 900 })} {...focus(beat === at2)} {...pick(why, 'impact')}>
              <span className="impact-label">KEY TAKEAWAY</span>
              <p className="impact-text">{why.impact}</p>
            </div>
          </>
        ) : (
          <p className="present-headline" {...mark(at2, { motion: 'zoom', delay: 160 })} {...focus(beat === at2)} {...pick(why, 'summary')}>{why.summary}</p>
        )}
      </div>

      {roadmap.length > 0 && (
        <div className="present-intro-scene" {...scene(at3)}>
          <div className="roadmap-header">
            <MapPin size={18} className="roadmap-icon" />
            <h3 className="roadmap-title">WHAT COMES NEXT</h3>
          </div>
          <div className="present-roadmap">
            <span className="present-roadmap-line" aria-hidden {...mark(at3, { motion: 'draw', delay: 150 })} />
            <ol className="present-roadmap-steps">
              {roadmap.map((step, i) => (
                <li key={i} className="present-roadmap-step" {...mark(at3, { motion: 'pop', delay: 300 + i * 180 })} {...pick(step)}>
                  <span className="step-number">{i + 1}</span>
                  <span className="present-roadmap-title" {...pick(step, 'title')}>{step.title}</span>
                  <span className="step-type-pill">{step.type}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
