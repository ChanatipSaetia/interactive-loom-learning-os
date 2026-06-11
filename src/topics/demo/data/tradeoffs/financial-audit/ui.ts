import type { TradeoffStep } from '../../../../../sections/tradeoff-sandbox'

export const uiStep: TradeoffStep = {
  id: 'ui',
  title: 'UI Framework',
  description: 'Choose the frontend framework for the auditing dashboard.',
  recommended: 'angular',
  choices: [
    {
      id: 'angular',
      label: 'Angular',
      description: 'Enterprise-grade framework with built-in dependency injection and strong typing.',
      metrics: { security: 10, compliance: 10, maintainability: 10, 'time-market': -5 },
      pros: [
        { title: 'Built-in security', description: 'XSS protection and type safety out of the box' },
        { title: 'Enterprise features', description: 'RxJS, DI, and forms are first-class' },
        { title: 'Strong structure', description: 'Opinionated architecture aids large teams' },
      ],
      cons: [
        { title: 'Steep learning curve', description: 'Angular concepts require training' },
        { title: 'Slower iteration', description: 'Boilerplate slows prototyping' },
        { title: 'Larger bundle size', description: 'Framework adds initial load weight' },
      ],
      whyThisFits: 'Financial auditing platforms require strict type safety, built-in security, and opinionated structure. Angular provides these out of the box, reducing the risk of security gaps from architectural inconsistency.',
    },
    {
      id: 'react-enterprise',
      label: 'React + TypeScript',
      description: 'Flexible component model with strong type checking.',
      metrics: { security: 5, compliance: 5, maintainability: 5, 'time-market': 15 },
      pros: [
        { title: 'Fast prototyping', description: 'Component composition speeds development' },
        { title: 'Large talent pool', description: 'Most common web framework' },
        { title: 'Ecosystem', description: 'Rich UI libraries and tooling' },
      ],
      cons: [
        { title: 'Architecture choices', description: 'Team must decide patterns and conventions' },
        { title: 'Type safety gaps', description: 'Some patterns resist strict typing' },
      ],
      whenToUse: 'Better suited when speed of development and talent availability outweigh the need for enforced architectural consistency.',
    },
  ],
}
