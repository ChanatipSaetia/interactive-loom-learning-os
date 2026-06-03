import type { SectionConfig } from '../../core/registry'
import {
  governanceNodes,
  governanceEdges,
  governanceJourneys,
  governanceSituations,
  governanceTextParagraphs,
  governanceFrameworksParagraphs,
  governanceInterventionBullets,
  owaspRiskBullets,
  riskLandscapeBullets,
} from './data'

export const aiGovernanceSections: SectionConfig[] = [
  {
    type: 'text',
    props: {
      title: 'What is AI Governance?',
      heading: 'Governing Autonomous AI Systems',
      paragraphs: governanceTextParagraphs,
    },
  },
  {
    type: 'flowchart',
    props: {
      title: 'Five-Category Intervention Taxonomy',
      nodes: governanceNodes,
      edges: governanceEdges,
      journeys: governanceJourneys,
    },
  },
  {
    type: 'bullets',
    props: {
      title: 'Intervention Categories',
      ordered: false,
      items: governanceInterventionBullets,
    },
  },
  {
    type: 'bullets',
    props: {
      title: 'Risk Landscape',
      ordered: false,
      items: riskLandscapeBullets,
    },
  },
  {
    type: 'bullets',
    props: {
      title: 'OWASP Top 10 for Agentic Applications',
      ordered: true,
      items: owaspRiskBullets,
    },
  },
  {
    type: 'text',
    props: {
      title: 'Governance Frameworks',
      heading: 'Industry Standards and Frameworks',
      paragraphs: governanceFrameworksParagraphs,
    },
  },
  {
    type: 'situation-choice',
    props: {
      title: 'AI Governance Design Decisions',
      situations: governanceSituations,
    },
  },
]
