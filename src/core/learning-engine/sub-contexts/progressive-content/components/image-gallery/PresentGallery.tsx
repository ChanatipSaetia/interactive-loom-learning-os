import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { beatMarks, type PresentRendererProps } from '../../../present-kernel'
import type { GalleryPresentData } from '../../present'
import '../present.css'

/**
 * Image gallery in Present mode: one image per beat with its caption; the image on stage drifts in
 * slowly (an ambient push-in outside the beat's timeline) (galleryBeats).
 */
export default function PresentGallery({ data, beat, active }: PresentRendererProps<GalleryPresentData>) {
  const mark = beatMarks(beat)
  const pick = usePickAnchors()
  const items = data.items ?? []
  const last = items.length - 1

  return (
    <div className="present-gallery" data-testid="present-gallery">
      <div className="present-gallery-frame">
        {items.map((item, i) => (
          <figure key={item.id} className={`present-gallery-shot${active && beat === i ? ' is-live' : ''}`} {...mark(i, { motion: 'fade', ...(i < last && { until: i }) })} {...pick(item)}>
            <img src={item.url} alt={item.caption} {...pick(item, 'url')} />
          </figure>
        ))}
      </div>
      <div className="present-gallery-side">
        <div className="present-gallery-captions">
          {items.map((item, i) => (
            <div key={item.id} className="present-gallery-caption" {...mark(i, { motion: 'words', delay: 200, ...(i < last && { until: i }) })}>
              <p {...pick(item, 'caption')}><PresentWords text={item.caption} /></p>
              {item.credit && <small {...pick(item, 'credit')}>{item.credit}</small>}
            </div>
          ))}
        </div>
        <div className="present-gallery-dots" aria-hidden>
          {items.map((item, i) => <i key={item.id} className={i === beat ? 'is-current' : undefined} />)}
        </div>
      </div>
    </div>
  )
}
