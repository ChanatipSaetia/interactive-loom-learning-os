import { BookOpen, ChevronLeft, ChevronRight, LayoutGrid, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import type { Beat } from '../../../learning-engine/sub-contexts/present-kernel'

export interface PresentControlsProps {
  beats: Beat[][]
  labels: string[]
  section: number
  beat: number
  complete: boolean
  playing: boolean
  overview: boolean
  /** Reading-time hold of the current beat in ms, while autoplay waits on it. */
  holding: number | null
  where: string
  onPrev: () => void
  onNext: () => void
  onPlay: () => void
  onOverview: () => void
  /** The voice reads each beat. */
  narrating: boolean
  /** The browser has a voice to narrate with. */
  canNarrate: boolean
  onNarrate: () => void
  onJump: (section: number) => void
  onExit: () => void
}

/** Prev / play / next, the progress rail (one tick per beat; performed answers marked red or green), overview and exit. */
export function PresentControls(p: PresentControlsProps) {
  const atStart = p.section === 0 && p.beat === 0
  return (
    <div className="present-controls" role="toolbar" aria-label="Present controls" data-testid="present-controls">
      <button type="button" className="present-ctl" onClick={p.onPrev} disabled={atStart} aria-label="Previous beat" data-testid="present-prev">
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        className="present-ctl present-ctl--main"
        onClick={p.onPlay}
        aria-label={p.playing ? 'Pause autoplay' : p.complete ? 'Replay' : 'Play'}
        aria-pressed={p.playing}
        data-testid="present-play"
      >
        {p.playing ? <Pause size={18} /> : <Play size={18} />}
      </button>
      <button type="button" className="present-ctl" onClick={p.onNext} disabled={p.complete} aria-label="Next beat" data-testid="present-next">
        <ChevronRight size={18} />
      </button>
      <span className="present-where" aria-live="polite" data-testid="present-where">{p.where}</span>
      <button
        type="button"
        className="present-ctl present-ctl--text"
        onClick={p.onNarrate}
        disabled={!p.canNarrate}
        aria-pressed={p.narrating}
        title={p.canNarrate ? 'Read each beat aloud (N)' : 'This browser has no speech voice'}
        data-testid="present-narration"
      >
        {p.narrating ? <Volume2 size={15} /> : <VolumeX size={15} />} <span>Narration</span>
      </button>
      <button type="button" className="present-ctl present-ctl--text" onClick={p.onOverview} aria-pressed={p.overview} data-testid="present-overview">
        <LayoutGrid size={15} /> <span>Overview</span>
      </button>
      <button type="button" className="present-ctl present-ctl--text" onClick={p.onExit} data-testid="present-exit">
        <BookOpen size={15} /> <span>Read</span>
      </button>
      <div className="present-rail" data-testid="present-rail">
        {p.beats.map((beats, s) => (
          <button
            key={s}
            type="button"
            className="present-seg"
            style={{ flexGrow: beats.length }}
            onClick={() => p.onJump(s)}
            aria-label={`Go to section ${s + 1}: ${p.labels[s]}`}
            aria-current={s === p.section && !p.complete ? 'step' : undefined}
          >
            {beats.map((b, i) => {
              const past = p.complete || s < p.section || (s === p.section && i < p.beat)
              const now = !p.complete && s === p.section && i === p.beat
              const cls = [
                'present-tick',
                b.answer && `is-${b.answer}`,
                past && 'is-past',
                now && 'is-now',
              ].filter(Boolean).join(' ')
              return (
                <span key={i} className={cls}>
                  {now && p.holding !== null && <i style={{ animationDuration: `${p.holding}ms` }} />}
                </span>
              )
            })}
          </button>
        ))}
      </div>
    </div>
  )
}
