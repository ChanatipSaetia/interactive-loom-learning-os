import type { ReactNode } from 'react'
import { QUIET } from './present-kernel'

/**
 * Where the viewer is in a section that plays one part at a time (decision 111): the parts' short
 * names in a column, the current one lit, the ones done ticked, the ones to come faint. It moves with
 * CSS as the beat changes, so it needs no beat marks; the voice skips it.
 */
export function PresentAgenda({ items, current, label }: { items: ReactNode[]; current: number; label: string }) {
  return (
    <ol className="present-agenda" aria-label={label} {...QUIET}>
      {items.map((item, i) => (
        <li key={i} className={i === current ? 'is-now' : i < current ? 'is-done' : undefined} aria-current={i === current ? 'step' : undefined}>
          <span className="present-agenda-dot" aria-hidden>{i + 1}</span>
          <span className="present-agenda-text">{item}</span>
        </li>
      ))}
    </ol>
  )
}
