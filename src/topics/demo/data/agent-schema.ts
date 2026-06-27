import { TYPES } from '../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../sections/flowchart'

/**
 * AGENT SCHEMA REFERENCE
 *
 * This schema serves as the reference for AI agents generating flowchart schemas.
 * Key conventions:
 *
 * - Set `root: true` on exactly ONE entity (the starting Command of the Event Storming flow)
 * - The root entity determines the entry point and chronological anchor for layout
 * - Commands flow left-to-right from the root; branching spreads vertically symmetrically
 * - Use `collapsedTo` to map duplicate aggregate/external references to a single canonical node
 * - Relations use `handledBy: true` for Command → Handler connections
 */

export const agentSchema: UnifiedFlowchartSchema = {
  entities: {
    // Actors
    'dev_user': {
      title: 'Developer (Initiator)',
      desc: 'The developer initiating instructions and goals.',
      type: TYPES.USER
    },

    'dev_user_feedback': {
      title: 'Developer (Feedback)',
      desc: 'The same developer providing feedback after being prompted.',
      type: TYPES.USER,
      collapsedTo: 'dev_user'
    },

    'qa_user': {
      title: 'QA Engineer',
      desc: 'The QA engineer reviewing results.',
      type: TYPES.USER
    },

    // Aggregates
    'orch_agent': {
      title: 'Agent Orchestrator',
      desc: 'Manages step coordination, memory updates, and loop state.',
      type: TYPES.AGGREGATE,
      stateMachine: {
        states: [
          { id: 'IDLE', label: 'Idle', color: 'var(--ctp-overlay1)' },
          { id: 'THINKING', label: 'Thinking', color: 'var(--ctp-blue)' },
          { id: 'EXECUTING_TOOL', label: 'Executing Tool', color: 'var(--ctp-green)' },
          { id: 'WAITING_FEEDBACK', label: 'Waiting Feedback', color: 'var(--ctp-peach)' },
          { id: 'COMPLETED', label: 'Completed', color: 'var(--ctp-teal)' }
        ],
        initialState: 'IDLE'
      },
    },
    'orch_plan_ref': {
      title: 'Orchestrator (Plan)',
      desc: 'Processes developer feedback and replans.',
      type: TYPES.AGGREGATE,
      collapsedTo: 'orch_agent'
    },
    'orch_qa_ref': {
      title: 'Orchestrator (QA)',
      desc: 'Processes QA review results.',
      type: TYPES.AGGREGATE,
      collapsedTo: 'orch_agent'
    },
    'orch_notify_ref': {
      title: 'Orchestrator (Notify)',
      desc: 'Handles sending messages to user interface.',
      type: TYPES.AGGREGATE,
      collapsedTo: 'orch_agent'
    },
    'tools_router': {
      title: 'Tools Router',
      desc: 'Handles command routing and executes operations.',
      type: TYPES.AGGREGATE
    },

    // Externals
    'llm_reason': {
      title: 'LLM (Reason)',
      desc: 'Generates execution plans and makes tool decisions.',
      type: TYPES.EXTERNAL
    },
    'llm_final': {
      title: 'LLM (Final)',
      desc: 'Synthesizes final answer from tool execution outputs.',
      type: TYPES.EXTERNAL,
      collapsedTo: 'llm_reason'
    },
    'mcp_servers': {
      title: 'MCP Servers',
      desc: 'Model Context Protocol servers providing structured tools.',
      type: TYPES.EXTERNAL
    },
    'subagents': {
      title: 'Subagent Pool',
      desc: 'Dynamic spawned subagents delegated to run isolated journeys concurrently.',
      type: TYPES.EXTERNAL
    },

    // Commands
    'cmd_run_agent': {
      title: 'Run Agent',
      desc: 'Trigger the agent orchestrator with custom user guidelines.',
      type: TYPES.COMMAND,
      root: true
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
    'cmd_call_mcp': {
      title: 'Call MCP',
      desc: 'Invoke MCP server tool with parameters from LLM.',
      type: TYPES.COMMAND
    },
    'cmd_provide_feedback': {
      title: 'Provide Feedback',
      desc: 'Same actor providing additional context or corrections.',
      type: TYPES.COMMAND
    },
    'cmd_complete': {
      title: 'Complete Task',
      desc: 'Compile tool execution logs and finalize user response.',
      type: TYPES.COMMAND
    },
    'cmd_review_result': {
      title: 'Review Result',
      desc: 'Different actor (QA) reviews the final output.',
      type: TYPES.COMMAND
    },
    'cmd_send_message': {
      title: 'Send Message',
      desc: 'System sends a message to the user asking for input or clarification.',
      type: TYPES.COMMAND
    },

    // Events
    'evt_started': {
      title: 'Agent Started',
      viewTitles: { DATA_FLOW: 'User Request' },
      desc: 'Task received, environment setup complete.',
      type: TYPES.EVENT
    },
    'evt_session_created': {
      title: 'Session Created',
      desc: 'A new agent session ID was allocated (multiple events from one command).',
      type: TYPES.EVENT
    },

    'evt_reasoned': {
      title: 'LLM Response Generated',
      viewTitles: { DATA_FLOW: 'Reasoning Output' },
      desc: 'Thinking thoughts and requested tool calls retrieved.',
      type: TYPES.EVENT
    },
    'evt_tool_executed': {
      title: 'Tool Executed',
      viewTitles: { DATA_FLOW: 'Tool Result' },
      desc: 'Result status and stdout output returned from execution.',
      type: TYPES.EVENT
    },
    'evt_mcp_called': {
      title: 'MCP Server Called',
      viewTitles: { DATA_FLOW: 'MCP Interaction' },
      desc: 'External API hit through MCP.',
      type: TYPES.EVENT
    },
    'evt_subagent_spawned': {
      title: 'Subagent Spawned',
      viewTitles: { DATA_FLOW: 'Subagent Dispatched' },
      desc: 'Background task delegated.',
      type: TYPES.EVENT
    },
    'evt_feedback_received': {
      title: 'Feedback Received',
      viewTitles: { DATA_FLOW: 'User Feedback' },
      desc: 'User provided new input to correct course.',
      type: TYPES.EVENT
    },
    'evt_done': {
      title: 'Task Completed',
      viewTitles: { DATA_FLOW: 'Final Answer' },
      desc: 'Agent finishes loops and returns the verified solution.',
      type: TYPES.EVENT
    },
    'evt_qa_approved': {
      title: 'QA Approved',
      viewTitles: { DATA_FLOW: 'Approval' },
      desc: 'The output passed QA standards.',
      type: TYPES.EVENT
    },
    'evt_qa_rejected': {
      title: 'QA Rejected',
      viewTitles: { DATA_FLOW: 'Rejection' },
      desc: 'The output failed QA standards.',
      type: TYPES.EVENT
    },
    'evt_message_sent': {
      title: 'Message Sent',
      viewTitles: { DATA_FLOW: 'User Prompted' },
      desc: 'User is notified and presented with input prompt.',
      type: TYPES.EVENT
    },

    // Policies
    'pol_notify_user': {
      title: 'Trigger User Notification',
      desc: 'Tool needs human input or threw an error requiring intervention.',
      type: TYPES.POLICY
    },
    'pol_plan': {
      title: 'Trigger Planning',
      desc: 'Load domain knowledge and query LLM on start or feedback.',
      type: TYPES.POLICY
    },
    'pol_route': {
      title: 'Trigger Tool Call',
      desc: 'Check if LLM requested a tool, execute if present.',
      type: TYPES.POLICY
    },
    'pol_mcp': {
      title: 'Trigger MCP Call',
      desc: 'LLM requested an MCP server tool, dispatch to MCP.',
      type: TYPES.POLICY
    },
    'pol_complete': {
      title: 'Trigger Completion',
      desc: 'Directly complete if LLM returns final answer.',
      type: TYPES.POLICY
    },
    'pol_eval': {
      title: 'Trigger Evaluation',
      desc: 'Send execution output back to LLM or wait for feedback.',
      type: TYPES.POLICY
    },
    'pol_qa_review': {
      title: 'Trigger QA Review',
      desc: 'When task completes, submit output for quality assurance review.',
      type: TYPES.POLICY
    }
  },
  relations: [
    // Start
    { id: 'r1', from: 'dev_user', to: 'cmd_run_agent', views: ['EVENT_STORMING'] },
    { id: 'r2', from: 'cmd_run_agent', to: 'orch_agent', handledBy: true, views: ['EVENT_STORMING'] },

    // One Command results in multiple events
    { id: 'r3', from: 'orch_agent', to: 'evt_started', views: ['EVENT_STORMING'] },
    { id: 'r4', from: 'orch_agent', to: 'evt_session_created', views: ['EVENT_STORMING'] },

    // Core Loop
    { id: 'r7', from: 'evt_started', to: 'pol_plan', views: ['EVENT_STORMING'] },
    { id: 'r8', from: 'evt_feedback_received', to: 'pol_plan', views: ['EVENT_STORMING'] },

    { id: 'r9', from: 'pol_plan', to: 'cmd_call_llm', views: ['EVENT_STORMING'] },
    { id: 'r10', from: 'cmd_call_llm', to: 'llm_reason', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r11', from: 'llm_reason', to: 'evt_reasoned', views: ['EVENT_STORMING'] },

    // Branching: Tool Route
    { id: 'r12', from: 'evt_reasoned', to: 'pol_route', views: ['EVENT_STORMING'], label: 'Needs Tool' },
    { id: 'r13', from: 'pol_route', to: 'cmd_execute_tool', views: ['EVENT_STORMING'] },
    { id: 'r14', from: 'cmd_execute_tool', to: 'tools_router', handledBy: true, views: ['EVENT_STORMING'] },

    // Branching: MCP Call
    { id: 'r12a', from: 'evt_reasoned', to: 'pol_mcp', views: ['EVENT_STORMING'], label: 'Needs MCP' },
    { id: 'r12b', from: 'pol_mcp', to: 'cmd_call_mcp', views: ['EVENT_STORMING'] },
    { id: 'r12c', from: 'cmd_call_mcp', to: 'mcp_servers', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r12d', from: 'mcp_servers', to: 'evt_mcp_called', views: ['EVENT_STORMING'] },

    // Tool interactions with Externals
    { id: 'r16', from: 'tools_router', to: 'subagents', views: ['EVENT_STORMING'] },

    // Events from tools and externals
    { id: 'r17', from: 'tools_router', to: 'evt_tool_executed', views: ['EVENT_STORMING'] },
    { id: 'r19', from: 'subagents', to: 'evt_subagent_spawned', views: ['EVENT_STORMING'] },

    { id: 'r20', from: 'evt_tool_executed', to: 'pol_eval', views: ['EVENT_STORMING'] },

    // Branching: Same actor feedback
    { id: 'r21', from: 'evt_tool_executed', to: 'pol_notify_user', views: ['EVENT_STORMING'], label: 'Needs Input' },
    { id: 'r21a', from: 'pol_notify_user', to: 'cmd_send_message', views: ['EVENT_STORMING'] },
    { id: 'r21b', from: 'cmd_send_message', to: 'orch_notify_ref', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r21c', from: 'orch_notify_ref', to: 'evt_message_sent', views: ['EVENT_STORMING'] },
    { id: 'r21d', from: 'evt_message_sent', to: 'dev_user_feedback', views: ['EVENT_STORMING'], label: 'Prompt User' },
    { id: 'r22', from: 'dev_user_feedback', to: 'cmd_provide_feedback', views: ['EVENT_STORMING'] },
    { id: 'r23', from: 'cmd_provide_feedback', to: 'orch_plan_ref', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r24', from: 'orch_plan_ref', to: 'evt_feedback_received', views: ['EVENT_STORMING'] },

    // Branching: Direct Completion
    { id: 'r25', from: 'evt_reasoned', to: 'pol_complete', views: ['EVENT_STORMING'], label: 'Final Answer' },

    // Converge to Complete
    { id: 'r26', from: 'pol_eval', to: 'cmd_complete', views: ['EVENT_STORMING'] },
    { id: 'r27', from: 'pol_complete', to: 'cmd_complete', views: ['EVENT_STORMING'] },

    { id: 'r28', from: 'cmd_complete', to: 'llm_final', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r29', from: 'llm_final', to: 'evt_done', views: ['EVENT_STORMING'] },

    // Different Actor: QA Review
    { id: 'r30', from: 'evt_done', to: 'pol_qa_review', views: ['EVENT_STORMING'] },
    { id: 'r30a', from: 'pol_qa_review', to: 'cmd_review_result', views: ['EVENT_STORMING'] },
    { id: 'r30b', from: 'cmd_review_result', to: 'orch_qa_ref', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r30c', from: 'cmd_review_result', to: 'qa_user', views: ['EVENT_STORMING'], label: 'Ready for QA' },

    // Branching at QA
    { id: 'r33', from: 'orch_qa_ref', to: 'evt_qa_approved', views: ['EVENT_STORMING'], label: 'Approve' },
    { id: 'r34', from: 'orch_qa_ref', to: 'evt_qa_rejected', views: ['EVENT_STORMING'], label: 'Reject' }
  ],
  journeys: [
    {
      id: 'happy-path',
      label: 'Happy Path',
      description: 'Agent uses tools successfully and passes QA.',
      steps: [
        { nodeIds: ['dev_user', 'cmd_run_agent', 'orch_agent', 'evt_started', 'evt_session_created'], description: 'Dev requests task. Multiple events generated.' },
        { nodeIds: ['pol_plan', 'cmd_call_llm', 'llm_reason', 'evt_reasoned'], description: 'LLM reasons about task.', processGroup: 'planning' },
        { nodeIds: ['pol_route', 'cmd_execute_tool', 'tools_router', 'subagents', 'evt_subagent_spawned', 'evt_tool_executed'], description: 'Tools execute successfully, spawning subagents.', processGroup: 'execution' },
        { nodeIds: ['pol_mcp', 'cmd_call_mcp', 'mcp_servers', 'evt_mcp_called'], description: 'MCP server called.', processGroup: 'execution' },
        { nodeIds: ['pol_eval', 'cmd_complete', 'llm_final', 'evt_done'], description: 'LLM compiles final answer.', processGroup: 'evaluation' },
        { nodeIds: ['pol_qa_review', 'cmd_review_result', 'qa_user', 'orch_qa_ref', 'evt_qa_approved'], description: 'Task submitted for QA review; QA approves.' }
      ]
    },
    {
      id: 'feedback-loop',
      label: 'Feedback Loop',
      description: 'Agent needs more info from same actor.',
      steps: [
        { nodeIds: ['pol_route', 'cmd_execute_tool', 'tools_router', 'evt_tool_executed'], description: 'Tool returns an error or asks user for input.', processGroup: 'execution' },
        { nodeIds: ['pol_notify_user', 'cmd_send_message', 'orch_notify_ref', 'evt_message_sent'], description: 'System sends message to user.' },
        { nodeIds: ['dev_user_feedback', 'cmd_provide_feedback', 'orch_plan_ref', 'evt_feedback_received'], description: 'Dev provides missing info.' },
        { nodeIds: ['evt_feedback_received', 'pol_plan', 'cmd_call_llm', 'llm_reason', 'evt_reasoned'], description: 'Agent replans with new context.', processGroup: 'planning' }
      ]
    },
    {
      id: 'direct-llm',
      label: 'Direct LLM Answer',
      description: 'No tools needed.',
      steps: [
        { nodeIds: ['evt_reasoned', 'pol_complete', 'cmd_complete', 'llm_final', 'evt_done'], description: 'LLM skips tools and directly answers.', processGroup: 'evaluation' }
      ]
    }
  ]
}
