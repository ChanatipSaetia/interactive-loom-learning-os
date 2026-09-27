/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
import { describe, it, expect } from 'vitest';
// @ts-ignore
import * as fs from 'fs';
// @ts-ignore
import * as path from 'path';
import * as yaml from 'js-yaml';
import { deriveSchema } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/model/derive';

// @ts-ignore
const OKF_ROOT = path.resolve(process.cwd ? process.cwd() : '.', 'public/okf');

interface SectionLoc {
  topic: string;
  section: string;
  dir: string;
}

function findFlowchartSections(): SectionLoc[] {
  const out: SectionLoc[] = [];
  for (const topic of fs.readdirSync(OKF_ROOT, { withFileTypes: true })) {
    if (!topic.isDirectory()) continue;
    const sectionsDir = path.join(OKF_ROOT, topic.name, 'sections');
    if (!fs.existsSync(sectionsDir)) continue;
    for (const sec of fs.readdirSync(sectionsDir, { withFileTypes: true })) {
      if (!sec.isDirectory()) continue;
      const md = path.join(sectionsDir, sec.name, 'section.md');
      if (!fs.existsSync(md)) continue;
      const m = fs.readFileSync(md, 'utf8').match(/^type:\s*(\S+)/m);
      if (m && m[1] === 'flowchart') {
        out.push({ topic: topic.name, section: sec.name, dir: path.join(sectionsDir, sec.name) });
      }
    }
  }
  return out;
}

function load(dir: string, file: string): any {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) return null;
  return yaml.load(fs.readFileSync(p, 'utf8'));
}

function loadSteps(dir: string): any[] {
  const raw = load(dir, 'steps.yaml');
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && Array.isArray(raw.steps)) return raw.steps;
  return [];
}

const getId = (ref: any): string => (typeof ref === 'string' ? ref : ref?.id || '');

const SYSTEM_DERIVED_TYPES = new Set(['Aggregate', 'External API', 'Service', 'Database']);

describe('Flowchart Invariants across all public/okf sections', () => {
  const sections = findFlowchartSections();

  it('finds all flowchart sections', () => {
    expect(sections.length).toBeGreaterThan(0);
  });

  it('CHECK 1: every actor & system is attached to at least one step', () => {
    const failures: string[] = [];
    for (const s of sections) {
      const actors = load(s.dir, 'actors.yaml') || {};
      const systems = load(s.dir, 'systems.yaml') || {};
      const steps = loadSteps(s.dir);

      const referenced = new Set<string>();
      for (const step of steps) {
        if (step.type === 'linear') {
          if (step.initiatedBy) referenced.add(getId(step.initiatedBy));
          if (step.handledBy) referenced.add(getId(step.handledBy));
          if (step.delegatesTo) referenced.add(getId(step.delegatesTo));
        } else if (step.type === 'branch') {
          for (const b of step.branches || []) {
            if (b.initiatedBy) referenced.add(getId(b.initiatedBy));
            if (b.handledBy) referenced.add(getId(b.handledBy));
            if (b.delegatesTo) referenced.add(getId(b.delegatesTo));
          }
        }
      }

      for (const id of Object.keys(actors)) {
        if (!referenced.has(id)) failures.push(`${s.topic}/${s.section}: actor "${id}" not attached to any step`);
      }
      for (const id of Object.keys(systems)) {
        if (!referenced.has(id)) failures.push(`${s.topic}/${s.section}: system "${id}" not attached to any step`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('CHECK 2: every command has an aggregate/external system as handler', () => {
    const failures: string[] = [];
    for (const s of sections) {
      const actors = load(s.dir, 'actors.yaml') || {};
      const systems = load(s.dir, 'systems.yaml') || {};
      const steps = loadSteps(s.dir);
      const journeys = load(s.dir, 'journeys.yaml') || [];

      for (const step of steps) {
        if (step.type === 'linear') {
          const h = getId(step.handledBy);
          if (!h) failures.push(`${s.topic}/${s.section}: step "${step.id}" has no handledBy`);
          else if (!systems[h]) failures.push(`${s.topic}/${s.section}: step "${step.id}" handledBy "${h}" not in systems.yaml`);
        } else if (step.type === 'branch') {
          for (const b of step.branches || []) {
            const h = getId(b.handledBy);
            if (!h) failures.push(`${s.topic}/${s.section}: branch "${b.id}" has no handledBy`);
            else if (!systems[h]) failures.push(`${s.topic}/${s.section}: branch "${b.id}" handledBy "${h}" not in systems.yaml`);
          }
        }
      }

      const derived = deriveSchema({ actors, systems, steps, journeys });
      const entityTypes: Record<string, string> = {};
      for (const [id, e] of Object.entries(derived.entities)) entityTypes[id] = (e as any).type;

      for (const [cmdId, cmd] of Object.entries(derived.entities)) {
        if ((cmd as any).type !== 'Command') continue;
        const ok = derived.relations.some(r =>
          r.from === cmdId && r.handledBy && SYSTEM_DERIVED_TYPES.has(entityTypes[r.to] || '')
        );
        if (!ok) {
          failures.push(
            `${s.topic}/${s.section}: command "${cmdId}" ("${(cmd as any).title}") has no handledBy relation to an Aggregate/External system`
          );
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('CHECK 3: deriveSchema produces per-step node instances without title suffixes or collapsedTo', () => {
    for (const s of sections) {
      const actors = load(s.dir, 'actors.yaml') || {};
      const systems = load(s.dir, 'systems.yaml') || {};
      const steps = loadSteps(s.dir);
      const journeys = load(s.dir, 'journeys.yaml') || [];

      const derived = deriveSchema({ actors, systems, steps, journeys });

      for (const [, entity] of Object.entries(derived.entities)) {
        expect((entity as any).collapsedTo).toBeUndefined();
        if (entity.title) {
          expect(entity.title).not.toMatch(/\s+\d+$/);
        }
      }
    }
  });
});
