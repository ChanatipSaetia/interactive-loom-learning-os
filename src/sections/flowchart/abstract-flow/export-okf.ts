import type { AbstractFlow, LinearStep, BranchStep } from './types';
import { isLinearStep, isBranchStep } from './types';

/** OKF frontmatter for a concept document. */
interface OKFFrontmatter {
  type: string;
  title?: string;
  description?: string;
  tags?: string[];
  timestamp?: string;
  [key: string]: string | string[] | undefined;
}

/** A single OKF concept file. */
export interface OKFConcept {
  path: string;
  content: string;
}

/** Full OKF bundle output. */
export interface OKFBundle {
  concepts: OKFConcept[];
}

/** Convert an AbstractFlow to an OKF-compliant bundle. */
export function exportOKF(flow: AbstractFlow, topicId: string, bundleRoot = 'knowledge-bundle'): OKFBundle {
  const concepts: OKFConcept[] = [];

  // Root index
  concepts.push({
    path: `${bundleRoot}/index.md`,
    content: generateRootIndex(topicId),
  });

  // Topic index
  concepts.push({
    path: `${bundleRoot}/topics/${topicId}/index.md`,
    content: generateTopicIndex(flow, topicId),
  });

  // Actors
  for (const [id, actor] of Object.entries(flow.actors)) {
    concepts.push({
      path: `${bundleRoot}/topics/${topicId}/actors/${id}.md`,
      content: generateActorConcept(id, actor),
    });
  }

  // Systems
  for (const [id, sys] of Object.entries(flow.systems)) {
    concepts.push({
      path: `${bundleRoot}/topics/${topicId}/systems/${id}.md`,
      content: generateSystemConcept(id, sys),
    });
  }

  // Steps as flow concepts
  for (let i = 0; i < flow.steps.length; i++) {
    const step = flow.steps[i];
    if (isLinearStep(step)) {
      concepts.push({
        path: `${bundleRoot}/topics/${topicId}/flow/${step.id}.md`,
        content: generateLinearStepConcept(step, i + 1),
      });
    } else if (isBranchStep(step)) {
      concepts.push({
        path: `${bundleRoot}/topics/${topicId}/flow/${step.event}.md`,
        content: generateBranchStepConcept(step, i + 1),
      });
    }
  }

  // Journeys
  for (const journey of flow.journeys) {
    concepts.push({
      path: `${bundleRoot}/topics/${topicId}/journeys/${journey.id}.md`,
      content: generateJourneyConcept(journey),
    });
  }

  return { concepts };
}

function frontmatter(fm: OKFFrontmatter): string {
  const lines = ['---'];
  for (const [key, value] of Object.entries(fm)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.join(', ')}]`);
    } else if (value !== undefined) {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

function generateRootIndex(topicId: string): string {
  return `${frontmatter({ type: 'Index', okf_version: '0.1' })}

# Knowledge Bundle

## Topics
* [${topicId}](topics/${topicId}/)
`;
}

function generateTopicIndex(flow: AbstractFlow, topicId: string): string {
  let content = `# ${topicId}

`;

  if (Object.keys(flow.actors).length > 0) {
    content += `## Actors\n`;
    for (const [id, actor] of Object.entries(flow.actors)) {
      content += `* [${actor.title}](actors/${id}.md) - ${actor.desc}\n`;
    }
    content += '\n';
  }

  if (Object.keys(flow.systems).length > 0) {
    content += `## Systems\n`;
    for (const [id, sys] of Object.entries(flow.systems)) {
      content += `* [${sys.title}](systems/${id}.md) - ${sys.desc}\n`;
    }
    content += '\n';
  }

  content += `## Flow Steps\n`;
  for (const step of flow.steps) {
    if (isLinearStep(step)) {
      content += `* [${step.command}](flow/${step.id}.md) - ${step.policy}\n`;
    } else if (isBranchStep(step)) {
      content += `* [${step.event}](flow/${step.event}.md) - Branch: ${step.branches.map(b => b.label).join(' / ')}\n`;
    }
  }

  if (flow.journeys.length > 0) {
    content += '\n## Journeys\n';
    for (const j of flow.journeys) {
      content += `* [${j.label}](journeys/${j.id}.md) - ${j.description}\n`;
    }
  }

  return content;
}

