import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { beatMarks, type PresentRendererProps } from '../../../present-kernel'
import type { IntroPresentData } from '../../present'
import '../present.css'

/** Intro in Present mode: title and tagline, What, Why, then the roadmap (introBeats). */
export default function PresentIntro({ data, beat }: PresentRendererProps<IntroPresentData>) {
  const mark = beatMarks(beat)
  const pick = usePickAnchors()
  const { what, why, roadmap = [] } = data
  const meta = [data.estimatedTime, data.moduleCount ? `${data.moduleCount} sections` : null].filter(Boolean).join(' · ')

  return (
    <div className="present-intro" data-testid="present-intro">
      <div className="present-intro-head">
        {meta && <p className="present-kicker" {...mark(0, { motion: 'fade' })}>{meta}</p>}
        <h2 className="present-hero" {...mark(0, { motion: 'words' })}><PresentWords text={data.title ?? ''} /></h2>
        {data.subtitle && (
          <p className="present-tagline" {...mark(0, { motion: 'words', delay: 260 })}><PresentWords text={data.subtitle} /></p>
        )}
      </div>
      <div className={`present-intro-grid${roadmap.length ? '' : ' no-roadmap'}`}>
        <div className="present-intro-col">
          <section className="present-card" {...mark(1)} {...pick(what)}>
            <h3>What</h3>
            {what.definition && <p className="present-strong" {...mark(1, { motion: 'words', delay: 120 })} {...pick(what, 'definition')}><PresentWords text={what.definition} /></p>}
            <p {...mark(1, { motion: 'words', delay: 160 })} {...pick(what, 'summary')}><PresentWords text={what.summary} /></p>
            {!!what.bullets?.length && (
              <ul className="present-dots">
                {what.bullets.map((b, i) => (
                  <li key={i} {...mark(1, { motion: 'unfold', delay: 500 + i * 80 })} {...pick(what.bullets, i)}>{b}</li>
                ))}
              </ul>
            )}
          </section>
          <section className="present-card" {...mark(2)} {...pick(why)}>
            <h3>Why</h3>
            <p {...mark(2, { motion: 'words', delay: 160 })} {...pick(why, 'summary')}><PresentWords text={why.summary} /></p>
            {why.impact && <p className="present-strong" {...mark(2, { motion: 'words', delay: 400 })} {...pick(why, 'impact')}><PresentWords text={why.impact} /></p>}
          </section>
        </div>
        {roadmap.length > 0 && (
          <section className="present-card present-roadmap" {...mark(3)}>
            <h3>Roadmap</h3>
            <ol className="present-road">
              <span className="present-road-line" aria-hidden {...mark(3, { motion: 'draw', delay: 120 })} />
              {roadmap.map((step, i) => (
                <li key={i} {...mark(3, { delay: 200 + i * 70 })} {...pick(step)}>
                  <span className="present-road-title">{step.title}</span>
                  <span className="present-road-type">{step.type.replace(/-/g, ' ')}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  )
}
