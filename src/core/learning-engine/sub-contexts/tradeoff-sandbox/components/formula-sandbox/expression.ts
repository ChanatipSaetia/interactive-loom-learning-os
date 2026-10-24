/**
 * A small reader for formula-sandbox formulas: the JavaScript expressions
 * topics write ("Math.round(chunk_size * (1 + overlap / 70))"), worked out
 * without compiling code. `new Function` is blocked where Loom runs inside a
 * chat (a Content Security Policy without `unsafe-eval`), so formulas are
 * parsed and evaluated here instead.
 *
 * Supported: numbers, variable names, `+ - * / % **`, brackets, unary `- + !`,
 * comparisons (`< <= > >= == != === !==`), `&&`, `||`, `? :`, and `Math.<name>`
 * functions and constants.
 */

const MATH_FUNCTIONS: Record<string, (...args: number[]) => number> = {
  abs: Math.abs, ceil: Math.ceil, floor: Math.floor, round: Math.round, trunc: Math.trunc, sign: Math.sign,
  sqrt: Math.sqrt, cbrt: Math.cbrt, pow: Math.pow, exp: Math.exp, expm1: Math.expm1,
  log: Math.log, log2: Math.log2, log10: Math.log10, log1p: Math.log1p,
  min: Math.min, max: Math.max, hypot: Math.hypot,
  sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, random: Math.random,
}

const MATH_CONSTANTS: Record<string, number> = {
  PI: Math.PI, E: Math.E, LN2: Math.LN2, LN10: Math.LN10, LOG2E: Math.LOG2E, LOG10E: Math.LOG10E, SQRT2: Math.SQRT2, SQRT1_2: Math.SQRT1_2,
}

const own = (record: object, key: string) => Object.prototype.hasOwnProperty.call(record, key)

type Token = { kind: 'num'; value: number } | { kind: 'name'; value: string } | { kind: 'op'; value: string }

const OPERATORS = ['===', '!==', '**', '<=', '>=', '==', '!=', '&&', '||', '+', '-', '*', '/', '%', '<', '>', '!', '?', ':', '(', ')', ',', '.']

function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < source.length) {
    const c = source[i]
    if (/\s/.test(c)) {
      i++
      continue
    }
    const number = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(source.slice(i))
    if (number) {
      tokens.push({ kind: 'num', value: Number(number[0]) })
      i += number[0].length
      continue
    }
    const name = /^[A-Za-z_$][\w$]*/.exec(source.slice(i))
    if (name) {
      tokens.push({ kind: 'name', value: name[0] })
      i += name[0].length
      continue
    }
    const op = OPERATORS.find((o) => source.startsWith(o, i))
    if (!op) throw new Error(`Unexpected "${c}" at ${i + 1}`)
    tokens.push({ kind: 'op', value: op })
    i += op.length
  }
  return tokens
}

/** Binding power of each binary operator (higher binds tighter). */
const BINARY: Record<string, number> = {
  '||': 1, '&&': 2,
  '==': 3, '!=': 3, '===': 3, '!==': 3,
  '<': 4, '<=': 4, '>': 4, '>=': 4,
  '+': 5, '-': 5,
  '*': 6, '/': 6, '%': 6,
  '**': 7,
}

function applyBinary(op: string, a: number, b: number): number {
  switch (op) {
    case '+': return a + b
    case '-': return a - b
    case '*': return a * b
    case '/': return a / b
    case '%': return a % b
    case '**': return a ** b
    case '<': return Number(a < b)
    case '<=': return Number(a <= b)
    case '>': return Number(a > b)
    case '>=': return Number(a >= b)
    case '==': case '===': return Number(a === b)
    case '!=': case '!==': return Number(a !== b)
    case '&&': return a ? b : a
    case '||': return a ? a : b
    default: throw new Error(`Unknown operator ${op}`)
  }
}

/** Evaluates a formula with the given variables. Throws on syntax errors and unknown names. */
export function evaluateExpression(source: string, variables: Record<string, number>): number {
  const tokens = tokenize(source)
  let pos = 0
  const peek = () => tokens[pos]
  const isOp = (value: string) => peek()?.kind === 'op' && peek()!.value === value
  const expectOp = (value: string) => {
    if (!isOp(value)) throw new Error(`Expected "${value}"`)
    pos++
  }

  // Lazy evaluation is not needed: formulas have no side effects (Math.random aside)
  function expression(): number {
    const condition = binary(1)
    if (!isOp('?')) return condition
    pos++
    const yes = expression()
    expectOp(':')
    const no = expression()
    return condition ? yes : no
  }

  function binary(minPower: number): number {
    let left = unary()
    for (;;) {
      const token = peek()
      if (token?.kind !== 'op') return left
      const power = BINARY[token.value]
      if (power === undefined || power < minPower) return left
      pos++
      // `**` groups to the right, the rest to the left
      const right = binary(token.value === '**' ? power : power + 1)
      left = applyBinary(token.value, left, right)
    }
  }

  function unary(): number {
    if (isOp('-')) { pos++; return -unary() }
    if (isOp('+')) { pos++; return +unary() }
    if (isOp('!')) { pos++; return Number(!unary()) }
    return primary()
  }

  function args(): number[] {
    expectOp('(')
    const list: number[] = []
    if (!isOp(')')) {
      list.push(expression())
      while (isOp(',')) {
        pos++
        list.push(expression())
      }
    }
    expectOp(')')
    return list
  }

  function primary(): number {
    const token = tokens[pos++]
    if (!token) throw new Error('Unexpected end of formula')
    if (token.kind === 'num') return token.value
    if (token.kind === 'op' && token.value === '(') {
      const value = expression()
      expectOp(')')
      return value
    }
    if (token.kind === 'name') {
      if (token.value === 'Math' && isOp('.')) {
        pos++
        const member = tokens[pos++]
        if (member?.kind !== 'name') throw new Error('Expected a Math function or constant')
        // Own properties only: `Math.constructor` and the like must not reach anything
        if (own(MATH_CONSTANTS, member.value)) return MATH_CONSTANTS[member.value]
        if (!own(MATH_FUNCTIONS, member.value)) throw new Error(`Unknown Math.${member.value}`)
        return MATH_FUNCTIONS[member.value](...args())
      }
      if (token.value === 'true') return 1
      if (token.value === 'false') return 0
      if (own(variables, token.value)) return variables[token.value]
      throw new Error(`Unknown name "${token.value}"`)
    }
    throw new Error(`Unexpected "${token.value}"`)
  }

  const value = expression()
  if (pos < tokens.length) throw new Error(`Unexpected "${String(tokens[pos].value)}"`)
  return value
}
