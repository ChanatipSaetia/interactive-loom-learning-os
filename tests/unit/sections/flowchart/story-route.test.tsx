import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Flowchart from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart';
import { deriveSchema } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/model/derive';
import { autoDeriveViews } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/derivations';
import { computeStoryRoute } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/story-route';
import { reviewFlow } from './fixtures/review-flow';

// pass journey: Draft (writer -> repo), Test (tester -> staging), Publish (fork option, staging -> site)
const schema = autoDeriveViews(deriveSchema(reviewFlow));
const pass = schema.journeys[0].steps;
const edge = (id: string) => {
  const r = schema.relations.find(rel => rel.id === id)!;
  return `${r.from}->${r.to}`;
};

describe('computeStoryRoute', () => {
  it('only applies to route views', () => {
    expect(computeStoryRoute(schema, 'EVENT_STORMING', pass, 0)).toBeNull();
    expect(computeStoryRoute(schema, 'SYS_ARCH', pass, -1)).toBeNull();
  });

  it("walks the step's own hand-off and labels it with the command", () => {
    const route = computeStoryRoute(schema, 'SYS_ARCH', pass, 0)!;
    expect(route.currentEdgeIds.map(edge)).toEqual(['writer->repo']);
    expect(route.labelEdgeId && edge(route.labelEdgeId)).toBe('writer->repo');
    expect(route.currentLabel).toBe('Open PR');
    expect(route.currentNumber).toBe(1);
    expect(route.currentNodeIds).toEqual(expect.arrayContaining(['writer', 'repo']));
    expect(route.trail).toEqual({});
  });

  it('keeps earlier steps as a numbered trail', () => {
    const route = computeStoryRoute(schema, 'SYS_ARCH', pass, 2)!;
    const trail = Object.fromEntries(Object.entries(route.trail).map(([id, n]) => [edge(id), n]));
    expect(trail['writer->repo']).toEqual([1]);
    expect(trail['tester->staging']).toEqual([2]);
  });

  it('hands a fork option off from the step that produced the fork', () => {
    const route = computeStoryRoute(schema, 'SYS_ARCH', pass, 2)!;
    expect(route.currentEdgeIds.map(edge)).toContain('staging->site');
    expect(route.currentNodeIds).toEqual(expect.arrayContaining(['staging', 'site']));
    expect(route.currentLabel).toBe('Publish');
  });
});

describe('Flowchart architecture playback', () => {
  it('draws the trail and labels the current hand-off', () => {
    const { container } = render(<Flowchart title="Review" flow={reviewFlow} />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByRole('tab', { name: /System Architecture/ }));
    fireEvent.click(screen.getByTestId('flowchart-mini-dot-1'));

    expect(container.querySelectorAll('.flowchart-edge-group[data-route="trail"]')).toHaveLength(1);
    expect(container.querySelectorAll('.flowchart-edge-group[data-route="current"]').length).toBeGreaterThan(0);
    // Every current edge gets the step number; only one carries the label
    const current = screen.getAllByTestId('flowchart-route-current').map(el => el.textContent);
    expect(current.every(text => text!.startsWith('2'))).toBe(true);
    expect(current.filter(text => text!.includes('Test steps'))).toHaveLength(1);
    expect(screen.getByTestId('flowchart-route-trail')).toHaveTextContent('1');
  });

  it('marks one main line per step and fades lines off the story', () => {
    const { container } = render(<Flowchart title="Review" flow={reviewFlow} />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByRole('tab', { name: /System Architecture/ }));
    fireEvent.click(screen.getByTestId('flowchart-mini-dot-1'));

    const groups = [...container.querySelectorAll<SVGGElement>('.flowchart-edge-group[data-route]')];
    const roles = groups.map(g => g.getAttribute('data-route'));
    expect(roles.filter(r => r === 'primary')).toHaveLength(1);
    expect(roles).toContain('off');
    // Painted last, so it sits on top of overlapping lines
    expect(roles[roles.length - 1]).toBe('primary');
    // Lines off the story drop their arrowheads
    const off = groups.find(g => g.getAttribute('data-route') === 'off')!;
    expect(off.querySelector('.flowchart-edge')!.getAttribute('marker-end')).toBeNull();
  });

  it('does not number edges in timeline views', () => {
    const { container } = render(<Flowchart title="Review" flow={reviewFlow} />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByTestId('flowchart-mini-dot-1'));
    expect(container.querySelector('[data-route]')).toBeNull();
  });
});
