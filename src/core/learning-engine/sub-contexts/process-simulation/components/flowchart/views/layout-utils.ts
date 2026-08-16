/* eslint-disable @typescript-eslint/no-explicit-any */
import { NODE_W, NODE_H } from '../types';

const MIN_ROW_SPACING = 80;
const MAX_ROW_SPACING = 240;

export function computeDynamicSpacing(
  info: { rowCount: number; colCount: number; nodeCount: number },
  base: { colSpacing: number; rowSpacing: number; offsetX: number; offsetY: number },
  viewKey: string
): { colSpacing: number; rowSpacing: number; offsetX: number; offsetY: number } {
  const { rowCount, colCount } = info;

  if (viewKey === 'SEQUENCE') return base;
  if (viewKey === 'EVENT_STORMING') return base;

  let rowSpacing = base.rowSpacing;
  if (rowCount > 2) {
    const extraRows = rowCount - 2;
    const additionalSpacing = Math.min(extraRows * 12, 80);
    rowSpacing = Math.min(base.rowSpacing + additionalSpacing, MAX_ROW_SPACING);
  }
  rowSpacing = Math.max(rowSpacing, MIN_ROW_SPACING);

  const offsetX = base.offsetX + Math.max(0, (colCount - 8)) * 20;
  const offsetY = base.offsetY + Math.max(0, (rowCount - 3)) * 10;

  return { ...base, rowSpacing, offsetX, offsetY };
}

export function getPathMidpoint(points: Array<{ x: number; y: number }>): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];

  const lengths: number[] = [];
  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i+1].x - points[i].x;
    const dy = points[i+1].y - points[i].y;
    const len = Math.abs(dx) + Math.abs(dy);
    lengths.push(len);
    totalLength += len;
  }

  const targetDist = totalLength / 2;
  let currentDist = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const len = lengths[i];
    if (currentDist + len >= targetDist) {
      const remaining = targetDist - currentDist;
      const p1 = points[i];
      const p2 = points[i+1];
      if (len === 0) return p1;
      const ratio = remaining / len;
      return {
        x: p1.x + (p2.x - p1.x) * ratio,
        y: p1.y + (p2.y - p1.y) * ratio
      };
    }
    currentDist += len;
  }

  return points[points.length - 1];
}

