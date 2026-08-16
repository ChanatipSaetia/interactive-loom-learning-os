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

  // Calculate each group's depth (its column) as the LONGEST path from the
  // root, not the shortest. A group reachable by both a short and a long path
  // (e.g. "Complete Task", which the root can reach directly but which also
  // sits downstream of the tool/MCP branches) must be drawn to the right of
  // ALL of its ancestors. Shortest-path (BFS first-visit) depth pulled such
  // groups left, overlapping them onto earlier columns.
  const groupDepth = new Map<number, number>();
  if (rootGroupIdx >= 0 && groupChildren.has(rootGroupIdx)) {
    groupOrder.forEach(gi => groupDepth.set(gi, 0));

    // Longest-path DFS from the root. Each group's depth is the maximum number
    // of edges along any acyclic path from the root, so a group always sits to
    // the right of every ancestor. Edges leading back to a group already on the
    // current DFS path are cycle back-edges and are skipped, which keeps the
    // longest *simple* path finite even though the flow contains feedback loops.
    const onPath = new Set<number>();
    const visit = (gi: number, depth: number) => {
      if (onPath.has(gi)) return;            // back-edge into current path
      if (depth <= (groupDepth.get(gi) ?? -1) && depth !== 0) return; // no deeper path found
      groupDepth.set(gi, depth);
      onPath.add(gi);
      for (const child of groupChildren.get(gi) ?? []) {
        visit(child, depth + 1);
      }
      onPath.delete(gi);
    };
    visit(rootGroupIdx, 0);
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
    if (outEdges.has(rel.from)) outEdges.get(rel.from)!.push(rel.to);
    if (inEdges.has(rel.to)) inEdges.get(rel.to)!.push(rel.from);
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

    // Assign Y within each parent group symmetrically around parent center Y
    parentSets.forEach((siblings, _key) => {
      const parentYStr = _key.split('|');
      const parentYs = parentYStr.map(p => groupOffsetY.get(parseInt(p)) ?? 0);
      const center = parentYs.reduce((a, b) => a + b, 0) / parentYs.length;
      const n = siblings.length;

      let maxH = 2.0;
      siblings.forEach(gi => {
        const b = groupBounds.get(gi);
        if (b) {
          const h = b.maxY - b.minY;
          if (h > maxH) maxH = h;
        }
      });

      const stepSpacing = Math.max(maxH + MIN_Y_SPACING, 3.2);

      siblings.forEach((gi, idx) => {
        const offset = (idx - (n - 1) / 2) * stepSpacing;
        const d = groupDepth.get(gi) ?? 0;
        const wrapY = (n === 1 && d >= 4) ? Math.floor(d / 4) * 1.5 : 0;
        groupOffsetY.set(gi, center + offset + wrapY);
      });
    });
  });

  // Safety net: any group that still lacks a Y (e.g. disconnected component
  // whose depth defaulted to 0 but was not in depthLayers) defaults to 0.
  groupOrder.forEach(gi => {
    if (!groupOffsetY.has(gi)) groupOffsetY.set(gi, 0);
  });

  // Post-layout: detect Y collisions within same X column, push apart symmetrically
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
          const overlap = needed - currTop;
          const half = overlap / 2;
          groupOffsetY.set(prev, prevCenter - half);
          groupOffsetY.set(curr, currCenter + half);
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

  // --- Column 0: Commands stacked with handlers, policies, and actors ---
  g.commands.forEach((cmd, cIdx) => {
    const rowY = 2 + cIdx * 1.5;
    pos.set(cmd, [CMD_COL, rowY]);

    // Handler stacked with command (above for aggregate, same row for user).
    // An external/service that runs the command (handledBy) plays the same
    // structural role as an aggregate handler, so treat it identically and
    // stack it in the command column rather than offsetting it sideways.
    const handlerInGroup =
      g.handlers.find(h => rels.some(r => (r.from === cmd && r.to === h && r.handledBy) || (r.from === h && r.to === cmd))) ??
      g.externals.find(h => rels.some(r => (r.from === cmd && r.to === h && r.handledBy) || (r.from === h && r.to === cmd)));
    if (handlerInGroup) {
      pos.set(handlerInGroup, [CMD_COL, rowY - 0.625]);
    }

    // Policies positioned next to their related command (-1 column offset).
    // A merge point may feed several policies into one command: stack them.
    const polsForCmd = g.policies.filter(p => rels.some(r => r.from === p && r.to === cmd));
    polsForCmd.forEach((pol, pIdx) => {
      pos.set(pol, [CMD_COL - 1, rowY + pIdx * 0.75]);
    });
    const polInGroup = polsForCmd[0];

    // Actor next to Policy and on top of Policy (above Policy)
    const actorInGroup = g.actors.find(a => {
      if (rels.some(r => r.from === a && r.to === cmd)) return true;
      if (polInGroup && rels.some(r => r.from === a && r.to === polInGroup)) return true;
      return false;
    });
    if (actorInGroup) {
      if (polInGroup && pos.has(polInGroup)) {
        // Place Actor on top of Policy (same X, rowY - 0.625)
        pos.set(actorInGroup, [pos.get(polInGroup)![0], rowY - 0.625]);
      } else {
        // If no policy present, place Actor next to Command on top level
        pos.set(actorInGroup, [CMD_COL - 1, rowY - 0.625]);
      }
    }
  });

  // --- Column 1+: Events stacked with related nodes, wrapping beyond 4 columns ---
  g.events.forEach((evt, eIdx) => {
    const isBranch = (branchPolicies.get(evt) ?? 0) > 1;
    const colOffset = (eIdx % 4) * (isBranch ? 1.5 : 1.2);
    const rowOffset = Math.floor(eIdx / 4) * 1.2;
    pos.set(evt, [EVT_COL + colOffset, 2 + rowOffset]);
  });

  // --- Policies not yet placed (branch policies: place next to their command) ---
  g.policies.forEach(pol => {
    if (pos.has(pol)) return; // Already positioned next to its linear command

    // Find the command this policy triggers
    const ownedCmd = g.commands.find(c => rels.some(r => r.from === pol && r.to === c));
    if (ownedCmd && pos.has(ownedCmd)) {
      // Place policy 1 column left of its command, same row
      const [cx, cy] = pos.get(ownedCmd)!;
      pos.set(pol, [cx - 1, cy]);
    } else {
      // Fallback: align with source event row
      const inEvents = inEdges.get(pol)!.filter(f => g.events.includes(f));
      const srcEvent = inEvents[0];
      if (srcEvent && pos.has(srcEvent)) {
        const srcRow = pos.get(srcEvent)![1];
        const siblings = g.policies.filter(p => {
          const pe = inEdges.get(p)!.filter(f => g.events.includes(f));
          return pe.includes(srcEvent);
        });
        const sibIdx = siblings.indexOf(pol);
        const totalSibs = siblings.length;
        const rowOffset = sibIdx - (totalSibs - 1) / 2;
        pos.set(pol, [POL_COL, srcRow + rowOffset * 1.5]);
      } else {
        pos.set(pol, [POL_COL, 2 + g.policies.indexOf(pol) * 1.5]);
      }
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
      const connectedPol = g.policies.find(p =>
        rels.some(r => r.from === actor && r.to === p),
      );
      if (connectedPol && pos.has(connectedPol)) {
        const pPos = pos.get(connectedPol)!;
        pos.set(actor, [pPos[0] - 1, pPos[1]]);
      } else {
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
