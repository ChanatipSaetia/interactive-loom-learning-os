import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { beatMarks, type BeatMarkAttributes, type BeatMarkOptions } from '../../../present-kernel'
import type { PresentRendererProps } from '../../../present-kernel'
import type { BulletItem } from '../../schema'
import type { BulletsPresentData } from '../../present'
import './bullets.css'
import '../present.css'

type Mark = (at: number, options?: BeatMarkOptions) => BeatMarkAttributes

const MARKERS = ['◆', '◦', '–']

/** The Read bullet marker: a diamond, circle or dash by depth, or the list's counter when ordered. */
function Marker({ depth, ordered }: { depth: number; ordered: boolean }) {
  const color = depth === 0 ? 'var(--primary)' : 'var(--secondary)'
  return ordered
    ? <span className="bullet-marker bullet-marker-ordered" style={{ color }} />
    : <span className="bullet-marker bullet-marker-unordered" style={{ color }}>{MARKERS[Math.min(depth, 2)]}</span>
}

/** Children unfold out of their card, one after another, in the card's beat. */
function Children({ items, at, mark, depth, start, ordered }: { items: BulletItem[]; at: number; mark: Mark; depth: number; start: number; ordered: boolean }) {
  const pick = usePickAnchors()
  let delay = start
  return (
    <ul className={`bullet-children${ordered ? ' bullet-children-ordered' : ''}`}>
      {items.map((child, i) => {
        const own = delay
        delay += 80 + (child.children?.length ?? 0) * 80
        return (
          <li key={i} className="bullet-item" {...mark(at, { motion: 'unfold', delay: own })} {...pick(child)}>
            <div className="bullet-item-row">
              <Marker depth={depth} ordered={ordered} />
              <span className="bullet-text" {...pick(child, 'text')}>{child.text}</span>
            </div>
            {!!child.children?.length && depth < 3 && <Children items={child.children} at={at} mark={mark} depth={depth + 1} start={own + 120} ordered={ordered} />}
          </li>
        )
      })}
    </ul>
  )
}

/** Bullets in Present mode, as the Read card grid: one top-level card per beat, its sub-points unfolding inside it (bulletsBeats). */
export default function PresentBullets({ data, beat }: PresentRendererProps<BulletsPresentData>) {
  const mark = beatMarks(beat)
  const pick = usePickAnchors()
  const items = data.items ?? []
  const ordered = !!data.ordered

  return (
    <ul className={`bullets-list ${ordered ? 'bullets-list-ordered' : 'bullets-list-unordered'} present-bullets`} data-testid="present-bullets">
      {items.map((item, i) => (
        <li key={i} className="bullets-card" {...mark(i)} {...pick(item)}>
          <div className="bullets-card-header">
            <div className="bullet-item-row">
              <Marker depth={0} ordered={ordered} />
              <span className="bullet-text bullet-text-parent" {...pick(item, 'text')}>{item.text}</span>
            </div>
          </div>
          {!!item.children?.length && <Children items={item.children} at={i} mark={mark} depth={1} start={320} ordered={ordered} />}
        </li>
      ))}
    </ul>
  )
}
