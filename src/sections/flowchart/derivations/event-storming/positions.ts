import type { FlowchartRelation, FlowchartViewNode } from '../../types';
import type { FlowGroup } from './grouping';

const CMD_COL = 0;
const EVT_COL = 1;
const POL_COL = 2;
const GROUP_GAP_X = 3;
const GROUP_GAP_Y = 0.5;

export function calculatePositions(
  nodes: FlowchartViewNode[],
  groups: FlowGroup[],
  groupOrder: number[],
  relations: FlowchartRelation[],
  viewKey: string,
): Map<string, [number, number]> {
  const rels = relations.filter(rel => {
    const isForView = !rel.views || rel.views.includes(viewKey);
    return rel.from && rel.to && isForView;
  });

  const outEdges = new Map<string, string[]>();
  const inEdges = new Map<string, string[]>();
  nodes.forEach(n => { outEdges.set(n.id, []); inEdges.set(n.id, []); });
  rels.forEach(rel => {
    outEdges.get(rel.from)!.push(rel.to);
    inEdges.get(rel.to)!.push(rel.from);
  });

  // Build group dependency graph (parent → children)
  const groupChildren = new Map<number, number[]>();
  const groupParents = new Map<number, number[]>();
  groups.forEach((_, i) => { groupChildren.set(i, []); groupParents.set(i, []); });

  rels.forEach(rel => {
    const fromIdx = groups.findIndex(gr => gr.allNodes.has(rel.from));
    const toIdx = groups.findIndex(gr => gr.allNodes.has(rel.to));
    if (fromIdx >= 0 && toIdx >= 0 && fromIdx !== toIdx) {
      if (!groupChildren.get(fromIdx)!.includes(toIdx)) {
        groupChildren.get(fromIdx)!.push(toIdx);
      }
      if (!groupParents.get(toIdx)!.includes(fromIdx)) {
        groupParents.get(toIdx)!.push(fromIdx);
      }
    }
  });

  // Calculate depth: root groups at depth 0, children increase
  const groupDepth = new Map<number, number>();
  const computeDepth = (gi: number, visited: Set<number>): number => {
    if (groupDepth.has(gi)) return groupDepth.get(gi)!;
    if (visited.has(gi)) return 0;
    visited.add(gi);
    const parents = groupParents.get(gi) ?? [];
    if (parents.length === 0) {
      groupDepth.set(gi, 0);
    } else {
      const maxParent = Math.max(...parents.map(p => computeDepth(p, visited)));
      groupDepth.set(gi, maxParent + 1);
    }
    return groupDepth.get(gi)!;
  };
  groupOrder.forEach(gi => computeDepth(gi, new Set()));

  // Compute each group's bounding box in internal coords
  const groupInternal = new Map<number, Map<string, [number, number]>>();
  const groupBounds = new Map<number, { minX: number; maxX: number; minY: number; maxY: number }>();

  groupOrder.forEach(gi => {
    const g = groups[gi];
    const internalGrid = computeWithinGroupPositions(g, outEdges, inEdges, rels);
    groupInternal.set(gi, internalGrid);

    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    internalGrid.forEach(([c, r]) => {
      if (c < minX) minX = c;
      if (c > maxX) maxX = c;
      if (r < minY) minY = r;
      if (r > maxY) maxY = r;
    });
    groupBounds.set(gi, { minX, maxX, minY, maxY });
  });

  // Group by depth layer
  const depthLayers = new Map<number, number[]>();
  groupOrder.forEach(gi => {
    const d = groupDepth.get(gi) ?? 0;
    if (!depthLayers.has(d)) depthLayers.set(d, []);
    depthLayers.get(d)!.push(gi);
  });

  // Assign x offset per depth column, y offset per group within the column
  const groupOffsetX = new Map<number, number>();
  const groupOffsetY = new Map<number, number>();

  // X: each depth layer gets its own column
  // Width of a column = max group width in that layer + gap
  const depthMaxWidth = new Map<number, number>();
  depthLayers.forEach((layer, depth) => {
    let maxW = 0;
    layer.forEach(gi => {
      const b = groupBounds.get(gi)!;
      const w = b.maxX - b.minX;
      if (w > maxW) maxW = w;
    });
    depthMaxWidth.set(depth, maxW + GROUP_GAP_X);
  });

  // Running x per depth
  let colX = 0;
  const depthCols = Array.from(depthLayers.keys()).sort((a, b) => a - b);
  depthCols.forEach(depth => {
    groupOrder.forEach(gi => {
      if ((groupDepth.get(gi) ?? 0) === depth) {
        groupOffsetX.set(gi, colX);
      }
    });
    colX += depthMaxWidth.get(depth)!;
  });

  // Y: within each depth column, stack groups vertically
  // But respect parent→child: child should be positioned near its parent's y
  depthCols.forEach(depth => {
    const layer = depthLayers.get(depth)!;
    if (layer.length === 0) return;

    // Sort by parent's y position to keep branches coherent
    const sorted = [...layer].sort((a, b) => {
      const aParents = groupParents.get(a) ?? [];
      const bParents = groupParents.get(b) ?? [];
      const aParentY = aParents.length > 0
        ? (groupOffsetY.get(aParents[0]) ?? 0)
        : 0;
      const bParentY = bParents.length > 0
        ? (groupOffsetY.get(bParents[0]) ?? 0)
        : 0;
      return aParentY - bParentY;
    });

    let rowY = 0;
    sorted.forEach(gi => {
      const b = groupBounds.get(gi)!;
      const h = b.maxY - b.minY;
      groupOffsetY.set(gi, rowY - b.minY);
      rowY += h + GROUP_GAP_Y;
    });
  });

  // Apply offsets to all nodes
  const grid = new Map<string, [number, number]>();
  groupOrder.forEach(gi => {
    const bounds = groupBounds.get(gi)!;
    const internalGrid = groupInternal.get(gi)!;

    internalGrid.forEach(([ic, ir], nodeId) => {
      const finalX = (ic - bounds.minX) + groupOffsetX.get(gi)!;
      const finalY = (ir - bounds.minY) + groupOffsetY.get(gi)!;
      grid.set(nodeId, [finalX, finalY]);
    });
  });

  return grid;
}

