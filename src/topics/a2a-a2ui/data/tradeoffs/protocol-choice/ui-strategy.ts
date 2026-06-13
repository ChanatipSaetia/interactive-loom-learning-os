import type { TradeoffStep } from '../../../../../sections/tradeoff-sandbox'

export const uiStrategyStep: TradeoffStep = {
  id: 'ui-strategy',
  title: 'User Interface',
  description: 'How should the agent present UI to the user?',
  recommended: 'a2ui',
  choices: [
    {
      id: 'a2ui',
      label: 'A2UI (Agent-to-UI)',
      description: 'Agents send declarative UI component definitions that the client renders natively.',
      metrics: { interop: 15, safety: 20, complexity: -10 },
      pros: [
        { title: 'Secure by design', description: 'Declarative data format, not executable code. Agents can only use pre-approved components from the client catalog.' },
        { title: 'Framework-agnostic rendering', description: 'One agent response renders on React, Angular, Flutter, or native mobile without changes.' },
        { title: 'Progressive streaming', description: 'UI updates stream as generated; users see the interface building in real-time.' },
        { title: 'Pre-approved component catalog', description: 'Client defines available components; agents reference them by name, ensuring only vetted UI is rendered.' },
      ],
      cons: [
        { title: 'Catalog definition upfront', description: 'Component catalog must be designed and published before agents can use it.' },
      ],
      whyThisFits: 'A2UI provides the best balance of safety and flexibility. Agents define WHAT the UI should look like; the client decides HOW to render it. The component catalog ensures only pre-approved, tested components reach the user.',
    },
    {
      id: 'html-gen',
      label: 'Raw HTML Generation',
      description: 'Agent generates raw HTML/CSS/JS that the client renders directly.',
      metrics: { interop: 0, safety: -20, complexity: -5 },
      pros: [
        { title: 'Maximum visual freedom', description: 'Agent can generate any layout, styling, or interaction without catalog constraints.' },
      ],
      cons: [
        { title: 'Security risk', description: 'Arbitrary HTML/JS execution opens XSS vulnerabilities and gives the agent unrestricted code execution on the client.' },
        { title: 'No type safety', description: 'Generated markup has no validation against a component API, leading to broken or inconsistent UI.' },
        { title: 'Framework-locked', description: 'Generated HTML ties the client to a DOM-based framework, incompatible with Flutter, native mobile, or other runtimes.' },
        { title: 'Hard to audit', description: 'Dynamic code generation makes it impossible to review what UI will render before deployment.' },
      ],
      whenToUse: 'Only when you fully trust the agent and have no security requirements. Not recommended for production systems handling user data.',
    },
    {
      id: 'static-ui',
      label: 'Static Chat UI',
      description: 'Traditional chat interface with text-only messages.',
      metrics: { interop: 5, safety: 15, complexity: -15 },
      pros: [
        { title: 'Simplest to implement', description: 'No dynamic rendering; just display text messages in a chat bubble.' },
        { title: 'No rendering engine needed', description: 'Works with any platform that can display text.' },
      ],
      cons: [
        { title: 'Limited interactivity', description: 'Cannot render forms, charts, buttons, or structured data displays.' },
        { title: 'Poor UX for complex tasks', description: 'Users must parse structured information from prose, leading to errors and frustration.' },
      ],
      whenToUse: 'Suitable for simple Q&A bots that do not need rich interactive UI. Inadequate for task-oriented agents that benefit from forms, selections, or structured output.',
    },
  ],
}
