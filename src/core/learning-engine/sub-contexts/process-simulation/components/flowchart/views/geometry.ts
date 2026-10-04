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

/**
 * Widest edge label (px) that can sit centred on (x, y) without running into
 * a node: the free horizontal room between the nearest boxes on that line.
 */
export function edgeLabelRoom(x: number, y: number, nodes: Array<{ x?: number; y?: number }>, halfHeight = 10): number {
  const MARGIN = 6;
  let half = Infinity;
  for (const n of nodes) {
    if (typeof n.x !== 'number' || typeof n.y !== 'number') continue;
    if (Math.abs(n.y - y) >= NODE_H / 2 + halfHeight) continue;
    const left = n.x - NODE_W / 2;
    const right = n.x + NODE_W / 2;
    if (x > left && x < right) return 0;
    half = Math.min(half, x <= left ? left - x : x - right);
  }
  return half === Infinity ? Infinity : Math.max(0, 2 * (half - MARGIN));
}

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
  const STAGGER = 8;
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

        // Facing sides are staggered (left/top a little later, right/bottom a little
        // earlier) so two boxes side by side never get ports at exactly the same
        // height, which would send their lines head-on along one channel.
        if (side === 'L') {
          px -= NODE_W / 2;
          py = py - NODE_H / 2 + (i + 1) * NODE_H / (K + 1) + STAGGER;
        } else if (side === 'R') {
          px += NODE_W / 2;
          py = py - NODE_H / 2 + (i + 1) * NODE_H / (K + 1) - STAGGER;
        } else if (side === 'T') {
          py -= NODE_H / 2;
          px = px - NODE_W / 2 + (i + 1) * NODE_W / (K + 1) + STAGGER;
        } else if (side === 'B') {
          py += NODE_H / 2;
          px = px - NODE_W / 2 + (i + 1) * NODE_W / (K + 1) - STAGGER;
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

  // A line between two facing sides should run straight when it can: if the
  // ends are close in height (or width), move the end whose side carries only
  // this line onto the other end's level. Both sides busy: just undo the stagger.
  const MARGIN = 10;
  relSides.forEach(entry => {
    const ports = relPorts[entry.rel.id];
    if (!ports) return;
    const { sideFrom, sideTo } = ports;
    const horizontal = (sideFrom === 'R' && sideTo === 'L') || (sideFrom === 'L' && sideTo === 'R');
    const vertical = (sideFrom === 'B' && sideTo === 'T') || (sideFrom === 'T' && sideTo === 'B');
    if (!horizontal && !vertical) return;
    const axis = horizontal ? 'Y' : 'X';
    const half = horizontal ? NODE_H / 2 : NODE_W / 2;
    const centre = (node: PositionedNode) => (horizontal ? node.y : node.x);
    const fits = (value: number, node: PositionedNode) => Math.abs(value - centre(node)) <= half - MARGIN;
    const start = ports[`start${axis}`];
    const finish = ports[`end${axis}`];
    if (Math.abs(start - finish) < 0.5) return;
    const fromAlone = nodeSideConns[entry.fromId][sideFrom].length === 1;
    const toAlone = nodeSideConns[entry.toId][sideTo].length === 1;
    // A port on a busy side may still slide into line when it stays clear of
    // the other ports on that side.
    const clearOf = (value: number, nodeId: string, side: string) =>
      nodeSideConns[nodeId][side].every(conn => {
        if (conn.relId === entry.rel.id) return true;
        const other = relPorts[conn.relId];
        const otherValue = other?.[`${conn.role === 'from' ? 'start' : 'end'}${axis}`];
        return otherValue === undefined || Math.abs(otherValue - value) >= MARGIN;
      });
    if (toAlone && fits(start, entry.toNode)) {
      ports[`end${axis}`] = start;
    } else if (fromAlone && fits(finish, entry.fromNode)) {
      ports[`start${axis}`] = finish;
    } else if (fits(start, entry.toNode) && clearOf(start, entry.toId, sideTo)) {
      ports[`end${axis}`] = start;
    } else if (fits(finish, entry.fromNode) && clearOf(finish, entry.fromId, sideFrom)) {
      ports[`start${axis}`] = finish;
    } else {
      const unstaggeredStart = start + ((sideFrom === 'R' || sideFrom === 'B') ? STAGGER : -STAGGER);
      const unstaggeredEnd = finish + ((sideTo === 'R' || sideTo === 'B') ? STAGGER : -STAGGER);
      if (Math.abs(unstaggeredStart - unstaggeredEnd) < 0.5) {
        ports[`start${axis}`] = unstaggeredStart;
        ports[`end${axis}`] = unstaggeredEnd;
      }
    }
  });

  // Two ports facing each other across an open gap (a right side and a left
  // side, or a bottom and a top) that land a pixel or two apart send their
  // lines along one channel. Nudge one of them apart: the one whose own line is
  // not already straight, when it stays on its box and clear of its neighbours.
  const NEAR = 4;
  const NUDGE = 6;
  type PortRef = { relId: string; end: 'start' | 'end'; nodeId: string; side: string };
  const portRefs: PortRef[] = [];
  relSides.forEach(entry => {
    const ports = relPorts[entry.rel.id];
    if (!ports) return;
    portRefs.push({ relId: entry.rel.id, end: 'start', nodeId: entry.fromId, side: ports.sideFrom });
    portRefs.push({ relId: entry.rel.id, end: 'end', nodeId: entry.toId, side: ports.sideTo });
  });
  const axisOf = (side: string) => (side === 'L' || side === 'R' ? 'Y' : 'X');
  const crossOf = (side: string) => (side === 'L' || side === 'R' ? 'X' : 'Y');
  const valueOf = (ref: PortRef) => relPorts[ref.relId][`${ref.end}${axisOf(ref.side)}`] as number;
  const crossValueOf = (ref: PortRef) => relPorts[ref.relId][`${ref.end}${crossOf(ref.side)}`] as number;
  const isStraight = (relId: string) => {
    const ports = relPorts[relId];
    return Math.abs(ports.startX - ports.endX) < 0.5 || Math.abs(ports.startY - ports.endY) < 0.5;
  };
  // a is on the right/bottom side, b on the left/top side further along, with no box between
  const facesAcrossGap = (a: PortRef, b: PortRef) => {
    const facing = (a.side === 'R' && b.side === 'L') || (a.side === 'B' && b.side === 'T');
    if (!facing || crossValueOf(a) >= crossValueOf(b)) return false;
    const level = (valueOf(a) + valueOf(b)) / 2;
    const [lo, hi] = [crossValueOf(a), crossValueOf(b)];
    return !positioned.some(n => {
      if (n.id === a.nodeId || n.id === b.nodeId) return false;
      const horizontal = a.side === 'R';
      const along = horizontal ? n.x : n.y;
      const across = horizontal ? n.y : n.x;
      const halfAlong = (horizontal ? NODE_W : NODE_H) / 2;
      const halfAcross = (horizontal ? NODE_H : NODE_W) / 2;
      return along + halfAlong > lo && along - halfAlong < hi && Math.abs(across - level) < halfAcross;
    });
  };
  const nudge = (ref: PortRef, away: PortRef) => {
    const axis = axisOf(ref.side);
    const node = nodeMap.get(ref.nodeId);
    if (!node) return false;
    const centre = axis === 'Y' ? node.y : node.x;
    const half = (axis === 'Y' ? NODE_H : NODE_W) / 2 - MARGIN;
    const siblings = portRefs.filter(o => o !== ref && o.nodeId === ref.nodeId && o.side === ref.side);
    const direction = valueOf(ref) >= valueOf(away) ? 1 : -1;
    for (const sign of [direction, -direction]) {
      const moved = valueOf(away) + sign * NUDGE;
      if (Math.abs(moved - centre) <= half && siblings.every(o => Math.abs(valueOf(o) - moved) >= MARGIN)) {
        relPorts[ref.relId][`${ref.end}${axis}`] = moved;
        return true;
      }
    }
    return false;
  };
  portRefs.forEach(a => {
    portRefs.forEach(b => {
      if (a.relId === b.relId || !facesAcrossGap(a, b)) return;
      if (Math.abs(valueOf(a) - valueOf(b)) >= NEAR) return;
      if (!isStraight(b.relId) && nudge(b, a)) return;
      if (!isStraight(a.relId)) nudge(a, b);
    });
  });

  // Route one line at a time so each can steer clear of the lines already placed,
  // then once more against all the others: the first pass cannot see lines
  // routed after it (e.g. one ending at a pinned port in the same channel).
  type Segment = { a: { x: number; y: number }; b: { x: number; y: number } };
  const segmentsOf = (points: Array<{ x: number; y: number }>): Segment[] =>
    points.slice(1).map((b, i) => ({ a: points[i], b }));
  const routeEntry = (entry: any, avoid: Segment[]) => {
    const ports = relPorts[entry.rel.id];
    if (!ports) return null;
    const { startX, startY, endX, endY, sideFrom, sideTo } = ports;
    const { pathD, points, midX, midY, incomingSide } = routeManhattanPath(
      startX, startY, endX, endY,
      sideFrom, sideTo,
      entry.fromNode, entry.toNode,
      positioned, spacing, avoid
    );
    return {
      ...entry.rel,
      pathD,
      points,
      startX, startY, endX, endY,
      midX, midY,
      incomingSide
    };
  };

  const placedSegments: Segment[] = [];
  const firstPass = relSides.map(entry => {
    const route = routeEntry(entry, placedSegments);
    if (route) placedSegments.push(...segmentsOf(route.points));
    return route;
  });
  const settled = [...firstPass];
  relSides.forEach((entry, i) => {
    if (!settled[i]) return;
    const others = settled.flatMap((r, j) => (r && j !== i ? segmentsOf(r.points) : []));
    settled[i] = routeEntry(entry, others);
  });
  const rawRoutes = settled.filter(Boolean) as any[];

  const bridgedRoutes = disambiguateAndBridgePaths(rawRoutes);

  return bridgedRoutes.map(r => ({
    ...r,
    path: r.pathD
  })) as (any & { path: string })[];

}
