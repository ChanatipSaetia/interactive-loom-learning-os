import { useLayoutEffect, useState } from 'react'
import { motion } from 'motion/react'
import { PresentWords } from '../../../learning-engine/sub-contexts/PresentWords'
import type { NarrationStepData } from '../../../learning-engine/composition/oui/narration'
import type { Size } from '../camera'
import { boxOf, targetElements, unionBox, type Box } from '../narration-targets'

export const HIGHLIGHT_CLASS = 'present-narr-hl'
const CALLOUT_W = 300
/** Room kept free at the bottom of the region for the stage's caption line and turn pill. */
const CAPTION_BAND = 120
/** A callout's height for framing it with a spotlight (it is measured only once drawn). */
const CALLOUT_H = 96
const EASE = [0.16, 1, 0.3, 1] as const

interface PlacedCallout {
  text: string
  x: number
  y: number
  /** The bubble sits above its target (its arrow points down). */
  above: boolean
  /** Arrow position from the bubble's left edge. */
  arrow: number
}

/**
 * A narration step's effects over its section (decision 94): highlights on the targets, callout
 * bubbles beside them and a spotlight that dims the rest. Drawn in region coordinates inside the
 * region, so the camera moves them with the section. The caption line is the stage's.
 */
export function NarrationLayer({ step, region, stage, onFocus }: {
  step: NarrationStepData
  region: HTMLElement
  stage: Size
  /** The box a Spotlight frames (region coordinates), or null; the stage moves the camera to it. */
  onFocus: (box: Box | null) => void
}) {
  const [callouts, setCallouts] = useState<PlacedCallout[]>([])
  const [spot, setSpot] = useState<Box | null>(null)

  useLayoutEffect(() => {
    const body = region.querySelector<HTMLElement>('.present-region-body') ?? region
    // Only what the learner can see: elements of a later beat are still hidden
    const visible = (target: string) => targetElements(body, target).filter((el) => !el.closest('[data-beat]:not([data-shown])'))
    const lit: Element[] = []
    const placed: PlacedCallout[] = []
    let focus: Box | null = null
    for (const effect of step.effects ?? []) {
      if (effect.kind === 'highlight') {
        for (const el of visible(effect.target)) {
          el.classList.add(HIGHLIGHT_CLASS)
          lit.push(el)
        }
      } else if (effect.kind === 'callout') {
        const target = unionBox(visible(effect.target).map((el) => boxOf(el, region, stage)))
        if (!target) continue
        const bottom = stage.h - CAPTION_BAND
        const above = target.y + target.h + 150 > bottom && target.y > 170
        const x = Math.min(Math.max(16, target.x + target.w / 2 - CALLOUT_W / 2), stage.w - CALLOUT_W - 16)
        placed.push({
          text: effect.text,
          x,
          y: above ? target.y - 14 : Math.min(target.y + target.h + 14, bottom - 110),
          above,
          arrow: Math.min(Math.max(20, target.x + target.w / 2 - x), CALLOUT_W - 20),
        })
      } else {
        focus = unionBox(effect.targets.flatMap(visible).map((el) => boxOf(el, region, stage)))
      }
    }
    // A spotlight frames the step's callouts too, so the zoom never cuts them off
    if (focus) {
      focus = unionBox([focus, ...placed.map((c) => ({ x: c.x, y: c.above ? c.y - CALLOUT_H : c.y, w: CALLOUT_W, h: CALLOUT_H }))])
    }
    setCallouts(placed)
    setSpot(focus)
    onFocus(focus)
    return () => {
      lit.forEach((el) => el.classList.remove(HIGHLIGHT_CLASS))
      onFocus(null)
    }
    // Measured once per step (and stage shape): the section does not move while a step plays
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, region, stage])

  return (
    <div className="present-narr" aria-live="polite">
      {spot && (
        <motion.div
          className="present-narr-spot"
          style={{ left: spot.x - 10, top: spot.y - 10, width: spot.w + 20, height: spot.h + 20 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE }}
          aria-hidden
        />
      )}
      {callouts.map((c, i) => (
        <motion.div
          key={i}
          className={`present-callout${c.above ? ' is-above' : ''}`}
          style={{ left: c.x, top: c.y, width: CALLOUT_W, ['--arrow-x' as string]: `${c.arrow}px` }}
          initial={{ opacity: 0, scale: 0.85, y: c.above ? 8 : -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.35 + i * 0.4, type: 'spring', stiffness: 420, damping: 26 }}
          data-testid="present-callout"
        >
          <p className="present-callout-text"><PresentWords text={c.text} /></p>
        </motion.div>
      ))}
    </div>
  )
}
