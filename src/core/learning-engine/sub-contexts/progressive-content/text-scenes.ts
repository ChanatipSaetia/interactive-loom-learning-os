import { marked } from 'marked'
import type { TextPresentData } from './present'

export interface TextScene {
  id: string
  source: string
  paragraph: number
  part: number
  total: number
}

/** A paragraph that opens with a bold term (`**Pipelines** — …`): the term, and the rest of the paragraph. */
export function leadTerm(paragraph: string): { term?: string; rest: string } {
  const m = paragraph.match(/^\s*\*\*([^*]{1,60})\*\*\s*(?:[—–:-]\s*)?/)
  return m ? { term: m[1].trim(), rest: paragraph.slice(m[0].length) } : { rest: paragraph }
}

/** Keep Markdown constructs intact; only ordinary prose may break at sentence or word boundaries. */
function chunks(source: string): string[] {
  const budget = 220
  const result: string[] = []
  let current = ''
  const append = (fragment: string) => {
    if (current.trim() && current.length + fragment.length > budget && (/\s$/.test(current) || /^\s/.test(fragment))) {
      result.push(current.trim())
      current = ''
    }
    current += fragment
  }
  for (const block of marked.lexer(source)) {
    if (block.type === 'paragraph' && block.tokens) {
      for (const token of block.tokens) {
        if (token.type !== 'text') {
          append(token.raw)
          continue
        }
        // Sentence-sized units where possible; a long sentence still gets breathing room.
        for (const sentence of token.raw.split(/(?<=[^\s.]{3}[.!?]|[。！？])(?=\s+\S)/)) {
          if (sentence.length <= budget) append(sentence)
          else for (const word of sentence.match(/\s*\S+\s*/g) ?? []) append(word)
        }
      }
      current += '\n\n'
    } else {
      // Tables, code blocks and other structured Markdown stay whole.
      if (current.trim()) { result.push(current.trim()); current = '' }
      if (block.raw.trim()) result.push(block.raw.trim())
    }
  }
  if (current.trim()) result.push(current.trim())
  return result.length ? result : [source]
}

/** First scene keeps pN; continuations add pN.partK so existing narration remains attached. */
export function textScenes(data: TextPresentData): TextScene[] {
  return (data.paragraphs ?? []).flatMap((source, paragraph) => {
    const { term, rest } = leadTerm(source)
    const parts = chunks(term ? rest : source)
    const prefix = term ? source.slice(0, source.length - rest.length) : ''
    return parts.map((part, i) => ({
      id: i === 0 ? `p${paragraph + 1}` : `p${paragraph + 1}.part${i + 1}`,
      source: i === 0 ? prefix + part : part,
      paragraph,
      part: i,
      total: parts.length,
    }))
  })
}
