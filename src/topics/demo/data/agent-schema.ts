import { TYPES } from '../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../sections/flowchart'

export const agentSchema: UnifiedFlowchartSchema = {
  entities: {
    // Actors
    'dev_user': {
      title: 'Developer',
      desc: 'The developer initiating instructions and goals.',
      type: TYPES.USER,
      refs: ['dev_user_ref']
    },
    'dev_user_ref': {
      title: 'Developer',
      desc: 'The same developer providing feedback.',
      type: TYPES.USER,
      collapsedTo: 'dev_user'
    },

    'qa_user': {
      title: 'QA Engineer',
      desc: 'The QA engineer reviewing results.',
      type: TYPES.USER
    },

    // Aggregates
    'orchestrator': {
      title: 'Orchestrator',
      desc: 'Core agent runtime owning the planning and coordination loops.',
      type: TYPES.AGGREGATE,
      refs: ['orch_agent', 'orch_plan_ref', 'orch_qa_ref', 'orch_notify_ref'],
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
    'orch_agent': {
      title: 'Agent Orchestrator',
      desc: 'Manages step coordination, memory updates, and loop state.',
      type: TYPES.AGGREGATE,
      collapsedTo: 'orchestrator'
    },
    'orch_plan_ref': {
      title: 'Agent Orchestrator',
      desc: 'Processes developer feedback.',
      type: TYPES.AGGREGATE,
      collapsedTo: 'orchestrator'
    },
    'orch_qa_ref': {
      title: 'Agent Orchestrator',
      desc: 'Processes QA review.',
      type: TYPES.AGGREGATE,
      collapsedTo: 'orchestrator'
    },
    'orch_notify_ref': {
      title: 'Agent Orchestrator',
      desc: 'Handles sending messages to user interface.',
      type: TYPES.AGGREGATE,
      collapsedTo: 'orchestrator'
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

    // DBs & Externals
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
    'evt_fs_read': {
      title: 'Filesystem Read',
      viewTitles: { DATA_FLOW: 'FS Context Loaded' },
      desc: 'Domain knowledge and skills loaded from Database.',
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
    'pol_complete': {
      title: 'Trigger Completion',
      desc: 'Directly complete if LLM returns final answer.',
      type: TYPES.POLICY
    },
    'pol_eval': {
      title: 'Trigger Evaluation',
      desc: 'Send execution output back to LLM or wait for feedback.',
      type: TYPES.POLICY
    }
  },
  relations: [
    // Start
    { id: 'r1', from: 'dev_user', to: 'cmd_run_agent', views: ['EVENT_STORMING'] },
    { id: 'r2', from: 'cmd_run_agent', to: 'orch_agent', handledBy: true, views: ['EVENT_STORMING'] },
    
    // One Command results in multiple events (Requirement #5)
    { id: 'r3', from: 'orch_agent', to: 'evt_started', views: ['EVENT_STORMING'] },
    { id: 'r4', from: 'orch_agent', to: 'evt_session_created', views: ['EVENT_STORMING'] },
    
    // DB interaction
    { id: 'r5', from: 'orch_agent', to: 'filesystem', views: ['EVENT_STORMING'] },
    { id: 'r6', from: 'filesystem', to: 'evt_fs_read', views: ['EVENT_STORMING'] }, // DB Event (Requirement #1)
    
    // Core Loop
    { id: 'r7', from: 'evt_started', to: 'pol_plan', views: ['EVENT_STORMING'] },
    { id: 'r8', from: 'evt_feedback_received', to: 'pol_plan', views: ['EVENT_STORMING'] },
    
    { id: 'r9', from: 'pol_plan', to: 'cmd_call_llm', views: ['EVENT_STORMING'] },
    { id: 'r10', from: 'cmd_call_llm', to: 'llm_reason_ref', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r11', from: 'llm_reason_ref', to: 'evt_reasoned', views: ['EVENT_STORMING'] }, // External Event (Requirement #1)
    
    // Branching: Tool Route (Requirement #2)
    { id: 'r12', from: 'evt_reasoned', to: 'pol_route', views: ['EVENT_STORMING'], label: 'Needs Tool' },
    { id: 'r13', from: 'pol_route', to: 'cmd_execute_tool', views: ['EVENT_STORMING'] },
    { id: 'r14', from: 'cmd_execute_tool', to: 'tools_ref', handledBy: true, views: ['EVENT_STORMING'] },
    
    // Tool interactions with Externals
    { id: 'r15', from: 'tools_ref', to: 'mcp_servers', views: ['EVENT_STORMING'] },
    { id: 'r16', from: 'tools_ref', to: 'subagents', views: ['EVENT_STORMING'] },
    
    // Events from tools and externals (Requirement #1)
    { id: 'r17', from: 'tools_ref', to: 'evt_tool_executed', views: ['EVENT_STORMING'] },
    { id: 'r18', from: 'mcp_servers', to: 'evt_mcp_called', views: ['EVENT_STORMING'] },
    { id: 'r19', from: 'subagents', to: 'evt_subagent_spawned', views: ['EVENT_STORMING'] },

    { id: 'r20', from: 'evt_tool_executed', to: 'pol_eval', views: ['EVENT_STORMING'] },
    
    // Branching: Same actor feedback (Requirement #3)
    { id: 'r21', from: 'evt_tool_executed', to: 'pol_notify_user', views: ['EVENT_STORMING'], label: 'Needs Input' },
    { id: 'r21a', from: 'pol_notify_user', to: 'cmd_send_message', views: ['EVENT_STORMING'] },
    { id: 'r21b', from: 'cmd_send_message', to: 'orch_notify_ref', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r21c', from: 'orch_notify_ref', to: 'evt_message_sent', views: ['EVENT_STORMING'] },
    { id: 'r21d', from: 'evt_message_sent', to: 'dev_user_ref', views: ['EVENT_STORMING'], label: 'Prompt User' },
    { id: 'r22', from: 'dev_user_ref', to: 'cmd_provide_feedback', views: ['EVENT_STORMING'] },
    { id: 'r23', from: 'cmd_provide_feedback', to: 'orch_plan_ref', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r24', from: 'orch_plan_ref', to: 'evt_feedback_received', views: ['EVENT_STORMING'] },

    // Branching: Direct Completion (Requirement #2)
    { id: 'r25', from: 'evt_reasoned', to: 'pol_complete', views: ['EVENT_STORMING'], label: 'Final Answer' },
    
    // Converge to Complete
    { id: 'r26', from: 'pol_eval', to: 'cmd_complete', views: ['EVENT_STORMING'] },
    { id: 'r27', from: 'pol_complete', to: 'cmd_complete', views: ['EVENT_STORMING'] },
    
    { id: 'r28', from: 'cmd_complete', to: 'llm_final_ref', handledBy: true, views: ['EVENT_STORMING'] },
    { id: 'r29', from: 'llm_final_ref', to: 'evt_done', views: ['EVENT_STORMING'] },


    // Different Actor: QA Review (Requirement #4)
    { id: 'r30', from: 'evt_done', to: 'qa_user', views: ['EVENT_STORMING'], label: 'Ready for QA' },
    { id: 'r31', from: 'qa_user', to: 'cmd_review_result', views: ['EVENT_STORMING'] },
    { id: 'r32', from: 'cmd_review_result', to: 'orch_qa_ref', handledBy: true, views: ['EVENT_STORMING'] },
    
    // Branching at QA
    { id: 'r33', from: 'orch_qa_ref', to: 'evt_qa_approved', views: ['EVENT_STORMING'], label: 'Approve' },
    { id: 'r34', from: 'orch_qa_ref', to: 'evt_qa_rejected', views: ['EVENT_STORMING'], label: 'Reject' }
  ],
  views: {
    EVENT_STORMING: {
      name: 'Event Storming',
      icon: 'Component',
      nodes: [
        { id: 'dev_user', grid: [0, 1] },
        { id: 'cmd_run_agent', grid: [1, 1] },
        { id: 'orch_agent', grid: [2, 1] },
        { id: 'filesystem', grid: [2, 0] },
        
        { id: 'evt_started', grid: [3, 1] },
        { id: 'evt_session_created', grid: [3, 2] },
        { id: 'evt_fs_read', grid: [3, 0] },
        
        { id: 'pol_plan', grid: [4, 1] },
        { id: 'cmd_call_llm', grid: [5, 1] },
        { id: 'llm_reason_ref', grid: [6, 1] },
        { id: 'evt_reasoned', grid: [7, 1] },
        
        // Branch A: Tools
        { id: 'pol_route', grid: [8, 0] },
        { id: 'cmd_execute_tool', grid: [9, 0] },
        { id: 'tools_ref', grid: [10, 0] },
        { id: 'mcp_servers', grid: [10, -1] },
        { id: 'subagents', grid: [10, -2] },
        
        { id: 'evt_tool_executed', grid: [11, 0] },
        { id: 'evt_mcp_called', grid: [11, -1] },
        { id: 'evt_subagent_spawned', grid: [11, -2] },
        
        { id: 'pol_eval', grid: [12, 0] },
        
        // Same Actor feedback
        { id: 'pol_notify_user', grid: [12, 2] },
        { id: 'cmd_send_message', grid: [13, 2] },
        { id: 'orch_notify_ref', grid: [14, 2] },
        { id: 'evt_message_sent', grid: [15, 2] },

        { id: 'dev_user_ref', grid: [15, 2] },
        { id: 'cmd_provide_feedback', grid: [16, 2] },
        { id: 'orch_plan_ref', grid: [17, 2] },
        { id: 'evt_feedback_received', grid: [18, 2] },

        // Branch B: Direct Complete
        { id: 'pol_complete', grid: [8, 3] },
        
        // Completion
        { id: 'cmd_complete', grid: [13, 1] },
        { id: 'llm_final_ref', grid: [14, 1] },
        { id: 'evt_done', grid: [15, 1] },

        
        // QA
        { id: 'qa_user', grid: [16, 1] },
        { id: 'cmd_review_result', grid: [17, 1] },
        { id: 'orch_qa_ref', grid: [18, 1] },
        { id: 'evt_qa_approved', grid: [19, 0] },
        { id: 'evt_qa_rejected', grid: [19, 2] }
      ],
      groups: [
        { id: 'g1', title: 'Initialization', desc: 'Sets up task and context.', nodeIds: ['dev_user', 'cmd_run_agent', 'orch_agent', 'filesystem', 'evt_started', 'evt_session_created', 'evt_fs_read'], color: 'rgba(140, 170, 238, 0.12)', borderColor: 'var(--ctp-blue)', textColor: 'var(--ctp-text)' },
        { id: 'g2', title: 'Cognition & Actions Loop', desc: 'LLM reasoning and branching.', nodeIds: ['pol_plan', 'cmd_call_llm', 'llm_reason_ref', 'evt_reasoned', 'pol_route', 'cmd_execute_tool', 'tools_ref', 'mcp_servers', 'subagents', 'evt_tool_executed', 'evt_mcp_called', 'evt_subagent_spawned', 'pol_eval'], color: 'rgba(244, 184, 228, 0.12)', borderColor: 'var(--ctp-pink)', textColor: 'var(--ctp-text)' },
        { id: 'g3', title: 'Feedback & Completion', desc: 'User feedback loop and final output generation.', nodeIds: ['pol_notify_user', 'cmd_send_message', 'orch_notify_ref', 'evt_message_sent', 'dev_user_ref', 'cmd_provide_feedback', 'orch_plan_ref', 'evt_feedback_received', 'pol_complete', 'cmd_complete', 'llm_final_ref', 'evt_done'], color: 'rgba(166, 218, 149, 0.12)', borderColor: 'var(--ctp-green)', textColor: 'var(--ctp-text)' },
        { id: 'g4', title: 'QA Review', desc: 'Different actor reviews the result.', nodeIds: ['qa_user', 'cmd_review_result', 'orch_qa_ref', 'evt_qa_approved', 'evt_qa_rejected'], color: 'rgba(237, 135, 150, 0.12)', borderColor: 'var(--ctp-red)', textColor: 'var(--ctp-text)' }
      ]
    }
  },
  journeys: [
    {
      id: 'happy-path',
      label: 'Happy Path',
      description: 'Agent uses tools successfully and passes QA.',
      steps: [
        { nodeIds: ['dev_user', 'cmd_run_agent', 'orch_agent', 'evt_started', 'evt_session_created'], description: 'Dev requests task. Multiple events generated.' },
        { nodeIds: ['pol_plan', 'cmd_call_llm', 'llm_reason_ref', 'evt_reasoned'], description: 'LLM reasons about task.', processGroup: 'planning' },
        { nodeIds: ['pol_route', 'cmd_execute_tool', 'tools_ref', 'mcp_servers', 'evt_mcp_called', 'evt_tool_executed'], description: 'Tools execute successfully.', processGroup: 'execution' },
        { nodeIds: ['pol_eval', 'cmd_complete', 'llm_final_ref', 'evt_done'], description: 'LLM compiles final answer.', processGroup: 'evaluation' },
        { nodeIds: ['qa_user', 'cmd_review_result', 'orch_qa_ref', 'evt_qa_approved'], description: 'QA reviews and approves.' }
      ]
    },
    {
      id: 'feedback-loop',
      label: 'Feedback Loop',
      description: 'Agent needs more info from same actor.',
      steps: [
        { nodeIds: ['pol_route', 'cmd_execute_tool', 'tools_ref', 'evt_tool_executed'], description: 'Tool returns an error or asks user for input.', processGroup: 'execution' },
        { nodeIds: ['pol_notify_user', 'cmd_send_message', 'orch_notify_ref', 'evt_message_sent'], description: 'System sends message to user.' },
        { nodeIds: ['dev_user_ref', 'cmd_provide_feedback', 'orch_plan_ref', 'evt_feedback_received'], description: 'Dev provides missing info.' },
        { nodeIds: ['evt_feedback_received', 'pol_plan', 'cmd_call_llm', 'llm_reason_ref', 'evt_reasoned'], description: 'Agent replans with new context.', processGroup: 'planning' }
      ]
    },
    {
      id: 'direct-llm',
      label: 'Direct LLM Answer',
      description: 'No tools needed.',
      steps: [
        { nodeIds: ['evt_reasoned', 'pol_complete', 'cmd_complete', 'llm_final_ref', 'evt_done'], description: 'LLM skips tools and directly answers.', processGroup: 'evaluation' }
      ]
    }
  ]
}

