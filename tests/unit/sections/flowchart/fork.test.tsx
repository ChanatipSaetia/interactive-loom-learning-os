import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Flowchart from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart';
import { reviewFlow } from './fixtures/review-flow';
import { deriveSchema } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/model/derive';
import { autoDeriveViews } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/derivations';
import { computeForkHighlights } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/fork-highlights';

const flow = reviewFlow;

describe('journey branch info', () => {
  const schema = deriveSchema(flow);

  it('marks only the steps that take a fork option', () => {
    const pass = schema.journeys[0].steps;
    expect(pass[0].branch).toBeUndefined();
    expect(pass[1].branch).toBeUndefined();
    expect(pass[2].branch).toMatchObject({ optionId: 'opt_pass', label: 'It worked' });
  });

  it('records the fork source and links each alternative to the journey that takes it', () => {
    const branch = schema.journeys[0].steps[2].branch!;
    expect(branch.forkNodeIds).toContain('evt_tested');
    expect(branch.forkNodeIds).toContain('cmd_step_test');
    expect(branch.alternatives).toEqual([
      expect.objectContaining({ optionId: 'opt_fail', label: 'It failed', journeyId: 'fail', stepIndex: 2 }),
    ]);
    expect(branch.alternatives[0].nodeIds).toContain('cmd_opt_fail');
  });

  it('does not treat a single-option branch as a fork', () => {
    const single = deriveSchema({
      ...flow,
      steps: flow.steps.map(s => (s.type === 'branch' ? { ...s, branches: [s.branches[0]] } : s)),
      journeys: [flow.journeys[0]],
    });
    expect(single.journeys[0].steps[2].branch).toBeUndefined();
  });
});

describe('computeForkHighlights', () => {
  const schema = autoDeriveViews(deriveSchema(flow));
  const step = schema.journeys[0].steps[2];

  it('splits the fork edges into taken and not taken in Event Storming', () => {
    const h = computeForkHighlights(schema, 'EVENT_STORMING', step.branch, step.nodeIds)!;
    const rel = (id: string) => schema.relations.find(r => r.id === id)!;
    expect(h.takenRelationIds.map(id => [rel(id).from, rel(id).to])).toEqual([['evt_tested', 'pol_opt_pass']]);
    expect(h.altRelationIds.map(id => [rel(id).from, rel(id).to])).toEqual([['evt_tested', 'pol_opt_fail']]);
    expect(h.altNodeIds).toEqual(expect.arrayContaining(['pol_opt_fail', 'cmd_opt_fail']));
  });

  it('marks the alt: groups in the sequence view', () => {
    const h = computeForkHighlights(schema, 'SEQUENCE', step.branch, step.nodeIds)!;
    expect(h.takenGroupId).toBe('seq_group_opt_pass');
    expect(h.altGroupIds).toEqual(['seq_group_opt_fail']);
  });

  it('has nothing to show in the state machine or for a step without a fork', () => {
    expect(computeForkHighlights(schema, 'STATE_MACHINE', step.branch, step.nodeIds)).toBeNull();
    const plain = schema.journeys[0].steps[1];
    expect(computeForkHighlights(schema, 'EVENT_STORMING', plain.branch, plain.nodeIds)).toBeNull();
  });
});

describe('Flowchart fork playback', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('shows fork steps as diamonds in the mini player', () => {
    render(<Flowchart title="Review" flow={flow} />, { wrapper: MemoryRouter });
    expect(screen.getByTestId('flowchart-mini-dot-1')).not.toHaveAttribute('data-branch');
    expect(screen.getByTestId('flowchart-mini-dot-2')).toHaveAttribute('data-branch', 'true');
    expect(screen.getByTestId('flowchart-mini-dot-2')).toHaveAttribute('title', '3. Publish (fork: It worked)');
  });

  it('marks the taken option in the caption and links to the other path', () => {
    render(<Flowchart title="Review" flow={flow} />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByTestId('flowchart-mini-dot-1'));
    expect(screen.queryByTestId('flowchart-step-caption-branch')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('flowchart-mini-dot-2'));
    expect(screen.getByTestId('flowchart-step-caption-branch')).toHaveTextContent('It worked');
    const alt = screen.getByTestId('flowchart-step-caption-alt');
    expect(alt).toHaveTextContent('It failed');

    fireEvent.click(alt);
    expect(screen.getByTestId('flowchart-mini-journey-trigger')).toHaveTextContent('Fail');
    expect(screen.getByTestId('flowchart-mini-progress').textContent).toBe('3 / 3');
    expect(screen.getByTestId('flowchart-step-caption-branch')).toHaveTextContent('It failed');
  });

  it('marks fork edges and the nodes of the path not taken on the canvas', () => {
    const { container } = render(<Flowchart title="Review" flow={flow} />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByTestId('flowchart-mini-dot-2'));
    expect(container.querySelectorAll('.flowchart-edge-group[data-fork="taken"]')).toHaveLength(1);
    expect(container.querySelectorAll('.flowchart-edge-group[data-fork="alt"]')).toHaveLength(1);
    expect(container.querySelector('[data-testid="flowchart-node-EVENT_STORMING-cmd_opt_fail"]')).toHaveAttribute('data-fork', 'alt');
    expect(container.querySelector('[data-testid="flowchart-node-EVENT_STORMING-cmd_opt_pass"]')).not.toHaveAttribute('data-fork');
  });

  it('shows the fork badge on the step card', () => {
    render(<Flowchart title="Review" flow={flow} />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByTestId('flowchart-dock-expand'));
    vi.advanceTimersByTime(1000);
    const badges = screen.getAllByTestId('flowchart-step-card-branch');
    expect(badges).toHaveLength(1);
    expect(badges[0]).toHaveTextContent('It worked');
  });
});
