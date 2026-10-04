import { describe, it, expect } from 'vitest';
import { compileOUISection } from '../../../../src/core/learning-engine/composition/oui/compile';
import { deriveSchema } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/abstract-flow/derive';
import { autoDeriveViews } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/derivations';
import { TYPES } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/types';
import type { AbstractFlow } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/abstract-flow/types';

const source = `
root = Flowchart("Kinds", [user], [api, store, mail], [save, notify], [j])
user = Actor("user", "User", "Saves")
api = System("api", "API", "Handles requests", "service")
store = System("store", "Store", "Keeps records", "database")
mail = System("mail", "Mail", "Sends mail", "external")
save = Step("save", "On submit", "Save Record", store, [Event("saved", "Record Saved")], user, null, "notify", null, api)
notify = Step("notify", "On saved", "Send Mail", mail, [Event("mailed", "Mail Sent")], null, null, null, null, user)
j = Journey("j", "J", "J", [JourneyStep(save, "Save", "Save")])
`;

describe('system kinds', () => {
  const flow = (compileOUISection(source).value!.data as { flow: AbstractFlow }).flow;
  const schema = autoDeriveViews(deriveSchema(flow));

  it('maps service and database kinds to their node types', () => {
    expect(flow.systems.api.type).toBe('service');
    expect(schema.entities.api.type).toBe(TYPES.SERVICE);
    expect(schema.entities.store.type).toBe(TYPES.DATABASE);
  });

  it('keeps services and databases inside the System Boundary, external systems outside', () => {
    const boundary = schema.views!.SYS_ARCH.groups.find(g => g.id === 'sys_boundary')!;
    expect(boundary.nodeIds).toEqual(expect.arrayContaining(['api', 'store']));
    expect(boundary.nodeIds).not.toContain('mail');
  });

  it('draws the command a database handles in the sequence diagram', () => {
    const seq = schema.relations.filter(r => r.views?.includes('SEQUENCE'));
    expect(seq.some(r => r.label === 'Save Record' && r.to === 'store')).toBe(true);
  });

  it('names an event\'s Data Flow data object with its data', () => {
    const withData = source.replace('Event("saved", "Record Saved")', 'Event("saved", "Record Saved", null, null, "Record ID + timestamp")');
    const f = (compileOUISection(withData).value!.data as { flow: AbstractFlow }).flow;
    const s = autoDeriveViews(deriveSchema(f));
    expect(s.entities.evt_saved.viewTitles?.DATA_FLOW).toBe('Record ID + timestamp');
    expect(s.entities.evt_saved.title).toBe('Record Saved');
  });
});
