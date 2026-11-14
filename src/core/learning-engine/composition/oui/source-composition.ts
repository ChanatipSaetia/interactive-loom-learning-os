/** Source-only dependency inspection; no compilation or execution. */
import { fileStatements, type FileStatement } from '../../../supporting/authoring-editor/assistant/statements'

export function inspectComposition(source: string) {
  const statements = fileStatements(source)
  const byName = new Map(statements.map((statement) => [statement.name, statement]))
  const visited = new Set<string>(), calls = new Set<string>(), missing = new Set<string>()
  const visit = (name: string): void => {
    if (visited.has(name)) return
    visited.add(name)
    const statement = byName.get(name)
    if (!statement) { missing.add(name); return }
    for (const call of statement.calls) calls.add(call)
    for (const ref of statement.refs) visit(ref)
  }
  visit('root')
  let root: FileStatement | undefined = byName.get('root')
  const aliases = new Set<string>()
  while (root && !root.component && root.refs.length === 1 && !aliases.has(root.name)) {
    aliases.add(root.name)
    root = byName.get(root.refs[0])
  }
  return { statements, visited, calls, missing, rootComponent: root?.component }
}
