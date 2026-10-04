import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Flowchart from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart';
import { FlowchartSectionSchema } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/schema';
import { deriveSchema } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/model/derive';
import { autoDeriveViews } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/derivations';
import { computeStoryRoute } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/story-route';

// A small handshake: dev starts the client, the client says hello to the server,
// the server answers the client, the client checks locally, then a state change no system runs.
const { flow } = FlowchartSectionSchema.parse({
  type: 'flowchart',
  flow: {
    actors: { dev: { title: 'Developer' } },
    systems: {
      client: { title: 'Client', type: 'aggregate' },
      server: { title: 'Server', type: 'aggregate' },
      trust: { title: 'Trust Store', type: 'aggregate' },
    },
    steps: [
      {
        id: 'start', type: 'linear', initiatedBy: 'dev', policy: 'On start', command: 'Open connection',
        handledBy: 'client', sendsTo: 'server', resultEvents: [{ id: 'hello', title: 'Hello sent' }], continuesAs: 'answer',
      },
      {
        id: 'answer', type: 'linear', policy: 'On hello', command: 'Send certificate',
        handledBy: 'server', sendsTo: 'client', resultEvents: [{ id: 'cert', title: 'Certificate sent' }], continuesAs: 'check',
      },
      {
        id: 'check', type: 'linear', policy: 'On certificate', command: 'Verify locally',
        handledBy: 'client', delegatesTo: 'trust', resultEvents: [{ id: 'verified', title: 'Verified' }], continuesAs: 'think',
      },
      {
        id: 'think', type: 'linear', policy: 'On verified', command: 'Agree keys',
        handledBy: 'client', resultEvents: [{ id: 'agreed', title: 'Keys agreed' }], continuesAs: 'done',
      },
      {
        id: 'done', type: 'linear', policy: 'On agreed', command: 'Mark secure',
        resultEvents: [{ id: 'secure', title: 'Channel secure' }],
      },
    ],
    journeys: [{
      id: 'happy', label: 'Happy', description: 'All good',
      steps: ['start', 'answer', 'check', 'think', 'done'].map(stepId => ({ stepId, name: stepId, description: `Step ${stepId}` })),
    }],
  },
});

const schema = autoDeriveViews(deriveSchema(flow));
const steps = schema.journeys[0].steps;
const route = (i: number) => computeStoryRoute(schema, 'SYS_ARCH', steps, i)!;
const edge = (id: string | undefined) => {
  const r = schema.relations.find(rel => rel.id === id);
  return r ? `${r.from}->${r.to}` : undefined;
};
const pair = (id: string | undefined) => {
  const r = schema.relations.find(rel => rel.id === id)!;
  return [r.from, r.to].sort().join('|');
};

describe('computeStoryRoute', () => {
  it('only applies to route views', () => {
    expect(computeStoryRoute(schema, 'EVENT_STORMING', steps, 0)).toBeNull();
    expect(computeStoryRoute(schema, 'SYS_ARCH', steps, -1)).toBeNull();
  });

  it('draws the command from the initiator to the handler, and the result to the recipient', () => {
    const r = route(0);
    expect(edge(r.labelEdgeId)).toBe('dev->client');
    expect(r.currentEdgeIds.map(pair)).toContain('client|server');
    expect(r.currentLabel).toBe('Open connection');
    expect(r.badgeNodeId).toBeUndefined();
  });

  it('draws handler → recipient as the main message and records when it runs against the edge', () => {
    const r = route(1);
    expect(pair(r.labelEdgeId)).toBe('client|server');
    expect(r.currentLabel).toBe('Send certificate');
    // client <-> server is stored once; the server-to-client message travels it backwards
    const stored = schema.relations.find(rel => rel.id === r.labelEdgeId)!;
    expect(r.reversedEdgeIds.includes(r.labelEdgeId!)).toBe(stored.from === 'client');
  });

  it('draws a delegation as the only line of a local step', () => {
    const r = route(2);
    expect(edge(r.labelEdgeId)).toBe('client->trust');
    expect(r.badgeNodeId).toBeUndefined();
  });

  it('puts the label on the box when a step sends nothing', () => {
    const r = route(3);
    expect(r.currentEdgeIds).toEqual([]);
    expect(r.badgeNodeId).toBe('client');
    expect(r.currentLabel).toBe('Agree keys');
  });

  it('lights nothing but keeps the label for a step no one runs', () => {
    const r = route(4);
    expect(r.currentEdgeIds).toEqual([]);
    expect(r.currentNodeIds).toEqual([]);
    expect(r.currentLabel).toBe('Mark secure');
  });

  it('keeps earlier lines and boxes as a numbered trail', () => {
    const r = route(4);
    const trail = Object.fromEntries(Object.entries(r.trail).map(([id, n]) => [edge(id), n]));
    expect(trail['dev->client']).toEqual([1]);
    expect(trail['client->trust']).toEqual([3]);
    expect(r.nodeTrail.client).toEqual([4]);
  });
});

describe('Flowchart architecture playback', () => {
  const open = () => {
    const utils = render(<Flowchart title="Handshake" flow={flow} />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByRole('tab', { name: /System Architecture/ }));
    return utils;
  };

  it('labels the main message and keeps earlier steps as a trail', () => {
    const { container } = open();
    fireEvent.click(screen.getByTestId('flowchart-mini-dot-2'));
    const roles = [...container.querySelectorAll('.flowchart-edge-group[data-route]')].map(g => g.getAttribute('data-route'));
    expect(roles.filter(r => r === 'primary')).toHaveLength(1);
    expect(roles).toContain('trail');
    expect(screen.getAllByTestId('flowchart-route-current').some(el => el.textContent?.includes('Verify locally'))).toBe(true);
  });

  it('marches a backwards message the other way with one arrowhead at the receiver', () => {
    const { container } = open();
    fireEvent.click(screen.getByTestId('flowchart-mini-dot-1'));
    const primary = container.querySelector('.flowchart-edge-group[data-route="primary"]')!;
    const path = primary.querySelector('.flowchart-edge')!;
    const reversed = primary.getAttribute('data-route-dir') === 'reverse';
    expect(path.getAttribute(reversed ? 'marker-start' : 'marker-end')).not.toBeNull();
    expect(path.getAttribute(reversed ? 'marker-end' : 'marker-start')).toBeNull();
  });

  it('shows a step that sends nothing as a badge on its box', () => {
    open();
    fireEvent.click(screen.getByTestId('flowchart-mini-dot-3'));
    expect(screen.getByTestId('flowchart-route-node-badge')).toHaveTextContent('4Agree keys');
  });

  it('does not number edges in timeline views', () => {
    const { container } = render(<Flowchart title="Handshake" flow={flow} />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByTestId('flowchart-mini-dot-1'));
    expect(container.querySelector('[data-route]')).toBeNull();
  });
});
