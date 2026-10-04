import { describe, it, expect } from 'vitest';
import { parseFlowchart } from './fixtures/parse-flowchart';
import { deriveSchema } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/abstract-flow/derive';
import { autoDeriveViews } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/derivations';

const step = (id: string, command: string, handledBy: string, next?: string, extra: Record<string, unknown> = {}) => ({
  id, type: 'linear', policy: `Before ${command}`, command, handledBy,
  resultEvents: [{ id: `${id}_done`, title: `${command} Done` }],
  ...(next ? { continuesAs: next } : {}),
  ...extra,
});

const messages = (steps: unknown[]) => {
  const { flow } = parseFlowchart({
    type: 'flowchart',
    flow: {
      actors: { user: { title: 'User' } },
      systems: { a: { title: 'A', type: 'aggregate' }, b: { title: 'B', type: 'aggregate' } },
      steps,
      journeys: [{ id: 'j', label: 'J', description: 'J', steps: [{ stepId: 'first', name: 'F', description: 'F' }] }],
    },
  });
  const schema = autoDeriveViews(deriveSchema(flow));
  return schema.relations
    .filter(r => r.views?.includes('SEQUENCE'))
    .sort((x, y) => (x.seqIndex ?? 0) - (y.seqIndex ?? 0));
};

describe('sequence order and async messages', () => {
  it('never shows a step before the step it follows from, whatever the declaration order', () => {
    const labels = messages([
      step('third', 'Ship', 'a'),
      step('first', 'Order', 'a', 'second', { initiatedBy: 'user' }),
      step('second', 'Pay', 'b', 'third', { sendsTo: 'a' }),
    ]).filter(r => !r.dashed).map(r => r.label);
    expect(labels).toEqual(['Order', 'Pay', 'Ship']);
  });

  it('keeps the declared order when it already follows the flow', () => {
    const labels = messages([
      step('first', 'Order', 'a', 'second', { initiatedBy: 'user' }),
      step('second', 'Pay', 'b', 'first'),
    ]).filter(r => !r.dashed).map(r => r.label);
    expect(labels).toEqual(['Order', 'Pay']);
  });

  it('marks the command of an async step as an async message', () => {
    const rels = messages([
      step('first', 'Order', 'a', 'second', { initiatedBy: 'user' }),
      step('second', 'Notify', 'b', undefined, { async: true }),
    ]);
    expect(rels.find(r => r.label === 'Notify')?.async).toBe(true);
    expect(rels.find(r => r.label === 'Order')?.async).toBeUndefined();
  });
});
