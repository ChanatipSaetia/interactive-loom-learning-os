import { describe, it, expect } from 'vitest';
import { parseFlowchart } from './fixtures/parse-flowchart';
import { deriveSchema } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/abstract-flow/derive';
import { autoDeriveViews } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/derivations';

// start (player) -> boost (no actor) -> fork chosen by the player: strike | blast
const { flow } = parseFlowchart({
  type: 'flowchart',
  flow: {
    actors: { player: { title: 'Player' } },
    systems: {
      charger: { title: 'Charger', type: 'aggregate' },
      booster: { title: 'Booster', type: 'aggregate' },
      striker: { title: 'Striker', type: 'aggregate' },
      blaster: { title: 'Blaster', type: 'aggregate' },
    },
    steps: [
      {
        id: 'start', type: 'linear', initiatedBy: 'player', policy: 'On start', command: 'Charge',
        handledBy: 'charger', resultEvents: [{ id: 'charged', title: 'Charged' }], continuesAs: 'boost',
      },
      {
        id: 'boost', type: 'linear', policy: 'On charged', command: 'Boost',
        handledBy: 'booster', resultEvents: [{ id: 'boosted', title: 'Boosted' }], continuesAs: 'fork',
      },
      {
        id: 'fork', type: 'branch', event: 'boosted',
        branches: [
          { id: 'strike', label: 'Strike', initiatedBy: 'player', policy: 'Prefer strike', command: 'Strike', handledBy: 'striker', resultEvents: [{ id: 'struck', title: 'Struck' }] },
          { id: 'blast', label: 'Blast', initiatedBy: 'player', policy: 'Prefer blast', command: 'Blast', handledBy: 'blaster', resultEvents: [{ id: 'blasted', title: 'Blasted' }] },
        ],
      },
    ],
    journeys: [{ id: 'j', label: 'J', description: 'J', steps: [{ stepId: 'start', name: 'Start', description: 'Start' }] }],
  },
});

const schema = autoDeriveViews(deriveSchema(flow));
const view = schema.views!.SWIMLANES;
const laneOf = (nodeId: string) => {
  const row = view.nodes.find(n => n.id === nodeId)!.grid![1];
  const lane = view.groups.find(g => row >= g.row! && row < g.row! + g.rowSpan!)!;
  return lane.title;
};

describe('swimlane lanes', () => {
  it('puts a command no actor starts in the lane of the system that handles it', () => {
    expect(laneOf('cmd_boost')).toBe('Booster');
  });

  it('puts a command an actor starts in that actor\'s lane', () => {
    expect(laneOf('cmd_start')).toBe('Player');
  });

  it('puts a fork every option of which the same actor starts in that actor\'s lane', () => {
    expect(laneOf('evt_boosted')).toBe('Player');
    expect(laneOf('cmd_strike')).toBe('Player');
  });
});
