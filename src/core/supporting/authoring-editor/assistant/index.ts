/**
 * AI assistant for Pick in Loom Studio and Loom Viewer: calls any
 * OpenAI-compatible API straight from the browser. See
 * grill-log-ai-assistant.md.
 */
export { AssistantDock, AssistantToggle, pickBridgeOf } from './AssistantPanel'
export type { AssistantDockProps } from './AssistantPanel'
export { AssistantMarkdown } from './AssistantMarkdown'
export { EditCard, ProposalBar } from './AssistantEdits'
export {
  applyEditBlock,
  applyOrder,
  checkProposal,
  diffLines,
  parseEditBlock,
  parseEditBlocks,
  sectionNameOf,
  narrationNameOf,
} from './edits'
export type { DiffLine, EditBlock, EditStatement, HunkResult, ProposalCheck, StatementChange } from './edits'
export { AssistantSettingsDialog } from './AssistantSettingsDialog'
export type { AssistantSettingsDialogProps } from './AssistantSettingsDialog'
export {
  AssistantError,
  SSEDecoder,
  chatCompletion,
  isIpLiteral,
  isLocalNetworkHost,
  isLoopbackHost,
  listModels,
  normalizeBaseUrl,
  testConnection,
} from './client'
export type {
  AssistantConnection,
  AssistantFailureKind,
  ChatMessage,
  ChatRequest,
  ChatResult,
  ClientEnvironment,
  ConnectionReport,
} from './client'
export { ASSISTANT_PRESETS, DEFAULT_TOKEN_BUDGET, failureHint, presetOf } from './presets'
export type { AssistantPreset, AssistantPresetId, HintContext } from './presets'
export {
  EMPTY_ASSISTANT_SETTINGS,
  activeProfile,
  connectionOf,
  createProfile,
  deleteProfileKey,
  formatHeaders,
  loadAssistantSettings,
  loadProfileKey,
  parseHeaders,
  saveAssistantSettings,
  saveProfileKey,
} from './profiles'
export type { AssistantProfile, AssistantSettings, StoredKey } from './profiles'
export { buildTopicContext, fileStatements, textHash } from './context'
export type { AssistantTopicContext, ContextPointer, FileStatement, TopicContextBlock, TopicContextOptions } from './context'
export {
  EMPTY_THREAD,
  estimateTokens,
  historyForRequest,
  historyMessages,
  historyStart,
  knownContext,
  loadThread,
  saveThread,
  threadPointers,
  userMessageContent,
} from './thread'
export type { AssistantThread, EditHunkState, HistoryForRequest, ThreadMessage, ThreadMessageStatus, ThreadPick } from './thread'
export { hostOf, retryMessage, useAssistant } from './useAssistant'
export type { AssistantDraft, AssistantEditor, AssistantState, RemoteNotice, UseAssistantOptions } from './useAssistant'
