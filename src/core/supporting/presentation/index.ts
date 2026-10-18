/**
 * PresentationContext — Present mode in Loom Viewer (grill-log-presenting-mode.md).
 */
export { PresentMode, kindLabel, preloadPresenters } from './components/PresentMode'
export type { PresentModeProps, PresentSection } from './components/PresentMode'
export {
  beatToDraw,
  holdMs,
  initialRunnerState,
  isComplete,
  runnerReducer,
} from './beat-runner'
export type { RunnerAction, RunnerState } from './beat-runner'
export * from './camera'
