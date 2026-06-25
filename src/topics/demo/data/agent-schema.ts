import { TYPES } from '../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../sections/flowchart'

export const agentSchema: UnifiedFlowchartSchema = {
  entities: {
    'user': {
      title: 'User',
      desc: 'The human client initiating instructions and goals.',
      type: TYPES.USER
    },
    'orchestrator': {
      title: 'Orchestrator',
      desc: 'Core agent runtime owning the planning and coordination loops.',
      type: TYPES.AGGREGATE,
      refs: ['orch_agent', 'orch_plan_ref'],
      stateMachine: {
        states: [
          { id: 'IDLE', label: 'Idle', color: '#838ba7' },
          { id: 'THINKING', label: 'Thinking', color: '#8caaee' },
          { id: 'EXECUTING_TOOL', label: 'Executing Tool', color: '#a6d189' },
          { id: 'DELEGATING', label: 'Delegating', color: '#e5c890' },
          { id: 'COMPLETED', label: 'Completed', color: '#81c8be' }
        ],
        initialState: 'IDLE'
      },
    },
    'orch_agent': {
      title: 'Agent Orchestrator',
      desc: 'Manages step coordination, memory updates, and loop state.',
      type: TYPES.AGGREGATE,
      collapsedTo: 'orchestrator'
    },
    'orch_plan_ref': {
      title: 'Agent Orchestrator',
      desc: 'Generates plans using loaded skills.',
      type: TYPES.AGGREGATE,
      collapsedTo: 'orchestrator'
    },
    'filesystem': {
      title: 'Filesystem',
      desc: 'Stores local instructions, skill definitions, and domain knowledge.',
      type: TYPES.DATABASE,
    },
    'llm': {
      title: 'LLM Engine',
      desc: 'Generates plans, reasons about data, and makes tool-use decisions.',
      type: TYPES.EXTERNAL,
      refs: ['llm_reason_ref', 'llm_final_ref']
    },
    'llm_reason_ref': {
      title: 'LLM Engine',
      desc: 'Generates execution plans and makes tool decisions.',
      type: TYPES.EXTERNAL,
      collapsedTo: 'llm'
    },
    'llm_final_ref': {
      title: 'LLM Engine',
      desc: 'Synthesizes final answer from tool execution outputs.',
      type: TYPES.EXTERNAL,
      collapsedTo: 'llm'
    },
    'tools': {
      title: 'Tools Router',
      desc: 'Dispatches task executions to local filesystem scripts, subagents, or external APIs.',
      type: TYPES.AGGREGATE,
      refs: ['tools_ref']
    },
    'tools_ref': {
      title: 'Tools Router',
      desc: 'Handles command routing and executes operations.',
      type: TYPES.AGGREGATE,
      collapsedTo: 'tools'
    },
    'mcp_servers': {
      title: 'MCP Servers',
      desc: 'Model Context Protocol servers providing structured tools like search, database access, or terminal command runners.',
      type: TYPES.EXTERNAL
    },
    'subagents': {
      title: 'Subagent Pool',
      desc: 'Dynamic spawned subagents delegated to run isolated journeys concurrently.',
      type: TYPES.EXTERNAL
    },
    'cmd_run_agent': {
      title: 'Run Agent',
      desc: 'Trigger the agent orchestrator with custom user guidelines.',
      type: TYPES.COMMAND
    },
    'cmd_call_llm': {
      title: 'Call LLM',
      desc: 'Request completion using current chat logs, skills, and history.',
      type: TYPES.COMMAND
    },
    'cmd_execute_tool': {
      title: 'Execute Tool',
      desc: 'Dispatch execution to the appropriate tool script or subagent.',
      type: TYPES.COMMAND
    },
    'cmd_complete': {
      title: 'Complete Task',
      desc: 'Compile tool execution logs and finalize user response.',
      type: TYPES.COMMAND
    },
    'evt_started': {
      title: 'Agent Started',
      viewTitles: { DATA_FLOW: 'User Request' },
      desc: 'Task received, environment setup complete.',
      type: TYPES.EVENT,
      jsonPayload: {
        type: 'agent_start',
        payload: {
          taskId: 'task_001',
          prompt: 'Solve the coding task using search and run tests.'
        }
      }
    },
    'evt_reasoned': {
      title: 'LLM Response Generated',
      viewTitles: { DATA_FLOW: 'Reasoning Output' },
      desc: 'Thinking thoughts and requested tool calls retrieved.',
      type: TYPES.EVENT,
      jsonPayload: {
        type: 'llm_completion',
        payload: {
          thinking: 'I need to check the files first before editing.',
          toolCalls: [
            { name: 'view_file', args: { path: 'src/main.ts' } }
          ]
        }
      }
    },
    'evt_tool_executed': {
      title: 'Tool Executed',
      viewTitles: { DATA_FLOW: 'Tool Result' },
      desc: 'Result status and stdout output returned from execution.',
      type: TYPES.EVENT,
      jsonPayload: {
        type: 'tool_output',
        payload: {
          status: 'success',
          data: 'File view successful, line 10 contains export...'
        }
      }
    },
    'evt_done': {
      title: 'Task Completed',
      viewTitles: { DATA_FLOW: 'Final Answer' },
      desc: 'Agent finishes loops and returns the verified solution to user.',
      type: TYPES.EVENT,
      jsonPayload: {
        type: 'agent_completion',
        payload: {
          result: 'All edits made, tests are passing.',
          status: 'success'
        }
      }
    },
    'pol_plan': {
      title: 'Trigger Planning',
      desc: 'Load domain knowledge and query LLM on start.',
      type: TYPES.POLICY
    },
    'pol_route': {
      title: 'Trigger Tool Call',
      desc: 'Check if LLM requested a tool, execute if present.',
      type: TYPES.POLICY
    },
    'pol_eval': {
      title: 'Trigger Evaluation',
      desc: 'Send execution output back to LLM to decide next action.',
      type: TYPES.POLICY
    }
  },
  relations: [
    { id: 'r1', from: 'user', to: 'cmd_run_agent', views: ['EVENT_STORMING'] },
    { id: 'r2', from: 'cmd_run_agent', to: 'orch_agent', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r3', from: 'orch_agent', to: 'filesystem', views: ['EVENT_STORMING'] },
    { id: 'r4', from: 'orch_agent', to: 'evt_started', views: ['EVENT_STORMING'] },
    { id: 'r5', from: 'evt_started', to: 'pol_plan', views: ['EVENT_STORMING'] },
    { id: 'r6', from: 'pol_plan', to: 'cmd_call_llm', views: ['EVENT_STORMING'] },
    { id: 'r7', from: 'cmd_call_llm', to: 'llm_reason_ref', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r8', from: 'llm_reason_ref', to: 'evt_reasoned', views: ['EVENT_STORMING'] },
    { id: 'r9', from: 'evt_reasoned', to: 'pol_route', views: ['EVENT_STORMING'] },
    { id: 'r10', from: 'pol_route', to: 'cmd_execute_tool', views: ['EVENT_STORMING'] },
    { id: 'r11', from: 'cmd_execute_tool', to: 'tools_ref', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r12', from: 'tools_ref', to: 'mcp_servers', views: ['EVENT_STORMING'] },
    { id: 'r13', from: 'tools_ref', to: 'subagents', views: ['EVENT_STORMING'] },
    { id: 'r14', from: 'tools_ref', to: 'evt_tool_executed', views: ['EVENT_STORMING'] },
    { id: 'r15', from: 'evt_tool_executed', to: 'pol_eval', views: ['EVENT_STORMING'] },
    { id: 'r16', from: 'pol_eval', to: 'cmd_complete', views: ['EVENT_STORMING'] },
    { id: 'r17', from: 'cmd_complete', to: 'llm_final_ref', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r18', from: 'llm_final_ref', to: 'evt_done', views: ['EVENT_STORMING'] },
    { id: 'r19', from: 'evt_done', to: 'user', views: ['EVENT_STORMING'] }
  ],
  views: {
    EVENT_STORMING: {
      name: 'Event Storming',
      icon: 'Component',
      nodes: [
        { id: 'user', grid: [0, 2] },
        { id: 'cmd_run_agent', grid: [1, 2] },
        { id: 'orch_agent', grid: [1, 1] },
        { id: 'filesystem', grid: [1, 0] },
        { id: 'evt_started', grid: [2, 2] },
        // GAP at Column 3
        { id: 'pol_plan', grid: [4, 2] },
        { id: 'cmd_call_llm', grid: [5, 2] },
        { id: 'llm_reason_ref', grid: [5, 1] },
        { id: 'evt_reasoned', grid: [6, 2] },
        // GAP at Column 7
        { id: 'pol_route', grid: [8, 2] },
        { id: 'cmd_execute_tool', grid: [9, 2] },
        { id: 'tools_ref', grid: [9, 1] },
        { id: 'mcp_servers', grid: [9, 0] },
        { id: 'subagents', grid: [9, 3] },
        { id: 'evt_tool_executed', grid: [10, 2] },
        // GAP at Column 11
        { id: 'pol_eval', grid: [12, 2] },
        { id: 'cmd_complete', grid: [13, 2] },
        { id: 'llm_final_ref', grid: [13, 1] },
        { id: 'evt_done', grid: [14, 2] }
      ],
      groups: [
        { id: 'g1', title: 'Agent Core Ingestion', desc: 'Sets up task and parses skills & instructions.', nodeIds: ['user', 'cmd_run_agent', 'orch_agent', 'filesystem', 'evt_started'], color: 'rgba(140, 170, 238, 0.12)', borderColor: '#8caaee', textColor: '#c6d0f5' },
        { id: 'g2', title: 'Cognition & Actions Loop', desc: 'Evaluates logic with LLM and runs tools via MCP servers or subagents.', nodeIds: ['pol_plan', 'cmd_call_llm', 'llm_reason_ref', 'evt_reasoned', 'pol_route', 'cmd_execute_tool', 'tools_ref', 'mcp_servers', 'subagents', 'evt_tool_executed', 'pol_eval', 'cmd_complete', 'llm_final_ref', 'evt_done'], color: 'rgba(244, 184, 228, 0.12)', borderColor: '#f4b8e4', textColor: '#c6d0f5' }
      ]
    }
  },
  journeys: [
    {
      id: 'agent-tool-use-loop',
      label: 'Agent-Subagent MCP Loop',
      description: 'Follow the flow of running the agent, loading filesystem knowledge, calling the LLM, executing MCP server tools, delegating to subagents, and returning final answers.',
      steps: [
        { nodeIds: ['user', 'cmd_run_agent', 'orch_agent', 'filesystem', 'evt_started'], description: 'Agent Started — User requests task; Agent loads skills from the Filesystem.' },
        { nodeIds: ['pol_plan', 'cmd_call_llm', 'llm_reason_ref', 'evt_reasoned'], description: 'Thinking — Agent triggers planning; calls LLM to choose actions and tool targets.', processGroup: 'planning' },
        { nodeIds: ['pol_route', 'cmd_execute_tool', 'tools_ref', 'mcp_servers', 'subagents', 'evt_tool_executed'], description: 'Tool Use — Agent executes tool commands, utilizing MCP Servers or delegating tasks to Subagents.', processGroup: 'execution' },
        { nodeIds: ['pol_eval', 'cmd_complete', 'llm_final_ref', 'evt_done'], description: 'Task Completion — LLM verifies results and returns the successful solution to the User.', processGroup: 'evaluation' }
      ]
    }
  ]
}
