import type { TradeoffStep } from '../../../../../sections/tradeoff-sandbox'

export const backendStep: TradeoffStep = {
  id: 'backend',
  title: 'Backend Pattern',
  description: 'Determine the server-side architecture for audit processing.',
  recommended: 'java-monolith',
  choices: [
    {
      id: 'java-monolith',
      label: 'Java Monolith (Spring)',
      description: 'Spring Boot monolith with layered architecture and comprehensive audit logging.',
      metrics: { security: 15, compliance: 20, maintainability: -5, 'time-market': -10 },
      pros: [
        { title: 'Audit trail built-in', description: 'Spring Security provides comprehensive audit logging' },
        { title: 'Enterprise security', description: 'OIDC, SAML, and RBAC are native' },
        { title: 'Regulatory fit', description: 'SOC2, PCI-DSS patterns well-established' },
        { title: 'Type safety', description: 'Java generics catch errors at compile time' },
      ],
      cons: [
        { title: 'Slow iteration', description: 'Full rebuild and redeploy for changes' },
        { title: 'Heavy resource usage', description: 'JVM requires significant memory' },
        { title: 'Longer onboarding', description: 'New developers need Java/Spring training' },
      ],
      whyThisFits: 'High-security financial auditing requires comprehensive audit trails, enterprise-grade security, and proven regulatory compliance patterns — all of which Spring Boot provides natively.',
    },
    {
      id: 'java-modular',
      label: 'Java Modular (Spring Boot Modules)',
      description: 'Spring Boot with clear module boundaries and feature toggles.',
      metrics: { security: 10, compliance: 15, maintainability: 10, 'time-market': 5 },
      pros: [
        { title: 'Independent testing', description: 'Modules can be tested in isolation' },
        { title: 'Progressive enhancement', description: 'Features released behind toggles' },
        { title: 'Clearer boundaries', description: 'Module contracts enforce loose coupling' },
      ],
      cons: [
        { title: 'Module complexity', description: 'Inter-module communication adds overhead' },
        { title: 'Still JVM-bound', description: 'Resource usage similar to monolith' },
      ],
      whenToUse: 'Consider when the auditing platform needs to evolve incrementally with feature toggles and independent module testing.',
    },
  ],
}