export function routeManhattanPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  sideFrom: string,
  sideTo: string,
  fromNode: any,
  toNode: any,
  positioned: any[],
  spacing: any
): { pathD: string; points: Array<{ x: number; y: number }>; midX: number; midY: number; incomingSide: string } {
  const STUB = 16;
  const candidates: Array<{ type: string; points: Array<{ x: number; y: number }> }> = [];

  const candidateXs = new Set<number>();
  candidateXs.add((startX + endX) / 2);
  candidateXs.add(startX + 24);
  candidateXs.add(startX - 24);
  candidateXs.add(endX + 24);
  candidateXs.add(endX - 24);

  const maxCol = positioned.length > 0 ? Math.max(...positioned.map(n => n.grid?.[0] ?? 0)) : 0;
  for (let c = -1; c <= maxCol + 1; c++) {
    candidateXs.add((c + 0.5) * spacing.colSpacing + spacing.offsetX);
    candidateXs.add((c + 0.3) * spacing.colSpacing + spacing.offsetX);
    candidateXs.add((c + 0.7) * spacing.colSpacing + spacing.offsetX);
  }

  const candidateYs = new Set<number>();
  candidateYs.add((startY + endY) / 2);
  candidateYs.add(startY + 24);
  candidateYs.add(startY - 24);
  candidateYs.add(endY + 24);
  candidateYs.add(endY - 24);

  const maxRow = positioned.length > 0 ? Math.max(...positioned.map(n => n.grid?.[1] ?? 0)) : 0;
  for (let r = -1; r <= maxRow + 1; r++) {
    candidateYs.add((r + 0.5) * spacing.rowSpacing + spacing.offsetY);
    candidateYs.add((r + 0.3) * spacing.rowSpacing + spacing.offsetY);
    candidateYs.add((r + 0.7) * spacing.rowSpacing + spacing.offsetY);
  }

  // 1-bend Direct H-V: (startX, startY) -> (endX, startY) -> (endX, endY)
  candidates.push({
    type: '1-bend H-V',
    points: [
      { x: startX, y: startY },
      { x: endX, y: startY },
      { x: endX, y: endY }
    ]
  });

  // 1-bend Direct V-H: (startX, startY) -> (startX, endY) -> (endX, endY)
  candidates.push({
    type: '1-bend V-H',
    points: [
      { x: startX, y: startY },
      { x: startX, y: endY },
      { x: endX, y: endY }
    ]
  });

  // 3-segment H-V-H via candidateXs: (startX, startY) -> (midX, startY) -> (midX, endY) -> (endX, endY)
  candidateXs.forEach(midX => {
    candidates.push({
      type: 'H-V-H',
      points: [
        { x: startX, y: startY },
        { x: midX, y: startY },
        { x: midX, y: endY },
        { x: endX, y: endY }
      ]
    });
  });

  // 3-segment V-H-V via candidateYs: (startX, startY) -> (startX, midY) -> (endX, midY) -> (endX, endY)
  candidateYs.forEach(midY => {
    candidates.push({
      type: 'V-H-V',
      points: [
        { x: startX, y: startY },
        { x: startX, y: midY },
        { x: endX, y: midY },
        { x: endX, y: endY }
      ]
    });
  });

  let bestPath: Array<{ x: number; y: number }> | null = null;
  let minScore = Infinity;
  const PADDING = 18;

  candidates.forEach(cand => {
    const pts = cand.points;
    let collisions = 0;
    let length = 0;
    const bends = pts.length - 2;

    // Verify initial segment respects exit direction
    const p0 = pts[0];
    const p1 = pts[1];
    if (sideFrom === 'R' && p1.x < p0.x + STUB) return;
    if (sideFrom === 'L' && p1.x > p0.x - STUB) return;
    if (sideFrom === 'T' && p1.y > p0.y - STUB) return;
    if (sideFrom === 'B' && p1.y < p0.y + STUB) return;

    // Verify final segment respects entry direction
    const pk = pts[pts.length - 1];
    const pk1 = pts[pts.length - 2];
    if (sideTo === 'R' && pk1.x < pk.x + STUB) return;
    if (sideTo === 'L' && pk1.x > pk.x - STUB) return;
    if (sideTo === 'T' && pk1.y > pk.y - STUB) return;
    if (sideTo === 'B' && pk1.y < pk.y + STUB) return;

    for (let i = 0; i < pts.length - 1; i++) {
      const segmentStart = pts[i];
      const segmentEnd = pts[i+1];
      const dx = segmentEnd.x - segmentStart.x;
      const dy = segmentEnd.y - segmentStart.y;
      length += Math.abs(dx) + Math.abs(dy);

      positioned.forEach(node => {
        const isFromNode = node.id === fromNode.id;
        const isToNode = node.id === toNode.id;

        if (i === 0 && isFromNode) return;
        if (i === pts.length - 2 && isToNode) return;

        const pad = (isFromNode || isToNode) ? 4 : PADDING;
        const left = node.x - NODE_W / 2 - pad;
        const right = node.x + NODE_W / 2 + pad;
        const top = node.y - NODE_H / 2 - pad;
        const bottom = node.y + NODE_H / 2 + pad;

        if (segmentStart.y === segmentEnd.y) {
          const y = segmentStart.y;
          const xMin = Math.min(segmentStart.x, segmentEnd.x);
          const xMax = Math.max(segmentStart.x, segmentEnd.x);
          if (y > top && y < bottom && xMax > left && xMin < right) {
            collisions++;
          }
        } else {
          const x = segmentStart.x;
          const yMin = Math.min(segmentStart.y, segmentEnd.y);
          const yMax = Math.max(segmentStart.y, segmentEnd.y);
          if (x > left && x < right && yMax > top && yMin < bottom) {
            collisions++;
          }
        }
      });
    }

    const score = collisions * 1000000 + bends * 5000 + length;
    if (score < minScore) {
      minScore = score;
      bestPath = pts;
    }
  });

  if (!bestPath) {
    bestPath = [
      { x: startX, y: startY },
      { x: (startX + endX) / 2, y: startY },
      { x: (startX + endX) / 2, y: endY },
      { x: endX, y: endY }
    ];
  }

  let pathD = `M ${bestPath[0].x} ${bestPath[0].y}`;
  for (let i = 1; i < bestPath.length; i++) {
    const prev = bestPath[i-1];
    const curr = bestPath[i];
    if (curr.x === prev.x && curr.y === prev.y) continue;
    if (curr.x === prev.x) {
      pathD += ` V ${curr.y}`;
    } else if (curr.y === prev.y) {
      pathD += ` H ${curr.x}`;
    } else {
      pathD += ` L ${curr.x} ${curr.y}`;
    }
  }

  const mid = getPathMidpoint(bestPath);

  return {
    pathD,
    points: bestPath,
    midX: mid.x,
    midY: mid.y,
    incomingSide: sideTo
  };
}

