import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Flowchart from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart';
import { deriveSchema } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/abstract-flow/derive';
import type { AbstractFlow } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/abstract-flow/types';
import { autoDeriveViews } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/derivations';
import { sequenceFocusBBox, SEQUENCE_LAYOUT } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/views/geometry';
import { validateProcessSimulationTier3 } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/validation';
import { compileOUISection } from '../../../../src/core/learning-engine/composition/oui/compile';
import { content, propsOf } from '../present/helpers';
import { printOUISection } from '../../../../src/core/learning-engine/composition/oui/print';

const source = (tail: string) => `root = Flowchart("Brew", [brewer], [kettle], [heat], [happy]${tail})
brewer = Actor("brewer", "Brewer", "Makes tea")
kettle = System("kettle", "Kettle", "Heats water", "aggregate")
heat = Step("heat", "On brew", "Heat water", kettle, [Event("hot", "Water Hot")], brewer, null, null, null, brewer)
happy = Journey("happy", "Happy", "All good", [JourneyStep(heat, "Heat", "The water heats")])
`;

const compile = (tail: string) => {
  const { value } = compileOUISection(source(tail));
  return value!;
};
const flowOf = (tail: string) => (compile(tail).data as unknown as { flow: AbstractFlow }).flow;

describe('Flowchart initialView', () => {
  it('is the last Flowchart argument, after heading and lead', () => {
    expect(flowOf('').initialView).toBeUndefined();
    expect(flowOf(', null, null, "sequence"').initialView).toBe('sequence');
  });

  it('survives printing the section back to OUI', () => {
    const { meta, data } = compile(', "From kettle to cup", null, "architecture"');
    const printed = printOUISection(meta, data);
    expect(printed).toContain('"architecture"');
    const again = compileOUISection(printed).value!;
    expect((again.data as unknown as { flow: AbstractFlow }).flow.initialView).toBe('architecture');
    expect(again.meta.heading).toBe('From kettle to cup');
  });

  it('opens the section on that view', () => {
    const schema = deriveSchema(flowOf(', null, null, "sequence"'));
    expect(schema.initialView).toBe('SEQUENCE');
    render(<MemoryRouter><Flowchart title="Brew" schema={schema} /></MemoryRouter>);
    expect(screen.getByTestId('flowchart-canvas-SEQUENCE')).toBeInTheDocument();
  });

  it('switches views with narration and falls back when a requested view is empty', () => {
    const schema = deriveSchema(flowOf(''));
    const { rerender } = render(<MemoryRouter><Flowchart title="Brew" schema={schema} present={{ step: 0, view: 'architecture' }} /></MemoryRouter>);
    expect(screen.getByTestId('flowchart-canvas-SYS_ARCH')).toBeInTheDocument();
    rerender(<MemoryRouter><Flowchart title="Brew" schema={schema} present={{ step: 0, view: 'sequence' }} /></MemoryRouter>);
    expect(screen.getByTestId('flowchart-canvas-SEQUENCE')).toBeInTheDocument();
    rerender(<MemoryRouter><Flowchart title="Brew" schema={schema} present={{ step: 0, view: 'state-machine' }} /></MemoryRouter>);
    expect(screen.getByTestId('flowchart-canvas-EVENT_STORMING')).toBeInTheDocument();
  });

  it('presents different sequence messages on each overview page with all participants', () => {
    const data = propsOf<{ schema: import('../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/types').UnifiedFlowchartSchema }>(content('hexagonal-architecture/sections/flowchart.oui'));
    const renderPage = (page: number) => <MemoryRouter><Flowchart title="Order" schema={data.schema} present={{ step: -1, view: 'sequence', overview: true, overviewPage: page, overviewPages: 3 }} /></MemoryRouter>;
    const { rerender } = render(renderPage(0));
    const first = screen.getAllByTestId(/^flowchart-seq-msg-label-SEQUENCE-/).map((node) => node.textContent);
    expect(first.length).toBeGreaterThan(0);
    expect(first.every((label) => !label?.endsWith('...'))).toBe(true);
    const participants = screen.getAllByTestId(/^flowchart-lifeline-SEQUENCE-/).length;
    rerender(renderPage(1));
    const second = screen.getAllByTestId(/^flowchart-seq-msg-label-SEQUENCE-/).map((node) => node.textContent);
    expect(second).not.toEqual(first);
    expect(screen.getAllByTestId(/^flowchart-lifeline-SEQUENCE-/)).toHaveLength(participants);
  });

  it('does not cut a compact architecture view when narration switches views during a paged overview', () => {
    const data = propsOf<{ schema: import('../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/types').UnifiedFlowchartSchema }>(content('hexagonal-architecture/sections/flowchart.oui'));
    render(<MemoryRouter><Flowchart title="Order" schema={data.schema} present={{ step: -1, view: 'architecture', overview: true, overviewPage: 0, overviewPages: 3 }} /></MemoryRouter>);
    expect(screen.getByTestId('flowchart-canvas-SYS_ARCH')).not.toHaveAttribute('clip-path');
    expect(screen.getByText('System Boundary')).toBeInTheDocument();
  });

  it('keeps swimlane headings and backgrounds visible across overview pages', () => {
    const data = propsOf<{ schema: import('../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/types').UnifiedFlowchartSchema }>(content('hexagonal-architecture/sections/flowchart.oui'));
    const renderPage = (page: number) => <MemoryRouter><Flowchart title="Order" schema={data.schema} present={{ step: -1, view: 'swimlanes', overview: true, overviewPage: page, overviewPages: 3 }} /></MemoryRouter>;
    const { rerender } = render(renderPage(0));
    const lanes = screen.getAllByTestId(/^present-swimlane-/);
    expect(lanes.length).toBeGreaterThan(1);
    expect(lanes[0]).toHaveTextContent('Online Customer');
    expect(lanes[0].querySelector('rect')).toHaveAttribute('width', '100%');
    rerender(renderPage(2));
    expect(screen.getAllByTestId(/^present-swimlane-/)[0]).toHaveTextContent('Online Customer');
  });

  it('falls back to Event Storming when the view has nothing to show', () => {
    const schema = deriveSchema(flowOf(', null, null, "state-machine"'));
    render(<MemoryRouter><Flowchart title="Brew" schema={schema} /></MemoryRouter>);
    expect(screen.getByTestId('flowchart-canvas-EVENT_STORMING')).toBeInTheDocument();
  });

  it('warns when it asks for a state machine the flowchart does not declare', () => {
    const diagnostics = validateProcessSimulationTier3(compile(', null, null, "state-machine"').data as Record<string, unknown>, 'flowchart');
    expect(diagnostics.map(d => d.field)).toContain('initialView');
    const fine = validateProcessSimulationTier3(compile(', null, null, "sequence"').data as Record<string, unknown>, 'flowchart');
    expect(fine.map(d => d.field)).not.toContain('initialView');
  });
});

describe('sequenceFocusBBox', () => {
  const schema = autoDeriveViews(deriveSchema(flowOf('')));
  const view = schema.views!.SEQUENCE;
  const messages = schema.relations.filter(r => r.views?.includes('SEQUENCE'));

  it('frames the given messages, not the whole diagram', () => {
    const box = sequenceFocusBBox(schema, view, [messages[0].id], null)!;
    const y = SEQUENCE_LAYOUT.MSG_START_Y + (messages[0].yOffset ?? 0);
    expect(box.minY).toBeLessThan(y);
    expect(box.maxY).toBeGreaterThan(y);
    expect(box.maxY - box.minY).toBeLessThan(SEQUENCE_LAYOUT.MSG_SPACING * 2);
  });

  it('falls back to the participants\' header boxes when no message is active', () => {
    const box = sequenceFocusBBox(schema, view, null, ['brewer'])!;
    expect(box.minY).toBe(SEQUENCE_LAYOUT.TOP_Y);
    expect(sequenceFocusBBox(schema, view, null, null)).toBeNull();
  });
});
