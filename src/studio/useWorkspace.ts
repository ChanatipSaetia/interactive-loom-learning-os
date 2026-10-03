import { useSyncExternalStore } from 'react'
import type { TopicWorkspace, WorkspaceSnapshot } from '../core/supporting/authoring-editor/workspace'

/** Subscribe a component to a TopicWorkspace. */
export function useWorkspace(workspace: TopicWorkspace): WorkspaceSnapshot {
  return useSyncExternalStore(workspace.subscribe, workspace.getSnapshot)
}
