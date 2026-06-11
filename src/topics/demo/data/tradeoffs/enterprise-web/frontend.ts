import type { TradeoffStep } from '../../../../../sections/tradeoff-sandbox'

export const frontendStep: TradeoffStep = {
  id: 'frontend',
  title: 'Frontend Framework',
  description: 'Choose the client-side rendering approach.',
  recommended: 'next-ssr',
  choices: [
    {
      id: 'react-spa',
      label: 'React SPA',
      description: 'Single-page application with client-side routing and state management.',
      metrics: { performance: 10, scalability: 5, complexity: 5, cost: 5 },
      pros: [
        { title: 'Rich ecosystem', description: 'Vast library support and community' },
        { title: 'Smooth UX', description: 'Client-side transitions feel native' },
      ],
      cons: [
        { title: 'SEO challenges', description: 'Requires SSR or SSG for search indexing' },
        { title: 'Larger initial bundle', description: 'Full framework must load first' },
      ],
      whenToUse: 'Useful for admin dashboards and internal tools where SEO is not a concern and developer familiarity with React is high.',
    },
    {
      id: 'next-ssr',
      label: 'Next.js SSR',
      description: 'Server-side rendered React with hybrid static/dynamic rendering.',
      metrics: { performance: 15, scalability: 10, complexity: 10, cost: -5 },
      pros: [
        { title: 'Better SEO', description: 'Server-rendered HTML for crawlers' },
        { title: 'Faster first paint', description: 'HTML delivered from server' },
        { title: 'Hybrid rendering', description: 'Mix static and dynamic pages' },
      ],
      cons: [
        { title: 'Server dependency', description: 'Requires Node.js server runtime' },
        { title: 'More complex deploy', description: 'SSR adds deployment surface' },
      ],
      whyThisFits: 'Enterprise web applications benefit from server-side rendering for SEO, faster perceived performance, and the ability to mix static public pages with dynamic user-specific content.',
    },
  ],
}
