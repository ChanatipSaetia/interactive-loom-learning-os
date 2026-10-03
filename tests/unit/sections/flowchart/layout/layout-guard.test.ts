import { describe, it, expect } from 'vitest';
import { loadAllFlowcharts, measureView, slantedSegments } from './layout-metrics';

/**
 * Layout guard over every flowchart in public/okf, measured on the routed lines
 * exactly as they are drawn. Budgets are the current totals: a layout or
 * routing change may lower them, never raise them. Lower a budget when a
 * change improves it.
 */
const BUDGETS: Record<string, { through: number; overlap: number }> = {
  SYS_ARCH: { through: 0, overlap: 0 },
  DATA_FLOW: { through: 0, overlap: 42 },
  SWIMLANES: { through: 0, overlap: 0 },
  EVENT_STORMING: { through: 4, overlap: 0 },
  STATE_MACHINE: { through: 0, overlap: 0 },
};

describe('flowchart layout guard', () => {
  const flowcharts = loadAllFlowcharts();

  it('covers every flowchart section', () => {
    expect(flowcharts.length).toBeGreaterThanOrEqual(26);
  });

  for (const [viewKey, budget] of Object.entries(BUDGETS)) {
    describe(viewKey, () => {
      const measured = flowcharts
        .filter(f => f.schema.views?.[viewKey])
        .map(f => ({ name: f.name, ...measureView(f.schema, viewKey), slanted: slantedSegments(f.schema, viewKey) }));

      it(`keeps lines out of boxes (budget ${budget.through})`, () => {
        const through = measured.flatMap(m => m.through.map(t => `${m.name}: ${t}`));
        expect(through.length, through.join('\n')).toBeLessThanOrEqual(budget.through);
      });

      it(`keeps lines from running on top of each other (budget ${budget.overlap}px)`, () => {
        const total = measured.reduce((sum, m) => sum + m.overlap, 0);
        const detail = measured.filter(m => m.overlap > 0).map(m => `${m.name}: ${m.overlap}px`).join('\n');
        expect(total, detail).toBeLessThanOrEqual(budget.overlap);
      });

      it('draws every segment straight (horizontal or vertical)', () => {
        const slanted = measured.filter(m => m.slanted > 0).map(m => `${m.name}: ${m.slanted}`);
        expect(slanted, slanted.join('\n')).toEqual([]);
      });
    });
  }
});
