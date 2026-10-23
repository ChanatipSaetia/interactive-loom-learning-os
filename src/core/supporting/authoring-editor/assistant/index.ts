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
export type { AssistantTopicContext, ContextPointer, FileStatement, TopicContextBlock, TopicContextOptions, AssistantView } from './context'
export { CONTENT_TOOLS, ContentToolRunner, STUDIO_CONTENT_TOOLS, parseAddress } from './content-tools'
export { EDIT_TOOLS, EditToolRunner } from './edit-tools'
export type { EditToolOutcome } from './edit-tools'
export { StagedChanges } from './StagedChanges'
export {
  changesetNote,
  fileView,
  newErrors,
  stageSection,
  stageStatements,
  stageTopic,
  stagedContext,
  stagedFiles,
} from './changeset'
export type { Changeset, FileView, StagedChange, StagedFile, StagedState } from './changeset'
export type { ContentAddress, ToolDefinition, ToolOutcome } from './content-tools'
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
  toolStepMessages,
  userMessageContent,
} from './thread'
export type { AssistantThread, EditHunkState, HistoryForRequest, HistoryOptions, ThreadMessage, ThreadMessageStatus, ThreadPick, ToolStep, ToolStepCall } from './thread'
export { MAX_STUDIO_TOOL_ROUNDS, MAX_TOOL_ROUNDS, hostOf, retryMessage, useAssistant } from './useAssistant'
export type { AssistantDraft, AssistantEditor, AssistantState, RemoteNotice, UseAssistantOptions } from './useAssistant'
