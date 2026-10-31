import { Fragment, useMemo, type CSSProperties } from 'react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { beatMarks, focus, type PresentRendererProps } from '../../../present-kernel'
import type { PillarLayerPresentData } from '../../present'
import { pillarLayerPlan } from '../../pillar-layer-scenes'
import './pillar-layer.css'
import '../present.css'

/**
 * Layer groups build from the foundation upward, followed by a whole-stack overview.
 * Beat derivation and rendering share pillarLayerPlan. Uses the Read grid placement; blocks
 * show their names only, their descriptions and "Uses" lines stay in Read (decision 109).
 */
export default function PresentPillarLayer({ data, beat }: PresentRendererProps<PillarLayerPresentData>) {
  const mark = beatMarks(beat)
  const pick = usePickAnchors()
  const layers = useMemo(() => data.section?.layers ?? [], [data.section])
  const { placed, simpleStack, scenes } = useMemo(() => pillarLayerPlan(data.section), [data.section])
  const scene = scenes[beat]
  const overview = scene?.id === 'overview'
  const maxCols = Math.max(1, ...placed.map((p) => p.colStart + p.colSpan))
  const description = data.description ?? data.section?.description
  /** Layers are listed top to bottom; the bottom one arrives first. */
  const beatOf = (layerIdx: number) => scenes.findIndex((s) => s.layerIndex === layerIdx)

  const overviewAt = scenes.findIndex((s) => s.id === 'overview')
  const overviewLabel = ['The whole stack', ...[...layers].reverse().map((l) => l.title)].join(' · ')

  if (simpleStack) return (
    <div className={`present-pillar present-layer-stack${overview ? ' is-overview' : ''}`} {...focus(overview)} data-testid="present-pillar-layer">
      {layers.map((layer, lIdx) => {
        const items = placed.filter((p) => p.layerIdx === lIdx)
        const grouped = items.some((p) => p.block.group)
        const groups = new Map<string, typeof items>()
        for (const p of items) {
          const name = grouped ? p.block.group || layer.title : layer.title
          groups.set(name, [...(groups.get(name) ?? []), p])
        }
        return <section key={layer.id} className="present-layer-level" aria-label={layer.title} {...pick(layer)}>
          {[...groups].map(([name, members]) => {
            const cols = grouped ? members.reduce((sum, p) => sum + p.colSpan, 0) : maxCols
            const current = scene?.layerIndex === lIdx && (!scene.group || scene.group === name)
            const groupAt = scenes.findIndex((s) => s.layerIndex === lIdx && (!s.group || s.group === name))
            return <div key={name} className={`present-layer-band${current ? ' is-current' : ''}`} {...focus(current)} {...mark(groupAt, { motion: 'stack' })} style={{ flex: cols, '--layer-accent': `var(--ctp-${members[0]?.block.color ?? 'blue'})` } as CSSProperties}>
              <h3 className="present-layer-name" {...(!grouped ? pick(layer, 'title') : pick(members[0].block, 'group'))}>{name}</h3>
              <div className="present-layer-items" style={{ '--layer-cols': cols } as CSSProperties}>
                {members.map((p) => <div key={p.key} className="present-layer-item" {...pick(p.block)} {...mark(groupAt, { motion: 'fade', delay: 150 })} style={{ gridColumn: grouped ? `span ${p.colSpan}` : `${p.colStart + 1} / span ${p.colSpan}` } as CSSProperties}><span {...pick(p.block, 'title')}>{p.block.title}</span></div>)}
              </div>
            </div>
          })}
        </section>
      })}
      {overviewAt >= 0 && <p className="sr-only" {...mark(overviewAt)}>{overviewLabel}</p>}
    </div>
  )

  return (
    <div className="present-pillar pillar-layer-section" {...focus(overview)} data-testid="present-pillar-layer">
      {description && <p className="pillar-layer-description" {...mark(0, { motion: 'fade' })}>{description}</p>}
      <div className="pillar-layer-matrix" style={{ '--pillar-cols': maxCols, '--pillar-rows': layers.length } as CSSProperties}>
        {layers.map((layer, lIdx) => (
          <Fragment key={layer.id}>
            <div className="pillar-layer-header" {...mark(beatOf(lIdx), { motion: 'stack' })} {...focus(beat === beatOf(lIdx))} {...pick(layer)} style={{ '--row': lIdx + 1 } as CSSProperties}>
              <span className="pillar-layer-header-title">{layer.title}</span>
              {layer.description && <span className="pillar-layer-header-desc">{layer.description}</span>}
            </div>
            {placed.filter((p) => p.layerIdx === lIdx).map((p, i) => {
              return (
                <div
                  key={p.key}
                  className={['pillar-block', p.block.color ? `color-${p.block.color}` : '', p.colSpan > 1 ? 'is-wide' : '', p.clipPath ? 'is-shaped' : ''].filter(Boolean).join(' ')}
                  {...mark(beatOf(lIdx), { motion: 'stack', delay: 90 + i * 70 })}
                  {...pick(p.block)}
                  style={{
                    '--row': p.layerIdx + 1,
                    '--row-span': p.rowSpan,
                    '--col': p.colStart + 2,
                    '--col-span': p.colSpan,
                    ...(p.clipPath ? { '--clip': p.clipPath } : {}),
                  } as CSSProperties}
                >
                  <span className="pillar-block-title">{p.block.title}</span>
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
      {overviewAt >= 0 && <p className="sr-only" {...mark(overviewAt)}>{overviewLabel}</p>}
    </div>
  )
}
