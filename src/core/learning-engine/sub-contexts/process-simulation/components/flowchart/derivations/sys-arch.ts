/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import type { UnifiedFlowchartSchema, FlowchartRelation, FlowchartViewNode, FlowchartEntity } from '../types';
import { TYPES, MASTER_MAPPING_MATRIX } from '../types';
import { getEntityType, deriveRelations, computeLayoutInfo } from './utils';

export function deriveSysArch(
  schema: UnifiedFlowchartSchema,
  getCollapsedId: (id: string) => string,
  getESNode: (id: string) => FlowchartViewNode | undefined
) {
  const sysNodes: FlowchartViewNode[] = [];
  const localAddedNodes = new Set<string>();

  Object.entries(schema.entities).forEach(([id, entity]) => {
    const type = getEntityType(entity);
    const esNode = getESNode(id);
    if (!esNode) return;

    const sysType = MASTER_MAPPING_MATRIX[type]?.SYS_ARCH;
    if (sysType) {
      const collapsedId = getCollapsedId(id);
      if (localAddedNodes.has(collapsedId)) return;
      localAddedNodes.add(collapsedId);

      sysNodes.push({
        id: collapsedId,
        grid: [esNode.grid ? esNode.grid[0] : 0, 0]
      });
    }
  });

  const getSysArchLabel = (pathNodeIds: string[], _startId: string): { label: string } => {
    const cmdNode = pathNodeIds.find(id => getEntityType(schema.entities[id]) === TYPES.COMMAND);
    const evtNode = pathNodeIds.find(id => getEntityType(schema.entities[id]) === TYPES.EVENT);

    if (cmdNode && evtNode) {
      return { label: `${schema.entities[cmdNode].title} / ${schema.entities[evtNode].title}` };
    }
    if (cmdNode) return { label: schema.entities[cmdNode].title };
    if (evtNode) return { label: schema.entities[evtNode].title };

    const lastNode = pathNodeIds[pathNodeIds.length - 1];
    if (lastNode && schema.entities[lastNode]) {
      return { label: schema.entities[lastNode].title };
    }
    return { label: '' };
  };

  const sysRelations = deriveRelations(schema, 'SYS_ARCH', localAddedNodes, getSysArchLabel);

  const updatedRelations = [
    ...schema.relations.filter(r => !r.views || !r.views.includes('SYS_ARCH')),
    ...sysRelations
  ];

  const aggregateIds = sysNodes
    .map(n => n.id)
    .filter(id => {
      const ent = schema.entities[id];
      const type = getEntityType(ent);
      return ent && (type === TYPES.AGGREGATE || type === TYPES.DATABASE);
    });

  const sysGroups = aggregateIds.length > 0 ? [
    {
      id: 'sys_boundary',
      title: 'System Boundary',
      nodeIds: aggregateIds,
      color: 'color-mix(in srgb, var(--ctp-green) 5%, transparent)',
      borderColor: 'var(--ctp-green)',
      textColor: 'var(--ctp-green)'
    }
  ] : [];

  const nodeIds = sysNodes.map(n => n.id);
  const nodeSet = new Set(nodeIds);
  const laidOutSysNodes = layoutSysArch(sysNodes, nodeIds, nodeSet, updatedRelations, 'SYS_ARCH', schema.entities);

  return {
    nodes: laidOutSysNodes,
    groups: sysGroups,
    relations: updatedRelations,
    layoutInfo: computeLayoutInfo(laidOutSysNodes)
  };
}

/** Grid units between neighbouring columns (one unit is a node width, so 2 leaves a node-wide channel). */
const COLUMN_PITCH = 2;
/** Minimum distance between nodes stacked in the actor or external column (grid rows). */
const STACK_GAP = 1;
/** Rough width:height the internal block aims for when it wraps into rows. */
const BLOCK_ASPECT = 1.5;

/**
 * Lays the architecture view out as three tiers, left to right:
 *
 *   actors  │  System Boundary (internal systems)  │  external systems
 *
 *  - Internal systems are ordered by flow (each one after the systems that hand
 *    off to it; loops are set aside first) and wrap into rows that each read
 *    left to right, so long pipelines become a compact block instead of a strip.
 *  - Actors and external systems are stacked in their columns level with the
 *    systems they connect to (average row), then nudged apart so none overlap.
 */
