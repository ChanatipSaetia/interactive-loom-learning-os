import type { FlowchartJourney } from '../../../../../../sections/flowchart'

// Works for SYS_ARCH view — uses SYS_ARCH entity IDs
export const defenseJourney: FlowchartJourney = {
  id: 'defense-in-depth',
  label: 'Defense-in-Depth (Layers)',
  description: 'Follow how a tool call passes through each runtime control layer before reaching business systems.',
  steps: [
    {
      nodeIds: ['agent', 'api_contract'],
      description: 'Tool Call → API Contract — The agent attempts a tool call. API contracts validate which APIs are permissible.',
    },
    {
      nodeIds: ['permission'],
      description: 'Permission Scoping — Read vs write access is checked per workflow scope.',
    },
    {
      nodeIds: ['sandbox'],
      description: 'Reasoning Sandbox — Proposed action is dry-run against policy before execution.',
    },
    {
      nodeIds: ['business_system'],
      description: 'Business Systems — If all layers pass, the action reaches the CRM, ERP, or database.',
    },
    {
      nodeIds: ['monitor', 'kill_switch'],
      description: 'Detection & Response — Anomaly monitor watches for drift. Kill switch halts the agent on threshold breach.',
    },
  ],
}
