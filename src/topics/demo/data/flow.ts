import type { AbstractFlow } from '../../../sections/flowchart/abstract-flow/types';
import { ref } from '../../../sections/flowchart/abstract-flow/types';

/**
 * AI Agent Orchestrator Flow
 * Reference schema for the demo topic.
 */
export const agentFlow: AbstractFlow = {
  actors: {
    dev_user: {
      title: 'Developer (Initiator)',
      desc: 'The developer initiating instructions and goals.',
    },
    qa_user: {
      title: 'QA Engineer',
      desc: 'The QA engineer reviewing results.',
    },
  },
  systems: {
    orch_agent: {
      title: 'Agent Orchestrator',
      desc: 'Manages step coordination, memory updates, and loop state.',
      type: 'aggregate',
      stateMachine: {
        states: [
          { id: 'IDLE', label: 'Idle', color: 'var(--ctp-overlay1)' },
          { id: 'THINKING', label: 'Thinking', color: 'var(--ctp-blue)' },
          { id: 'EXECUTING_TOOL', label: 'Executing Tool', color: 'var(--ctp-green)' },
          { id: 'WAITING_FEEDBACK', label: 'Waiting Feedback', color: 'var(--ctp-peach)' },
          { id: 'COMPLETED', label: 'Completed', color: 'var(--ctp-teal)' },
        ],
        initialState: 'IDLE',
      },
    },
    tools_router: {
      title: 'Tools Router',
      desc: 'Handles command routing and executes operations.',
      type: 'aggregate',
    },
    llm: {
      title: 'LLM',
      desc: 'Generates execution plans, makes tool decisions, and synthesizes answers.',
      type: 'external',
    },
    mcp_servers: {
      title: 'MCP Servers',
      desc: 'Model Context Protocol servers providing structured tools.',
      type: 'external',
    },
    subagents: {
      title: 'Subagent Pool',
      desc: 'Dynamic spawned subagents delegated to run isolated journeys concurrently.',
      type: 'external',
    },
  },
  steps: [
    {
      type: 'linear',
      id: 'run_agent',
      initiatedBy: ref('dev_user'),
      command: 'Run Agent',
      policy: 'Trigger Planning',
      handledBy: ref('orch_agent'),
      resultEvents: [
        { id: 'started', title: 'Agent Started', desc: 'Task received, environment setup complete.' },
        { id: 'session_created', title: 'Session Created', desc: 'A new agent session ID was allocated.' },
      ],
      continuesAs: 'call_llm',
    },
    {
      type: 'linear',
      id: 'call_llm',
      policy: 'Trigger Planning',
      command: 'Call LLM',
      handledBy: ref('llm'),
      resultEvents: [
        { id: 'reasoned', title: 'LLM Response Generated', desc: 'Thinking thoughts and requested tool calls retrieved.' },
      ],
      continuesAs: 'reason-branch',
    },
    {
      type: 'branch',
      id: 'reason-branch',
      event: 'reasoned',
      branches: [
        {
          id: 'execute_tool',
          label: 'Needs Tool',
          policy: 'Trigger Tool Call',
          command: 'Execute Tool',
          handledBy: ref('tools_router'),
          resultEvents: [
            { id: 'tool_executed', title: 'Tool Executed', desc: 'Result status and stdout output returned from execution.' },
            { id: 'subagent_spawned', title: 'Subagent Spawned', desc: 'Background task delegated.' },
          ],
          continuesAs: 'eval',
        },
        {
          id: 'call_mcp',
          label: 'Needs MCP',
          policy: 'Trigger MCP Call',
          command: 'Call MCP',
          handledBy: ref('mcp_servers'),
          resultEvents: [
            { id: 'mcp_called', title: 'MCP Server Called', desc: 'External API hit through MCP.' },
          ],
          continuesAs: 'eval',
        },
        {
          id: 'direct_complete',
          label: 'Final Answer',
          policy: 'Trigger Completion',
          command: 'Complete Task',
          handledBy: ref('llm'),
          resultEvents: [
            { id: 'done', title: 'Task Completed', desc: 'Agent finishes loops and returns the verified solution.' },
          ],
          continuesAs: 'qa_review',
        },
      ],
    },
    {
      type: 'linear',
      id: 'eval',
      policy: 'Trigger Evaluation',
      command: 'Compile Answer',
      handledBy: ref('llm'),
      resultEvents: [
        { id: 'done', title: 'Task Completed', desc: 'Agent finishes loops and returns the verified solution.' },
      ],
      continuesAs: 'notify-branch',
    },
    {
      type: 'branch',
      id: 'notify-branch',
      event: 'tool_executed',
      branches: [
        {
          id: 'send_message',
          label: 'Needs Input',
          policy: 'Trigger User Notification',
          command: 'Send Message',
          handledBy: ref('orch_agent'),
          resultEvents: [
            { id: 'message_sent', title: 'Message Sent', desc: 'User is notified and presented with input prompt.' },
          ],
          continuesAs: 'provide_feedback',
        },
      ],
    },
    {
      type: 'linear',
      id: 'provide_feedback',
      initiatedBy: ref('dev_user'),
      policy: 'Trigger Planning',
      command: 'Provide Feedback',
      handledBy: ref('orch_agent'),
      resultEvents: [
        { id: 'feedback_received', title: 'Feedback Received', desc: 'User provided new input to correct course.' },
      ],
      continuesAs: 'call_llm',
    },
    {
      type: 'branch',
      id: 'qa-branch',
      event: 'done',
      branches: [
        {
          id: 'qa_review',
          label: 'Ready for QA',
          policy: 'Trigger QA Review',
          command: 'Review Result',
          handledBy: ref('orch_agent'),
          resultEvents: [
            { id: 'qa_approved', title: 'QA Approved', desc: 'The output passed QA standards.' },
            { id: 'qa_rejected', title: 'QA Rejected', desc: 'The output failed QA standards.' },
          ],
        },
      ],
    },
  ],
  journeys: [
    {
      id: 'happy-path',
      label: 'Happy Path',
      description: 'Agent uses tools successfully and passes QA.',
      steps: [
        { nodeId: 'run_agent', description: 'Dev requests task. Multiple events generated.', processGroup: 'planning' },
        { nodeId: 'started', description: 'Agent started, session created.', processGroup: 'planning' },
        { nodeId: 'call_llm', description: 'LLM reasons about task.', processGroup: 'planning' },
        { nodeId: 'reasoned', description: 'LLM generates response with tool calls.', processGroup: 'planning' },
        { nodeId: 'execute_tool', description: 'Tools execute successfully, spawning subagents.', processGroup: 'execution' },
        { nodeId: 'tool_executed', description: 'Tool execution returns results.', processGroup: 'execution' },
        { nodeId: 'call_mcp', description: 'MCP server called.', processGroup: 'execution' },
        { nodeId: 'mcp_called', description: 'MCP interaction completes.', processGroup: 'execution' },
        { nodeId: 'eval', description: 'LLM compiles final answer.', processGroup: 'evaluation' },
        { nodeId: 'done', description: 'Task completed with verified solution.', processGroup: 'evaluation' },
        { nodeId: 'qa_review', description: 'Task submitted for QA review; QA approves.' },
        { nodeId: 'qa_approved', description: 'Output passes QA standards.' },
      ],
    },
    {
      id: 'feedback-loop',
      label: 'Feedback Loop',
      description: 'Agent needs more info from same actor.',
      steps: [
        { nodeId: 'execute_tool', description: 'Tool returns an error or asks user for input.', processGroup: 'execution' },
        { nodeId: 'tool_executed', description: 'Tool execution needs user input.', processGroup: 'execution' },
        { nodeId: 'send_message', description: 'System sends message to user.' },
        { nodeId: 'message_sent', description: 'User is prompted for input.' },
        { nodeId: 'provide_feedback', description: 'Dev provides missing info.' },
        { nodeId: 'feedback_received', description: 'Feedback received by orchestrator.' },
        { nodeId: 'call_llm', description: 'Agent replans with new context.', processGroup: 'planning' },
        { nodeId: 'reasoned', description: 'LLM generates updated response.', processGroup: 'planning' },
      ],
    },
    {
      id: 'direct-llm',
      label: 'Direct LLM Answer',
      description: 'No tools needed.',
      steps: [
        { nodeId: 'call_llm', description: 'LLM reasons about task.', processGroup: 'planning' },
        { nodeId: 'reasoned', description: 'LLM has direct answer.', processGroup: 'planning' },
        { nodeId: 'direct_complete', description: 'LLM skips tools and directly answers.', processGroup: 'evaluation' },
        { nodeId: 'done', description: 'Task completed with direct answer.', processGroup: 'evaluation' },
      ],
    },
  ],
};
