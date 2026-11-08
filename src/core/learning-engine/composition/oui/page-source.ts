/** Balanced source operations shared by the printer and the explicit converter. */
export function rootCall(source: string): { component: string; args: string[]; start: number; end: number } | null {
  const head = /^[ \t]*root\s*=\s*([A-Z]\w*)\s*\(/m.exec(source)
  if (!head) return null
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
  let body = call.args[1]
  if (/^[A-Za-z_]\w*$/.test(body)) {
    const declaration = new RegExp(`^\\s*${body}\\s*=\\s*`, 'm').exec(source)
    if (declaration) {
      // Retain the named statement (and its Pick identity); root may reference it.
      const tail = source.slice(declaration.index + declaration[0].length)
      const nested = rootCall(`root = ${tail}`)
      if (nested) body = `root = ${tail}`.slice(nested.start, nested.end)
    }
  }
  return source.slice(0, call.start) + body + source.slice(call.end)
}

/** Explicit migration only. Runtime readers do not silently accept old sections. */
export function migrateSectionSource(source: string): string {
  if (rootCall(source)?.component === 'Page') return source
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
  return renamed.slice(0, next.start) + `Page(${title}, ${renamed.slice(next.start, next.end)})` + renamed.slice(next.end)
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
