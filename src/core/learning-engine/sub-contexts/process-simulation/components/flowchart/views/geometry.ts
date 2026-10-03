/* eslint-disable @typescript-eslint/no-explicit-any */
import { NODE_W, NODE_H, TYPES } from '../types';
import type { UnifiedFlowchartSchema, FlowchartViewConfig, FlowchartViewNode } from '../types';
import { computeDynamicSpacing, routeManhattanPath, disambiguateAndBridgePaths } from './layout-utils';

/*
 * View geometry, independent of React: grid spacing, node pixel positions and
 * edge routing. FlowchartView renders from these; tests use them to check
 * layouts (e.g. that no edge passes through a node).
 */

// Views whose timeline reads left-to-right. In these, edges between flow nodes
// (Command/Event/Policy and their per-view equivalents) should leave the
// right side of the source and enter the left side of the target.
const HORIZONTAL_FLOW_VIEWS = new Set(['EVENT_STORMING', 'SWIMLANES', 'DATA_FLOW']);

// The per-view node types that participate in the horizontal timeline flow.
const FLOW_TYPES_BY_VIEW: Record<string, Set<string>> = {
  EVENT_STORMING: new Set([TYPES.COMMAND, TYPES.EVENT, TYPES.POLICY]),
  SWIMLANES: new Set([TYPES.PROCESS, TYPES.DECISION]),
  DATA_FLOW: new Set([TYPES.DATA_OBJECT, TYPES.DECISION]),
};

export interface ViewSpacing { colSpacing: number; rowSpacing: number; offsetX: number; offsetY: number }
export type PositionedNode = FlowchartViewNode & { x: number; y: number };

export function getViewSpacing(view: FlowchartViewConfig | undefined, viewKey: string): ViewSpacing {
  if (!view) return { colSpacing: 140, rowSpacing: 150, offsetX: 100, offsetY: 100 };
  const defaults: Record<string, { colSpacing: number; rowSpacing: number; offsetX: number; offsetY: number }> = {
    EVENT_STORMING: { colSpacing: 140, rowSpacing: 160, offsetX: 60, offsetY: 50 },
    STATE_MACHINE: { colSpacing: 140, rowSpacing: 150, offsetX: 60, offsetY: 80 },
    // Rows leave an 80px channel between boxes so hand-offs and loops can pass between rows
    SYS_ARCH: { colSpacing: 140, rowSpacing: 180, offsetX: 80, offsetY: 100 },
    DATA_FLOW: { colSpacing: 140, rowSpacing: 130, offsetX: 100, offsetY: 100 },
    SWIMLANES: { colSpacing: 110, rowSpacing: 100, offsetX: 160, offsetY: 75 },
    SEQUENCE: { colSpacing: 100, rowSpacing: 48, offsetX: 60, offsetY: 80 },
  };
  const base = defaults[viewKey] || { colSpacing: 140, rowSpacing: 150, offsetX: 100, offsetY: 100 };
  return view.layoutInfo
    ? computeDynamicSpacing(view.layoutInfo, base, viewKey)
    : base;
}

export function positionViewNodes(view: FlowchartViewConfig | undefined, spacing: ViewSpacing, isSequenceView: boolean): PositionedNode[] {
  if (!view || isSequenceView) return [];
  return view.nodes.map(n => ({
    ...n,
    x: n.grid ? n.grid[0] * spacing.colSpacing + spacing.offsetX : (n.x !== undefined ? n.x : 0),
    y: n.grid ? n.grid[1] * spacing.rowSpacing + spacing.offsetY : (n.y !== undefined ? n.y : 0)
  }));
}