function computeWithinGroupPositions(
  g: FlowGroup,
  outEdges: Map<string, string[]>,
  inEdges: Map<string, string[]>,
  rels: FlowchartRelation[],
): Map<string, [number, number]> {
  const pos = new Map<string, [number, number]>();

  // Identify branching events (event -> multiple policies in this group)
  const branchPolicies = new Map<string, number>();
  g.events.forEach(evt => {
    const pols = outEdges.get(evt)!.filter(t => g.policies.includes(t));
    if (pols.length > 0) branchPolicies.set(evt, pols.length);
  });

  // --- Column 0: Commands stacked with handlers ---
  g.commands.forEach((cmd, cIdx) => {
    pos.set(cmd, [CMD_COL, 2 + cIdx * 1.5]);

    // Handler stacked with command (above for aggregate, same row for user)
    const handlerInGroup = g.handlers.find(h => {
      return rels.some(r => r.from === cmd && r.to === h && r.handledBy);
    });
    if (handlerInGroup) {
      pos.set(handlerInGroup, [CMD_COL, 2 + cIdx * 1.5 - 0.625]);
    }

    // Actor to the left of command
    const actorInGroup = g.actors.find(a => {
      return rels.some(r => r.from === a && r.to === cmd);
    });
    if (actorInGroup) {
      pos.set(actorInGroup, [CMD_COL - 1, 2 + cIdx * 1.5]);
    }
  });

  // --- Column 1: Events stacked with related nodes ---
  g.events.forEach((evt, eIdx) => {
    const isBranch = branchPolicies.get(evt)! > 1;
    pos.set(evt, [EVT_COL, 2 + eIdx * (isBranch ? 1.5 : 1.2)]);
  });

  // --- Column 2+: Policies (gap for branching) ---
  g.policies.forEach(pol => {
    const inEvents = inEdges.get(pol)!.filter(f => g.events.includes(f));
    const srcEvent = inEvents[0];
    const isBranch = srcEvent && branchPolicies.get(srcEvent)! > 1;

    if (isBranch && srcEvent) {
      // Extra column gap + spread rows around source event
      const srcRow = pos.get(srcEvent)![1];
      const siblings = g.policies.filter(p => {
        const pe = inEdges.get(p)!.filter(f => g.events.includes(f));
        return pe.includes(srcEvent);
      });
      const sibIdx = siblings.indexOf(pol);
      const totalSibs = siblings.length;
      pos.set(pol, [POL_COL + 0.5, srcRow - (totalSibs - 1) * 0.5 + sibIdx * 1.0]);
    } else {
      pos.set(pol, [POL_COL, 2 + g.policies.indexOf(pol) * 1.2]);
    }
  });

  // --- Externals: same column as related handler or event ---
  g.externals.forEach(ext => {
    // Find which handler or event connects to this external
    const connectedHandler = g.handlers.find(h =>
      rels.some(r => (r.from === h && r.to === ext) || (r.from === ext && r.to === h)),
    );
    const connectedEvent = g.events.find(e =>
      rels.some(r => r.from === ext && r.to === e),
    );

    if (connectedHandler && pos.has(connectedHandler)) {
      const hPos = pos.get(connectedHandler)!;
      pos.set(ext, [hPos[0], hPos[1] - 0.75]);
    } else if (connectedEvent && pos.has(connectedEvent)) {
      const ePos = pos.get(connectedEvent)!;
      pos.set(ext, [ePos[0] - 0.5, ePos[1]]);
    } else {
      pos.set(ext, [CMD_COL, 0.5]);
    }
  });

  // --- DBs: same column as related handler ---
  g.dbs.forEach(db => {
    const handlerInGroup = g.handlers.find(h =>
      rels.some(r => (r.from === h && r.to === db) || (r.from === db && r.to === h)),
    );
    if (handlerInGroup && pos.has(handlerInGroup)) {
      const hPos = pos.get(handlerInGroup)!;
      pos.set(db, [hPos[0], hPos[1] - 0.75]);
    } else {
      pos.set(db, [CMD_COL, 0.5]);
    }
  });

  // --- Additional actors not yet positioned (e.g., event return users) ---
  g.actors.forEach(actor => {
    if (!pos.has(actor)) {
      // Check if event returns to this user
      const connectedEvent = g.events.find(e =>
        rels.some(r => r.from === e && r.to === actor),
      );
      if (connectedEvent && pos.has(connectedEvent)) {
        const ePos = pos.get(connectedEvent)!;
        pos.set(actor, [ePos[0] + 1, ePos[1]]);
      } else {
        pos.set(actor, [CMD_COL - 1, 2]);
      }
    }
  });

  // --- Handlers not yet positioned ---
  g.handlers.forEach(handler => {
    if (!pos.has(handler)) {
      pos.set(handler, [CMD_COL, 0.5]);
    }
  });

  return pos;
}
