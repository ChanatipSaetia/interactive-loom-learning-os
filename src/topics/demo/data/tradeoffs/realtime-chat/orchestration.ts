import type { TradeoffStep } from '../../../../../sections/tradeoff-sandbox'

export const orchestrationStep: TradeoffStep = {
  id: 'orchestration',
  title: 'Deployment Orchestration',
  description: 'How to manage the deployment and scaling of services.',
  recommended: 'kubernetes',
  choices: [
    {
      id: 'kubernetes',
      label: 'Kubernetes',
      description: 'Full container orchestration with auto-scaling and self-healing.',
      metrics: { latency: 5, consistency: 10, devex: -10, 'ops-cost': -20 },
      pros: [
        { title: 'Auto-scaling', description: 'HPA/VPA scale pods by metrics' },
        { title: 'Self-healing', description: 'Crashed pods restart automatically' },
        { title: 'Service mesh ready', description: 'Istio/Linkerd for traffic management' },
      ],
      cons: [
        { title: 'Steep learning curve', description: 'K8s concepts take time to master' },
        { title: 'Resource overhead', description: 'Control plane consumes cluster resources' },
        { title: 'Complex debugging', description: 'Multi-layer abstraction obscures root cause' },
      ],
      whyThisFits: 'Real-time collaboration systems need reliable auto-scaling to handle variable connection loads. Kubernetes provides the operational guarantees required for production-grade availability.',
    },
    {
      id: 'serverless',
      label: 'Serverless',
      description: 'Platform-managed functions with automatic scaling.',
      metrics: { latency: -10, consistency: 5, devex: 20, 'ops-cost': 25 },
      pros: [
        { title: 'Zero infra management', description: 'Platform handles scaling and uptime' },
        { title: 'Pay per use', description: 'No idle resource cost' },
        { title: 'Fast iteration', description: 'Deploy individual functions instantly' },
      ],
      cons: [
        { title: 'Cold start latency', description: 'First request after idle incurs delay' },
        { title: 'Vendor lock-in', description: 'Platform-specific APIs and limits' },
        { title: 'Connection limits', description: 'WebSocket long-polling constrained' },
      ],
      whenToUse: 'Good for prototypes and early-stage products where development speed matters more than connection stability.',
    },
  ],
}
