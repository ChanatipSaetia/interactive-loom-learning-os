import { Fragment } from 'react'
import { PRESENT_WORD_CLASS, splitWords } from './present-kernel'

/** Plain text as word spans, for elements marked with the `words` motion. */
export function PresentWords({ text }: { text: string }) {
  return (
    <>
      {splitWords(text).map((w, i) => (
        <Fragment key={i}>
          <span className={PRESENT_WORD_CLASS}>{w.word}</span>
          {w.space}
        </Fragment>
      ))}
    </>
  )
}
