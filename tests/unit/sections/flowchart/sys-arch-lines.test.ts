import { describe, it, expect } from 'vitest';
import { parseFlowchart } from './fixtures/parse-flowchart';
import { deriveSchema } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/abstract-flow/derive';
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
