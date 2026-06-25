import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StateMachineWidget } from '../../../../../src/sections/flowchart/inspector/state-machine-widget';
import { JsonPayloadViewer } from '../../../../../src/sections/flowchart/inspector/json-payload-viewer';
import { InspectorSidebar } from '../../../../../src/sections/flowchart/inspector';
import type { FlowchartEntity, UnifiedFlowchartSchema } from '../../../../../src/sections/flowchart';

const mockStateMachine = {
  states: [
    { id: 'IDLE', label: 'Idle', color: '#838ba7' },
    { id: 'PLANNING', label: 'Planning', color: '#8caaee' },
    { id: 'EXECUTING', label: 'Executing', color: '#a6d189' },
    { id: 'EVALUATING', label: 'Evaluating', color: '#e5c890' },
    { id: 'ESCALATED', label: 'Escalated', color: '#e78284' },
  ],
  initialState: 'IDLE',
};

const mockEntityWithPayload: FlowchartEntity = {
  title: 'Goal Submitted',
  desc: 'Test entity',
  viewTypes: { DATA_FLOW: 'Data Object' },
  jsonPayload: {
    type: 'parsed_request',
    payload: {
      goal: 'Test goal',
      userId: 'usr_001',
    },
  },
};

const mockSchema = {
  entities: {
    orchestrator: {
      title: 'Orchestrator',
      desc: 'Test',
      viewTypes: { SYS_ARCH: 'Aggregate' },
      stateMachine: mockStateMachine,
    },
    evt_goal: {
      title: 'Goal Submitted',
      desc: 'Test',
      viewTypes: { DATA_FLOW: 'Data Object' },
      jsonPayload: { type: 'parsed_request', payload: { goal: 'test' } },
    },
  },
  relations: [],
  views: {},
  journeys: [
    {
      id: 'test-journey',
      label: 'Test Journey',
      steps: [
        { nodeIds: ['evt_goal'], description: 'Goal step' },
        { nodeIds: ['orchestrator'], description: 'Planning step', processGroup: 'planning' },
        { nodeIds: ['orchestrator'], description: 'Execution step', processGroup: 'execution' },
      ],
    },
  ],
};

describe('StateMachineWidget', () => {
  it('renders all states', () => {
    render(<StateMachineWidget stateMachine={mockStateMachine} activeStateId={null} />);
    expect(screen.getByTestId('state-IDLE')).toBeTruthy();
    expect(screen.getByTestId('state-PLANNING')).toBeTruthy();
    expect(screen.getByTestId('state-EXECUTING')).toBeTruthy();
    expect(screen.getByTestId('state-EVALUATING')).toBeTruthy();
    expect(screen.getByTestId('state-ESCALATED')).toBeTruthy();
  });

  it('highlights active state', () => {
    render(<StateMachineWidget stateMachine={mockStateMachine} activeStateId="EXECUTING" />);
    const activeNode = screen.getByTestId('state-EXECUTING');
    expect(activeNode).toHaveClass('inspector-state-active');
  });

  it('falls back to initial state when activeStateId is null', () => {
    render(<StateMachineWidget stateMachine={mockStateMachine} activeStateId={null} />);
    const idleNode = screen.getByTestId('state-IDLE');
    expect(idleNode).toHaveClass('inspector-state-active');
  });

  it('renders transitions between states', () => {
    render(<StateMachineWidget stateMachine={mockStateMachine} activeStateId="PLANNING" />);
    expect(screen.getByTestId('state-transitions')).toBeTruthy();
  });
});

describe('JsonPayloadViewer', () => {
  it('renders payload for entity with jsonPayload', () => {
    render(<JsonPayloadViewer entity={mockEntityWithPayload} />);
    expect(screen.getByTestId('json-payload-viewer')).toBeTruthy();
    expect(screen.getByTestId('json-payload-type')).toHaveTextContent('parsed_request');
    expect(screen.getByTestId('json-payload-code')).toBeTruthy();
    expect(screen.getByTestId('json-payload-code')).toHaveTextContent('Test goal');
  });

  it('shows empty state for entity without jsonPayload', () => {
    const emptyEntity: FlowchartEntity = {
      title: 'Empty Entity',
      desc: 'No payload',
      viewTypes: { EVENT_STORMING: 'Event' },
    };
    render(<JsonPayloadViewer entity={emptyEntity} />);
    expect(screen.getByTestId('json-payload-empty')).toBeTruthy();
  });

  it('shows empty state when entity is null', () => {
    render(<JsonPayloadViewer entity={null} />);
    expect(screen.getByTestId('json-payload-empty')).toBeTruthy();
  });
});

describe('InspectorSidebar', () => {
  const onClose = vi.fn();

  it('renders with state-machine tab active by default', () => {
    render(
      <InspectorSidebar
        schema={mockSchema as UnifiedFlowchartSchema}
        currentStep={-1}
        currentJourneyId="test-journey"
         onClose={onClose}
      />
    );
    expect(screen.getByTestId('inspector-sidebar')).toBeTruthy();
    expect(screen.getByTestId('inspector-tab-state-machine')).toHaveClass('active');
    expect(screen.getByTestId('inspector-widget-state-machine')).toBeTruthy();
  });

  it('switches to payload tab', () => {
    render(
      <InspectorSidebar
        schema={mockSchema as UnifiedFlowchartSchema}
        currentStep={-1}
        currentJourneyId="test-journey"
         onClose={onClose}
      />
    );
    const payloadTab = screen.getByTestId('inspector-tab-payload');
    fireEvent.click(payloadTab);
    expect(screen.getByTestId('inspector-widget-payload')).toBeTruthy();
  });

  it('shows JSON payload for active step', () => {
    render(
      <InspectorSidebar
        schema={mockSchema as UnifiedFlowchartSchema}
        currentStep={0}
        currentJourneyId="test-journey"
         onClose={onClose}
      />
    );
    const payloadTab = screen.getByTestId('inspector-tab-payload');
    fireEvent.click(payloadTab);
    expect(screen.getByTestId('json-payload-viewer')).toBeTruthy();
  });

  it('shows state machine states for orchestrator', () => {
    render(
      <InspectorSidebar
        schema={mockSchema as UnifiedFlowchartSchema}
        currentStep={1}
        currentJourneyId="test-journey"
         onClose={onClose}
      />
    );
    expect(screen.getByTestId('state-PLANNING')).toHaveClass('inspector-state-active');
  });

  it('calls onClose when close button clicked', () => {
    render(
      <InspectorSidebar
        schema={mockSchema as UnifiedFlowchartSchema}
        currentStep={-1}
        currentJourneyId="test-journey"
         onClose={onClose}
      />
    );
    const closeBtn = screen.getByTestId('inspector-close');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