function generateActorConcept(_id: string, actor: { title: string; desc: string }): string {
  return `${frontmatter({
    type: 'Actor',
    title: actor.title,
    description: actor.desc,
    tags: ['actor'],
  })}

## Description
${actor.desc}
`;
}

function generateSystemConcept(_id: string, sys: {
  title: string;
  desc: string;
  type: 'aggregate' | 'external';
}): string {
  return `${frontmatter({
    type: sys.type === 'aggregate' ? 'Aggregate' : 'External System',
    title: sys.title,
    description: sys.desc,
    tags: [sys.type],
  })}

## Description
${sys.desc}

## Type
\`${sys.type}\`
`;
}

function generateLinearStepConcept(step: LinearStep, order: number): string {
  let body = `## Step ${order}: ${step.command}

`;

  if (step.initiatedBy) {
    body += `- **Initiated by:** [\`${step.initiatedBy.id}\`](../actors/${step.initiatedBy.id}.md)\n`;
  }

  body += `- **Policy:** ${step.policy}\n`;
  body += `- **Command:** ${step.command}\n`;
  body += `- **Handled by:** [\`${step.handledBy.id}\`](../systems/${step.handledBy.id}.md)\n`;
  body += `- **Result event(s):**\n`;

  for (const evt of step.resultEvents) {
    body += `  * \`${evt.id}\` - ${evt.title}\n`;
  }

  if (step.continuesAs) {
    body += `\n→ Continues to: [\`${step.continuesAs}\`](${step.continuesAs}.md)\n`;
  }

  return `${frontmatter({
    type: 'FlowStep',
    title: step.command,
    description: step.policy,
    tags: ['flow', 'linear'],
    'step-order': order.toString(),
  })}

${body}`;
}

function generateBranchStepConcept(step: BranchStep, order: number): string {
  let body = `## Branch Point: ${step.event}

`;

  for (let i = 0; i < step.branches.length; i++) {
    const b = step.branches[i];
    body += `### Branch ${i + 1}: ${b.label}\n\n`;
    body += `- **Policy:** ${b.policy}\n`;
    body += `- **Command:** ${b.command}\n`;
    body += `- **Handled by:** [\`${b.handledBy.id}\`](../systems/${b.handledBy.id}.md)\n`;
    body += `- **Result event(s):**\n`;

    for (const evt of b.resultEvents) {
      body += `  * \`${evt.id}\` - ${evt.title}\n`;
    }

    if (b.dashed) {
      body += `- **Note:** Error/edge case path\n`;
    }

    if (b.continuesAs) {
      body += `\n→ Continues to: [\`${b.continuesAs}\`](${b.continuesAs}.md)\n`;
    }

    body += '\n';
  }

  return `${frontmatter({
    type: 'FlowStep',
    title: step.event,
    description: `Branch point with ${step.branches.length} options`,
    tags: ['flow', 'branch'],
    'step-order': order.toString(),
  })}

${body}`;
}

function generateJourneyConcept(journey: {
  id: string;
  label: string;
  description: string;
  steps: Array<{ nodeId: string; description: string; processGroup?: string }>;
}): string {
  let body = `## ${journey.label}

${journey.description}

`;

  body += `### Steps\n\n`;
  body += `| # | Node | Description |\n`;
  body += `|---|---|---|\n`;

  journey.steps.forEach((s, i) => {
    const processGroup = s.processGroup ? ` (\`${s.processGroup}\`)` : '';
    body += `| ${i + 1} | \`${s.nodeId}\`${processGroup} | ${s.description} |\n`;
  });

  return `${frontmatter({
    type: 'Journey',
    title: journey.label,
    description: journey.description,
    tags: ['journey'],
  })}

${body}`;
}
