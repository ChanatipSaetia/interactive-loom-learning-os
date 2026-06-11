import { TYPES } from '../../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../../sections/flowchart'

export const entities: UnifiedFlowchartSchema['entities'] = {
  'user': {
    title: 'User',
    desc: 'The human (or client system) initiating goals or receiving results.',
    viewTypes: {
      EVENT_STORMING: TYPES.USER,
      SYS_ARCH: TYPES.USER,
      DATA_FLOW: TYPES.USER,
      SWIMLANES: TYPES.USER,
    }
  },
  'orchestrator': {
    title: 'Orchestrator',
    desc: 'Coordinating component running the core planning and execution loops.',
    viewTypes: {
      SYS_ARCH: TYPES.SERVICE,
      DATA_FLOW: TYPES.SERVICE,
      SWIMLANES: TYPES.SERVICE,
    }
  },
  'orch_plan': {
    title: 'Orchestrator',
    desc: 'Handles planning: creates execution plan, tracks progression, retrieves memory.',
    viewTypes: { EVENT_STORMING: TYPES.AGGREGATE }
  },
  'orch_eval': {
    title: 'Orchestrator',
    desc: 'Handles evaluation: assesses result quality, decides pass or fail.',
    viewTypes: { EVENT_STORMING: TYPES.AGGREGATE }
  },
  'planner': {
    title: 'Create Plan',
    desc: 'Formulates multi-step actions (e.g. CoT, ReAct plan) dynamically.',
    viewTypes: {
      EVENT_STORMING: TYPES.COMMAND,
      SYS_ARCH: TYPES.SERVICE,
      DATA_FLOW: TYPES.PROCESS,
      SWIMLANES: TYPES.PROCESS,
    }
  },
  'memory': {
    title: 'Memory Storage',
    desc: 'Retrieves conversational logs and semantic vectors (long-term database).',
    viewTypes: {
      EVENT_STORMING: TYPES.DATABASE,
      SYS_ARCH: TYPES.DATABASE,
      DATA_FLOW: TYPES.DATABASE,
      SWIMLANES: TYPES.DATABASE,
    }
  },
  'tools': {
    title: 'Execute Next Step',
    desc: 'Selects appropriate external APIs or scripts for a given task.',
    viewTypes: {
      EVENT_STORMING: TYPES.POLICY,
      SYS_ARCH: TYPES.SERVICE,
      DATA_FLOW: TYPES.PROCESS,
      SWIMLANES: TYPES.PROCESS,
    }
  },
  'llm': {
    title: 'LLM Engine',
    desc: 'Large language model performing prompt parsing and reasoning.',
    viewTypes: {
      EVENT_STORMING: TYPES.EXTERNAL,
      SYS_ARCH: TYPES.EXTERNAL,
      DATA_FLOW: TYPES.EXTERNAL,
      SWIMLANES: TYPES.EXTERNAL,
    }
  },
  'executor': {
    title: 'Run Tool',
    desc: 'Executes actions (HTTP search, sandboxed script, API requests).',
    viewTypes: {
      EVENT_STORMING: TYPES.COMMAND,
      SYS_ARCH: TYPES.SERVICE,
      DATA_FLOW: TYPES.PROCESS,
      SWIMLANES: TYPES.PROCESS,
    }
  },
  'evaluator': {
    title: 'Evaluate Result',
    desc: 'Tests execution outputs against success conditions.',
    viewTypes: {
      EVENT_STORMING: TYPES.COMMAND,
      SYS_ARCH: TYPES.SERVICE,
      DATA_FLOW: TYPES.DECISION,
      SWIMLANES: TYPES.DECISION,
    }
  },
  'output': {
    title: 'Final Response',
    desc: 'The verified markdown output returned to the caller.',
    viewTypes: {
      EVENT_STORMING: TYPES.DATA_OBJECT,
      SYS_ARCH: TYPES.DATA_OBJECT,
      DATA_FLOW: TYPES.DATA_OBJECT,
      SWIMLANES: TYPES.DATA_OBJECT,
    }
  },
  'evt_goal': {
    title: 'Goal Submitted',
    desc: 'User submitted a natural-language goal.',
    viewTypes: { EVENT_STORMING: TYPES.EVENT }
  },
  'pol_plan': {
    title: 'Plan on New Goal',
    desc: 'When Goal Submitted, create an execution plan.',
    viewTypes: { EVENT_STORMING: TYPES.POLICY }
  },
  'evt_plan_ready': {
    title: 'Plan Generated',
    desc: 'Multi-step execution plan written to working memory.',
    viewTypes: { EVENT_STORMING: TYPES.EVENT }
  },
  'evt_tool_call': {
    title: 'Tool Selected',
    desc: 'Router selected tool and arguments.',
    viewTypes: { EVENT_STORMING: TYPES.EVENT }
  },
  'evt_executed': {
    title: 'Tool Executed',
    desc: 'Output retrieved from sandbox execution.',
    viewTypes: { EVENT_STORMING: TYPES.EVENT }
  },
  'pol_eval': {
    title: 'Evaluate on Result',
    desc: 'When Tool Executed, evaluate the output.',
    viewTypes: { EVENT_STORMING: TYPES.POLICY }
  },
  'evt_done': {
    title: 'Goal Satisfied',
    desc: 'Evaluation passes, ready to reply.',
    viewTypes: { EVENT_STORMING: TYPES.EVENT }
  },
  'evt_fail': {
    title: 'Goal Not Satisfied',
    desc: 'Evaluation fails, requiring re-planning.',
    viewTypes: { EVENT_STORMING: TYPES.EVENT }
  },
  'pol_retry': {
    title: 'Re-Plan on Failure',
    desc: 'When Goal Not Satisfied, re-plan and try again.',
    viewTypes: { EVENT_STORMING: TYPES.POLICY }
  },
  'pol_escalate': {
    title: 'Escalate to Human',
    desc: 'When Goal Not Satisfied, escalate to human reviewer.',
    viewTypes: { EVENT_STORMING: TYPES.POLICY }
  },
  'human_reviewer': {
    title: 'Human Reviewer',
    desc: 'Subject-matter expert who reviews failed evaluation results.',
    viewTypes: { EVENT_STORMING: TYPES.USER }
  },
  'cmd_review': {
    title: 'Review Result',
    desc: 'Human reviews the failed output and provides feedback.',
    viewTypes: { EVENT_STORMING: TYPES.COMMAND }
  },
  'evt_reviewed': {
    title: 'Result Reviewed',
    desc: 'Human feedback captured, ready for re-planning.',
    viewTypes: { EVENT_STORMING: TYPES.EVENT }
  },
}
