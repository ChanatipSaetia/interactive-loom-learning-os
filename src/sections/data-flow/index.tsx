import { useRef, useCallback, useMemo, useState, type ComponentType } from 'react'
import { createTimeline } from 'animejs'
import { useAnimation } from '../../core/hooks/useAnimation'
import { SectionRegistry } from '../../core/registry'

export interface DataFlowPath {
  id: string
  label: string
  d: string
  color?: string
}

export interface DataFlowProps {
  title?: string
  paths: DataFlowPath[]
  particleColor?: string
}

const defaultPathColor = '#17171c'
const defaultParticleColor = '#ff7759'

function parsePathStart(d: string): { x: number; y: number } {
  const match = d.match(/M\s*([\d.]+)\s+([\d.]+)/)
  if (match) {
    return { x: parseFloat(match[1]), y: parseFloat(match[2]) }
  }
  return { x: 0, y: 0 }
}

function DataFlow({ title, paths, particleColor = defaultParticleColor }: DataFlowProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({})
  const particleRefs = useRef<Record<string, SVGCircleElement | null>>({})
  const [currentStep, setCurrentStep] = useState(-1)

  const setPathRef = useCallback((id: string, el: SVGPathElement | null) => {
    if (el) {
      pathRefs.current[id] = el
      if (typeof el.getTotalLength === 'function') {
        const len = el.getTotalLength()
        el.style.strokeDasharray = String(len)
        el.style.strokeDashoffset = String(len)
      }
    }
  }, [])

  const setParticleRef = useCallback((id: string, el: SVGCircleElement | null) => {
    if (el) {
      particleRefs.current[id] = el
      el.setAttribute('opacity', '0')
    }
  }, [])

  const buildTimeline = useCallback(
    (tl: ReturnType<typeof createTimeline>) => {
      paths.forEach((p, i) => {
        const pathEl = pathRefs.current[p.id]
        const particleEl = particleRefs.current[p.id]
        if (!pathEl || !particleEl || typeof pathEl.getTotalLength !== 'function') return

        const len = pathEl.getTotalLength()
        const base = i * 600

        tl.add(
          particleEl,
          { opacity: 1, duration: 100 },
          String(base)
        )

        tl.add(
          pathEl,
          {
            strokeDashoffset: [len, 0],
            duration: 800,
            easing: 'easeInOutQuad',
          },
          String(base)
        )
      })
    },
    [paths]
  )

  const tlRef = useRef<ReturnType<typeof createTimeline> | null>(null)

  useAnimation(
    useCallback(
      (tl: ReturnType<typeof createTimeline>) => {
        tlRef.current = tl
        buildTimeline(tl)
      },
      [buildTimeline]
    ),
    { autoplay: false }
  )

  const handlePlay = useCallback(() => {
    if (tlRef.current) {
      tlRef.current.restart()
      setCurrentStep(paths.length - 1)
    }
  }, [paths.length])

  const handlePause = useCallback(() => {
    tlRef.current?.pause()
  }, [])

  const handleReset = useCallback(() => {
    tlRef.current?.reset()
    setCurrentStep(-1)
    paths.forEach((p) => {
      const pathEl = pathRefs.current[p.id]
      const particleEl = particleRefs.current[p.id]
      if (pathEl && typeof pathEl.getTotalLength === 'function') {
        pathEl.style.strokeDashoffset = String(pathEl.getTotalLength())
      }
      if (particleEl) {
        particleEl.setAttribute('opacity', '0')
      }
    })
  }, [paths])

  const handleStep = useCallback(() => {
    const next = Math.min(currentStep + 1, paths.length - 1)
    if (next < 0) return

    setCurrentStep(next)
    const p = paths[next]
    const pathEl = pathRefs.current[p.id]
    const particleEl = particleRefs.current[p.id]

    if (particleEl) {
      particleEl.setAttribute('opacity', '1')
    }
    if (pathEl) {
      pathEl.style.strokeDashoffset = '0'
    }
  }, [currentStep, paths])

  const startPositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {}
    paths.forEach((p) => {
      positions[p.id] = parsePathStart(p.d)
    })
    return positions
  }, [paths])

  return (
    <div className="data-flow" data-testid="data-flow">
      {title && <h3 className="data-flow-title">{title}</h3>}

      <svg
        ref={svgRef}
        className="data-flow-svg"
        viewBox="0 0 600 200"
        data-testid="data-flow-svg"
      >
        {paths.map((p) => {
          const start = startPositions[p.id]
          return (
            <g key={p.id} data-testid={`dataflow-path-${p.id}`}>
              <path
                ref={(el) => setPathRef(p.id, el)}
                d={p.d}
                fill="none"
                stroke={p.color || defaultPathColor}
                strokeWidth="2"
              />
              <circle
                ref={(el) => setParticleRef(p.id, el)}
                cx={start.x}
                cy={start.y}
                r="5"
                fill={particleColor}
                data-testid={`dataflow-particle-${p.id}`}
              />
              <text
                x={start.x}
                y={start.y - 10}
                textAnchor="middle"
                fontSize="10"
                fill="var(--muted)"
              >
                {p.label}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="data-flow-controls" data-testid="data-flow-controls">
        <button
          className="data-flow-btn"
          onClick={handlePlay}
          data-testid="dataflow-play"
          aria-label="Play animation"
        >
          Play
        </button>
        <button
          className="data-flow-btn"
          onClick={handlePause}
          data-testid="dataflow-pause"
          aria-label="Pause animation"
        >
          Pause
        </button>
        <button
          className="data-flow-btn"
          onClick={handleStep}
          disabled={currentStep >= paths.length - 1}
          data-testid="dataflow-step"
          aria-label="Step forward"
        >
          Step
        </button>
        <button
          className="data-flow-btn"
          onClick={handleReset}
          data-testid="dataflow-reset"
          aria-label="Reset animation"
        >
          Reset
        </button>
        <span
          className="data-flow-progress"
          data-testid="data-flow-progress"
        >
          {currentStep + 1} / {paths.length}
        </span>
      </div>
    </div>
  )
}

SectionRegistry.register('data-flow', DataFlow as ComponentType<unknown>)

export default DataFlow
