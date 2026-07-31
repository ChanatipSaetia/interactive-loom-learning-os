export {
  TradeoffSandboxSectionSchema,
  FormulaSandboxSectionSchema,
  DecisionTreeSectionSchema,
} from './schema'
export type {
  TradeoffSandboxSectionData,
  TradeoffMetricDef,
  TradeoffProCon,
  TradeoffChoice,
  TradeoffStep,
  TradeoffScenario,
  FormulaSandboxSectionData,
  FormulaVariable,
  FormulaMetric,
  DecisionTreeSectionData,
  DecisionTreeNode,
  DecisionTreeChoice,
  DecisionTreeLeaf,
} from './schema'

export { TradeoffSandboxSection } from './components/TradeoffSandboxSection'
export type { TradeoffSandboxSectionProps } from './components/TradeoffSandboxSection'

export { FormulaSandboxSection, FormulaSandbox } from './components/FormulaSandboxSection'
export type { FormulaSandboxProps } from './components/FormulaSandboxSection'

export { DecisionTreeSection } from './components/DecisionTreeSection'
export type { DecisionTreeSectionProps } from './components/DecisionTreeSection'

// Component-level type aliases used by editor forms and embed adapter
export type { MetricDef } from './components/tradeoff-sandbox'

// Help modals
export { TradeoffHelpModal } from './components/tradeoff-sandbox/TradeoffHelpModal'
export { FormulaHelpModal } from './components/formula-sandbox/FormulaHelpModal'
export { DecisionTreeHelpModal } from './components/decision-tree/DecisionTreeHelpModal'

export type {
  TradeoffSandboxEvents,
  SliderValueChanged,
  MetricRecalculated,
  DecisionNodeSelected,
} from './events'
