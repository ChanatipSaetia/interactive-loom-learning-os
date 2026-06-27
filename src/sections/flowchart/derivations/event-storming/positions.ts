import type { FlowchartRelation, FlowchartViewNode } from '../../types';
import type { FlowGroup } from './grouping';

const CMD_COL = 0;
const EVT_COL = 1;
const POL_COL = 2;
const COLUMN_WIDTH_GAP = 1.5;
const MIN_Y_SPACING = 1.0;

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

  // Find root group
  let rootGroupIdx = groups.findIndex(g => g.isRoot);
  if (rootGroupIdx < 0) {
    // Fallback: first group by schema order with no incoming edges
    const inDegreeZero = groupOrder.find(gi => (groupParents.get(gi)?.length ?? 0) === 0);
    rootGroupIdx = inDegreeZero ?? (groups.length > 0 ? 0 : -1);
  }

  // BFS from root to calculate depth. Guard the degenerate case where there
  // are no groups at all (e.g. views with no command/timeline nodes), so we
  // never seed the queue with an index that is absent from groupChildren.
  const groupDepth = new Map<number, number>();
  if (rootGroupIdx >= 0 && groupChildren.has(rootGroupIdx)) {
    const visited = new Set<number>();
    const queue: number[] = [rootGroupIdx];
    visited.add(rootGroupIdx);
    groupDepth.set(rootGroupIdx, 0);

    while (queue.length > 0) {
      const gi = queue.shift()!;
      const depth = groupDepth.get(gi)!;
      for (const child of groupChildren.get(gi) ?? []) {
        if (!visited.has(child)) {
          visited.add(child);
          groupDepth.set(child, depth + 1);
          queue.push(child);
        }
      }
    }
  }

  // Assign depth to unvisited groups (disconnected components)
  groupOrder.forEach(gi => {
    if (!groupDepth.has(gi)) {
      groupDepth.set(gi, 0);
    }
  });

  // Compute each group's bounding box in internal coords
  const groupInternal = new Map<number, Map<string, [number, number]>>();
  const groupBounds = new Map<number, { minX: number; maxX: number; minY: number; maxY: number }>();

  const outEdges = new Map<string, string[]>();
  const inEdges = new Map<string, string[]>();
  nodes.forEach(n => { outEdges.set(n.id, []); inEdges.set(n.id, []); });
  rels.forEach(rel => {
    outEdges.get(rel.from)!.push(rel.to);
    inEdges.get(rel.to)!.push(rel.from);
  });

  groupOrder.forEach(gi => {
    const g = groups[gi];
    const internalGrid = computeWithinGroupPositions(g, outEdges, inEdges, rels);
    groupInternal.set(gi, internalGrid);

    // Seed bounds from the actual nodes. Internal Y coords never start at 0
    // (commands sit around row 2, handlers/dbs around 0.5–1.4), so clamping
    // the initial min to 0 counted phantom empty space above the topmost node
    // as group height — inflating groupH and pushing the group's computed top
    // (centerY - groupH/2) upward, which misaligned groups against each other.
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    internalGrid.forEach(([c, r]) => {
      if (c < minX) minX = c;
      if (c > maxX) maxX = c;
      if (r < minY) minY = r;
      if (r > maxY) maxY = r;
    });
    if (!Number.isFinite(minX)) { minX = 0; maxX = 0; minY = 0; maxY = 0; }
    groupBounds.set(gi, { minX, maxX, minY, maxY });
  });

  // Group by depth layer. Dedupe defensively: a duplicated group index here
  // (e.g. from a cyclic topological order) would place the same group in a
  // layer twice and the collision pass would shove it against itself, pushing
  // it far off-screen.
  const depthLayers = new Map<number, number[]>();
  const seenInLayers = new Set<number>();
  groupOrder.forEach(gi => {
    if (seenInLayers.has(gi)) return;
    seenInLayers.add(gi);
    const d = groupDepth.get(gi) ?? 0;
    if (!depthLayers.has(d)) depthLayers.set(d, []);
    depthLayers.get(d)!.push(gi);
  });

  // Assign x offset per depth column
  const groupOffsetX = new Map<number, number>();
  const depthMaxWidth = new Map<number, number>();
  depthLayers.forEach((layer, depth) => {
    let maxW = 0;
    layer.forEach(gi => {
      const b = groupBounds.get(gi)!;
      const w = b.maxX - b.minX;
      if (w > maxW) maxW = w;
    });
    depthMaxWidth.set(depth, maxW + COLUMN_WIDTH_GAP);
  });

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

  // Assign Y: root at 0, children spread symmetrically around parent Y
  const groupOffsetY = new Map<number, number>();

  depthCols.forEach(depth => {
    const layer = depthLayers.get(depth)!;
    if (layer.length === 0) return;

    if (depth === 0) {
      // Depth 0 holds the root plus any independent top-level groups
      // (multiple entry commands / disconnected components). The root is
      // anchored at 0; siblings are seeded around 0 and spread top-to-bottom
      // by the collision pass below. Previously only the root received a Y
      // here, leaving sibling depth-0 groups with an undefined offset (NaN
      // positions) and pushing the root far from the rest of the layout.
      let cursor = 0;
      layer.forEach(gi => {
        if (gi === rootGroupIdx) {
          groupOffsetY.set(gi, 0);
        } else {
          const h = groupBounds.get(gi)!.maxY - groupBounds.get(gi)!.minY;
          cursor += h / 2 + MIN_Y_SPACING;
          groupOffsetY.set(gi, cursor);
          cursor += h / 2;
        }
      });
      // Guarantee the root always has a Y even if it is not in this layer.
      if (!groupOffsetY.has(rootGroupIdx)) groupOffsetY.set(rootGroupIdx, 0);
      return;
    }

    // For each group, compute target Y as average of parents' Y
    const targetY = new Map<number, number>();
    layer.forEach(gi => {
      const parents = groupParents.get(gi)!.filter(p => groupDepth.get(p) === depth - 1);
      if (parents.length === 0) {
        targetY.set(gi, 0);
      } else {
        const avgY = parents.reduce((sum, p) => sum + (groupOffsetY.get(p) ?? 0), 0) / parents.length;
        targetY.set(gi, avgY);
      }
    });

    // Sort by target Y to process from top to bottom
    const sorted = [...layer].sort((a, b) => (targetY.get(a) ?? 0) - (targetY.get(b) ?? 0));

    // Group siblings that share the same parent(s)
    // For each unique set of parents, spread children symmetrically
    const parentSets = new Map<string, number[]>();
    sorted.forEach(gi => {
      const parents = [...(groupParents.get(gi)!.filter(p => groupDepth.get(p) === depth - 1))].sort();
      const key = parents.join('|');
      if (!parentSets.has(key)) parentSets.set(key, []);
      parentSets.get(key)!.push(gi);
    });

    // Assign Y within each parent group symmetrically
    parentSets.forEach((siblings, _key) => {
      const parentYStr = _key.split('|');
      const parentYs = parentYStr.map(p => groupOffsetY.get(parseInt(p)) ?? 0);
      const center = parentYs.reduce((a, b) => a + b, 0) / parentYs.length;
      const n = siblings.length;

      siblings.forEach((gi, idx) => {
        const offset = idx - (n - 1) / 2;
        groupOffsetY.set(gi, center + offset);
      });
    });
  });

  // Safety net: any group that still lacks a Y (e.g. disconnected component
  // whose depth defaulted to 0 but was not in depthLayers) defaults to 0.
  groupOrder.forEach(gi => {
    if (!groupOffsetY.has(gi)) groupOffsetY.set(gi, 0);
  });

  // Post-layout: detect Y collisions within same X column, push apart
  depthCols.forEach(depth => {
    const layer = depthLayers.get(depth)!;
    if (layer.length <= 1) return;

    for (let iteration = 0; iteration < 20; iteration++) {
      const sorted = [...layer].sort((a, b) => (groupOffsetY.get(a) ?? 0) - (groupOffsetY.get(b) ?? 0));

      let hasCollision = false;
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        const prevCenter = groupOffsetY.get(prev)!;
        const currCenter = groupOffsetY.get(curr)!;
        const prevH = groupBounds.get(prev)!.maxY - groupBounds.get(prev)!.minY;
        const currH = groupBounds.get(curr)!.maxY - groupBounds.get(curr)!.minY;
        const prevBottom = prevCenter + prevH / 2;
        const currTop = currCenter - currH / 2;
        const needed = prevBottom + MIN_Y_SPACING;

        if (currTop < needed) {
          groupOffsetY.set(curr, needed + currH / 2);
          hasCollision = true;
        }
      }
      if (!hasCollision) break;
    }
  });

  // Apply offsets to all nodes (groupOffsetY is center of group, not top)
  const grid = new Map<string, [number, number]>();
  groupOrder.forEach(gi => {
    const bounds = groupBounds.get(gi)!;
    const internalGrid = groupInternal.get(gi)!;
    const groupH = bounds.maxY - bounds.minY;
    const centerY = groupOffsetY.get(gi)!;
    const topY = centerY - groupH / 2;

    internalGrid.forEach(([ic, ir], nodeId) => {
      const finalX = (ic - bounds.minX) + groupOffsetX.get(gi)!;
      const finalY = (ir - bounds.minY) + topY;
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

    // Handler stacked with command (above for aggregate, same row for user).
    // An external/service that runs the command (handledBy) plays the same
    // structural role as an aggregate handler, so treat it identically and
    // stack it in the command column rather than offsetting it sideways.
    const handlerInGroup =
      g.handlers.find(h => rels.some(r => r.from === cmd && r.to === h && r.handledBy)) ??
      g.externals.find(h => rels.some(r => r.from === cmd && r.to === h && r.handledBy));
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

  // --- Externals: align with their command, handler, or emitted event ---
  g.externals.forEach(ext => {
    // Already placed above as a command's handledBy handler — leave as-is.
    if (pos.has(ext)) return;

    // External invoked by a command (handledBy or plain edge): stack it in the
    // command column, just above the command, exactly like an aggregate.
    const owningCmd = g.commands.find(c =>
      rels.some(r => r.from === c && r.to === ext),
    );
    if (owningCmd && pos.has(owningCmd)) {
      const cPos = pos.get(owningCmd)!;
      pos.set(ext, [cPos[0], cPos[1] - 0.625]);
      return;
    }

    // External attached to another handler (e.g. router -> subagent pool):
    // sit it directly above that handler in the same column.
    const connectedHandler = g.handlers.find(h =>
      rels.some(r => (r.from === h && r.to === ext) || (r.from === ext && r.to === h)),
    );
    if (connectedHandler && pos.has(connectedHandler)) {
      const hPos = pos.get(connectedHandler)!;
      pos.set(ext, [hPos[0], hPos[1] - 0.75]);
      return;
    }

    // External that emits an event but has no clear handler: place it one
    // column left of that event, aligned to the same row.
    const connectedEvent = g.events.find(e =>
      rels.some(r => r.from === ext && r.to === e),
    );
    if (connectedEvent && pos.has(connectedEvent)) {
      const ePos = pos.get(connectedEvent)!;
      pos.set(ext, [ePos[0] - 1, ePos[1]]);
      return;
    }

    pos.set(ext, [CMD_COL, 0.5]);
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

  // --- Additional actors not yet positioned ---
  g.actors.forEach(actor => {
    if (!pos.has(actor)) {
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
