import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { beatMarks, type PresentRendererProps } from '../../../present-kernel'
import type { GalleryItem } from '../../schema'
import type { GalleryPresentData } from '../../present'
import '../present.css'

const two = (n: number) => String(n).padStart(2, '0')

/** One image in the Read gallery's frame, with its "Image unavailable" state. */
function Shot({ item, live }: { item: GalleryItem; live: boolean }) {
  const pick = usePickAnchors()
  const [error, setError] = useState(false)
  return error ? (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
      <ImageOff className="w-8 h-8" />
      <span className="text-sm font-mono">Image unavailable</span>
    </div>
  ) : (
    <img src={item.url} alt={item.caption} className={`present-gallery-img${live ? ' is-live' : ''}`} onError={() => setError(true)} {...pick(item, 'url')} />
  )
}

/**
 * Image gallery in Present mode, styled as the Read gallery and its lightbox: one image per beat in the
 * Read image frame, with the lightbox counter and caption; the image on stage drifts in slowly (an
 * ambient push-in outside the beat's timeline) (galleryBeats).
 */
export default function PresentGallery({ data, beat, active }: PresentRendererProps<GalleryPresentData>) {
  const mark = beatMarks(beat)
  const pick = usePickAnchors()
  const items = data.items ?? []
  const last = items.length - 1
  const at = Math.max(0, Math.min(beat, last))

  return (
    <div className="present-gallery" data-testid="present-gallery">
      <div className="present-gallery-meta" {...mark(0, { motion: 'fade' })}>
        <span className="flex-shrink-0 flex items-center px-3.5 py-1.5 rounded-full bg-muted/10 border border-border font-mono text-xs font-bold tracking-widest text-muted-foreground">
          {two(items.length)} images
        </span>
        <span className="font-mono text-xs tracking-widest text-muted-foreground">{two(at + 1)} / {two(items.length)}</span>
      </div>
      <div className="present-gallery-frame relative w-full rounded-lg overflow-hidden border border-border/50 bg-muted/20">
        {items.map((item, i) => (
          <figure key={item.id} className="present-gallery-shot" {...mark(i, { motion: 'fade', ...(i < last && { until: i }) })} {...pick(item)}>
            <Shot item={item} live={active && beat === i} />
          </figure>
        ))}
      </div>
      <div className="present-gallery-captions">
        {items.map((item, i) => (
          <div key={item.id} className="present-gallery-caption text-center space-y-1" {...mark(i, { motion: 'words', delay: 200, ...(i < last && { until: i }) })}>
            <p className="text-foreground font-medium leading-snug" {...pick(item, 'caption')}><PresentWords text={item.caption} /></p>
            {item.credit && <p className="text-muted-foreground text-xs font-mono" {...pick(item, 'credit')}>{item.credit}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
