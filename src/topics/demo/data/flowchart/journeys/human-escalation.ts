import type { FlowchartJourney } from '../../../../../sections/flowchart'

export const humanEscalationJourney: FlowchartJourney = {
  id: 'human-escalation',
  label: 'Human-in-the-Loop Escalation',
  description: 'Trace the path when tool execution fails repeatedly and policy escalates to human intervention.',
  steps: [
    { nodeIds: ['user', 'evt_goal'], description: 'Goal Submitted — User submits a complex task requiring human verification.' },
    { nodeIds: ['pol_plan', 'planner', 'orch_plan'], description: 'Initial Planning — Planner creates execution steps; Orchestrator registers plan.' },
    { nodeIds: ['executor', 'llm', 'evt_fail'], description: 'Execution Failure — Tool run fails or produces inconsistent output, emitting a Failure event.' },
    { nodeIds: ['pol_escalate', 'cmd_review', 'human_reviewer'], description: 'Human Escalation — System triggers the human-in-the-loop policy and dispatches a review command to the human reviewer.' },
    { nodeIds: ['human_reviewer', 'evt_reviewed', 'pol_plan'], description: 'Human Decision & Recovery — Human reviewer corrects the instruction, emitting a Reviewed event to resume planning.' },
  ]
}
