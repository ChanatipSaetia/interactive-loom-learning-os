import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { beatMarks, type BeatMarkAttributes, type BeatMarkOptions } from '../../../present-kernel'
import type { PresentRendererProps } from '../../../present-kernel'
import type { BulletItem } from '../../schema'
import type { BulletsPresentData } from '../../present'
import '../present.css'

type Mark = (at: number, options?: BeatMarkOptions) => BeatMarkAttributes

/** Children unfold out of their parent, one after another, in the parent's beat. */
function Children({ items, at, mark, depth, start }: { items: BulletItem[]; at: number; mark: Mark; depth: number; start: number }) {
  const pick = usePickAnchors()
  let delay = start
  return (
    <ul className="present-sub">
      <span className="present-stem" aria-hidden {...mark(at, { motion: 'draw', delay: start - 80 })} />
      {items.map((child, i) => {
        const own = delay
        delay += 80 + (child.children?.length ?? 0) * 80
        return (
          <li key={i} {...mark(at, { motion: 'unfold', delay: own })} {...pick(child)}>
            {child.text}
            {!!child.children?.length && depth < 3 && <Children items={child.children} at={at} mark={mark} depth={depth + 1} start={own + 120} />}
          </li>
        )
      })}
    </ul>
  )
}

/** Bullets in Present mode: one top-level bullet per beat, its children unfolding from it (bulletsBeats). */
export default function PresentBullets({ data, beat }: PresentRendererProps<BulletsPresentData>) {
  const mark = beatMarks(beat)
  const pick = usePickAnchors()
  const items = data.items ?? []
  const List = data.ordered ? 'ol' : 'ul'

  return (
    <List className={`present-bullets${data.ordered ? ' is-ordered' : ''}`} data-testid="present-bullets">
      {items.map((item, i) => (
        <li key={i} className="present-bullet" {...mark(i)} {...pick(item)}>
          <span className="present-bullet-text">{item.text}</span>
          {!!item.children?.length && <Children items={item.children} at={i} mark={mark} depth={1} start={320} />}
        </li>
      ))}
    </List>
  )
}
