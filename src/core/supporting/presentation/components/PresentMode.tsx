/**
 * Present mode stage (grill-log-presenting-mode.md): the topic's sections as regions on one
 * camera canvas, entered beat by beat. Sections draw themselves for a beat; this component moves
 * the camera, plays each beat's entrance, holds for reading time when autoplay is on, and waits at
 * gates and explore beats.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { animate, cubicBezier, type JSAnimation } from 'animejs'
import { useReducedMotion } from 'motion/react'
import { BookOpen, RotateCcw } from 'lucide-react'
import { PRESENT_MOTION } from '../../../ui-system'
import { useSound } from '../../../ui-system/sensory/SoundContext'
import { SectionRegistry, type SectionConfig } from '../../../learning-engine/registry'
import { PresentRegistry, beatsOf } from '../../../learning-engine/registry/present-registry'
import type { PresentGate, PresentRendererProps } from '../../../learning-engine/sub-contexts/present-kernel'
import { SectionErrorBoundary } from '../../../ui-system/primitives/SectionErrorBoundary'
import {
  beatToDraw,
  gateKey,
  holdMs,
  initialRunnerState,
  isBlocked,
  isComplete,
  isWaiting,
  kindAt,
  runnerReducer,
} from '../beat-runner'
import {
  PORTRAIT_BELOW,
  STAGE_LANDSCAPE,
  STAGE_PORTRAIT,
  cameraTransform,
  overviewCamera,
  regionCamera,
  regionOrigin,
  worldSize,
  type Camera,
  type Size,
} from '../camera'
import { enterBeat, revealBeat, type BeatEntrance } from '../motion'
import { PresentControls } from './PresentControls'
import './present.css'

export interface PresentSection {
  /** File name of the section, for keys. */
  name: string
  /** Index of the section among the topic's sections (what Read mode shows). */
  sectionIndex: number
  config: SectionConfig
}

export interface PresentModeProps {
  sections: PresentSection[]
  /** Section to start at (index into `sections`), decision 89. */
  start?: number
  /** Back to Read mode, at the section being presented. */
  onExit: (sectionIndex: number) => void
  /** Called with the section being presented (its index among the topic's sections) whenever it changes. */
  onSectionChange?: (sectionIndex: number) => void
  /** Domain events from gates, as Read sections emit them (decision 71). */
  onEvent?: (event: { type: string; [key: string]: unknown }, sectionIndex: number) => void
}

const KIND_LABELS: Record<string, string> = {
  intro: 'Intro', text: 'Text', bullets: 'Bullets', openui: 'OpenUI', flowchart: 'Flowchart',
  'tradeoff-sandbox': 'Trade-offs', 'taxonomy-browser': 'Taxonomy', flashcards: 'Flashcards', quiz: 'Quiz',
  'concept-map': 'Concept map', scenario: 'Scenario', 'decision-tree': 'Decision tree', 'image-gallery': 'Gallery',
  'pillar-layer': 'Layers', 'formula-sandbox': 'Formula', 'reflection-sequence': 'Sequence', 'reflection-template': 'Template',
}
export const kindLabel = (type: string) => KIND_LABELS[type] ?? type

const CAMERA_EASE = cubicBezier(...PRESENT_MOTION.ease.inOut)

/** Words a beat puts on screen, for its reading-time hold. */
function wordsOfBeat(region: HTMLElement | null, beat: number): number {
  if (!region) return 0
  const els = Array.from(region.querySelectorAll<HTMLElement>(`[data-beat="${beat}"]`))
  const top = els.filter((el) => !els.some((o) => o !== el && o.contains(el)))
  return top.reduce((n, el) => n + (el.textContent ?? '').trim().split(/\s+/).filter(Boolean).length, 0)
}

/** A section's Present renderer, or its Read component when the type has no renderer yet. */
type SectionView =
  | { kind: 'present'; Component: ComponentType<PresentRendererProps> }
  | { kind: 'read'; Component: ComponentType<Record<string, unknown>> }
  | { kind: 'missing' }

/** Start loading the Present renderers of these sections, so switching to Present is instant. */
export function preloadPresenters(sections: PresentSection[]): void {
  for (const type of new Set(sections.map((s) => s.config.type))) void PresentRegistry.get(type)?.load()
}

/** Load the view of a section type: its Present renderer, else its Read component. */
async function loadView(type: string): Promise<SectionView> {
  const presenter = PresentRegistry.get(type)
  if (presenter) return { kind: 'present', Component: await presenter.load() }
  const loader = SectionRegistry.loader(type)
  if (!loader) return { kind: 'missing' }
  return { kind: 'read', Component: (await loader()).default as ComponentType<Record<string, unknown>> }
}

