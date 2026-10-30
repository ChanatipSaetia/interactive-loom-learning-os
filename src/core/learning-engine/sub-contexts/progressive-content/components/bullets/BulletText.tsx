import { Fragment, useMemo, type ReactNode } from 'react'
import { marked, type Token } from 'marked'

/** Inline bold only. React escapes all other text; authored HTML is never executed. */
function renderTokens(tokens: Token[]): ReactNode[] {
  return tokens.map((token, i) => token.type === 'strong'
    ? <strong key={i}>{renderTokens(token.tokens ?? [])}</strong>
    : <Fragment key={i}>{token.type === 'escape' ? token.text : token.raw}</Fragment>)
}

export function BulletText({ text }: { text: string }) {
  return <>{useMemo(() => renderTokens(marked.Lexer.lexInline(text)), [text])}</>
}
