/** Shared editor/MCP statement indexing; no browser state or source retrieval. */
import { indexStatements, scan, type OUIToken } from '../oui-language/scanner'

export interface FileStatement {
  name: string
  /** 1-based line the statement starts on. */
  line: number
  /** Offsets of the statement in the source (name to end of expression). */
  start: number
  end: number
  text: string
  /** Component at the top of the expression, e.g. `QuizQuestion`. */
  component?: string
  /** Every component called inside the statement. */
  calls: string[]
  /** Other statements of the file it names. */
  refs: string[]
}

/** The top-level statements of one file, with the components they call and the statements they name. */
export function fileStatements(source: string): FileStatement[] {
  const tokens = scan(source)
  const statements = indexStatements(tokens)
  const lineStarts = [0]
  for (let i = 0; i < source.length; i++) if (source[i] === '\n') lineStarts.push(i + 1)
  const lineOf = (offset: number) => {
    let lo = 0
    let hi = lineStarts.length - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (lineStarts[mid] <= offset) lo = mid
      else hi = mid - 1
    }
    return lo + 1
  }
  const significant = tokens.filter((t) => t.type !== 'comment' && t.type !== 'newline')

  return statements.map((statement) => {
    const inside: OUIToken[] = significant.filter((t) => t.start >= statement.start && t.end <= statement.end)
    const calls = new Set<string>()
    const refs = new Set<string>()
    inside.forEach((token, i) => {
      if (i === 0 || token.type !== 'ident') return
      if (inside[i + 1]?.text === '(') calls.add(token.text)
      else if (!['true', 'false', 'null'].includes(token.text) && inside[i + 1]?.text !== ':' && inside[i - 1]?.text !== '.') refs.add(token.text)
    })
    return {
      name: statement.name,
      line: lineOf(statement.start),
      start: statement.start,
      end: statement.end,
      text: source.slice(statement.start, statement.end),
      component: statement.component,
      calls: [...calls],
      refs: [...refs],
    }
  })
}

/** Short FNV-1a hash, enough to tell whether a text changed. */
export function textHash(text: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}