/**
 * Disambiguates parallel overlapping segments among multiple routes by distributing
 * co-linear overlapping segments into separate offset tracks, then applies bridge arcs for orthogonal crossings.
 */
export function disambiguateAndBridgePaths(
  routes: Array<{ id: string; points: Array<{ x: number; y: number }>; [key: string]: any }>
): Array<{ id: string; pathD: string; [key: string]: any }> {
  const TRACK_GAP = 14;

  // 1. Group horizontal segments that share roughly the same Y coordinate and overlap in X
  const hSegments: Array<{ routeIdx: number; segIdx: number; y: number; xMin: number; xMax: number }> = [];
  // 2. Group vertical segments that share roughly the same X coordinate and overlap in Y
  const vSegmentsList: Array<{ routeIdx: number; segIdx: number; x: number; yMin: number; yMax: number }> = [];

  routes.forEach((r, rIdx) => {
    for (let i = 0; i < r.points.length - 1; i++) {
      const p1 = r.points[i];
      const p2 = r.points[i + 1];
      if (p1.y === p2.y && p1.x !== p2.x) {
        hSegments.push({
          routeIdx: rIdx,
          segIdx: i,
          y: p1.y,
          xMin: Math.min(p1.x, p2.x),
          xMax: Math.max(p1.x, p2.x)
        });
      } else if (p1.x === p2.x && p1.y !== p2.y) {
        vSegmentsList.push({
          routeIdx: rIdx,
          segIdx: i,
          x: p1.x,
          yMin: Math.min(p1.y, p2.y),
          yMax: Math.max(p1.y, p2.y)
        });
      }
    }
  });

  // Cluster overlapping horizontal segments by Y (within 8px tolerance)
  const hClusters: Array<typeof hSegments> = [];
  hSegments.forEach(seg => {
    let placed = false;
    for (const cluster of hClusters) {
      if (Math.abs(cluster[0].y - seg.y) <= 8) {
        const overlaps = cluster.some(s => !(seg.xMax <= s.xMin + 6 || seg.xMin >= s.xMax - 6));
        if (overlaps) {
          cluster.push(seg);
          placed = true;
          break;
        }
      }
    }
    if (!placed) hClusters.push([seg]);
  });

  // Cluster overlapping vertical segments by X (within 8px tolerance)
  const vClusters: Array<typeof vSegmentsList> = [];
  vSegmentsList.forEach(seg => {
    let placed = false;
    for (const cluster of vClusters) {
      if (Math.abs(cluster[0].x - seg.x) <= 8) {
        const overlaps = cluster.some(s => !(seg.yMax <= s.yMin + 6 || seg.yMin >= s.yMax - 6));
        if (overlaps) {
          cluster.push(seg);
          placed = true;
          break;
        }
      }
    }
    if (!placed) vClusters.push([seg]);
  });

  // Clone route points to apply offsets
  const updatedRoutes = routes.map(r => ({
    ...r,
    points: r.points.map(p => ({ ...p }))
  }));

  // Distribute clustered horizontal segments across offset tracks symmetrically
  hClusters.forEach(cluster => {
    if (cluster.length <= 1) return;
    const count = cluster.length;
    cluster.forEach((seg, idx) => {
      const pts = updatedRoutes[seg.routeIdx].points;
      const isStartSeg = seg.segIdx === 0;
      const isEndSeg = seg.segIdx === pts.length - 2;
      const offset = (idx - (count - 1) / 2) * TRACK_GAP;
      if (Math.abs(offset) < 0.1) return;

      if (!isStartSeg && !isEndSeg) {
        pts[seg.segIdx].y += offset;
        pts[seg.segIdx + 1].y += offset;
      } else if (isStartSeg && pts.length > 2) {
        pts[seg.segIdx + 1].y += offset;
      } else if (isEndSeg && pts.length > 2) {
        pts[seg.segIdx].y += offset;
      }
    });
  });

  // Distribute clustered vertical segments across offset tracks symmetrically
  vClusters.forEach(cluster => {
    if (cluster.length <= 1) return;
    const count = cluster.length;
    cluster.forEach((seg, idx) => {
      const pts = updatedRoutes[seg.routeIdx].points;
      const isStartSeg = seg.segIdx === 0;
      const isEndSeg = seg.segIdx === pts.length - 2;
      const offset = (idx - (count - 1) / 2) * TRACK_GAP;
      if (Math.abs(offset) < 0.1) return;

      if (!isStartSeg && !isEndSeg) {
        pts[seg.segIdx].x += offset;
        pts[seg.segIdx + 1].x += offset;
      } else if (isStartSeg && pts.length > 2) {
        pts[seg.segIdx + 1].x += offset;
      } else if (isEndSeg && pts.length > 2) {
        pts[seg.segIdx].x += offset;
      }
    });
  });

  // 2. Run the bridge arcs generator over the updated routes
  return addBridgeArcsToPaths(updatedRoutes);
}

