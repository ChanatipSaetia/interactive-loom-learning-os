/**
 * Fault-tolerant OpenUI Lang scanner for editor tooling.
 *
 * Unlike the real parser this never throws and keeps exact offsets, so it
 * can answer "what is under / before the cursor?" on half-typed code.
 */

export type OUITokenType =
  | 'ident'
  | 'state'
  | 'builtin'
  | 'string'
  | 'number'
  | 'comment'
  | 'punct'
  | 'operator'
  | 'newline'

export interface OUIToken {
  type: OUITokenType
  text: string
  start: number
  end: number
  /** Strings only: false when the closing quote is missing. */
  terminated?: boolean
}

const IDENT_START = /[A-Za-z_]/
const IDENT_PART = /[\w]/

export function scan(source: string): OUIToken[] {
  const tokens: OUIToken[] = []
  let i = 0
  const push = (type: OUITokenType, start: number, end: number, extra?: Partial<OUIToken>) =>
    tokens.push({ type, text: source.slice(start, end), start, end, ...extra })

  while (i < source.length) {
    const ch = source[i]
    const start = i
    if (ch === '\n') {
      push('newline', i, ++i)
    } else if (/\s/.test(ch)) {
      i++
    } else if (ch === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i++
      push('comment', start, i)
    } else if (ch === '"' || ch === "'") {
      i++
      let terminated = false
      while (i < source.length && source[i] !== '\n') {
        if (source[i] === '\\') {
          i += 2
          continue
        }
        if (source[i] === ch) {
          i++
          terminated = true
          break
        }
        i++
      }
      push('string', start, Math.min(i, source.length), { terminated })
    } else if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(source[i + 1] ?? ''))) {
      while (i < source.length && /[0-9.]/.test(source[i])) i++
      push('number', start, i)
    } else if (ch === '$' || ch === '@') {
      i++
      while (i < source.length && IDENT_PART.test(source[i])) i++
      push(ch === '$' ? 'state' : 'builtin', start, i)
    } else if (IDENT_START.test(ch)) {
      while (i < source.length && IDENT_PART.test(source[i])) i++
      push('ident', start, i)
    } else if ('()[]{},:'.includes(ch)) {
      push('punct', i, ++i)
    } else {
      const two = source.slice(i, i + 2)
      i += ['==', '!=', '>=', '<=', '&&', '||'].includes(two) ? 2 : 1
      push('operator', start, i)
    }
  }
  return tokens
}

// ============================================================================
// Statements
// ============================================================================

export interface OUIStatement {
  name: string
  /** Offset range of the statement name. */
  nameStart: number
  nameEnd: number
  /** Offset range of the whole statement (name to end of expression). */
  start: number
  end: number
  /** Component called at the top of the expression, e.g. `Quiz`. */
  component?: string
}

/** Index top-level `name = Expression` statements (multi-line aware). */
export function indexStatements(tokens: OUIToken[]): OUIStatement[] {
  const statements: OUIStatement[] = []
  let depth = 0
  let lineStart = true
  let current: OUIStatement | null = null

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]
    if (tok.type === 'comment') continue
    if (tok.type === 'newline') {
      if (depth === 0) lineStart = true
      continue
    }
    if (lineStart && depth === 0 && (tok.type === 'ident' || tok.type === 'state')) {
      const next = nextSignificant(tokens, i + 1)
      if (next && next.type === 'operator' && next.text === '=') {
        if (current) statements.push(current)
        const value = nextSignificant(tokens, tokens.indexOf(next) + 1)
        const afterValue = value ? nextSignificant(tokens, tokens.indexOf(value) + 1) : undefined
        current = {
          name: tok.text,
          nameStart: tok.start,
          nameEnd: tok.end,
          start: tok.start,
          end: tok.end,
          component: value?.type === 'ident' && afterValue?.text === '(' ? value.text : undefined,
        }
      }
    }
    lineStart = false
    if (tok.type === 'punct') {
      if ('([{'.includes(tok.text)) depth++
      else if (')]}'.includes(tok.text)) depth = Math.max(0, depth - 1)
    }
    if (current) current.end = tok.end
  }
  if (current) statements.push(current)
  return statements
}

function nextSignificant(tokens: OUIToken[], from: number): OUIToken | undefined {
  for (let i = from; i < tokens.length; i++) {
    if (tokens[i].type !== 'comment' && tokens[i].type !== 'newline') return tokens[i]
  }
  return undefined
}

// ============================================================================
// Cursor context
// ============================================================================