export function routeViewRelations(
  view: FlowchartViewConfig | undefined,
  viewKey: string,
  schema: UnifiedFlowchartSchema,
  positioned: PositionedNode[],
  spacing: ViewSpacing,
  isSequenceView: boolean
): any[] {
  const nodeMap = new Map<string, PositionedNode>();
  positioned.forEach(n => nodeMap.set(n.id, n));

  if (!view || isSequenceView) return [];
  const activeRelations = schema.relations.filter(r => r.views?.includes(viewKey));

  // Map of occupied grid cells -> node id, so a port can avoid exiting or
  // entering through a side where an adjacent node sits (which would make the
  // edge cross through that neighbour). Cells are quantised to the nearest
  // half-row/half-col to catch the fractional offsets used by handlers/dbs.
  const cellKey = (col: number, row: number) => `${Math.round(col * 2)},${Math.round(row * 2)}`;
  const occupied = new Map<string, string>();
  positioned.forEach(n => {
    if (n.grid) occupied.set(cellKey(n.grid[0], n.grid[1]), n.id);
  });
  // Is the cell immediately on `side` of (col,row) taken by a node other than
  // `selfId` and `otherId` (the two endpoints of the edge being routed)?
  const sideBlocked = (
    col: number, row: number, side: string, selfId: string, otherId: string,
  ): boolean => {
    let dc = 0, dr = 0;
    if (side === 'R') dc = 1;
    else if (side === 'L') dc = -1;
    else if (side === 'T') dr = -1;
    else if (side === 'B') dr = 1;
    const occ = occupied.get(cellKey(col + dc, row + dr));
    return occ !== undefined && occ !== selfId && occ !== otherId;
  };

  const relSides = activeRelations.map(rel => {
    const fromNode = nodeMap.get(rel.from);
    const toNode = nodeMap.get(rel.to);
    if (!fromNode || !toNode) return null;

    const colA = fromNode.grid ? fromNode.grid[0] : Math.round(((fromNode.x || 0) - spacing.offsetX) / spacing.colSpacing);
    const rowA = fromNode.grid ? fromNode.grid[1] : Math.round(((fromNode.y || 0) - spacing.offsetY) / spacing.rowSpacing);
    const colB = toNode.grid ? toNode.grid[0] : Math.round(((toNode.x || 0) - spacing.offsetX) / spacing.colSpacing);
    const rowB = toNode.grid ? toNode.grid[1] : Math.round(((toNode.y || 0) - spacing.offsetY) / spacing.rowSpacing);

    const startPts = [
      { side: 'T', x: fromNode.x, y: fromNode.y - NODE_H / 2 },
      { side: 'R', x: fromNode.x + NODE_W / 2, y: fromNode.y },
      { side: 'B', x: fromNode.x, y: fromNode.y + NODE_H / 2 },
      { side: 'L', x: fromNode.x - NODE_W / 2, y: fromNode.y }
    ];

    const endPts = [
      { side: 'T', x: toNode.x, y: toNode.y - NODE_H / 2 },
      { side: 'R', x: toNode.x + NODE_W / 2, y: toNode.y },
      { side: 'B', x: toNode.x, y: toNode.y + NODE_H / 2 },
      { side: 'L', x: toNode.x - NODE_W / 2, y: toNode.y }
    ];

    let minPenalty = Infinity;
    let startPt = startPts[0];
    let endPt = endPts[0];

    startPts.forEach(sp => {
      endPts.forEach(ep => {
        const dx = ep.x - sp.x;
        const dy = ep.y - sp.y;
        const dist = Math.abs(dx) + Math.abs(dy);
        let penalty = dist;

        // A port must face the other end with some room to spare; otherwise the
        // line has to double back (e.g. leave sideways from a box stacked
        // straight above its target).
        const MIN_RUN = 32;
        if (sp.side === 'R' && dx < MIN_RUN) penalty += 500;
        if (sp.side === 'L' && dx > -MIN_RUN) penalty += 500;
        if (sp.side === 'T' && dy > -MIN_RUN) penalty += 500;
        if (sp.side === 'B' && dy < MIN_RUN) penalty += 500;

        if (ep.side === 'R' && dx > -MIN_RUN) penalty += 500;
        if (ep.side === 'L' && dx < MIN_RUN) penalty += 500;
        if (ep.side === 'T' && dy < MIN_RUN) penalty += 500;
        if (ep.side === 'B' && dy > -MIN_RUN) penalty += 500;

        // Strongly discourage ports on a side that an adjacent in-grid node
        // occupies: tunnelling an edge straight through a neighbouring node is
        // worse than taking a slightly longer route, so this outweighs the
        // directional penalty above and pushes the port to a clear side.
        if (sideBlocked(colA, rowA, sp.side, rel.from, rel.to)) penalty += 800;
        if (sideBlocked(colB, rowB, ep.side, rel.to, rel.from)) penalty += 800;

        if (penalty < minPenalty) {
          minPenalty = penalty;
          startPt = sp;
          endPt = ep;
        }
      });
    });

    let sideFrom = startPt.side;
    let sideTo = endPt.side;

    // In the horizontal timeline views, force flow-node edges to exit the
    // right of the source and enter the left of the target so Command →
    // Event → Policy chains read cleanly left-to-right. Only applies when the
    // target sits to the right of the source (forward flow); backward edges
    // keep the distance-optimised sides to avoid crossing through nodes.
    if (HORIZONTAL_FLOW_VIEWS.has(viewKey)) {
      const flowTypes = FLOW_TYPES_BY_VIEW[viewKey];
      const typeOf = (id: string) => {
        const e = schema.entities[id];
        return e?.viewTypes?.[viewKey] || e?.type || 'default';
      };
      const bothFlow = flowTypes.has(typeOf(rel.from)) && flowTypes.has(typeOf(rel.to));
      if (bothFlow && colB > colA) {
        sideFrom = 'R';
        sideTo = 'L';
      }
    }

    const finalToId = rel.to;
    const finalToNode = toNode;

    return {
      rel,
      fromId: rel.from,
      toId: finalToId,
      sideFrom,
      sideTo,
      fromNode,
      toNode: finalToNode,
      colA, rowA, colB, rowB
    };
  }).filter(Boolean) as any[];

  const nodeSideConns: Record<string, Record<string, any[]>> = {};
  positioned.forEach(n => {
    nodeSideConns[n.id] = { 'T': [], 'R': [], 'B': [], 'L': [] };
  });

  relSides.forEach((entry, index) => {
    if (nodeSideConns[entry.fromId]) {
      nodeSideConns[entry.fromId][entry.sideFrom].push({
        relId: entry.rel.id,
        role: 'from',
        otherNodeId: entry.toId,
        relIndex: index
      });
    }
    if (nodeSideConns[entry.toId]) {
      nodeSideConns[entry.toId][entry.sideTo].push({
        relId: entry.rel.id,
        role: 'to',
        otherNodeId: entry.fromId,
        relIndex: index
      });
    }
  });

  const relPorts: Record<string, any> = {};
  positioned.forEach(node => {
    ['T', 'R', 'B', 'L'].forEach(side => {
      const conns = nodeSideConns[node.id][side];
      if (conns.length === 0) return;

      conns.sort((a, b) => {
        const nodeA = nodeMap.get(a.otherNodeId);
        const nodeB = nodeMap.get(b.otherNodeId);
        if (!nodeA || !nodeB) return 0;
        if (side === 'T' || side === 'B') {
          return (nodeA.x || 0) - (nodeB.x || 0);
        } else {
          return (nodeA.y || 0) - (nodeB.y || 0);
        }
      });

      const K = conns.length;
      conns.forEach((conn, i) => {
        let px = node.x || 0;
        let py = node.y || 0;

        if (side === 'L') {
          px -= NODE_W / 2;
          py = py - NODE_H / 2 + (i + 1) * NODE_H / (K + 1);
        } else if (side === 'R') {
          px += NODE_W / 2;
          py = py - NODE_H / 2 + (i + 1) * NODE_H / (K + 1);
        } else if (side === 'T') {
          py -= NODE_H / 2;
          px = px - NODE_W / 2 + (i + 1) * NODE_W / (K + 1);
        } else if (side === 'B') {
          py += NODE_H / 2;
          px = px - NODE_W / 2 + (i + 1) * NODE_W / (K + 1);
        }

        if (!relPorts[conn.relId]) relPorts[conn.relId] = {};
        if (conn.role === 'from') {
          relPorts[conn.relId].startX = px;
          relPorts[conn.relId].startY = py;
          relPorts[conn.relId].sideFrom = side;
        } else {
          relPorts[conn.relId].endX = px;
          relPorts[conn.relId].endY = py;
          relPorts[conn.relId].sideTo = side;
        }
      });
    });
  });

  // Route one line at a time so each can steer clear of the lines already placed
  const placedSegments: Array<{ a: { x: number; y: number }; b: { x: number; y: number } }> = [];
  const rawRoutes = relSides.map(entry => {
    const ports = relPorts[entry.rel.id];
    if (!ports) return null;

    const { startX, startY, endX, endY, sideFrom, sideTo } = ports;
    const { pathD, points, midX, midY, incomingSide } = routeManhattanPath(
      startX, startY, endX, endY,
      sideFrom, sideTo,
      entry.fromNode, entry.toNode,
      positioned, spacing, placedSegments
    );
    for (let i = 0; i < points.length - 1; i++) placedSegments.push({ a: points[i], b: points[i + 1] });

    return {
      ...entry.rel,
      pathD,
      points,
      startX, startY, endX, endY,
      midX, midY,
      incomingSide
    };
  }).filter(Boolean) as any[];

  const bridgedRoutes = disambiguateAndBridgePaths(rawRoutes);

  return bridgedRoutes.map(r => ({
    ...r,
    path: r.pathD
  })) as (any & { path: string })[];

}
