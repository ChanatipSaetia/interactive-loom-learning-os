import { MessageSquare } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TaxonomyCategory } from '../../../../../sections/taxonomy-browser'

export const messageCategory: TaxonomyCategory = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: MessageSquare as unknown as ComponentType<any>,
  title: 'Message',
  subtitle: 'A2A Data Model',
  description: 'Single conversational turn within a task with a role (user or agent) and Parts.',
  details: 'Conveys instructions, context, questions, answers, and status updates. Each message belongs to a task and carries a role indicating whether it originates from the user or the agent, along with one or more Part objects containing the actual content.',
  analogy: 'Like an email in a conversation thread — each message has a sender, content, and is part of an ongoing exchange.',
  primaryFocus: 'Text content, structured data, questions, answers, status updates',
  inScope: [
    'Text content',
    'Structured data',
    'Questions',
    'Answers',
    'Status updates',
  ],
  outOfScope: ['Task lifecycle', 'Agent discovery', 'Authentication'],
  color: 'teal',
}