/**
 * Inserts semicircular bridge arcs onto horizontal segments when crossing vertical segments of other edges.
 */
export function addBridgeArcsToPaths(
  routes: Array<{ id: string; points: Array<{ x: number; y: number }>; [key: string]: any }>
): Array<{ id: string; pathD: string; [key: string]: any }> {
  const ARC_RADIUS = 6;

  // Extract all vertical segments across all routes: { x, yMin, yMax, routeId }
  const vSegments: Array<{ x: number; yMin: number; yMax: number; routeId: string }> = [];
  routes.forEach(r => {
    for (let i = 0; i < r.points.length - 1; i++) {
      const p1 = r.points[i];
      const p2 = r.points[i + 1];
      if (p1.x === p2.x && p1.y !== p2.y) {
        vSegments.push({
          x: p1.x,
          yMin: Math.min(p1.y, p2.y),
          yMax: Math.max(p1.y, p2.y),
          routeId: r.id
        });
      }
    }
  });

  return routes.map(r => {
    const pts = r.points;
    if (!pts || pts.length < 2) return { ...r, pathD: r.pathD };

    let d = `M ${pts[0].x} ${pts[0].y}`;

    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];

      if (p1.y === p2.y && p1.x !== p2.x) {
        // Horizontal segment: check for orthogonal crossings with vertical segments
        const y = p1.y;
        const xStart = p1.x;
        const xEnd = p2.x;
        const xMin = Math.min(xStart, xEnd);
        const xMax = Math.max(xStart, xEnd);
        const isLeftToRight = xEnd > xStart;

        // Find crossings with other routes' vertical segments
        const crossings: number[] = [];
        vSegments.forEach(vs => {
          if (vs.routeId !== r.id) {
            if (vs.x > xMin + ARC_RADIUS + 2 && vs.x < xMax - ARC_RADIUS - 2 && y > vs.yMin + 2 && y < vs.yMax - 2) {
              crossings.push(vs.x);
            }
          }
        });

        if (crossings.length > 0) {
          // Sort crossings in traversal direction
          crossings.sort((a, b) => isLeftToRight ? a - b : b - a);

          crossings.forEach(crossX => {
            if (isLeftToRight) {
              d += ` H ${crossX - ARC_RADIUS}`;
              d += ` A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${crossX + ARC_RADIUS} ${y}`;
            } else {
              d += ` H ${crossX + ARC_RADIUS}`;
              d += ` A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${crossX - ARC_RADIUS} ${y}`;
            }
          });
        }
        d += ` H ${xEnd}`;
      } else if (p1.x === p2.x && p1.y !== p2.y) {
        d += ` V ${p2.y}`;
      } else {
        d += ` L ${p2.x} ${p2.y}`;
      }
    }

    return {
      ...r,
      pathD: d
    };
  });
}

