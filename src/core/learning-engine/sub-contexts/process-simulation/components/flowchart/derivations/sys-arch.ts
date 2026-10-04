/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import type { UnifiedFlowchartSchema, FlowchartRelation, FlowchartViewNode, FlowchartEntity } from '../types';
import { TYPES, MASTER_MAPPING_MATRIX } from '../types';
import { getEntityType, deriveRelations, computeLayoutInfo } from './utils';
import { findEventProducer } from './sequence/commands';

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

  // sendsTo messages are not in Event Storming, so add them here: producer → recipient,
  // labelled with the event (one label per direction, like the other edges)
  schema.relations.filter(r => r.sendsTo).forEach(link => {
    const producer = findEventProducer(schema, link.from, getCollapsedId);
    const recipient = getCollapsedId(link.to);
    if (!producer || producer === recipient || !localAddedNodes.has(producer) || !localAddedNodes.has(recipient)) return;
    const label = schema.entities[link.from]?.title ?? '';
    const same = sysRelations.find(r => r.from === producer && r.to === recipient);
    const opposite = sysRelations.find(r => r.from === recipient && r.to === producer);
    if (same) {
      if (!same.label) same.label = label;
    } else if (opposite) {
      opposite.bidirectional = true;
      if (!opposite.reverseLabel) opposite.reverseLabel = label;
    } else {
      sysRelations.push({
        id: `derived_sys_arch_rel_${producer}_${recipient}`,
        from: producer,
        to: recipient,
        views: ['SYS_ARCH'],
        label,
        chronologicalIndex: schema.relations.indexOf(link),
      });
    }
  });

  const updatedRelations = [
    ...schema.relations.filter(r => !r.views || !r.views.includes('SYS_ARCH')),
    ...sysRelations
  ];

  const aggregateIds = sysNodes
    .map(n => n.id)
    .filter(id => {
      const ent = schema.entities[id];
      const type = getEntityType(ent);
      return ent && (type === TYPES.AGGREGATE || type === TYPES.SERVICE || type === TYPES.DATABASE);
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
/**
 * Canvas the row count is tuned for (px, inline section minus the floating
 * controls), with the view's column/row pitch and node size, so the chosen
 * shape is the one that shows largest on screen.
 */
const REFERENCE_VIEW = { width: 1100, height: 420 };
const PITCH_PX = { col: 280, row: 180 };
const NODE_PX = { w: 140, h: 100 };

/**
 * How many rows the diagram uses. The block and each side column wrap to that
 * height (block: ceil(n / rows) columns; a side with k nodes: ceil(k / rows)
 * columns), so a tall side column makes the block taller rather than leaving
 * it as a short strip beside a long list. Picks the height whose overall shape
 * fits the reference view at the largest scale; ties go to fewer rows.
 */
function chooseRows(internalCount: number, actorCount: number, externalCount: number) {
  const most = Math.max(1, internalCount, actorCount, externalCount);
  let best = { rows: 1, scale: -Infinity };
  for (let target = 1; target <= most; target++) {
    const blockCols = internalCount ? Math.ceil(internalCount / target) : 0;
    const actorCols = actorCount ? Math.ceil(actorCount / target) : 0;
    const externalCols = externalCount ? Math.ceil(externalCount / target) : 0;
    const rows = Math.max(
      1,
      blockCols ? Math.ceil(internalCount / blockCols) : 0,
      actorCols ? Math.ceil(actorCount / actorCols) : 0,
      externalCols ? Math.ceil(externalCount / externalCols) : 0,
    );
    const cols = blockCols + actorCols + externalCols;
    const width = cols * PITCH_PX.col - (PITCH_PX.col - NODE_PX.w);
    const height = rows * PITCH_PX.row - (PITCH_PX.row - NODE_PX.h);
    const scale = Math.min(REFERENCE_VIEW.width / width, REFERENCE_VIEW.height / height);
    if (scale > best.scale + 1e-9) best = { rows: target, scale };
  }
  return best.rows;
}

/**
 * Lays the architecture view out as three tiers, left to right:
 *
 *   actors  │  System Boundary (internal systems)  │  external systems
 *
 *  - The diagram height is chosen first (chooseRows): the block and both side
 *    tiers wrap to it, so their heights match.
 *  - Internal systems are ordered by flow (each one after the systems that hand
 *    off to it; loops are set aside first) and wrap into rows that each read
 *    left to right, so long pipelines become a compact block instead of a strip.
 *  - Actors and external systems sit level with the systems they connect to
 *    (average row). A side with more nodes than rows splits into several
 *    columns, dealt alternately (inner, outer, …) in row order so each node
 *    stays near its row; then each column is nudged apart so none overlap.
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
  const targetRows = chooseRows(internals.length, actors.length, externals.length);
  const block = [...internals].sort((a, b) => layer.get(a)! - layer.get(b)! || byFirstSeen(a, b));
  const blockCols = Math.max(1, Math.ceil(block.length / targetRows));
  const actorCols = actors.length ? Math.ceil(actors.length / targetRows) : 0;
  const externalCols = externals.length ? Math.ceil(externals.length / targetRows) : 0;
  const grid = new Map<string, [number, number]>();
  const blockLeft = actorCols * COLUMN_PITCH;
  block.forEach((id, i) => grid.set(id, [blockLeft + (i % blockCols) * COLUMN_PITCH, Math.floor(i / blockCols)]));
  const blockRight = blockLeft + (blockCols - 1) * COLUMN_PITCH;

  // --- 3. Side columns: level with what they connect to, then nudged apart ---
  const neighbours = new Map<string, string[]>(nodeIds.map(id => [id, []]));
  edges.forEach(e => {
    neighbours.get(e.from)!.push(e.to);
    neighbours.get(e.to)!.push(e.from);
  });
  // `cols` runs from the column next to the block outwards
  const stack = (ids: string[], cols: number[], fallbackOrder: (a: string, b: string) => number) => {
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

    // Deal into the columns in turn, so every column covers the full height
    cols.forEach((col, c) => {
      const inColumn = wanted.filter((_, i) => i % cols.length === c);
      const placed: number[] = [];
      inColumn.forEach((w, i) => placed.push(i === 0 ? w.row : Math.max(w.row, placed[i - 1] + STACK_GAP)));
      // Nudging only pushes down; shift back so the column stays centred on where it wanted to be
      const drift = inColumn.reduce((sum, w, i) => sum + placed[i] - w.row, 0) / Math.max(1, inColumn.length);
      inColumn.forEach((w, i) => grid.set(w.id, [col, placed[i] - drift]));
    });
  };
  const columnsFrom = (start: number, count: number, step: number) =>
    Array.from({ length: count }, (_, i) => start + i * step);
  const actorColumns = columnsFrom(blockLeft - COLUMN_PITCH, actorCols, -COLUMN_PITCH);
  const externalColumns = columnsFrom(blockRight + COLUMN_PITCH, externalCols, COLUMN_PITCH);

  // Externals are placed first when actors talk to them directly, so actors can line up with them too
  stack(externals, externalColumns, byFirstSeen);
  stack(actors, actorColumns, byFirstSeen);
  // Externals chained to each other (A → B) only now see each other's rows; settle once more
  stack(externals, externalColumns, byFirstSeen);

  const minRow = Math.min(...[...grid.values()].map(([, r]) => r));
  const minCol = Math.min(...[...grid.values()].map(([c]) => c));
  return nodes.map(n => {
    const [c, r] = grid.get(n.id) ?? [0, 0];
    return { ...n, grid: [c - minCol, r - minRow] as [number, number] };
  });
}
