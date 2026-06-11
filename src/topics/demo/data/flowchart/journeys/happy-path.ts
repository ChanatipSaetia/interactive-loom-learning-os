import type { FlowchartJourney } from '../../../../../sections/flowchart'

export const happyPathJourney: FlowchartJourney = {
  id: 'happy-path',
  label: 'Agentic Problem Solving Loop',
  description: 'Follow the execution plan as it transitions from the orchestrator through the LLM, resolves tools, and returns the response.',
  steps: [
    { nodeIds: ['user', 'evt_goal'], description: 'Goal Submitted — User submits: "Research top 3 competitors and summarise."' },
    { nodeIds: ['pol_plan', 'planner', 'orch_plan', 'memory', 'evt_plan_ready'], description: 'Cognition & Planning — Policy "Plan on New Goal" fires. "Create Plan" command handled by Orchestrator (Aggregate). Memory fetches context. Plan Generated event published.' },
    { nodeIds: ['tools', 'evt_tool_call'], description: 'Tool Selection — Policy "Execute Next Step" fires. Tool Selected event published.' },
    { nodeIds: ['executor', 'llm', 'evt_executed'], description: 'Action Execution — "Run Tool" command handled by LLM (External). Tool Executed event published.' },
    { nodeIds: ['pol_eval', 'evaluator', 'orch_eval', 'evt_done', 'output'], description: 'Evaluation (Happy Path) — Policy "Evaluate on Result" fires. "Evaluate Result" handled by Orchestrator. Goal Satisfied → Final Response delivered.' },
    { nodeIds: ['evt_fail', 'pol_retry', 'planner'], description: 'Failure Branch (Auto Re-Plan) — Goal Not Satisfied triggers "Re-Plan on Failure" policy, loops back to "Create Plan" command.' },
    { nodeIds: ['evt_fail', 'pol_escalate', 'cmd_review', 'human_reviewer', 'evt_reviewed'], description: 'Failure Branch (Human Review) — "Escalate to Human" policy fires. "Review Result" handled by Human Reviewer. Result Reviewed loops back to planning.' },
  ]
}