export interface OUIFrame {
  kind: 'call' | 'builtin' | 'array' | 'object' | 'group'
  /** Component (or builtin) name for call frames. */
  name?: string
  /** Offset of the opening bracket. */
  open: number
  /** Zero-based argument / element index at the cursor. */
  index: number
}

export interface OUICursorContext {
  /** Open brackets enclosing the cursor, innermost last. */
  frames: OUIFrame[]
  /** Token the cursor is inside or touching at its end. */
  token?: OUIToken
  /** Identifier-like text typed so far (for filtering completions). */
  prefix: string
  prefixStart: number
  inString: boolean
  inComment: boolean
  /** Cursor is where a new top-level statement name would go. */
  atStatementStart: boolean
  /** Cursor is in an object literal key position (`{key: …}`). */
  inObjectKey: boolean
}

export function cursorContext(source: string, tokens: OUIToken[], offset: number): OUICursorContext {
  const frames: OUIFrame[] = []
  let prev: OUIToken | undefined
  let token: OUIToken | undefined
  let afterColonInObject = false

  for (const tok of tokens) {
    if (tok.start >= offset) break
    const containsCursor = offset <= tok.end && !(tok.type === 'punct' || tok.type === 'newline' || tok.type === 'operator')
    if (containsCursor) {
      token = tok
      break
    }
    if (tok.type === 'newline' || tok.type === 'comment') continue

    if (tok.type === 'punct') {
      const top = frames[frames.length - 1]
      if (tok.text === '(') {
        const isCall = prev && (prev.type === 'ident' || prev.type === 'builtin')
        frames.push({
          kind: isCall ? (prev!.type === 'builtin' ? 'builtin' : 'call') : 'group',
          name: isCall ? prev!.text.replace(/^@/, '') : undefined,
          open: tok.start,
          index: 0,
        })
      } else if (tok.text === '[') {
        frames.push({ kind: 'array', open: tok.start, index: 0 })
      } else if (tok.text === '{') {
        frames.push({ kind: 'object', open: tok.start, index: 0 })
        afterColonInObject = false
      } else if (')]}'.includes(tok.text)) {
        frames.pop()
        afterColonInObject = false
      } else if (tok.text === ',' && top) {
        top.index++
        afterColonInObject = false
      } else if (tok.text === ':' && top?.kind === 'object') {
        afterColonInObject = true
      }
    }
    prev = tok
  }

  const inString = token?.type === 'string' && offset > token.start && (offset < token.end || !token.terminated)
  const inComment = token?.type === 'comment'
  const identLike = token && (token.type === 'ident' || token.type === 'state' || token.type === 'builtin')
  const prefix = identLike ? source.slice(token!.start, offset) : ''
  const prefixStart = identLike ? token!.start : offset
  const top = frames[frames.length - 1]

  return {
    frames,
    token,
    prefix,
    prefixStart,
    inString: !!inString,
    inComment: !!inComment,
    atStatementStart: frames.length === 0 && isAtLineStart(source, prefixStart),
    inObjectKey: top?.kind === 'object' && !afterColonInObject,
  }
}

function isAtLineStart(source: string, offset: number): boolean {
  for (let i = offset - 1; i >= 0; i--) {
    if (source[i] === '\n') return true
    if (!/\s/.test(source[i])) return false
  }
  return true
}

/**
 * Token under `offset`. A word-like token starting or ending at the offset
 * wins over adjacent punctuation, so `[p` with the cursor before `p` is `p`.
 */
export function tokenAt(tokens: OUIToken[], offset: number): OUIToken | undefined {
  const touching = tokens.filter((t) => t.start <= offset && offset <= t.end && t.type !== 'newline')
  const isWord = (t: OUIToken) => t.type !== 'punct' && t.type !== 'operator'
  return touching.find((t) => isWord(t) && offset < t.end)
    ?? touching.find(isWord)
    ?? touching.find((t) => offset < t.end)
}

// ============================================================================
// Positions
// ============================================================================

export interface OUIPosition {
  /** 0-based line. */
  line: number
  /** 0-based column (UTF-16 code units). */
  character: number
}

export function offsetToPosition(source: string, offset: number): OUIPosition {
  let line = 0
  let lineStartOffset = 0
  for (let i = 0; i < offset && i < source.length; i++) {
    if (source[i] === '\n') {
      line++
      lineStartOffset = i + 1
    }
  }
  return { line, character: offset - lineStartOffset }
}

export function positionToOffset(source: string, position: OUIPosition): number {
  let line = 0
  let i = 0
  while (line < position.line && i < source.length) {
    if (source[i] === '\n') line++
    i++
  }
  return Math.min(i + position.character, source.length)
}
