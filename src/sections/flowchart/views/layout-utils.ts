import { NODE_W, NODE_H } from '../types';

const MIN_ROW_SPACING = 120;
const MAX_ROW_SPACING = 240;

export function computeDynamicSpacing(
  info: { rowCount: number; colCount: number; nodeCount: number },
  base: { colSpacing: number; rowSpacing: number; offsetX: number; offsetY: number },
  viewKey: string
): { colSpacing: number; rowSpacing: number; offsetX: number; offsetY: number } {
  const { rowCount, colCount } = info;

  if (viewKey === 'SEQUENCE') return base;

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
): { pathD: string; midX: number; midY: number } {
  const candidates: Array<{ type: string; points: Array<{ x: number; y: number }> }> = [];

  const candidateXs = new Set<number>();
  candidateXs.add((startX + endX) / 2);
  candidateXs.add(startX + 30);
  candidateXs.add(startX - 30);
  candidateXs.add(endX + 30);
  candidateXs.add(endX - 30);

  const maxCol = positioned.length > 0 ? Math.max(...positioned.map(n => n.grid?.[0] ?? 0)) : 0;
  for (let c = 0; c <= maxCol; c++) {
    candidateXs.add((c + 0.5) * spacing.colSpacing + spacing.offsetX);
  }

  const candidateYs = new Set<number>();
  candidateYs.add((startY + endY) / 2);
  candidateYs.add(startY + 30);
  candidateYs.add(startY - 30);
  candidateYs.add(endY + 30);
  candidateYs.add(endY - 30);

  const maxRow = positioned.length > 0 ? Math.max(...positioned.map(n => n.grid?.[1] ?? 0)) : 0;
  for (let r = 0; r <= maxRow; r++) {
    candidateYs.add((r + 0.5) * spacing.rowSpacing + spacing.offsetY);
  }

  // 1-bend H-V
  candidates.push({
    type: '1-bend H-V',
    points: [
      { x: startX, y: startY },
      { x: endX, y: startY },
      { x: endX, y: endY }
    ]
  });

  // 1-bend V-H
  candidates.push({
    type: '1-bend V-H',
    points: [
      { x: startX, y: startY },
      { x: startX, y: endY },
      { x: endX, y: endY }
    ]
  });

  // H-V-H
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

  // V-H-V
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
  const PADDING = 12;

  candidates.forEach(cand => {
    const pts = cand.points;
    let collisions = 0;
    let length = 0;
    const bends = pts.length - 2;

    const p0 = pts[0];
    const p1 = pts[1];
    if (sideFrom === 'R' && p1.x < p0.x) return;
    if (sideFrom === 'L' && p1.x > p0.x) return;
    if (sideFrom === 'T' && p1.y > p0.y) return;
    if (sideFrom === 'B' && p1.y < p0.y) return;

    const pk = pts[pts.length - 1];
    const pk1 = pts[pts.length - 2];
    if (sideTo === 'R' && pk1.x < pk.x) return;
    if (sideTo === 'L' && pk1.x > pk.x) return;
    if (sideTo === 'T' && pk1.y > pk.y) return;
    if (sideTo === 'B' && pk1.y < pk.y) return;

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

        const pad = (isFromNode || isToNode) ? 0 : PADDING;
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
    midX: mid.x,
    midY: mid.y
  };
}
