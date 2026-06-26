import { describe, it } from 'vitest';
import { autoDeriveViews } from '../../../../src/sections/flowchart/derivations';
import { agentSchema } from '../../../../src/topics/demo/data/agent-schema';

describe('Sequence Debug', () => {
  it('logs sequence relations', () => {
    const result = autoDeriveViews(agentSchema);
    const seqView = result.views.SEQUENCE!;
    console.log('=== SEQUENCE COLUMNS ===');
    console.log(seqView.nodes.map(n => ({ id: n.id, grid: n.grid })));
    
    console.log('=== SEQUENCE RELATIONS ===');
    console.log(
      result.relations
        .filter(r => r.views?.includes('SEQUENCE'))
        .map((r, idx) => ({
          idx,
          id: r.id,
          from: r.from,
          to: r.to,
          label: r.label,
          chronologicalIndex: r.chronologicalIndex
        }))
    );
  });
});
