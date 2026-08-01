export interface StepChanged {
  type: 'StepChanged'
  /** Current step index within the active journey or sequence. */
  stepIndex: number
  /** ID of the active journey or scenario path. */
  journeyId?: string
  /** Timestamp of the change. */
  timestamp: number
}

export interface SimulationReset {
  type: 'SimulationReset'
  /** ID of the simulation that was reset (flowchart journey or scenario). */
  simulationId: string
  /** Timestamp of the reset. */
  timestamp: number
}

export type ProcessSimulationEvents = StepChanged | SimulationReset
