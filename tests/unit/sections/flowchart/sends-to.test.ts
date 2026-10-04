import { describe, it, expect } from 'vitest';
import type { AbstractFlow } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/abstract-flow/types';
import { parseFlowchart } from './fixtures/parse-flowchart';
import { deriveSchema } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/abstract-flow/derive';
import { autoDeriveViews } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/derivations';
import { validateOKFSection } from '../../../../src/core/learning-engine/validation/gateway';
import { validateOUISection } from '../../../../src/core/learning-engine/validation/oui-gateway';
import { compileOUISection } from '../../../../src/core/learning-engine/composition/oui/compile';
import { printOUISection } from '../../../../src/core/learning-engine/composition/oui/print';

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

describe('sendsTo in OpenUI Lang', () => {
  const source = `
root = Flowchart("Hello", [dev], [client, server], [hello, fork], [j])
dev = Actor("dev", "Developer", "Starts it")
client = System("client", "Client", "Calls", "aggregate")
server = System("server", "Server", "Answers", "aggregate")
hello = Step("hello", "On start", "Say hello", client, [Event("said", "Hello said")], dev, null, "fork", null, server)
fork = Branch("fork", "said", [ok, ko])
ok = BranchOption("ok", "Accepted", "If valid", "Accept", server, [Event("accepted", "Accepted")], null, null, null, null, null, client)
ko = BranchOption("ko", "Rejected", "If invalid", "Reject", server, [Event("rejected", "Rejected")], true)
j = Journey("j", "J", "J", [JourneyStep(hello, "Hello", "Say hello")])
`;

  it('compiles sendsTo on steps and branch options as references', () => {
    const flow = (compileOUISection(source).value!.data as { flow: AbstractFlow }).flow;
    const [hello, fork] = flow.steps;
    expect(hello.type === 'linear' && hello.sendsTo?.id).toBe('server');
    expect(fork.type === 'branch' && fork.branches.map(b => b.sendsTo?.id)).toEqual(['client', undefined]);
    const seq = autoDeriveViews(deriveSchema(flow)).relations.filter(r => r.views?.includes('SEQUENCE') && r.dashed);
    expect(seq.find(r => r.label === 'Hello said')).toMatchObject({ to: expect.stringContaining('server') });
  });

  it('keeps sendsTo when the visual form saves the section back to .oui', () => {
    const compiled = compileOUISection(source).value!;
    const reprinted = compileOUISection(printOUISection(compiled.meta, compiled.data));
    expect(reprinted.issues).toEqual([]);
    expect(reprinted.value).toEqual(compiled);
  });

  it('flags a sendsTo that names nothing declared', () => {
    const bad = source.replace('"fork", null, server)', '"fork", null, "nobody")');
    const diag = validateOUISection(bad).diagnostics.find(d => d.field?.endsWith('sendsTo'));
    expect(diag?.message).toContain('"nobody"');
  });
});
