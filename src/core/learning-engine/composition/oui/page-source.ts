import { fileStatements } from '../../../supporting/authoring-editor/assistant/statements'
/** Balanced source operations shared by the printer and the explicit converter. */
export function rootCall(source: string): { component: string; args: string[]; start: number; end: number } | null {
  const head = /^[ \t]*root\s*=\s*([A-Z]\w*)\s*\(/m.exec(source)
  if (!head) {
    const alias = /^[ \t]*root\s*=\s*([A-Za-z_]\w*)[ \t]*(?=\r?\n|$)/m.exec(source)
    if (!alias) return null
    const statements = fileStatements(source)
    const seen = new Set<string>()
    let expression = alias[1]
    while (/^[A-Za-z_]\w*$/.test(expression)) {
      if (seen.has(expression)) return null
      seen.add(expression)
      const statement = statements.find((entry) => entry.name === expression)
      if (!statement) return null
      expression = statement.text.slice(statement.text.indexOf('=') + 1).trim()
    }
    const resolved = rootCall(`root = ${expression}`)
    const start = alias.index + alias[0].indexOf(alias[1], alias[0].indexOf('=') + 1)
    return resolved ? { ...resolved, start, end: start + alias[1].length } : null
  }
  const start = head.index + head[0].indexOf(head[1])
  let from = head.index + head[0].length
  const args: string[] = []
  let depth = 0
  for (let i = from; i < source.length; i++) {
    const c = source[i]
    if (c === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i++
      continue
    }
    if (c === '"' || c === "'") {
      const quote = c
      for (i++; i < source.length && source[i] !== quote; i++) if (source[i] === '\\') i++
      continue
    }
    if ('([{'.includes(c)) depth++
    else if (c === ')' && depth === 0) {
      if (source.slice(from, i).trim()) args.push(source.slice(from, i).trim())
      return { component: head[1], args, start, end: i + 1 }
    } else if (')]}'.includes(c)) depth--
    else if (c === ',' && depth === 0) { args.push(source.slice(from, i).trim()); from = i + 1 }
  }
  return null
}

/** Preserve declarations and names while exposing the Page body as a program. */
export function pageBodySource(source: string): string {
  const call = rootCall(source)
  if (call?.component !== 'Page' || !call.args[1]) return source
  const body = call.args[1]
  return source.slice(0, call.start) + body + source.slice(call.end)
}

/** Explicit migration only. Runtime readers do not silently accept old sections. */
export function migrateSectionSource(source: string): string {
  if (rootCall(source)?.component === 'Page') return migrateLessonText(source)
  const directive = /^\s*\/\/\s*@openui\b([^\n]*)\n/.exec(source)
  if (directive) {
    const leading = source.slice(0, source.indexOf('//'))
    const strings = [...directive[1].matchAll(/"(?:[^"\\]|\\.)*"/g)].map((m) => m[0])
    const program = source.slice(directive[0].length)
    const call = rootCall(program)
    if (!call) throw new Error('Cannot convert OpenUI section without a complete root call')
    return leading + program.slice(0, call.start) + `Page(${strings[0] ?? '"Untitled"'}, ${program.slice(call.start, call.end)}${strings[1] ? `, ${strings[1]}` : ''})` + program.slice(call.end)
  }
  const call = rootCall(source)
  if (call?.component === 'Narration') return renameLearningCalls(source, { Callout: 'NarrationCallout' })
  if (!call || ['Topic', 'Catalog', 'Domain', 'Library'].includes(call.component)) return source
  // These names belonged to Loom only in the old non-directive dialect.
  const renamed = renameLearningCalls(source)
  const next = rootCall(renamed)!
  const title = next.args[0] ?? '"Untitled"'
  return migrateLessonText(renamed.slice(0, next.start) + `Page(${title}, ${renamed.slice(next.start, next.end)})` + renamed.slice(next.end))
}

function renameLearningCalls(source: string, names: Record<string, string> = { Text: 'LessonText', ImageGallery: 'LearningGallery' }): string {
  let result = ''
  for (let i = 0; i < source.length;) {
    const start = i
    if (source[i] === '"' || source[i] === "'") {
      const quote = source[i++]
      while (i < source.length) { if (source[i++] === '\\') i++; else if (source[i - 1] === quote) break }
    } else if (source[i] === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i++
    } else {
      const match = new RegExp(`^(${Object.keys(names).join('|')})\\b(?=\\s*\\()`).exec(source.slice(i))
      if (match && (i === 0 || !/\w/.test(source[i - 1]))) {
        result += names[match[1]]
        i += match[1].length
        continue
      }
      i++
    }
    result += source.slice(start, i)
  }
  return result
}

/** Remove the retired prose wrapper explicitly, preserving each paragraph block. */
export function migrateLessonText(source: string): string {
  const page = rootCall(source)
  const bodySource = page?.component === 'Page' ? page.args[1] : undefined
  const statement = bodySource && /^[A-Za-z_]\w*$/.test(bodySource) ? fileStatements(source).find((entry) => entry.name === bodySource) : undefined
  const bodyExpression = statement ? statement.text.slice(statement.text.indexOf('=') + 1) : bodySource
  const legacy = bodyExpression ? rootCall(`root = ${bodyExpression}`) : null
  if (page && legacy?.component === 'LessonText') {
    const args = [...page.args]
    if ((!args[2] || args[2] === 'null') && legacy.args[2]) args[2] = legacy.args[2]
    if (legacy.args[3] && legacy.args[3] !== 'null') {
      if (args[3] && args[3] !== 'null' && args[3] !== legacy.args[3]) throw new Error('Conflicting Page and LessonText leads; resolve them before migration.')
      args[2] ??= 'null'
      args[3] = legacy.args[3]
    }
    source = source.slice(0, page.start) + `Page(${args.join(', ')})` + source.slice(page.end)
  }
  const expandedArrays = new Set<string>()
  let result = ''
  for (let i = 0; i < source.length;) {
    const start = i
    if (source[i] === '"' || source[i] === "'") {
      const quote = source[i++]
      while (i < source.length) { if (source[i++] === '\\') i++; else if (source[i - 1] === quote) break }
    } else if (source[i] === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i++
    } else if (/^LessonText\s*\(/.test(source.slice(i)) && (i === 0 || !/\w/.test(source[i - 1]))) {
      const call = rootCall(`root = ${source.slice(i)}`)
      if (!call) throw new Error('Incomplete LessonText call; repair its syntax before migration.')
      if (legacy?.component !== 'LessonText') throw new Error('Nested LessonText needs an explicit composition and narration migration; move its metadata and review layout beats before replacing it with TextContent.')
      let array = call.args[1] ?? ''
      // Resolve a named paragraph array without changing its statement identity.
      const seen = new Set<string>()
      while (/^[A-Za-z_]\w*$/.test(array) && !seen.has(array)) {
        seen.add(array)
        expandedArrays.add(array)
        const statement = fileStatements(source).find((entry) => entry.name === array)
        if (!statement) break
        array = statement.text.slice(statement.text.indexOf('=') + 1).trim()
      }
      if (!array.startsWith('[') || !array.endsWith(']')) throw new Error('LessonText migration needs a literal or named paragraph array; inspect this source manually.')
      const paragraphs = rootCall(`root = Items(${array.slice(1, -1)})`)!.args
      result += `Stack([${paragraphs.map((text) => `TextContent(${text})`).join(', ')}])`
      i += call.end - call.start
      continue
    } else i++
    result += source.slice(start, i)
  }
  const statements = fileStatements(result)
  const reachable = new Set<string>()
  const visit = (name: string) => {
    if (reachable.has(name)) return
    reachable.add(name)
    statements.find((statement) => statement.name === name)?.refs.forEach(visit)
  }
  visit('root')
  for (const statement of [...statements].reverse()) {
    if (expandedArrays.has(statement.name) && !reachable.has(statement.name)) result = result.slice(0, statement.start) + result.slice(statement.end)
  }
  return result
}

/** Narration targets follow the standard block shape; beat IDs remain pN. */
export function migrateProseNarration(source: string): string {
  return source.replace(/"([A-Za-z_]\w*(?:\.[A-Za-z_]\w*|\[\d+\])*)\.paragraphs\[(\d+)\]"/g, (_match, base: string, index: string) => `"${base === 'root' ? 'root.body' : base}.children[${index}].text"`)
}
