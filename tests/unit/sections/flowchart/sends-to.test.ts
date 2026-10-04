import { describe, it, expect } from 'vitest';
import { parseFlowchart } from './fixtures/parse-flowchart';
import { deriveSchema } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/abstract-flow/derive';
import { autoDeriveViews } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/derivations';
import { validateOKFSection } from '../../../../src/core/learning-engine/validation/gateway';

const base = {
  actors: { dev: { title: 'Developer' } },
  systems: {
    client: { title: 'Client', type: 'aggregate' },
    server: { title: 'Server', type: 'aggregate' },
  },
  journeys: [{ id: 'j', label: 'J', description: 'J', steps: [{ stepId: 'hello', name: 'Hello', description: 'Say hello' }] }],
};
const parse = (steps: unknown[]) => parseFlowchart({ type: 'flowchart', flow: { ...base, steps } }).flow;

describe('sendsTo and optional handledBy in derivation', () => {
  const flow = parse([
    {
      id: 'hello', type: 'linear', initiatedBy: 'dev', policy: 'On start', command: 'Say hello',
      handledBy: 'client', sendsTo: 'server', resultEvents: [{ id: 'said', title: 'Hello said' }], continuesAs: 'settle',
    },
    { id: 'settle', type: 'linear', policy: 'On hello', command: 'Settle', resultEvents: [{ id: 'settled', title: 'Settled' }] },
  ]);
  const schema = deriveSchema(flow);

  it('links each result event to the recipient', () => {
    const toRecipient = schema.relations.filter(r => r.sendsTo);
    expect(toRecipient.map(r => r.from)).toEqual(['evt_said']);
    expect(schema.entities[toRecipient[0].to].title).toBe('Server');
  });

  it('lets a step without a handler emit its events from the command', () => {
    expect(schema.relations.some(r => r.from === 'cmd_settle' && r.to === 'evt_settled')).toBe(true);
    expect(schema.relations.some(r => r.from === 'cmd_settle' && r.handledBy)).toBe(false);
  });

  it('records who does what on each journey step', () => {
    const roles = schema.journeys[0].steps[0].roles!;
    expect(roles.command).toBe('Say hello');
    expect(schema.entities[roles.initiator!].title).toBe('Developer');
    expect(schema.entities[roles.handler!].title).toBe('Client');
    expect(schema.entities[roles.recipient!].title).toBe('Server');
  });

  it('draws the result as a message to the recipient in the sequence view', () => {
    const views = autoDeriveViews(schema);
    const message = views.relations.find(r => r.views?.includes('SEQUENCE') && r.label === 'Hello said')!;
    expect(message.from).toBe('client');
    expect(message.to).toBe('server');
  });

  it('gives the architecture view a client → server edge from sendsTo', () => {
    const views = autoDeriveViews(schema);
    const edges = views.relations.filter(r => r.views?.includes('SYS_ARCH')).map(r => `${r.from}->${r.to}`);
    expect(edges).toContain('client->server');
  });
});

describe('sendsTo and optional handledBy in validation', () => {
  const yaml = (step: string) => `
type: flowchart
flow:
  actors:
    dev:
      title: "Developer"
  systems:
    client:
      title: "Client"
      type: "aggregate"
  steps:
    - id: hello
      type: linear
      initiatedBy: dev
      policy: "On start"
      command: "Say hello"
${step}
      resultEvents:
        - id: said
          title: "Hello said"
  journeys:
    - id: j
      label: "J"
      description: "J"
      steps:
        - stepId: hello
          name: "Hello"
          description: "Say hello"
`.trim();
  const tier3 = (step: string) => validateOKFSection(yaml(step)).diagnostics.filter(d => d.tier === 3);

  it('accepts a step without handledBy', () => {
    expect(tier3('      sendsTo: client').filter(d => d.field?.startsWith('steps.'))).toEqual([]);
  });

  it('rejects a sendsTo that names nothing declared', () => {
    const d = tier3('      handledBy: client\n      sendsTo: nobody').find(x => x.field === 'steps.hello.sendsTo');
    expect(d?.message).toContain('"nobody"');
    expect(d?.fixHint).toContain('"client"');
  });

  it('rejects delegatesTo without a handler', () => {
    const d = tier3('      delegatesTo: client').find(x => x.field === 'steps.hello.delegatesTo');
    expect(d?.message).toContain('no handledBy');
  });

  it('counts sendsTo as attaching a system to the flow', () => {
    const unattached = tier3('      sendsTo: client').filter(x => x.field === 'systems.client');
    expect(unattached).toEqual([]);
  });
});
