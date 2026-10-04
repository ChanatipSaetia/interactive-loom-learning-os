import { describe, it, expect } from 'vitest';
import { parseFlowchart } from './fixtures/parse-flowchart';
import { deriveSchema } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/abstract-flow/derive';
import { autoDeriveViews } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/derivations';
import { stateAtStep } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/state-at-step';
import { validateOUISection } from '../../../../src/core/learning-engine/validation/oui-gateway';

const raw = (enters: Record<string, string>) => ({
  type: 'flowchart',
  flow: {
    actors: { buyer: { title: 'Buyer' } },
    systems: {
      orders: {
        title: 'Orders', type: 'aggregate',
        stateMachine: {
          initialState: 'DRAFT',
          states: [
            { id: 'DRAFT', label: 'Draft', color: 'var(--ctp-overlay1)' },
            { id: 'PLACED', label: 'Placed', color: 'var(--ctp-blue)' },
            { id: 'PAID', label: 'Paid', color: 'var(--ctp-green)' },
          ],
        },
      },
      bank: { title: 'Bank', type: 'external' },
    },
    steps: [
      {
        id: 'place', type: 'linear', initiatedBy: 'buyer', policy: 'On checkout', command: 'Place Order', handledBy: 'orders',
        resultEvents: [{ id: 'placed', title: 'Order Placed', ...(enters.placed ? { enters: enters.placed } : {}) }], continuesAs: 'note',
      },
      {
        id: 'note', type: 'linear', policy: 'On placed', command: 'Log Order', handledBy: 'orders',
        resultEvents: [{ id: 'logged', title: 'Order Logged' }], continuesAs: 'pay',
      },
      {
        id: 'pay', type: 'linear', policy: 'When logged', command: 'Charge Card', handledBy: 'bank',
        resultEvents: [{ id: 'paid', title: 'Payment Taken', ...(enters.paid ? { enters: enters.paid } : {}) }],
      },
    ],
    journeys: [{ id: 'j', label: 'J', description: 'J', steps: [{ stepId: 'place', name: 'Place', description: 'Place' }] }],
  },
});

const transitions = (enters: Record<string, string>) => {
  const schema = autoDeriveViews(deriveSchema(parseFlowchart(raw(enters)).flow));
  return schema.relations
    .filter(r => r.views?.includes('STATE_MACHINE'))
    .map(r => `${schema.entities[r.from].title} -> ${schema.entities[r.to].title}: ${r.label}`);
};

describe('state machine from enters', () => {
  it('draws a transition into each entered state, labelled with the command that produced the event', () => {
    expect(transitions({ placed: 'PLACED', paid: 'PAID' })).toEqual([
      'Placed -> Paid: Charge Card \n[Guard: When logged]',
      'Draft -> Placed: Place Order \n[Guard: On checkout]',
    ]);
  });

  it('shows the states without transitions when no event declares enters', () => {
    expect(transitions({})).toEqual([]);
  });

  it('rejects an enters that is not a declared state', () => {
    const source = `
root = Flowchart("Orders", [buyer], [orders], [place], [j])
buyer = Actor("buyer", "Buyer", "Buys")
orders = System("orders", "Orders", "Owns orders", "aggregate", StateMachine([MachineState("DRAFT", "Draft", "var(--ctp-blue)")], "DRAFT"))
place = Step("place", "On checkout", "Place Order", orders, [Event("placed", "Order Placed", null, "SHIPPED")], buyer)
j = Journey("j", "J", "J", [JourneyStep(place, "Place", "Place")])
`;
    const diag = validateOUISection(source).diagnostics.find(d => d.field?.endsWith('.enters'));
    expect(diag?.message).toContain('"SHIPPED"');
    expect(diag?.fixHint).toContain('"DRAFT"');
  });

  it('highlights the initial state, then the last state the journey entered', () => {
    const data = raw({ placed: 'PLACED', paid: 'PAID' });
    data.flow.journeys[0].steps = ['place', 'note', 'pay'].map(stepId => ({ stepId, name: stepId, description: stepId }));
    const schema = deriveSchema(parseFlowchart(data).flow);
    const steps = schema.journeys[0].steps;
    expect([-1, 0, 1, 2].map(i => stateAtStep(schema, steps, i))).toEqual(['DRAFT', 'PLACED', 'PLACED', 'PAID']);
  });
});
