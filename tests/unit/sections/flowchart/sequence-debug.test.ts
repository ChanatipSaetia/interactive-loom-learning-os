import { describe, it } from 'vitest';
import { autoDeriveViews } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/derivations';

describe('Sequence Debug', () => {
  it('logs sequence relations', () => {
    const schema = {
      entities: {
        user: { title: 'User', desc: 'A user actor.', viewTypes: { EVENT_STORMING: 'Actor' } },
        cmd_submit: { title: 'Submit Request', desc: 'Submit command.', viewTypes: { EVENT_STORMING: 'Command' } },
        agg_doc: { title: 'Doc Aggregate', desc: 'Main domain aggregate.', viewTypes: { EVENT_STORMING: 'Aggregate' } }
      },
      relations: [
        { id: 'r1', from: 'user', to: 'cmd_submit', views: ['EVENT_STORMING'] },
        { id: 'r2', from: 'cmd_submit', to: 'agg_doc', views: ['EVENT_STORMING'], handledBy: true }
      ],
      views: {
        EVENT_STORMING: {
          name: 'Event Storming',
          icon: 'Component',
          nodes: [
            { id: 'user', grid: [0, 2] as [number, number] },
            { id: 'cmd_submit', grid: [1, 2] as [number, number] },
            { id: 'agg_doc', grid: [1, 1] as [number, number] }
          ],
          groups: []
        }
      },
      journeys: []
    };
    const result = autoDeriveViews(schema);
    const seqView = result.views!.SEQUENCE!;
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
