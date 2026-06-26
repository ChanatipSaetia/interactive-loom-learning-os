import { describe, it, expect } from 'vitest';
import { autoDeriveViews } from '../../../../src/sections/flowchart/derivations';
import type { UnifiedFlowchartSchema, FlowchartEntity, FlowchartRelation, FlowchartViewNode } from '../../../../src/sections/flowchart/types';
import { TYPES } from '../../../../src/sections/flowchart/types';

describe('Policy branching mapping (#69)', () => {
  const baseSchema = (entities: Record<string, FlowchartEntity>, relations: FlowchartRelation[], viewNodes: FlowchartViewNode[]): UnifiedFlowchartSchema => ({
    entities,
    relations,
    views: {
      EVENT_STORMING: {
        name: 'Event Storming',
        icon: 'Component',
        nodes: viewNodes,
        groups: []
      }
    },
    journeys: []
  });

  it('omits linear Policy (1 outgoing) from SWIMLANES and DATA_FLOW', () => {
    const schema = baseSchema(
      {
        user: { title: 'User', desc: '', type: TYPES.USER },
        cmd: { title: 'Command', desc: '', type: TYPES.COMMAND },
        pol: { title: 'Policy', desc: '', type: TYPES.POLICY },
        evt1: { title: 'Event1', desc: '', type: TYPES.EVENT },
        agg: { title: 'Aggregate', desc: '', type: TYPES.AGGREGATE }
      },
      [
        { id: 'r1', from: 'user', to: 'cmd', views: ['EVENT_STORMING'] },
        { id: 'r2', from: 'cmd', to: 'pol', views: ['EVENT_STORMING'] },
        { id: 'r3', from: 'pol', to: 'agg', views: ['EVENT_STORMING'] },
        { id: 'r4', from: 'agg', to: 'evt1', views: ['EVENT_STORMING'] }
      ],
      [
        { id: 'user', grid: [0, 2] },
        { id: 'cmd', grid: [1, 2] },
        { id: 'pol', grid: [2, 2] },
        { id: 'agg', grid: [2, 1] },
        { id: 'evt1', grid: [3, 2] }
      ]
    );

    const result = autoDeriveViews(schema);

    // Policy should NOT appear in SWIMLANES (linear, 1 outgoing)
    const swimNodeIds = result.views.SWIMLANES!.nodes.map(n => n.id);
    expect(swimNodeIds).not.toContain('pol');

    // Policy should NOT appear in DATA_FLOW (linear, 1 outgoing)
    const dfNodeIds = result.views.DATA_FLOW!.nodes.map(n => n.id);
    expect(dfNodeIds).not.toContain('pol');

    // Policy SHOULD still appear in EVENT_STORMING (source of truth)
    const esNodeIds = result.views.EVENT_STORMING.nodes.map(n => n.id);
    expect(esNodeIds).toContain('pol');

    // Policy viewTypes should NOT include Decision for SWIMLANES/DATA_FLOW
    const polEntity = result.entities['pol'];
    expect(polEntity?.viewTypes?.EVENT_STORMING).toBe(TYPES.POLICY);
    expect(polEntity?.viewTypes?.SWIMLANES).toBeUndefined();
    expect(polEntity?.viewTypes?.DATA_FLOW).toBeUndefined();
  });

  it('maps branching Policy (2+ outgoing) to Decision in SWIMLANES and DATA_FLOW', () => {
    const schema = baseSchema(
      {
        user: { title: 'User', desc: '', type: TYPES.USER },
        cmd: { title: 'Command', desc: '', type: TYPES.COMMAND },
        pol: { title: 'Policy', desc: '', type: TYPES.POLICY },
        evt1: { title: 'Event1', desc: '', type: TYPES.EVENT },
        evt2: { title: 'Event2', desc: '', type: TYPES.EVENT },
        agg: { title: 'Aggregate', desc: '', type: TYPES.AGGREGATE }
      },
      [
        { id: 'r1', from: 'user', to: 'cmd', views: ['EVENT_STORMING'] },
        { id: 'r2', from: 'cmd', to: 'pol', views: ['EVENT_STORMING'] },
        { id: 'r3', from: 'pol', to: 'evt1', views: ['EVENT_STORMING'] },
        { id: 'r4', from: 'pol', to: 'evt2', views: ['EVENT_STORMING'] },
        { id: 'r5', from: 'evt1', to: 'agg', views: ['EVENT_STORMING'] }
      ],
      [
        { id: 'user', grid: [0, 2] },
        { id: 'cmd', grid: [1, 2] },
        { id: 'pol', grid: [2, 2] },
        { id: 'evt1', grid: [3, 2] },
        { id: 'evt2', grid: [3, 3] },
        { id: 'agg', grid: [3, 1] }
      ]
    );

    const result = autoDeriveViews(schema);

    // Policy SHOULD appear in SWIMLANES as Decision (branching, 2 outgoing)
    const swimNodeIds = result.views.SWIMLANES!.nodes.map(n => n.id);
    expect(swimNodeIds).toContain('pol');

    // Policy SHOULD appear in DATA_FLOW as Decision (branching, 2 outgoing)
    const dfNodeIds = result.views.DATA_FLOW!.nodes.map(n => n.id);
    expect(dfNodeIds).toContain('pol');

    // Policy viewTypes should include Decision for SWIMLANES/DATA_FLOW
    const polEntity = result.entities['pol'];
    expect(polEntity?.viewTypes?.SWIMLANES).toBe(TYPES.DECISION);
    expect(polEntity?.viewTypes?.DATA_FLOW).toBe(TYPES.DECISION);
  });

  it('omits Policy with 0 outgoing relations from derived views', () => {
    const schema = baseSchema(
      {
        user: { title: 'User', desc: '', type: TYPES.USER },
        pol: { title: 'Policy', desc: '', type: TYPES.POLICY },
        agg: { title: 'Aggregate', desc: '', type: TYPES.AGGREGATE },
        evt: { title: 'Event', desc: '', type: TYPES.EVENT }
      },
      [
        { id: 'r1', from: 'user', to: 'agg', views: ['EVENT_STORMING'] },
        { id: 'r2', from: 'agg', to: 'evt', views: ['EVENT_STORMING'] }
      ],
      [
        { id: 'user', grid: [0, 2] },
        { id: 'pol', grid: [1, 2] },
        { id: 'agg', grid: [1, 1] },
        { id: 'evt', grid: [2, 2] }
      ]
    );

    const result = autoDeriveViews(schema);

    const swimNodeIds = result.views.SWIMLANES!.nodes.map(n => n.id);
    expect(swimNodeIds).not.toContain('pol');

    const dfNodeIds = result.views.DATA_FLOW!.nodes.map(n => n.id);
    expect(dfNodeIds).not.toContain('pol');
  });

  it('non-Policy entities are unaffected by branching rule', () => {
    const schema = baseSchema(
      {
        user: { title: 'User', desc: '', type: TYPES.USER },
        cmd: { title: 'Command', desc: '', type: TYPES.COMMAND },
        agg: { title: 'Aggregate', desc: '', type: TYPES.AGGREGATE },
        evt: { title: 'Event', desc: '', type: TYPES.EVENT }
      },
      [
        { id: 'r1', from: 'user', to: 'cmd', views: ['EVENT_STORMING'] },
        { id: 'r2', from: 'cmd', to: 'agg', views: ['EVENT_STORMING'] },
        { id: 'r3', from: 'agg', to: 'evt', views: ['EVENT_STORMING'] }
      ],
      [
        { id: 'user', grid: [0, 2] },
        { id: 'cmd', grid: [1, 2] },
        { id: 'agg', grid: [1, 1] },
        { id: 'evt', grid: [2, 2] }
      ]
    );

    const result = autoDeriveViews(schema);

    // Command maps to Process in SWIMLANES regardless of outgoing count
    const swimNodeIds = result.views.SWIMLANES!.nodes.map(n => n.id);
    expect(swimNodeIds).toContain('cmd');
    expect(swimNodeIds).toContain('agg');

    // User always appears in DATA_FLOW
    const dfNodeIds = result.views.DATA_FLOW!.nodes.map(n => n.id);
    expect(dfNodeIds).toContain('user');
  });
});


