import { describe, it, expect } from 'vitest';
import { loadAllFlowcharts } from './layout/layout-metrics';
import { getViewSpacing, positionViewNodes, edgeLabelRoom } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/views/geometry';
import { NODE_W, NODE_H } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/types';

describe('Node spacing in the repo topics', () => {
  it('never draws one box over another', () => {
    const overlaps: string[] = [];
    loadAllFlowcharts().forEach(({ name, schema }) => {
      Object.entries(schema.views ?? {}).forEach(([viewKey, view]) => {
        if (viewKey === 'SEQUENCE') return;
        const nodes = positionViewNodes(view, getViewSpacing(view, viewKey), false);
        nodes.forEach((a, i) => nodes.slice(i + 1).forEach(b => {
          if (Math.abs(a.x - b.x) < NODE_W && Math.abs(a.y - b.y) < NODE_H) {
            overlaps.push(`${name} ${viewKey}: ${a.id} / ${b.id}`);
          }
        }));
      });
    });
    expect(overlaps).toEqual([]);
  });
});

describe('edgeLabelRoom', () => {
  const nodes = [{ x: 0, y: 0 }, { x: 400, y: 0 }];

  it('is the gap between the boxes on the label\'s line, less a margin', () => {
    // boxes end at 70 and start at 330; centred at 200 that leaves 130 on each side
    expect(edgeLabelRoom(200, 0, nodes)).toBe(2 * (130 - 6));
    // off-centre, the nearer box decides
    expect(edgeLabelRoom(100, 0, nodes)).toBe(2 * (30 - 6));
  });

  it('ignores boxes above or below the label and is unbounded with none beside it', () => {
    expect(edgeLabelRoom(200, 200, nodes)).toBe(Infinity);
  });

  it('has no room inside a box', () => {
    expect(edgeLabelRoom(10, 0, nodes)).toBe(0);
  });
});