function SectionBody({ section, view, beat, gate, active, onEvent }: { section: PresentSection; view: SectionView; beat: number; gate: PresentGate; active: boolean; onEvent?: PresentModeProps['onEvent'] }) {
  const emit = useMemo(() => (onEvent ? (event: { type: string }) => onEvent(event, section.sectionIndex) : undefined), [onEvent, section.sectionIndex])
  const beats = useMemo(() => beatsOf(section.config), [section.config])
  let body: ReactNode
  if (view.kind === 'present') {
    const Renderer = view.Component
    body = <Renderer data={section.config.props} beats={beats} beat={beat} sectionIndex={section.sectionIndex} gate={gate} active={active} onEvent={emit} />
  } else {
    // No Present renderer yet: the Read section, entering as one beat
    const Read = view.kind === 'read' ? view.Component : null
    body = (
      <div className="present-fallback" data-beat={0} data-motion="fade" {...(beat >= 0 && { 'data-shown': '' })}>
        {Read ? <Read {...section.config.props} sectionIndex={section.sectionIndex} animate={false} /> : <p>Unknown section type “{section.config.type}”.</p>}
      </div>
    )
  }
  return <SectionErrorBoundary sectionName={String(section.config.props.title ?? section.name)}>{body}</SectionErrorBoundary>
}

