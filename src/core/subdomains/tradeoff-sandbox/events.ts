export interface SliderValueChanged {
  type: 'SliderValueChanged'
  /** Variable or parameter ID that changed. */
  variableId: string
  /** New value after the change. */
  newValue: number
  /** Previous value before the change. */
  oldValue: number
  /** Timestamp of the change. */
  timestamp: number
}

export interface MetricRecalculated {
  type: 'MetricRecalculated'
  /** Metric ID that was recalculated. */
  metricId: string
  /** New computed value. */
  newValue: number
  /** Formula that produced the value. */
  formula: string
  /** Timestamp of the recalculation. */
  timestamp: number
}

export interface DecisionNodeSelected {
  type: 'DecisionNodeSelected'
  /** ID of the decision node. */
  nodeId: string
  /** ID of the selected choice. */
  choiceId: string
  /** ID of the next node to navigate to. */
  nextNodeId: string
  /** Timestamp of the selection. */
  timestamp: number
}

export type TradeoffSandboxEvents = SliderValueChanged | MetricRecalculated | DecisionNodeSelected
