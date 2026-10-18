import { Fragment, useMemo, type CSSProperties } from 'react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { beatMarks, type PresentRendererProps } from '../../../present-kernel'
import type { PillarLayerPresentData } from '../../present'
import { placePillarBlocks } from './index'
import './pillar-layer.css'
import '../present.css'

/**
 * Pillar and layer matrix in Present mode: one layer per beat, from the bottom up, each settling onto
 * the stack with its blocks (pillarLayerBeats). Uses the Read view's grid, block placement and "Uses" lines.
 */
export default function PresentPillarLayer({ data, beat }: PresentRendererProps<PillarLayerPresentData>) {
  const mark = beatMarks(beat)
  const pick = usePickAnchors()
  const layers = useMemo(() => data.section?.layers ?? [], [data.section])
  const blocks = useMemo(() => data.section?.matrix_blocks ?? [], [data.section])
  const placed = useMemo(() => placePillarBlocks(layers, blocks), [layers, blocks])
  const maxCols = Math.max(1, ...placed.map((p) => p.colStart + p.colSpan))
  const titles = useMemo(() => new Map(placed.map((p) => [p.key, p.block.title])), [placed])
  const description = data.description ?? data.section?.description
  /** Layers are listed top to bottom; the bottom one arrives first. */
  const beatOf = (layerIdx: number) => layers.length - 1 - layerIdx

  return (
    <div className="present-pillar pillar-layer-section" data-testid="present-pillar-layer">
      {description && <p className="pillar-layer-description" {...mark(0, { motion: 'fade' })}>{description}</p>}
      <div className="pillar-layer-matrix" style={{ '--pillar-cols': maxCols, '--pillar-rows': layers.length } as CSSProperties}>
        {layers.map((layer, lIdx) => (
          <Fragment key={layer.id}>
            <div className="pillar-layer-header" {...mark(beatOf(lIdx), { motion: 'stack' })} {...pick(layer)} style={{ '--row': lIdx + 1 } as CSSProperties}>
              <span className="pillar-layer-header-title">{layer.title}</span>
              {layer.description && <span className="pillar-layer-header-desc">{layer.description}</span>}
            </div>
            {placed.filter((p) => p.layerIdx === lIdx).map((p, i) => {
              const uses = (p.block.depends_on ?? []).filter((d) => titles.has(d))
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
                  {p.block.description && <span className="pillar-block-desc">{p.block.description}</span>}
                  {uses.length > 0 && <span className="pillar-block-uses">Uses: {uses.map((k) => titles.get(k)).join(', ')}</span>}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