export function PresentMode({ sections, start = 0, onExit, onSectionChange, onEvent }: PresentModeProps) {
  const beats = useMemo(() => sections.map((s) => beatsOf(s.config)), [sections])
  const reducer = useMemo(() => runnerReducer(beats), [beats])
  const [state, dispatch] = useReducer(reducer, start, initialRunnerState)
  const [epoch, setEpoch] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [overview, setOverview] = useState(false)
  const [holding, setHolding] = useState<number | null>(null)
  const [views, setViews] = useState<Record<string, SectionView>>({})
  const [box, setBox] = useState({ w: 0, h: 0 })
  const reduced = !!useReducedMotion()
  const { playSound } = useSound()

  const rootRef = useRef<HTMLDivElement>(null)
  const stageAreaRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const regionRefs = useRef<Array<HTMLElement | null>>([])
  const entrance = useRef<BeatEntrance | null>(null)
  const enteredKey = useRef<string | null>(null)
  const cameraAnim = useRef<JSAnimation | null>(null)
  const camera = useRef<Camera | null>(null)
  const shownSection = useRef<number | null>(null)
  const holdTimer = useRef<number | null>(null)

  // Load each section type's view, the starting section's first; a section draws (and enters) once its view is here
  const types = useMemo(() => {
    const first = sections[Math.min(start, sections.length - 1)]?.config.type
    return [...new Set([first, ...sections.map((s) => s.config.type)].filter(Boolean))].join(',')
  }, [sections, start])
  useEffect(() => {
    let live = true
    for (const type of types ? types.split(',') : []) {
      void loadView(type).then((view) => {
        if (live) setViews((v) => (v[type] ? v : { ...v, [type]: view }))
      })
    }
    return () => {
      live = false
    }
  }, [types])
  const viewReady = (i: number) => !!sections[i] && !!views[sections[i].config.type]
  const currentReady = viewReady(state.section)

  const complete = isComplete(state, beats)
  const waiting = isWaiting(state, beats)
  const kind = kindAt(state, beats)

  // ---- stage size: the region size the camera frames, scaled to the space available ----
  useLayoutEffect(() => {
    const area = stageAreaRef.current
    const root = rootRef.current
    if (!area || !root) return
    const measure = () => {
      root.style.height = `${Math.max(320, window.innerHeight - root.getBoundingClientRect().top)}px`
      setBox({ w: area.clientWidth, h: area.clientHeight })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(area)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])
  const stage: Size = box.w > 0 && box.w < PORTRAIT_BELOW ? STAGE_PORTRAIT : STAGE_LANDSCAPE
  const scale = box.w > 0 ? Math.min(box.w / stage.w, box.h / stage.h) : 1
  const world = worldSize(sections.length, stage)

  // ---- camera ----
  const target: Camera = overview || complete ? overviewCamera(sections.length, stage) : regionCamera(state.section, stage)
  const applyCamera = useCallback((c: Camera) => {
    camera.current = c
    if (worldRef.current) worldRef.current.style.transform = cameraTransform(c, stage)
  }, [stage])

  const finishCamera = () => {
    cameraAnim.current?.complete()
    cameraAnim.current = null
  }

  const cameraStage = useRef(stage)
  useLayoutEffect(() => {
    const from = camera.current
    finishCamera()
    const reshaped = cameraStage.current !== stage
    cameraStage.current = stage
    if (!from || reduced || box.w === 0 || reshaped) {
      applyCamera(target)
      return
    }
    if (from.x === target.x && from.y === target.y && from.z === target.z) return
    const moving = { ...from }
    cameraAnim.current = animate(moving, {
      x: target.x, y: target.y, z: target.z,
      duration: state.mode === 'enter' ? PRESENT_MOTION.camera : PRESENT_MOTION.camera * 0.7,
      ease: CAMERA_EASE,
      onUpdate: () => applyCamera(moving),
      onComplete: () => {
        applyCamera(target)
        cameraAnim.current = null
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.x, target.y, target.z, stage, box.w])

  // ---- beat entrance ----
  const finishEntrance = () => {
    entrance.current?.finish()
    entrance.current = null
  }
  const clearHold = () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current)
    holdTimer.current = null
    setHolding(null)
  }

  useLayoutEffect(() => {
    const key = `${state.section}:${state.beat}:${epoch}`
    if (complete || state.mode !== 'enter' || !currentReady || enteredKey.current === key) return
    const region = regionRefs.current[state.section]
    if (!region) return
    enteredKey.current = key
    const arriving = shownSection.current !== null && shownSection.current !== state.section
    shownSection.current = state.section
    if (arriving) playSound('whoosh')
    entrance.current = enterBeat(region, state.beat, {
      reduced,
      delay: arriving && !reduced ? Math.round(PRESENT_MOTION.camera * 0.7) : 0,
      onSound: playSound,
    })
    return () => {
      finishEntrance()
      enteredKey.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.section, state.beat, state.mode, epoch, currentReady, complete])

  useEffect(() => {
    if (state.mode !== 'settle') return
    shownSection.current = state.section
    const region = regionRefs.current[state.section]
    if (region) revealBeat(region, state.beat, false)
  }, [state.mode, state.section, state.beat])

  // ---- autoplay: hold for reading time after the entrance, then move on ----
  useEffect(() => {
    clearHold()
    if (!playing || complete || waiting || overview) return
    let cancelled = false
    const wait = entrance.current?.done ?? Promise.resolve()
    void wait.then(() => {
      if (cancelled) return
      const ms = holdMs(wordsOfBeat(regionRefs.current[state.section], state.beat))
      setHolding(ms)
      holdTimer.current = window.setTimeout(() => dispatch({ type: 'next' }), ms)
    })
    return () => {
      cancelled = true
      clearHold()
    }
  }, [playing, state.section, state.beat, state.solved, complete, waiting, overview, currentReady])

  useEffect(() => {
    if (complete) setPlaying(false)
  }, [complete])

  const presented = sections[Math.min(state.section, sections.length - 1)]?.sectionIndex
  useEffect(() => {
    if (presented !== undefined) onSectionChange?.(presented)
  }, [presented, onSectionChange])

  // ---- actions ----
  const busy = () => !!cameraAnim.current || !!entrance.current
  const next = useCallback(() => {
    // The first press finishes the beat in progress
    if (busy()) {
      finishCamera()
      finishEntrance()
      return
    }
    if (isBlocked(state, beats)) return
    setOverview(false)
    dispatch({ type: 'next' })
  }, [state, beats])

  // An entrance that has played out is no longer in progress
  useEffect(() => {
    const current = entrance.current
    if (!current) return
    void current.done.then(() => {
      if (entrance.current === current) entrance.current = null
    })
  })

  const prev = useCallback(() => {
    finishCamera()
    finishEntrance()
    setOverview(false)
    dispatch({ type: 'prev' })
  }, [])
  const jump = useCallback((section: number) => {
    finishCamera()
    finishEntrance()
    setOverview(false)
    dispatch({ type: 'jump', section })
  }, [])
  const replay = useCallback(() => {
    finishCamera()
    finishEntrance()
    setOverview(false)
    enteredKey.current = null
    setEpoch((e) => e + 1)
    dispatch({ type: 'restart' })
  }, [])
  const exit = useCallback(() => {
    const at = sections[Math.min(state.section, sections.length - 1)]
    onExit(at ? at.sectionIndex : 0)
  }, [sections, state.section, onExit])
  const togglePlay = useCallback(() => {
    if (complete) {
      replay()
      setPlaying(true)
      return
    }
    setPlaying((p) => {
      if (!p && !waiting && !busy()) dispatch({ type: 'next' })
      return !p
    })
  }, [complete, waiting, replay])
  const toggleOverview = useCallback(() => {
    finishCamera()
    finishEntrance()
    setOverview((o) => !o)
  }, [])

  const solveCurrent = useCallback(() => dispatch({ type: 'solve', section: state.section, beat: state.beat }), [state.section, state.beat])

  // ---- keyboard and touch ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      const inStage = !!target?.closest('.present-region button, .present-complete button, .present-turn button')
      if (e.key === 'ArrowRight' || (e.key === ' ' && !inStage)) {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
      } else if (e.key === 'a' || e.key === 'A') togglePlay()
      else if (e.key === 'g' || e.key === 'G') toggleOverview()
      else if (e.key === 'Escape') exit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, togglePlay, toggleOverview, exit])

  const pointer = useRef<{ x: number; y: number } | null>(null)
  const onPointerUp = (e: React.PointerEvent) => {
    const down = pointer.current
    pointer.current = null
    if (!down) return
    const dx = e.clientX - down.x
    const dy = e.clientY - down.y
    const target = e.target as HTMLElement
    if (overview || complete) {
      if (target.closest('.present-complete-card, .present-turn')) return
      const region = target.closest<HTMLElement>('[data-present-region]')
      if (region) jump(Number(region.dataset.presentRegion))
      return
    }
    if (target.closest('button, a, input, select, textarea, summary, [role="button"]')) return
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) prev()
      else next()
    } else if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && !waiting) next()
  }

  const current = sections[state.section]
  const turnText = kind === 'gate' ? 'Your turn' : 'Explore freely'
  const showTurn = !overview && !complete && waiting

  return (
    <div className="present-mode" ref={rootRef} data-testid="present-mode">
      <div className="present-stage-area" ref={stageAreaRef}>
        <div
          className={`present-stage${stage === STAGE_PORTRAIT ? ' is-portrait' : ''}`}
          style={{ width: stage.w * scale, height: stage.h * scale }}
          onPointerDown={(e) => { pointer.current = { x: e.clientX, y: e.clientY } }}
          onPointerUp={onPointerUp}
          role="region"
          aria-label="Present mode"
          data-testid="present-stage"
        >
          <div className="present-viewport" style={{ width: stage.w, height: stage.h, transform: `scale(${scale})` }}>
            <div className="present-world" ref={worldRef} style={{ width: world.w, height: world.h }}>
              {sections.map((section, i) => {
                const o = regionOrigin(i, stage)
                const beat = complete ? beats[i].length - 1 : beatToDraw(state, beats, i)
                const mounted = Math.abs(i - Math.min(state.section, sections.length - 1)) <= 1
                const gate: PresentGate = {
                  solved: !(beats[i][beat]?.kind === 'gate') || state.solved.has(gateKey(i, beat)),
                  solve: i === state.section ? solveCurrent : () => {},
                }
                const title = section.config.props.title as string | undefined
                return (
                  <section
                    key={section.name}
                    ref={(el) => { regionRefs.current[i] = el }}
                    className={`present-region${i < state.section || complete ? ' is-done' : ''}${i === state.section && !complete ? ' is-current' : ''}`}
                    style={{ left: o.x, top: o.y, width: stage.w, height: stage.h }}
                    data-present-region={i}
                    data-testid={`present-region-${i}`}
                    aria-hidden={i !== state.section || overview || complete ? true : undefined}
                  >
                    {(section.config.type !== 'intro' || !mounted || !viewReady(i)) && (
                      <header className="present-region-head">
                        <span className="present-kind">{kindLabel(section.config.type)}</span>
                        {title && <h2>{title}</h2>}
                      </header>
                    )}
                    <div className={`present-region-body${PresentRegistry.get(section.config.type) ? '' : ' is-fallback'}`}>
                      {mounted && viewReady(i) && <SectionBody section={section} view={views[section.config.type]} beat={beat} gate={gate} active={i === state.section && !complete && !overview} onEvent={onEvent} />}
                      {mounted && !viewReady(i) && i === state.section && <p className="present-loading" role="status">Loading…</p>}
                    </div>
                  </section>
                )
              })}
            </div>
          </div>

          {showTurn && (
            <div className="present-turn" data-testid="present-turn">
              <i aria-hidden />
              <span>{turnText}</span>
              {kind === 'explore' && <button type="button" onClick={next}>Continue</button>}
            </div>
          )}
          {complete && (
            <div className="present-complete">
              <div className="present-complete-card" data-testid="present-complete">
                <h2>Topic complete</h2>
                <p>This is the whole topic in one view. Tap a section to go back to it.</p>
                <div className="present-complete-actions">
                  <button type="button" className="present-button present-button--primary" onClick={replay}><RotateCcw size={15} /> Replay</button>
                  <button type="button" className="present-button" onClick={exit}><BookOpen size={15} /> Back to reading</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <PresentControls
        beats={beats}
        labels={sections.map((s) => kindLabel(s.config.type))}
        section={state.section}
        beat={state.beat}
        solved={state.solved}
        complete={complete}
        playing={playing}
        overview={overview}
        holding={holding}
        where={complete ? 'Topic complete' : `${kindLabel(current.config.type)} · ${state.beat + 1} of ${beats[state.section].length}`}
        onPrev={prev}
        onNext={next}
        onPlay={togglePlay}
        onOverview={toggleOverview}
        onJump={jump}
        onExit={exit}
      />
    </div>
  )
}
