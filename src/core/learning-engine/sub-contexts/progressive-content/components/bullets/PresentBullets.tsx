import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentAgenda } from '../../../PresentAgenda'
import { beatMarks, type PresentRendererProps, QUIET } from '../../../present-kernel'
import { bulletScenes, type BulletScene, type BulletsPresentData } from '../../present'
import { paginateBullets } from '../../bullet-pages'
import { BulletText } from './BulletText'
import { BulletIcon } from './icons'
import './bullets.css'
import '../present.css'

/** Identical typography in the measuring copy and the visible rows makes pagination match the stage. */
function BulletRow({ scene, at, beat, until, ordered, measuring = false }: {
  scene: BulletScene; at: number; beat: number; until: number; ordered?: boolean; measuring?: boolean
}) {
  const pick = usePickAnchors()
  const nested = scene.parents.length > 0
  return (
    <div className={`present-bullet-row${nested ? ' is-child' : ' is-parent'}${!measuring && beat === at ? ' is-current' : ''}`}
      style={{ '--bullet-depth': Math.min(scene.parents.length, 4) } as CSSProperties}
      {...(!measuring && { ...beatMarks(beat)(at, { motion: 'fade', until }), ...pick(scene.item) })}>
      <span className="present-bullet-icon" {...QUIET}>
        <BulletIcon name={scene.item.icon} nested={nested} />
      </span>
      <div className="present-bullet-copy">
        {ordered && !nested && <span className="present-bullet-order" {...QUIET}>Point {scene.topIndex + 1}</span>}
        <p className={nested ? 'present-bullet-subitem' : 'present-headline'} {...(!measuring && pick(scene.item, 'text'))}><BulletText text={scene.item.text} /></p>
      </div>
    </div>
  )
}

function Context({ scene }: { scene: BulletScene }) {
  return scene.parents.length > 0 ? (
    <div className="present-bullet-context" {...QUIET}>
      {scene.parents.slice(-2).map((parent, i) => <p key={i}><BulletText text={parent.text} /></p>)}
      <span className="present-eyebrow">Continued</span>
    </div>
  ) : null
}

/** Content stays together on measured pages; beats guide attention through its visible hierarchy. */
export default function PresentBullets({ data, beat }: PresentRendererProps<BulletsPresentData>) {
  const scenes = useMemo(() => bulletScenes(data), [data])
  const current = scenes[beat]?.topIndex ?? -1
  const area = useRef<HTMLDivElement>(null)
  const measuring = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState<{ height: number; rows: number[]; context: number[] }>()
  const pages = useMemo(() => paginateBullets(scenes,
    metrics?.rows ?? scenes.map((s) => 36 + Math.ceil(s.item.text.length / 60) * (s.parents.length ? 30 : 38)),
    metrics?.height ?? 420, metrics?.context), [scenes, metrics])
  const currentPage = pages.findIndex((p) => beat >= p.from && beat <= p.to)

  useLayoutEffect(() => {
    const root = area.current
    const copy = measuring.current
    if (!root || !copy) return
    const measure = () => {
      let height = root.clientHeight - 42 // page label and its spacing
      if (height <= 0) return // jsdom/unmeasured stage: keep the content-based initial estimate
      const rows = [...copy.querySelectorAll<HTMLElement>('[data-measure-row]')].map((el) => el.offsetHeight)
      const context = [...copy.querySelectorAll<HTMLElement>('[data-measure-context]')].map((el) => el.offsetHeight)
      // Check the space a single page gets without an agenda, so the agenda cannot force a second page.
      const agenda = root.parentElement?.querySelector<HTMLElement>('.present-agenda')
      if (agenda?.offsetHeight) {
        const gap = parseFloat(getComputedStyle(root.parentElement!).rowGap) || 0
        const withoutAgenda = height + agenda.offsetHeight + gap
        if (rows.reduce((total, row) => total + row, 0) <= withoutAgenda) height = withoutAgenda
      }
      setMetrics((old) => old?.height === height && old.rows.join() === rows.join() && old.context.join() === context.join() ? old : { height, rows, context })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    observer.observe(copy)
    let alive = true
    void document.fonts?.ready.then(() => { if (alive) measure() })
    return () => { alive = false; observer.disconnect() }
  }, [scenes, data.ordered])

  return (
    <div className="present-bullets-layout">
      <div ref={area} className="present-bullets" data-testid="present-bullets">
        <div ref={measuring} className="present-bullets-measure" aria-hidden="true" {...QUIET}>
          {scenes.map((scene, i) => <div key={scene.id}>
            <div data-measure-row><BulletRow scene={scene} at={i} beat={-1} until={i} ordered={data.ordered} measuring /></div>
            <div data-measure-context><Context scene={scene} /></div>
          </div>)}
        </div>
        {pages.map((page, p) => (
          <div key={page.from} className="present-bullet-page" hidden={p !== currentPage} data-page-from={page.from} data-page-to={page.to}>
            <p className="present-eyebrow" {...QUIET}>Page {p + 1} of {pages.length}</p>
            <div className="present-bullet-page-content">
              <Context scene={scenes[page.from]} />
              <ul className="present-bullet-tree">
                {scenes.slice(page.from, page.to + 1).map((scene, j) => <li key={scene.id}>
                  <BulletRow scene={scene} at={page.from + j} beat={beat} until={page.to} ordered={data.ordered} />
                </li>)}
              </ul>
            </div>
          </div>
        ))}
      </div>
      {pages.length > 1 && (data.items?.length ?? 0) > 1 && <PresentAgenda items={data.items.map((item) => <BulletText text={item.text} />)} current={current} label="Points" />}
    </div>
  )
}