export function layoutSysArch(
  nodes: FlowchartViewNode[],
  nodeIds: string[],
  _nodeSet: Set<string>,
  relations: FlowchartRelation[],
  _viewKey: string,
  entities: Record<string, FlowchartEntity>
): FlowchartViewNode[] {
  const nodeSet = new Set(nodeIds);
  const typeOf = (id: string) => getEntityType(entities[id]);
  const actors = nodeIds.filter(id => typeOf(id) === TYPES.USER);
  const externals = nodeIds.filter(id => typeOf(id) === TYPES.EXTERNAL);
  const internals = nodeIds.filter(id => typeOf(id) !== TYPES.USER && typeOf(id) !== TYPES.EXTERNAL);
  const actorSet = new Set(actors);

  const edges = relations
    .filter(r => r.views?.includes('SYS_ARCH') && r.from !== r.to && nodeSet.has(r.from) && nodeSet.has(r.to))
    .sort((a, b) => (a.chronologicalIndex ?? 999) - (b.chronologicalIndex ?? 999));

  // When the story first touches each node; ties keep declaration order
  const firstSeen = new Map<string, number>();
  edges.forEach((e, idx) => {
    [e.from, e.to].forEach(id => { if (!firstSeen.has(id)) firstSeen.set(id, idx); });
  });
  const declared = new Map(nodeIds.map((id, idx) => [id, idx]));
  const byFirstSeen = (a: string, b: string) =>
    (firstSeen.get(a) ?? Infinity) - (firstSeen.get(b) ?? Infinity) || declared.get(a)! - declared.get(b)!;

  // --- 1. Flow order of systems: longest path over hand-offs, loops removed by DFS ---
  const systems = nodeIds.filter(id => !actorSet.has(id));
  const systemEdges = edges.filter(e => !actorSet.has(e.from) && !actorSet.has(e.to));
  const out = new Map<string, FlowchartRelation[]>(systems.map(id => [id, []]));
  systemEdges.forEach(e => out.get(e.from)!.push(e));
  const back = new Set<FlowchartRelation>();
  const visited = new Set<string>();
  const onStack = new Set<string>();
  const visit = (id: string) => {
    visited.add(id);
    onStack.add(id);
    for (const e of out.get(id)!) {
      if (onStack.has(e.to)) back.add(e);
      else if (!visited.has(e.to)) visit(e.to);
    }
    onStack.delete(id);
  };
  [...systems].sort(byFirstSeen).forEach(id => { if (!visited.has(id)) visit(id); });
  const forward = systemEdges.filter(e => !back.has(e));
  const layer = new Map<string, number>();
  const layerOf = (id: string, guard = new Set<string>()): number => {
    if (layer.has(id)) return layer.get(id)!;
    guard.add(id);
    const preds = forward.filter(e => e.to === id && !guard.has(e.from));
    const value = preds.length === 0 ? 0 : Math.max(...preds.map(e => layerOf(e.from, guard) + 1));
    layer.set(id, value);
    return value;
  };
  systems.forEach(id => layerOf(id));

  // --- 2. Internal block: flow order, wrapped into rows that read left to right ---
  const block = [...internals].sort((a, b) => layer.get(a)! - layer.get(b)! || byFirstSeen(a, b));
  const blockCols = Math.max(1, Math.min(block.length, Math.ceil(Math.sqrt(block.length * BLOCK_ASPECT))));
  const grid = new Map<string, [number, number]>();
  const blockLeft = actors.length > 0 ? COLUMN_PITCH : 0;
  block.forEach((id, i) => grid.set(id, [blockLeft + (i % blockCols) * COLUMN_PITCH, Math.floor(i / blockCols)]));
  const blockRight = blockLeft + (blockCols - 1) * COLUMN_PITCH;

  // --- 3. Side columns: level with what they connect to, then nudged apart ---
  const neighbours = new Map<string, string[]>(nodeIds.map(id => [id, []]));
  edges.forEach(e => {
    neighbours.get(e.from)!.push(e.to);
    neighbours.get(e.to)!.push(e.from);
  });
  const stack = (ids: string[], col: number, fallbackOrder: (a: string, b: string) => number) => {
    const wanted = ids.map(id => {
      const rows = neighbours.get(id)!.filter(n => grid.has(n)).map(n => grid.get(n)![1]);
      return { id, row: rows.length ? rows.reduce((sum, r) => sum + r, 0) / rows.length : Infinity };
    });
    // Unconnected (or only connected to the other side column) go after the rest
    const known = wanted.filter(w => isFinite(w.row));
    const maxKnown = known.length ? Math.max(...known.map(w => w.row)) : -STACK_GAP;
    wanted.filter(w => !isFinite(w.row)).sort((a, b) => fallbackOrder(a.id, b.id))
      .forEach((w, i) => { w.row = maxKnown + STACK_GAP * (i + 1); });
    wanted.sort((a, b) => a.row - b.row || fallbackOrder(a.id, b.id));

    const placed: number[] = [];
    wanted.forEach((w, i) => placed.push(i === 0 ? w.row : Math.max(w.row, placed[i - 1] + STACK_GAP)));
    // Nudging only pushes down; shift back so the column stays centred on where it wanted to be
    const drift = wanted.reduce((sum, w, i) => sum + placed[i] - w.row, 0) / Math.max(1, wanted.length);
    wanted.forEach((w, i) => grid.set(w.id, [col, placed[i] - drift]));
  };

  // Externals are placed first when actors talk to them directly, so actors can line up with them too
  stack(externals, blockRight + COLUMN_PITCH, byFirstSeen);
  stack(actors, 0, byFirstSeen);
  // Externals chained to each other (A → B) only now see each other's rows; settle once more
  stack(externals, blockRight + COLUMN_PITCH, byFirstSeen);

  const minRow = Math.min(...[...grid.values()].map(([, r]) => r));
  return nodes.map(n => {
    const [c, r] = grid.get(n.id) ?? [0, 0];
    return { ...n, grid: [c, r - minRow] as [number, number] };
  });
}
