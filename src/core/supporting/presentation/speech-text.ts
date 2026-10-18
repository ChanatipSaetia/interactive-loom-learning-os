/**
 * Rewrites section text for a speech voice (decision 80 in grill-log-presenting-mode.md): file names,
 * paths and URLs are read in parts, header values lose their `=`, a few symbols become words. Rule-based
 * and authoring-free; anything it does not recognise is read as written.
 */

/** File extensions a voice would otherwise mangle, read letter by letter. */
const SPELLED = new Set(['js', 'ts', 'jsx', 'tsx', 'mjs', 'cjs', 'css', 'scss', 'html', 'svg', 'png', 'jpg', 'gif', 'md', 'sh', 'py', 'yml', 'oui', 'pdf', 'csv', 'xml', 'sql', 'dll', 'exe'])
/** A content hash in a built file name (`app.3f9a.js`): hex with at least one digit. */
const HASH = /^(?=[a-f]*\d)[0-9a-f]{4,}$/i
const FILE = /^[A-Za-z_@][\w@-]*(?:\.[\w-]+)*\.[A-Za-z][A-Za-z0-9]{0,4}$/
const PHRASES: Array<[RegExp, string]> = [
  [/\be\.g\.,?/gi, 'for example'],
  [/\bi\.e\.,?/gi, 'that is'],
  [/\betc\./gi, 'et cetera'],
  [/\s*(?:→|->|=>)\s*/g, ' to '],
  [/\s*←\s*/g, ' from '],
  [/\s*&\s*/g, ' and '],
  [/\s*×\s*/g, ' times '],
  [/\s*÷\s*/g, ' divided by '],
  [/\s*≥\s*/g, ' at least '],
  [/\s*≤\s*/g, ' at most '],
  [/\s*≈\s*/g, ' about '],
  [/~(?=\d)/g, 'about '],
  [/[`*]+/g, ''],
]

const spell = (part: string) => (SPELLED.has(part.toLowerCase()) ? part.toLowerCase().split('').join(' ') : part)

/** A file name or path in parts: "/static/app.3f9a.js" → "static slash app dot j s". */
function readPath(path: string): string {
  return path
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      const parts = segment.split('.')
      return parts
        .filter((p, i) => p && !(i > 0 && i < parts.length - 1 && HASH.test(p)))
        .map((p, i, kept) => (i === kept.length - 1 && i > 0 ? spell(p) : p.replace(/[_-]+/g, ' ')))
        .join(' dot ')
    })
    .join(' slash ')
}

function readToken(token: string): string {
  const [, lead, core, trail] = /^([("'“‘[]*)(.*?)([)"'”’\],.;:!?]*)$/.exec(token) ?? ['', '', token, '']
  if (!core) return token
  let out = core
  if (/^https?:\/\//i.test(core)) out = readPath(core.replace(/^https?:\/\/(www\.)?/i, ''))
  else if (/^\/[\w.-]/.test(core) || (core.includes('/') && /\.[A-Za-z]{1,5}$/.test(core) && !/\s/.test(core))) out = readPath(core)
  else if (FILE.test(core) && !/^\d/.test(core)) out = readPath(core)
  else if (/^[\w-]+=[\w.-]+$/.test(core)) out = core.replace('=', ' ')
  return lead + out + trail
}

export function speechText(text: string): string {
  let out = text
  for (const [pattern, words] of PHRASES) out = out.replace(pattern, words)
  return out
    .split(/(\s+)/)
    .map((piece) => (/^\s+$/.test(piece) ? piece : readToken(piece)))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}
