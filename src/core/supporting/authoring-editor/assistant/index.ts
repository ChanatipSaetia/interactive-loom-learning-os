/**
 * AI assistant for Pick in Loom Studio and Loom Viewer: calls any
 * OpenAI-compatible API straight from the browser. See
 * grill-log-ai-assistant.md.
 */
export { AssistantSettingsDialog } from './AssistantSettingsDialog'
export type { AssistantSettingsDialogProps } from './AssistantSettingsDialog'
export {
  AssistantError,
  SSEDecoder,
  chatCompletion,
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
