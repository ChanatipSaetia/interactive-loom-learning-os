/**
 * Pick & Comment for Loom Studio and Loom Viewer: point at part of a topic
 * and copy a reference for an AI coding agent. See grill-log-pick-and-comment.md.
 */
export { PickMode, useNarrow } from './PickMode'
export type { PickAssistantBridge, PickModeApi, PickSendDraft } from './PickMode'
export { PickSection } from './PickSection'
export { PickLayer, pickTargetOf } from './PickLayer'
export type { PickTarget } from './PickLayer'
export {
  EMPTY_TRAY,
  addPickEntry,
  entrySection,
  orderPickEntries,
  widenAnchor,
  widenPickEntry,
  loadPickTray,
  pickEntryKey,
  resolvePickEntries,
  savePickTray,
  sourceResolver,
  statementAtLine,
  statementOfAnchor,
  trayReport,
} from './tray'
export type { PickEntry, PickMode as PickTrayMode, PickResolver, PickTrayState, ResolvedPickEntry } from './tray'
