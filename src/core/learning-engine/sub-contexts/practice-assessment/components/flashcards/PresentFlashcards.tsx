import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useSound } from '../../../../../ui-system/sensory/SoundContext'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { beatMarks, type PresentRendererProps } from '../../../present-kernel'
import type { FlashcardFlipped } from '../../events'
import type { FlashcardsPresentData } from '../../present'
import { FlashcardCategoryBadge, FlashcardCrosshairs } from './index'
import '../present.css'

const LEAVE = 420

/**
 * Flashcards in Present mode (flashcardsBeats), drawn as the Read deck's card: the deck arrives, then
 * the learner flips each card and says whether they knew it. "Again" sends a card to the back; the gate opens when every card is known.
 */
export default function PresentFlashcards({ data, beat, beats, active, gate, onEvent }: PresentRendererProps<FlashcardsPresentData>) {
  const terms = data.terms ?? []
  const mark = beatMarks(beat)
  const pick = usePickAnchors()
  const { playSound } = useSound()
  const [queue, setQueue] = useState<number[]>(() => terms.map((_, i) => i))
  const [flipped, setFlipped] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const timer = useRef<number | null>(null)
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current) }, [])

  const gateBeat = beats.findIndex((b) => b.kind === 'gate')
  const solved = gateBeat >= 0 && (beat > gateBeat || (beat === gateBeat && gate.solved))
  const deck = solved ? [] : queue
  const live = active && beat === gateBeat && !solved && !leaving
  const top = deck[0]

  const flip = () => {
    if (!live || flipped || top === undefined) return
    playSound('flip')
    setFlipped(true)
    const event: FlashcardFlipped = { type: 'FlashcardFlipped', termId: terms[top].id, termIndex: top, isFront: false, timestamp: Date.now() }
    onEvent?.(event as unknown as { type: string })
  }
  const grade = (known: boolean) => {
    if (!live || !flipped || top === undefined) return
    if (!known) {
      playSound('flip')
      setFlipped(false)
      setQueue((q) => [...q.slice(1), q[0]])
      return
    }
    playSound('success')
    setLeaving(true)
    timer.current = window.setTimeout(() => {
      setLeaving(false)
      setFlipped(false)
      const rest = queue.slice(1)
      setQueue(rest)
      if (rest.length === 0) {
        playSound('complete')
        gate.solve()
      }
    }, LEAVE)
  }

  return (
    <div className="present-cards" data-testid="present-flashcards">
      <div className="present-deck" {...mark(0, { delay: 150 })}>
        {terms.map((term, i) => {
          const k = deck.indexOf(i)
          if (k < 0) return null
          const isTop = k === 0
          return (
            <div
              key={term.id}
              className={`present-card-stack${isTop && flipped ? ' is-flipped' : ''}${isTop && leaving ? ' is-leaving' : ''}`}
              style={{ '--k': Math.min(k, 3) } as CSSProperties}
              {...pick(term)}
            >
              <div className="present-card-inner">
                <button
                  type="button"
                  className="present-card-face is-front bg-card border border-border shadow-sm rounded-lg"
                  onClick={flip}
                  disabled={!isTop || !live}
                  tabIndex={isTop ? 0 : -1}
                  aria-label={`Flip card: ${term.word}`}
                >
                  <FlashcardCrosshairs />
                  <span className="present-card-toolbar border-b border-border">
                    <FlashcardCategoryBadge category={term.category} />
                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-mono">{live && isTop ? 'Flip card ↺' : `${terms.length - deck.length + 1} / ${terms.length}`}</span>
                  </span>
                  <span className="present-card-body">
                    <span className="present-card-word font-light tracking-tight text-foreground font-display" {...pick(term, 'word')}>{term.word}</span>
                    {term.pronunciation && (
                      <span className="text-sm font-mono text-muted-foreground font-medium tracking-wider uppercase" {...pick(term, 'pronunciation')}>
                        Phonetic: <span className="text-foreground italic">/{term.pronunciation}/</span>
                      </span>
                    )}
                  </span>
                </button>
                <div className="present-card-face is-back bg-card text-foreground rounded-lg border border-border shadow-md" aria-hidden={!(isTop && flipped)}>
                  <FlashcardCrosshairs />
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block">Standard Concept</span>
                  <span className="present-card-back-word font-light tracking-tight text-foreground font-display">{term.word}</span>
                  <span className="present-card-quote">
                    <span className="present-card-quote-bar bg-primary/50" aria-hidden />
                    <p className="text-muted-foreground italic font-serif leading-relaxed" {...pick(term, 'shortDefinition')}>“{term.shortDefinition}”</p>
                  </span>
                </div>
              </div>
            </div>
          )
        })}
        {deck.length === 0 && (
          <div className="present-deck-done" role="status">
            <strong>All {terms.length} cards known</strong>
          </div>
        )}
      </div>
      <div className="present-cards-side">
        <p className="present-cards-lead" {...mark(0, { motion: 'words' })}>
          <PresentWords text={`${terms.length} ${terms.length === 1 ? 'card' : 'cards'}. Flip each one, then say whether you knew it.`} />
        </p>
        {!solved && (
          <div className="present-cards-actions" {...mark(0, { motion: 'fade', delay: 700 })}>
            {!flipped ? (
              <button type="button" className={`present-button present-button--primary${live ? ' present-breathe' : ''}`} onClick={flip} disabled={!live}>Flip card</button>
            ) : (
              <>
                <button type="button" className="present-button" onClick={() => grade(false)} disabled={!live}>Again</button>
                <button type="button" className="present-button present-button--primary" onClick={() => grade(true)} disabled={!live}>Got it</button>
              </>
            )}
          </div>
        )}
        <p className="present-cards-count" {...mark(0, { motion: 'fade', delay: 700 })}>{terms.length - deck.length} of {terms.length} known</p>
      </div>
    </div>
  )
}
