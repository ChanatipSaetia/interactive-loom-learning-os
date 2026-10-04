import { describe, it, expect } from 'vitest';
import { parseFlowchart } from './fixtures/parse-flowchart';
import { deriveSchema } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/abstract-flow/derive';
import { loadAllFlowcharts } from './layout/layout-metrics';
import { computeStoryRoute } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/story-route';
import { autoDeriveViews } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/derivations';

// cart (A) -> its event triggers billing (B), which sends the receipt to the shopper
const lines = (withSendsTo: boolean) => {
  const { flow } = parseFlowchart({
    type: 'flowchart',
    flow: {
      actors: { shopper: { title: 'Shopper' } },
      systems: { cart: { title: 'Cart', type: 'aggregate' }, billing: { title: 'Billing', type: 'aggregate' } },
      steps: [
        {
          id: 'checkout', type: 'linear', initiatedBy: 'shopper', policy: 'On checkout', command: 'Check Out', handledBy: 'cart',
          resultEvents: [{ id: 'checked_out', title: 'Checked Out' }], continuesAs: 'bill',
        },
        {
          id: 'bill', type: 'linear', policy: 'When checked out', command: 'Charge', handledBy: 'billing',
          resultEvents: [{ id: 'charged', title: 'Charged' }],
          ...(withSendsTo ? { sendsTo: 'shopper' } : {}),
        },
      ],
      journeys: [{ id: 'j', label: 'J', description: 'J', steps: [{ stepId: 'checkout', name: 'C', description: 'C' }] }],
    },
  });
  const schema = autoDeriveViews(deriveSchema(flow));
  return schema.relations
    .filter(r => r.views?.includes('SYS_ARCH'))
    .map(r => `${schema.entities[r.from].title} -> ${schema.entities[r.to].title}`)
    .sort();
};

describe('System Architecture lines', () => {
  it('draws only declared links once the flowchart declares sendsTo', () => {
    expect(lines(true)).toEqual(['Billing -> Shopper', 'Shopper -> Cart']);
  });

  it('still infers event hand-offs in a flowchart without sendsTo', () => {
    expect(lines(false)).toContain('Cart -> Billing');
  });
});

describe('A step that declares no link', () => {
  // review sends its result to the writer; the approved option only names its handler
  const { flow } = parseFlowchart({
    type: 'flowchart',
    flow: {
      actors: { writer: { title: 'Writer' } },
      systems: { preview: { title: 'Preview', type: 'external' }, site: { title: 'Site', type: 'external' } },
      steps: [
        {
          id: 'review', type: 'linear', initiatedBy: 'writer', policy: 'On ready', command: 'Review', handledBy: 'preview',
          sendsTo: 'writer', resultEvents: [{ id: 'reviewed', title: 'Reviewed' }],
        },
        {
          id: 'outcome', type: 'branch', event: 'reviewed',
          branches: [{
            id: 'publish', label: 'Approved', policy: 'If approved', command: 'Publish', handledBy: 'site',
            resultEvents: [{ id: 'published', title: 'Published' }],
          }],
        },
      ],
      journeys: [{
        id: 'j', label: 'J', description: 'J',
        steps: [{ stepId: 'review', name: 'R', description: 'R' }, { stepId: 'publish', name: 'P', description: 'P' }],
      }],
    },
  });
  const schema = autoDeriveViews(deriveSchema(flow));
  const title = (id: string) => schema.entities[id].title;

  it('keeps the hand-off from the system whose event starts it', () => {
    const sysLines = schema.relations
      .filter(r => r.views?.includes('SYS_ARCH'))
      .map(r => `${title(r.from)} -> ${title(r.to)}`);
    expect(sysLines).toContain('Preview -> Site');
  });

  it('plays that hand-off as the step\'s message', () => {
    const route = computeStoryRoute(schema, 'SYS_ARCH', schema.journeys[0].steps, 1)!;
    const main = schema.relations.find(r => r.id === route.labelEdgeId)!;
    expect(`${title(main.from)} -> ${title(main.to)}`).toBe('Preview -> Site');
    expect(route.badgeNodeId).toBeUndefined();
    expect(route.currentNodeIds.map(title).sort()).toEqual(['Preview', 'Site']);
  });
});

describe('System Architecture in the repo topics', () => {
  it('leaves no actor or system without a line', () => {
    const isolated = loadAllFlowcharts().flatMap(({ name, schema }) => {
      const view = schema.views?.SYS_ARCH;
      if (!view) return [];
      const linked = new Set(
        schema.relations.filter(r => r.views?.includes('SYS_ARCH')).flatMap(r => [r.from, r.to])
      );
      return view.nodes.filter(n => !linked.has(n.id)).map(n => `${name}: ${schema.entities[n.id]?.title ?? n.id}`);
    });
    expect(isolated).toEqual([]);
  });
});
