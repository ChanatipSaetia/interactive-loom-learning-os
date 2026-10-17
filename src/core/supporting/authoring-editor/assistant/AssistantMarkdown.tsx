/**
 * Renders a model's reply (grill-log-ai-assistant.md, decision 61).
 *
 * The markdown is tokenised with `marked` and turned into React elements
 * here, so nothing the model writes ever reaches `innerHTML`: raw HTML shows
 * as text, images show only their alt text (loading an image URL could leak
 * the topic source or comments to whoever wrote the URL), and links show
 * their full address and open in a new tab without a referrer. Only
 * http(s) and mailto links are links. openui-lang code blocks are
 * highlighted with the editor's scanner.
 */
import { Fragment, useMemo, type ReactNode } from 'react'
import { marked, type Token, type Tokens } from 'marked'
import { scan } from '../oui-language'

const SAFE_LINK = /^(https?:|mailto:)/i

function safeHref(href: string): string | null {
  try {
    const url = new URL(href, 'https://invalid.invalid/')
    if (!SAFE_LINK.test(href.trim())) return null
    return url.href
  } catch {
    return null
  }
}

const OUI_LANGS = new Set(['oui', 'openui', 'openui-lang', 'oui-edit'])

/** A code block that looks like openui-lang: `name = Component(`. */
const looksLikeOUI = (text: string) => /^\s*(\/\/.*\n\s*)*\$?[A-Za-z_]\w*\s*=\s*[A-Z]\w*\(/.test(text)

function HighlightedOUI({ text }: { text: string }) {
  const tokens = scan(text)
  const out: ReactNode[] = []
  let at = 0
  tokens.forEach((token, i) => {
    if (token.start > at) out.push(text.slice(at, token.start))
    let kind: string = token.type
    if (token.type === 'ident') {
      const next = tokens.slice(i + 1).find((t) => t.type !== 'newline' && t.type !== 'comment')
      if (next?.text === '(') kind = 'component'
      else if (['true', 'false', 'null'].includes(token.text)) kind = 'keyword'
    }
    out.push(
      kind === 'newline' || kind === 'punct' ? token.text : (
        <span key={i} className={`ai-tok-${kind}`}>{token.text}</span>
      ),
    )
    at = token.end
  })
  if (at < text.length) out.push(text.slice(at))
  return <>{out}</>
}

function inline(tokens: Token[] | undefined, key = ''): ReactNode[] {
  return (tokens ?? []).map((token, i) => {
    const k = `${key}${i}`
    switch (token.type) {
      case 'strong':
        return <strong key={k}>{inline((token as Tokens.Strong).tokens, k)}</strong>
      case 'em':
        return <em key={k}>{inline((token as Tokens.Em).tokens, k)}</em>
      case 'del':
        return <del key={k}>{inline((token as Tokens.Del).tokens, k)}</del>
      case 'codespan':
        return <code key={k}>{(token as Tokens.Codespan).text}</code>
      case 'br':
        return <br key={k} />
      case 'link': {
        const link = token as Tokens.Link
        const href = safeHref(link.href)
        const label = inline(link.tokens, k)
        if (!href) return <Fragment key={k}>{label}</Fragment>
        const shown = link.text === link.href || link.text === href
        return (
          <Fragment key={k}>
            <a href={href} target="_blank" rel="noopener noreferrer nofollow" title={href}>{label}</a>
            {!shown && <span className="ai-md-url"> ({href})</span>}
          </Fragment>
        )
      }
      case 'image': {
        const image = token as Tokens.Image
        return <span key={k} className="ai-md-image">[image{image.text ? `: ${image.text}` : ''}]</span>
      }
      case 'checkbox':
        return <span key={k}>{(token as Tokens.Checkbox).checked ? '☑ ' : '☐ '}</span>
      case 'text': {
        const text = token as Tokens.Text
        return text.tokens ? <Fragment key={k}>{inline(text.tokens, k)}</Fragment> : <Fragment key={k}>{text.text}</Fragment>
      }
      case 'escape':
      case 'html':
      default:
        return <Fragment key={k}>{'text' in token ? String(token.text) : token.raw}</Fragment>
    }
  })
}

function block(tokens: Token[], key = ''): ReactNode[] {
  return tokens.map((token, i) => {
    const k = `${key}${i}`
    switch (token.type) {
      case 'space':
        return null
      case 'paragraph':
        return <p key={k}>{inline((token as Tokens.Paragraph).tokens, k)}</p>
      case 'heading': {
        const heading = token as Tokens.Heading
        return <p key={k} className={`ai-md-heading ai-md-h${Math.min(heading.depth, 3)}`}>{inline(heading.tokens, k)}</p>
      }
      case 'code': {
        const code = token as Tokens.Code
        const lang = (code.lang ?? '').split(/\s/)[0].toLowerCase()
        const oui = OUI_LANGS.has(lang) || (!lang && looksLikeOUI(code.text))
        return (
          <pre key={k} className="ai-md-code" data-lang={lang || undefined}>
            <code>{oui ? <HighlightedOUI text={code.text} /> : code.text}</code>
          </pre>
        )
      }
      case 'blockquote':
        return <blockquote key={k}>{block((token as Tokens.Blockquote).tokens, k)}</blockquote>
      case 'list': {
        const list = token as Tokens.List
        const items = list.items.map((item, j) => <li key={j}>{item.loose ? block(item.tokens, `${k}.${j}`) : inline(item.tokens, `${k}.${j}`)}</li>)
        return list.ordered
          ? <ol key={k} start={typeof list.start === 'number' && list.start !== 1 ? list.start : undefined}>{items}</ol>
          : <ul key={k}>{items}</ul>
      }
      case 'table': {
        const table = token as Tokens.Table
        return (
          <div key={k} className="ai-md-table">
            <table>
              <thead><tr>{table.header.map((cell, j) => <th key={j}>{inline(cell.tokens, `${k}h${j}`)}</th>)}</tr></thead>
              <tbody>
                {table.rows.map((row, r) => (
                  <tr key={r}>{row.map((cell, j) => <td key={j}>{inline(cell.tokens, `${k}r${r}c${j}`)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      case 'hr':
        return <hr key={k} />
      case 'html':
        // Raw HTML is shown as the text it is.
        return <p key={k} className="ai-md-raw">{(token as Tokens.HTML).text}</p>
      case 'text': {
        const text = token as Tokens.Text
        return <p key={k}>{text.tokens ? inline(text.tokens, k) : text.text}</p>
      }
      default:
        return <p key={k}>{token.raw}</p>
    }
  })
}

export function AssistantMarkdown({ text }: { text: string }) {
  const tokens = useMemo(() => {
    try {
      return marked.lexer(text, { gfm: true })
    } catch {
      return null
    }
  }, [text])
  if (!tokens) return <div className="ai-md"><p>{text}</p></div>
  return <div className="ai-md">{block(tokens)}</div>
}
