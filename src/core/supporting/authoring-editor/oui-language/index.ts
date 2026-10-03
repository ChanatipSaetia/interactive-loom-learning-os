/**
 * OpenUI Lang editor tooling: language spec, scanner, and language service
 * shared by the VS Code extension and the in-app CodeMirror editor.
 *
 * Editor-agnostic on purpose; CodeMirror bindings live in './codemirror'
 * and are imported directly (or via the lazy `OUICodeEditor`).
 */
export { getOUILanguageSpec } from './spec'
export type { OUILanguageSpec, OUIComponentSpec, OUIParamSpec, OUIBuiltinSpec, OUIValueKind } from './spec'
export { scan, indexStatements, cursorContext, tokenAt, offsetToPosition, positionToOffset } from './scanner'
export type { OUIToken, OUITokenType, OUIStatement, OUIFrame, OUICursorContext, OUIPosition } from './scanner'
export {
  getCompletions,
  getSignatureHelp,
  getHover,
  getDefinition,
  getDocumentSymbols,
  getDiagnostics,
  componentSnippet,
  fileKindFromPath,
} from './service'
export type {
  OUIFileKind,
  OUIRange,
  OUICompletion,
  OUICompletionKind,
  OUISignatureHelp,
  OUIHover,
  OUIDiagnostic,
  OUISymbol,
  OUIWorkspaceHints,
} from './service'
