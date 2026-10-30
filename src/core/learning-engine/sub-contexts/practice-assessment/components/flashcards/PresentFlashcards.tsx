import type { CSSProperties } from 'react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { beatMarks, focus, type PresentRendererProps } from '../../../present-kernel'
import type { FlashcardsPresentData } from '../../present'
import { FlashcardCategoryBadge, FlashcardCrosshairs } from './index'
import '../present.css'

/**
 * Flashcards in Present mode (flashcardsBeats), drawn as the Read deck's card and turned by the stage
 * (decision 104): per card, its word arrives on the front, then the card flips to its definition;
 * the next beat sends it off the deck.
 */
export default function PresentFlashcards({ data, beat }: PresentRendererProps<FlashcardsPresentData>) {
  const terms = data.terms ?? []
  const mark = beatMarks(beat)
  const pick = usePickAnchors()
  const top = Math.min(Math.max(0, Math.floor(beat / 2)), Math.max(0, terms.length - 1))
  const flipped = beat >= 0 && beat % 2 === 1

  return (
    <div className="present-cards" data-testid="present-flashcards">
      <div className="present-deck">
        {terms.map((term, i) => {
          const k = i - top
          // The card just turned leaves the deck while the next one comes up
          const leaving = k === -1 && beat === 2 * top && beat > 0
          if (k < 0 && !leaving) return null
          const isTop = k === 0
          return (
            <div
              key={term.id}
              className={`present-card-stack${(isTop && flipped) || leaving ? ' is-flipped' : ''}${leaving ? ' is-leaving' : ''}`}
              style={{ '--k': Math.max(0, Math.min(k, 3)) } as CSSProperties}
              {...pick(term)}
            >
              <div className="present-card-inner">
                <div className="present-card-face is-front bg-card border border-border shadow-sm rounded-lg">
                  <FlashcardCrosshairs />
                  <span className="present-card-toolbar border-b border-border">
                    <FlashcardCategoryBadge category={term.category} />
                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-mono">{i + 1} / {terms.length}</span>
                  </span>
                  <span className="present-card-body">
                    <span className="present-card-word font-light tracking-tight text-foreground font-display" {...mark(2 * i, { motion: 'pop', delay: 200 })} {...focus(isTop && beat === 2 * i)} {...pick(term, 'word')}>{term.word}</span>
                    {term.pronunciation && (
                      <span className="text-sm font-mono text-muted-foreground font-medium tracking-wider uppercase" {...mark(2 * i, { motion: 'fade', delay: 450 })} {...pick(term, 'pronunciation')}>
                        Phonetic: <span className="text-foreground italic">/{term.pronunciation}/</span>
                      </span>
                    )}
                  </span>
                </div>
                <div className="present-card-face is-back bg-card text-foreground rounded-lg border border-border shadow-md" aria-hidden={!(isTop && flipped)}>
                  <FlashcardCrosshairs />
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block">Standard Concept</span>
                  <span className="present-card-back-word font-light tracking-tight text-foreground font-display">{term.word}</span>
                  <span className="present-card-quote" {...mark(2 * i + 1, { motion: 'fade', delay: 300, sound: 'flip' })} {...focus(isTop && beat === 2 * i + 1)}>
                    <span className="present-card-quote-bar bg-primary/50" aria-hidden />
                    <p className="text-muted-foreground italic font-serif leading-relaxed" {...pick(term, 'shortDefinition')}>“{term.shortDefinition}”</p>
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <p className="present-cards-count">Card {top + 1} of {terms.length}{flipped ? ' · Definition' : ' · Term'}</p>
    </div>
  )
}
