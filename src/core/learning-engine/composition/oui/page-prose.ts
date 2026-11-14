import { fileStatements } from '../../../supporting/authoring-editor/assistant/statements'
import type { ElementNode } from '@openuidev/lang-core'

/** Paragraph blocks remain ordinary TextContent. Presentation supplies the scenes. */
export function proseBlocks(node: ElementNode): ElementNode[] | null {
  if (node.typeName === 'Page') {
    const body = node.props.body as ElementNode | undefined
    return body?.type === 'element' ? proseBlocks(body) : null
  }
  if (node.typeName === 'TextContent' && typeof node.props.text === 'string') return [node]
  if (node.typeName !== 'Stack' || (node.props.direction && node.props.direction !== 'column')) return null
  const children = node.props.children as ElementNode[] | undefined
  return children?.length && children.every((child) => child?.type === 'element' && child.typeName === 'TextContent' && typeof child.props.text === 'string') ? children : null
}

/** Pick paths refer to the authored Page, even when its body is rendered alone. */
export function proseAnchors(node: ElementNode, bodyOnly = false, rootAlias?: string): string[] {
  let base = rootAlias ?? node.statementId ?? 'root'
  if (bodyOnly && base === 'root') base = 'root.body'
  if (node.typeName === 'Page') {
    const body = node.props.body as ElementNode
    const anchors = proseAnchors({ ...body, statementId: body.statementId ?? `${base}.body` })
    return anchors
  }
  if (node.typeName === 'TextContent') return [`${base}.text`]
  return (node.props.children as ElementNode[]).map((block, index) => `${block.statementId ?? `${base}.children[${index}]`}.text`)
}

/** OpenUI assigns root its own ID even when its expression references a named body. */
export function proseRootAlias(source: string): string | undefined {
  const root = fileStatements(source).find((statement) => statement.name === 'root')
  return root ? /^root\s*=\s*([A-Za-z_]\w*)$/.exec(root.text.trim())?.[1] : undefined
}
