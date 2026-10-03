/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { readFileSync, readdirSync, existsSync } from 'fs';
// @ts-ignore
import { join, resolve } from 'path';
import { load } from 'js-yaml';
import { FlowchartSectionSchema } from '../../../../../src/core/learning-engine/sub-contexts/process-simulation/schema';
import { deriveSchema } from '../../../../../src/core/learning-engine/sub-contexts/process-simulation/model/derive';
import { autoDeriveViews } from '../../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/derivations';
import {
  getViewSpacing,
  positionViewNodes,
  routeViewRelations,
} from '../../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/views/geometry';
import { NODE_W, NODE_H } from '../../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/types';
import type { UnifiedFlowchartSchema } from '../../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/types';

// @ts-ignore
const OKF_ROOT = resolve(process.cwd ? process.cwd() : '.', 'public/okf');

/** Every flowchart section in the repo, derived the same way the app does. */
export function loadAllFlowcharts(): Array<{ name: string; schema: UnifiedFlowchartSchema }> {
  const result: Array<{ name: string; schema: UnifiedFlowchartSchema }> = [];
  for (const topic of readdirSync(OKF_ROOT).sort()) {
    const sectionsDir = join(OKF_ROOT, topic, 'sections');
    if (!existsSync(sectionsDir)) continue;
    for (const section of readdirSync(sectionsDir).sort()) {
      const dir = join(sectionsDir, section);
      const md = join(dir, 'section.md');
      if (!existsSync(md) || !/^type: flowchart\s*$/m.test(readFileSync(md, 'utf8'))) continue;
      const read = (file: string) => load(readFileSync(join(dir, file), 'utf8'));
      const { flow } = FlowchartSectionSchema.parse({
        type: 'flowchart',
        flow: { actors: read('actors.yaml'), systems: read('systems.yaml'), steps: read('steps.yaml'), journeys: read('journeys.yaml') },
      });
      result.push({ name: `${topic}/${section}`, schema: autoDeriveViews(deriveSchema(flow)) });
    }
  }
  return result;
}

type Pt = { x: number; y: number };
interface Seg { a: Pt; b: Pt; route: number }

export interface LayoutMetrics {
  /** "from->to x node" for every edge that passes through a node other than its own ends. */
  through: string[];
  /** Total length (px) where two different edges run on top of each other. */
  overlap: number;
  nodes: number;
  edges: number;
}

/** Measures the routed layout of one view the way it is drawn. */
export function measureView(schema: UnifiedFlowchartSchema, viewKey: string): LayoutMetrics {
  const view = schema.views?.[viewKey];
  const spacing = getViewSpacing(view, viewKey);
  const positioned = positionViewNodes(view, spacing, false);
  const routes = routeViewRelations(view, viewKey, schema, positioned, spacing, false);

  const segs: Seg[] = [];
  const through: string[] = [];
  routes.forEach((r: { from: string; to: string; points: Pt[] }, ri: number) => {
    const hits = new Set<string>();
    for (let i = 0; i < r.points.length - 1; i++) {
      const a = r.points[i], b = r.points[i + 1];
      segs.push({ a, b, route: ri });
      for (const n of positioned) {
        if (n.id === r.from || n.id === r.to) continue;
        const left = n.x - NODE_W / 2 + 2, right = n.x + NODE_W / 2 - 2;
        const top = n.y - NODE_H / 2 + 2, bottom = n.y + NODE_H / 2 - 2;
        const xMin = Math.min(a.x, b.x), xMax = Math.max(a.x, b.x);
        const yMin = Math.min(a.y, b.y), yMax = Math.max(a.y, b.y);
        if (xMax > left && xMin < right && yMax > top && yMin < bottom) hits.add(n.id);
      }
    }
    hits.forEach(h => through.push(`${r.from}->${r.to} x ${h}`));
  });

  let overlap = 0;
  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length; j++) {
      const s = segs[i], t = segs[j];
      if (s.route === t.route) continue;
      const sH = s.a.y === s.b.y, tH = t.a.y === t.b.y;
      if (sH && tH && Math.abs(s.a.y - t.a.y) < 2) {
        overlap += Math.max(0, Math.min(Math.max(s.a.x, s.b.x), Math.max(t.a.x, t.b.x)) - Math.max(Math.min(s.a.x, s.b.x), Math.min(t.a.x, t.b.x)));
      } else if (!sH && !tH && Math.abs(s.a.x - t.a.x) < 2) {
        overlap += Math.max(0, Math.min(Math.max(s.a.y, s.b.y), Math.max(t.a.y, t.b.y)) - Math.max(Math.min(s.a.y, s.b.y), Math.min(t.a.y, t.b.y)));
      }
    }
  }
  return { through, overlap: Math.round(overlap), nodes: positioned.length, edges: routes.length };
}

/** Segments that are neither horizontal nor vertical (a routing bug, drawn slanted). */
export function slantedSegments(schema: UnifiedFlowchartSchema, viewKey: string): number {
  const view = schema.views?.[viewKey];
  const spacing = getViewSpacing(view, viewKey);
  const positioned = positionViewNodes(view, spacing, false);
  const routes = routeViewRelations(view, viewKey, schema, positioned, spacing, false);
  let count = 0;
  routes.forEach((r: { points: Pt[] }) => {
    for (let i = 0; i < r.points.length - 1; i++) {
      const a = r.points[i], b = r.points[i + 1];
      if (Math.abs(a.x - b.x) > 0.5 && Math.abs(a.y - b.y) > 0.5) count++;
    }
  });
  return count;
}