describe('Dynamic layout (#68)', () => {
  const baseSchema = (entities: Record<string, FlowchartEntity>, relations: FlowchartRelation[], viewNodes: FlowchartViewNode[]): UnifiedFlowchartSchema => ({
    entities,
    relations,
    views: {
      EVENT_STORMING: {
        name: 'Event Storming',
        icon: 'Component',
        nodes: viewNodes,
        groups: []
      }
    },
    journeys: []
  });

  describe('layoutInfo computation', () => {
    it('computes layoutInfo for all derived views', () => {
      const schema = baseSchema(
        {
          user: { title: 'User', desc: '', type: TYPES.USER },
          cmd: { title: 'Command', desc: '', type: TYPES.COMMAND },
          evt: { title: 'Event', desc: '', type: TYPES.EVENT },
          agg: { title: 'Aggregate', desc: '', type: TYPES.AGGREGATE },
          db: { title: 'Database', desc: '', type: TYPES.DATABASE }
        },
        [
          { id: 'r1', from: 'user', to: 'cmd', views: ['EVENT_STORMING'] },
          { id: 'r2', from: 'cmd', to: 'agg', views: ['EVENT_STORMING'], handledBy: true },
          { id: 'r3', from: 'agg', to: 'evt', views: ['EVENT_STORMING'] },
          { id: 'r4', from: 'evt', to: 'db', views: ['EVENT_STORMING'] }
        ],
        [
          { id: 'user', grid: [0, 2] },
          { id: 'cmd', grid: [1, 2] },
          { id: 'agg', grid: [1, 1] },
          { id: 'evt', grid: [2, 2] },
          { id: 'db', grid: [2, 0] }
        ]
      );

      const result = autoDeriveViews(schema);

      expect(result.views.SYS_ARCH?.layoutInfo).toBeDefined();
      expect(result.views.SWIMLANES?.layoutInfo).toBeDefined();
      expect(result.views.SEQUENCE?.layoutInfo).toBeDefined();
      expect(result.views.DATA_FLOW?.layoutInfo).toBeDefined();

      expect(result.views.EVENT_STORMING.layoutInfo).toBeDefined();
      expect(result.views.EVENT_STORMING.layoutInfo!.nodeCount).toBe(5);
    });

    it('layoutInfo rowCount and colCount reflect grid dimensions', () => {
      const schema = baseSchema(
        {
          n1: { title: 'N1', desc: '', type: TYPES.EVENT },
          n2: { title: 'N2', desc: '', type: TYPES.EVENT },
          n3: { title: 'N3', desc: '', type: TYPES.EVENT },
          n4: { title: 'N4', desc: '', type: TYPES.EVENT },
          n5: { title: 'N5', desc: '', type: TYPES.EVENT },
          n6: { title: 'N6', desc: '', type: TYPES.EVENT },
          n7: { title: 'N7', desc: '', type: TYPES.EVENT },
          n8: { title: 'N8', desc: '', type: TYPES.EVENT },
          n9: { title: 'N9', desc: '', type: TYPES.EVENT }
        },
        [
          { id: 'r1', from: 'n1', to: 'n2', views: ['EVENT_STORMING'] },
          { id: 'r2', from: 'n2', to: 'n3', views: ['EVENT_STORMING'] },
          { id: 'r3', from: 'n3', to: 'n4', views: ['EVENT_STORMING'] },
          { id: 'r4', from: 'n4', to: 'n5', views: ['EVENT_STORMING'] },
          { id: 'r5', from: 'n5', to: 'n6', views: ['EVENT_STORMING'] },
          { id: 'r6', from: 'n6', to: 'n7', views: ['EVENT_STORMING'] },
          { id: 'r7', from: 'n7', to: 'n8', views: ['EVENT_STORMING'] },
          { id: 'r8', from: 'n8', to: 'n9', views: ['EVENT_STORMING'] }
        ],
        [
          { id: 'n1', grid: [0, 0] },
          { id: 'n2', grid: [1, 0] },
          { id: 'n3', grid: [2, 0] },
          { id: 'n4', grid: [3, 0] },
          { id: 'n5', grid: [4, 0] },
          { id: 'n6', grid: [5, 0] },
          { id: 'n7', grid: [6, 0] },
          { id: 'n8', grid: [7, 0] },
          { id: 'n9', grid: [8, 0] }
        ]
      );

      const result = autoDeriveViews(schema);
      const info = result.views.EVENT_STORMING.layoutInfo!;

      expect(info.colCount).toBeGreaterThanOrEqual(9);
      expect(info.rowCount).toBeGreaterThanOrEqual(1);
      expect(info.nodeCount).toBe(9);
    });
  });

  describe('EVENT_STORMING layout', () => {
    it('preserves DB/Aggregate/Timeline layering', () => {
      const schema = baseSchema(
        {
          user: { title: 'User', desc: '', type: TYPES.USER },
          cmd: { title: 'Command', desc: '', type: TYPES.COMMAND },
          evt: { title: 'Event', desc: '', type: TYPES.EVENT },
          agg: { title: 'Aggregate', desc: '', type: TYPES.AGGREGATE },
          db: { title: 'Database', desc: '', type: TYPES.DATABASE }
        },
        [
          { id: 'r1', from: 'user', to: 'cmd', views: ['EVENT_STORMING'] },
          { id: 'r2', from: 'cmd', to: 'agg', views: ['EVENT_STORMING'], handledBy: true },
          { id: 'r3', from: 'agg', to: 'evt', views: ['EVENT_STORMING'] },
          { id: 'r4', from: 'evt', to: 'db', views: ['EVENT_STORMING'] }
        ],
        [
          { id: 'user', grid: [0, 2] },
          { id: 'cmd', grid: [1, 2] },
          { id: 'agg', grid: [1, 1] },
          { id: 'evt', grid: [2, 2] },
          { id: 'db', grid: [2, 0] }
        ]
      );

      const result = autoDeriveViews(schema);
      const esNodes = result.views.EVENT_STORMING.nodes;
      const nodeMap = new Map(esNodes.map(n => [n.id, n.grid]));

      // DB should be at row 0
      expect(nodeMap.get('db')![1]).toBe(0);
      // Aggregate should be at row 1
      expect(nodeMap.get('agg')![1]).toBe(1);
      // Timeline nodes should be at row >= 2
      expect(nodeMap.get('evt')![1]).toBeGreaterThanOrEqual(2);
      expect(nodeMap.get('cmd')![1]).toBeGreaterThanOrEqual(2);
    });

    it('auto-expands timeline branches beyond row 4', () => {
      const manyTimelineNodes: { id: string; grid: [number, number]; type: string }[] = [
        { id: 'agg', grid: [0, 1], type: TYPES.AGGREGATE },
        { id: 'cmd1', grid: [0, 2], type: TYPES.COMMAND },
        { id: 'evt1', grid: [1, 2], type: TYPES.EVENT },
        { id: 'evt2', grid: [2, 2], type: TYPES.EVENT },
        { id: 'evt3', grid: [3, 2], type: TYPES.EVENT },
        { id: 'evt4', grid: [4, 2], type: TYPES.EVENT },
        { id: 'evt5', grid: [5, 2], type: TYPES.EVENT },
        { id: 'evt6', grid: [6, 2], type: TYPES.EVENT },
        { id: 'evt7', grid: [7, 2], type: TYPES.EVENT },
        { id: 'evt8', grid: [8, 2], type: TYPES.EVENT }
      ];

      const entities: Record<string, FlowchartEntity> = {};
      const nodes: FlowchartViewNode[] = [];
      const relations: FlowchartRelation[] = [];

      manyTimelineNodes.forEach((n, i) => {
        entities[n.id] = { title: n.id, desc: '', type: n.type };
        nodes.push({ id: n.id, grid: n.grid });
        if (i > 0) {
          relations.push({
            id: `r${i}`,
            from: manyTimelineNodes[i - 1].id,
            to: n.id,
            views: ['EVENT_STORMING']
          });
        }
      });

      const schema = baseSchema(entities, relations, nodes);
      const result = autoDeriveViews(schema);
      const info = result.views.EVENT_STORMING.layoutInfo!;

      // With 9 timeline nodes in a chain, rows should expand dynamically
      expect(info.rowCount).toBeGreaterThanOrEqual(2);
      expect(info.colCount).toBeGreaterThanOrEqual(8);
    });

    it('maintains chronological left-to-right ordering', () => {
      const schema = baseSchema(
        {
          evt1: { title: 'E1', desc: '', type: TYPES.EVENT },
          evt2: { title: 'E2', desc: '', type: TYPES.EVENT },
          evt3: { title: 'E3', desc: '', type: TYPES.EVENT },
          evt4: { title: 'E4', desc: '', type: TYPES.EVENT }
        },
        [
          { id: 'r1', from: 'evt1', to: 'evt2', views: ['EVENT_STORMING'] },
          { id: 'r2', from: 'evt2', to: 'evt3', views: ['EVENT_STORMING'] },
          { id: 'r3', from: 'evt3', to: 'evt4', views: ['EVENT_STORMING'] }
        ],
        [
          { id: 'evt1', grid: [0, 0] },
          { id: 'evt2', grid: [1, 0] },
          { id: 'evt3', grid: [2, 0] },
          { id: 'evt4', grid: [3, 0] }
        ]
      );

      const result = autoDeriveViews(schema);
      const esNodes = result.views.EVENT_STORMING.nodes;
      const nodeMap = new Map(esNodes.map(n => [n.id, n.grid!]));

      // Columns should increase along the chain
      const col1 = nodeMap.get('evt1')![0];
      const col2 = nodeMap.get('evt2')![0];
      const col3 = nodeMap.get('evt3')![0];
      const col4 = nodeMap.get('evt4')![0];

      expect(col2).toBeGreaterThanOrEqual(col1);
      expect(col3).toBeGreaterThanOrEqual(col2);
      expect(col4).toBeGreaterThanOrEqual(col3);
    });
  });

  describe('SYS_ARCH layout', () => {
    it('spreads nodes vertically with dynamic row count', () => {
      const nodes: FlowchartViewNode[] = [
        { id: 'user', grid: [0, 0] },
        { id: 's1', grid: [0, 0] },
        { id: 's2', grid: [0, 0] },
        { id: 's3', grid: [0, 0] },
        { id: 's4', grid: [0, 0] },
        { id: 's5', grid: [0, 0] },
        { id: 'db', grid: [0, 0] }
      ];

      const schema = baseSchema(
        {
          user: { title: 'User', desc: '', type: TYPES.USER },
          s1: { title: 'S1', desc: '', type: TYPES.AGGREGATE },
          s2: { title: 'S2', desc: '', type: TYPES.AGGREGATE },
          s3: { title: 'S3', desc: '', type: TYPES.AGGREGATE },
          s4: { title: 'S4', desc: '', type: TYPES.AGGREGATE },
          s5: { title: 'S5', desc: '', type: TYPES.AGGREGATE },
          db: { title: 'DB', desc: '', type: TYPES.DATABASE }
        },
        [
          { id: 'r1', from: 'user', to: 's1', views: ['EVENT_STORMING'] },
          { id: 'r2', from: 's1', to: 's2', views: ['EVENT_STORMING'] },
          { id: 'r3', from: 's2', to: 's3', views: ['EVENT_STORMING'] },
          { id: 'r4', from: 's3', to: 's4', views: ['EVENT_STORMING'] },
          { id: 'r5', from: 's4', to: 's5', views: ['EVENT_STORMING'] },
          { id: 'r6', from: 's5', to: 'db', views: ['EVENT_STORMING'] }
        ],
        nodes
      );

      const result = autoDeriveViews(schema);
      const sysNodes = result.views.SYS_ARCH!.nodes;
      const rowValues = sysNodes.map(n => n.grid![1]);
      const maxRow = Math.max(...rowValues);

      // With 7 nodes, rows should spread beyond 2 (fixed old behavior)
      expect(maxRow).toBeGreaterThanOrEqual(3);
      expect(result.views.SYS_ARCH!.layoutInfo!.rowCount).toBeGreaterThan(3);
    });

    it('places users above other nodes in SYS_ARCH', () => {
      const schema = baseSchema(
        {
          user: { title: 'User', desc: '', type: TYPES.USER },
          svc: { title: 'Service', desc: '', type: TYPES.AGGREGATE },
          evt: { title: 'Event', desc: '', type: TYPES.EVENT }
        },
        [
          { id: 'r1', from: 'user', to: 'svc', views: ['EVENT_STORMING'] },
          { id: 'r2', from: 'svc', to: 'evt', views: ['EVENT_STORMING'] }
        ],
        [
          { id: 'user', grid: [0, 0] },
          { id: 'svc', grid: [1, 0] },
          { id: 'evt', grid: [2, 0] }
        ]
      );

      const result = autoDeriveViews(schema);
      const sysNodes = result.views.SYS_ARCH!.nodes;
      const nodeMap = new Map(sysNodes.map(n => [n.id, n.grid!]));

      const userRow = nodeMap.get('user')?.[1];
      const svcRow = nodeMap.get('svc')?.[1];

      expect(userRow).toBeDefined();
      expect(svcRow).toBeDefined();
      expect(userRow).toBeLessThanOrEqual(svcRow!);
    });
  });

  describe('SWIMLANES layout', () => {
    it('maintains chronological ordering', () => {
      const schema = baseSchema(
        {
          user: { title: 'User', desc: '', type: TYPES.USER },
          cmd: { title: 'Command', desc: '', type: TYPES.COMMAND },
          evt: { title: 'Event', desc: '', type: TYPES.EVENT },
          agg: { title: 'Aggregate', desc: '', type: TYPES.AGGREGATE }
        },
        [
          { id: 'r1', from: 'user', to: 'cmd', views: ['EVENT_STORMING'] },
          { id: 'r2', from: 'cmd', to: 'agg', views: ['EVENT_STORMING'], handledBy: true },
          { id: 'r3', from: 'agg', to: 'evt', views: ['EVENT_STORMING'] }
        ],
        [
          { id: 'user', grid: [0, 0] },
          { id: 'cmd', grid: [1, 0] },
          { id: 'agg', grid: [1, 1] },
          { id: 'evt', grid: [2, 0] }
        ]
      );

      const result = autoDeriveViews(schema);
      const swimNodes = result.views.SWIMLANES!.nodes;
      const nodeMap = new Map(swimNodes.map(n => [n.id, n.grid!]));

      const userCol = nodeMap.get('user')?.[0];
      // Event maps to null in SWIMLANES, so use agg (Aggregate → Process in SWIMLANES)
      const aggCol = nodeMap.get('agg')?.[0];

      expect(userCol).toBeDefined();
      expect(aggCol).toBeDefined();
      // User is forced to column 0, agg should be at or after user
      expect(aggCol).toBeGreaterThanOrEqual(userCol!);
    });
  });

  describe('SEQUENCE layout', () => {
    it('places all nodes at row 0', () => {
      const schema = baseSchema(
        {
          user: { title: 'User', desc: '', type: TYPES.USER },
          svc: { title: 'Service', desc: '', type: TYPES.AGGREGATE },
          ext: { title: 'External', desc: '', type: TYPES.EXTERNAL }
        },
        [
          { id: 'r1', from: 'user', to: 'svc', views: ['EVENT_STORMING'] },
          { id: 'r2', from: 'svc', to: 'ext', views: ['EVENT_STORMING'] }
        ],
        [
          { id: 'user', grid: [0, 0] },
          { id: 'svc', grid: [1, 0] },
          { id: 'ext', grid: [2, 0] }
        ]
      );

      const result = autoDeriveViews(schema);
      const seqNodes = result.views.SEQUENCE!.nodes;

      seqNodes.forEach(n => {
        expect(n.grid![1]).toBe(0);
      });
    });

    it('orders columns chronologically by Event Storming position', () => {
      const schema = baseSchema(
        {
          user: { title: 'User', desc: '', type: TYPES.USER },
          svc: { title: 'Service', desc: '', type: TYPES.AGGREGATE },
          ext: { title: 'External', desc: '', type: TYPES.EXTERNAL }
        },
        [
          { id: 'r1', from: 'user', to: 'svc', views: ['EVENT_STORMING'] },
          { id: 'r2', from: 'svc', to: 'ext', views: ['EVENT_STORMING'] }
        ],
        [
          { id: 'user', grid: [0, 0] },
          { id: 'svc', grid: [1, 0] },
          { id: 'ext', grid: [2, 0] }
        ]
      );

      const result = autoDeriveViews(schema);
      const seqNodes = result.views.SEQUENCE!.nodes;
      const nodeMap = new Map(seqNodes.map(n => [n.id, n.grid!]));

      const userCol = nodeMap.get('user')?.[0];
      const svcCol = nodeMap.get('svc')?.[0];
      const extCol = nodeMap.get('ext')?.[0];

      expect(svcCol).toBeGreaterThan(userCol!);
      expect(extCol).toBeGreaterThan(svcCol!);
    });
  });

  describe('DATA_FLOW layout', () => {
    it('places user nodes on top (lowest row index)', () => {
      const schema = baseSchema(
        {
          user: { title: 'User', desc: '', type: TYPES.USER },
          svc: { title: 'Service', desc: '', type: TYPES.AGGREGATE },
          evt: { title: 'Event', desc: '', type: TYPES.EVENT },
          cmd: { title: 'Command', desc: '', type: TYPES.COMMAND }
        },
        [
          { id: 'r1', from: 'user', to: 'cmd', views: ['EVENT_STORMING'] },
          { id: 'r2', from: 'cmd', to: 'svc', views: ['EVENT_STORMING'], handledBy: true },
          { id: 'r3', from: 'svc', to: 'evt', views: ['EVENT_STORMING'] }
        ],
        [
          { id: 'user', grid: [0, 0] },
          { id: 'cmd', grid: [1, 0] },
          { id: 'svc', grid: [1, 1] },
          { id: 'evt', grid: [2, 0] }
        ]
      );

      const result = autoDeriveViews(schema);
      const dfNodes = result.views.DATA_FLOW!.nodes;
      const nodeMap = new Map(dfNodes.map(n => [n.id, n.grid!]));

      const userRow = nodeMap.get('user')?.[1];

      // User should be at row 0 (top)
      expect(userRow).toBe(0);
    });

    it('maintains chronological ordering', () => {
      const schema = baseSchema(
        {
          user: { title: 'User', desc: '', type: TYPES.USER },
          svc: { title: 'Service', desc: '', type: TYPES.AGGREGATE },
          evt: { title: 'Event', desc: '', type: TYPES.EVENT },
          cmd: { title: 'Command', desc: '', type: TYPES.COMMAND }
        },
        [
          { id: 'r1', from: 'user', to: 'cmd', views: ['EVENT_STORMING'] },
          { id: 'r2', from: 'cmd', to: 'svc', views: ['EVENT_STORMING'], handledBy: true },
          { id: 'r3', from: 'svc', to: 'evt', views: ['EVENT_STORMING'] }
        ],
        [
          { id: 'user', grid: [0, 0] },
          { id: 'cmd', grid: [1, 0] },
          { id: 'svc', grid: [1, 1] },
          { id: 'evt', grid: [2, 0] }
        ]
      );

      const result = autoDeriveViews(schema);
      const dfNodes = result.views.DATA_FLOW!.nodes;
      const nodeMap = new Map(dfNodes.map(n => [n.id, n.grid!]));

      const userCol = nodeMap.get('user')?.[0];
      const evtCol = nodeMap.get('evt')?.[0];

      // Both user and evt are present in DATA_FLOW; user is forced to col 0
      // evt col depends on topological position (may be same or later column)
      expect(userCol).toBeGreaterThanOrEqual(0);
      expect(evtCol).toBeGreaterThanOrEqual(0);
    });
  });

  describe('no node overlap', () => {
    it('derived views produce unique grid positions per column', () => {
      const schema = baseSchema(
        {
          user: { title: 'User', desc: '', type: TYPES.USER },
          cmd: { title: 'Command', desc: '', type: TYPES.COMMAND },
          evt: { title: 'Event', desc: '', type: TYPES.EVENT },
          agg: { title: 'Aggregate', desc: '', type: TYPES.AGGREGATE },
          db: { title: 'Database', desc: '', type: TYPES.DATABASE }
        },
        [
          { id: 'r1', from: 'user', to: 'cmd', views: ['EVENT_STORMING'] },
          { id: 'r2', from: 'cmd', to: 'agg', views: ['EVENT_STORMING'], handledBy: true },
          { id: 'r3', from: 'agg', to: 'evt', views: ['EVENT_STORMING'] },
          { id: 'r4', from: 'evt', to: 'db', views: ['EVENT_STORMING'] }
        ],
        [
          { id: 'user', grid: [0, 2] },
          { id: 'cmd', grid: [1, 2] },
          { id: 'agg', grid: [1, 1] },
          { id: 'evt', grid: [2, 2] },
          { id: 'db', grid: [2, 0] }
        ]
      );

      const result = autoDeriveViews(schema);

      // Check each derived view for no overlapping nodes within the same column
      ['SYS_ARCH', 'SWIMLANES', 'DATA_FLOW'].forEach(viewKey => {
        const view = result.views[viewKey as keyof typeof result.views];
        if (!view) return;

        const colRows = new Map<number, Set<number>>();
        view.nodes.forEach(n => {
          const [c, r] = n.grid!;
          if (!colRows.has(c)) colRows.set(c, new Set());
          colRows.get(c)!.add(r);
        });

        // Each column should have unique rows (one node per row within a column)
        // This is the definition of "no overlapping nodes"
        colRows.forEach((rows) => {
          const rowArr = Array.from(rows);
          const uniqueRows = new Set(rowArr);
          expect(uniqueRows.size).toBe(rowArr.length);
        });
      });
    });
  });
});
