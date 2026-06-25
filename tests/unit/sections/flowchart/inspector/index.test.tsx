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

const mockStateMachine2 = {
  states: [
    { id: 'PENDING', label: 'Pending', color: '#838ba7' },
    { id: 'PROCESSING', label: 'Processing', color: '#8caaee' },
    { id: 'COMPLETED', label: 'Completed', color: '#a6d189' },
  ],
  initialState: 'PENDING',
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

// Schema with multiple aggregates that have stateMachine
const multiAggSchema: UnifiedFlowchartSchema = {
  entities: {
    order_service: {
      title: 'Order Service',
      desc: 'Core order orchestration',
      viewTypes: { EVENT_STORMING: 'Aggregate' },
      stateMachine: mockStateMachine,
    },
    inventory_service: {
      title: 'Inventory Service',
      desc: 'Stock management',
      viewTypes: { EVENT_STORMING: 'Aggregate' },
      stateMachine: mockStateMachine2,
    },
    evt_order: {
      title: 'Order Placed',
      desc: 'Order event',
      viewTypes: { EVENT_STORMING: 'Event' },
    },
  },
  relations: [],
  views: {},
  journeys: [
    {
      id: 'order-journey',
      label: 'Order Journey',
      steps: [
        { nodeIds: ['evt_order'], description: 'Order placed' },
        { nodeIds: ['order_service'], description: 'Processing', processGroup: 'execution' },
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

  // New tests for aggregate dropdown
  it('shows aggregate dropdown when multiple aggregates have stateMachine', () => {
    render(
      <InspectorSidebar
        schema={multiAggSchema}
        currentStep={-1}
        currentJourneyId="order-journey"
        onClose={onClose}
      />
    );
    const select = screen.getByTestId('inspector-aggregate-select');
    expect(select).toBeTruthy();
    expect(select).toHaveValue('order_service');
  });

  it('shows aggregate dropdown with single option when one aggregate has stateMachine', () => {
    render(
      <InspectorSidebar
        schema={mockSchema as UnifiedFlowchartSchema}
        currentStep={-1}
        currentJourneyId="test-journey"
        onClose={onClose}
      />
    );
    const select = screen.getByTestId('inspector-aggregate-select') as HTMLSelectElement;
    expect(select).toBeTruthy();
    expect(select.options).toHaveLength(1);
    expect(select.options[0].text).toBe('Orchestrator');
  });

  it('renders all aggregates in dropdown', () => {
    render(
      <InspectorSidebar
        schema={multiAggSchema}
        currentStep={-1}
        currentJourneyId="order-journey"
        onClose={onClose}
      />
    );
    const select = screen.getByTestId('inspector-aggregate-select') as HTMLSelectElement;
    expect(select.options).toHaveLength(2);
    expect(select.options[0].text).toBe('Order Service');
    expect(select.options[1].text).toBe('Inventory Service');
  });

  it('switching aggregate updates state machine display', () => {
    const onAggregateChange = vi.fn();
    render(
      <InspectorSidebar
        schema={multiAggSchema}
        currentStep={-1}
        currentJourneyId="order-journey"
        selectedAggregateId="order_service"
        onAggregateChange={onAggregateChange}
        onClose={onClose}
      />
    );

    expect(screen.getByTestId('state-IDLE')).toBeTruthy();
    expect(screen.getByTestId('state-PLANNING')).toBeTruthy();

    const select = screen.getByTestId('inspector-aggregate-select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'inventory_service' } });

    expect(onAggregateChange).toHaveBeenCalledWith('inventory_service');
  });

  it('controlled selectedAggregateId displays correct state machine', () => {
    render(
      <InspectorSidebar
        schema={multiAggSchema}
        currentStep={-1}
        currentJourneyId="order-journey"
        selectedAggregateId="inventory_service"
        onClose={onClose}
      />
    );
    expect(screen.getByTestId('state-PENDING')).toBeTruthy();
    expect(screen.getByTestId('state-PROCESSING')).toBeTruthy();
    expect(screen.getByTestId('state-COMPLETED')).toBeTruthy();
    expect(screen.queryByTestId('state-IDLE')).not.toBeInTheDocument();
  });

  it('calls onAggregateChange when dropdown value changes', () => {
    const onAggregateChange = vi.fn();
    render(
      <InspectorSidebar
        schema={multiAggSchema}
        currentStep={-1}
        currentJourneyId="order-journey"
        selectedAggregateId="order_service"
        onAggregateChange={onAggregateChange}
        onClose={onClose}
      />
    );

    const select = screen.getByTestId('inspector-aggregate-select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'inventory_service' } });
    expect(onAggregateChange).toHaveBeenCalledWith('inventory_service');
  });

  it('shows state machine hint when no step data', () => {
    render(
      <InspectorSidebar
        schema={mockSchema as UnifiedFlowchartSchema}
        currentStep={-1}
        currentJourneyId="test-journey"
        onClose={onClose}
      />
    );
    expect(screen.getByTestId('state-machine-hint')).toBeTruthy();
    expect(screen.getByTestId('state-machine-hint')).toHaveTextContent('Advance playback to see state transitions');
  });
});
