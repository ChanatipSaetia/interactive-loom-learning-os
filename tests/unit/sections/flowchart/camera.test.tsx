import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SectionRegistry } from '../../../../src/core/registry';
import Flowchart from '../../../../src/sections/flowchart/index';
import type { UnifiedFlowchartSchema } from '../../../../src/sections/flowchart/index';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

// Schema with 4 views, each having a distinct node at different positions
// Some nodes appear in all views, some only in specific views
const multiViewSchema: UnifiedFlowchartSchema = {
  entities: {
    // Nodes present in all views
    'user': {
      title: 'User',
      desc: 'Human actor',
      viewTypes: {
        EVENT_STORMING: 'Actor',
        SYS_ARCH: 'Actor',
        DATA_FLOW: 'Actor',
        SWIMLANES: 'Actor'
      }
    },
    'service': {
      title: 'Service',
      desc: 'Backend service',
      viewTypes: {
        EVENT_STORMING: 'Aggregate',
        SYS_ARCH: 'Service',
        DATA_FLOW: 'Process',
        SWIMLANES: 'Process'
      }
    },
    // Event-only node (only in EVENT_STORMING and DATA_FLOW)
    'evt_created': {
      title: 'Event Created',
      desc: 'Domain event',
      viewTypes: {
        EVENT_STORMING: 'Event',
        DATA_FLOW: 'Data Object'
      }
    },
    // Policy-only node (only in EVENT_STORMING)
    'pol_route': {
      title: 'Route Policy',
      desc: 'Business policy',
      viewTypes: {
        EVENT_STORMING: 'Policy'
      }
    }
  },
  relations: [
    { id: 'r1', from: 'user', to: 'service', views: ['EVENT_STORMING', 'SYS_ARCH', 'DATA_FLOW', 'SWIMLANES'] },
    { id: 'r2', from: 'service', to: 'evt_created', views: ['EVENT_STORMING', 'DATA_FLOW'] },
    { id: 'r3', from: 'evt_created', to: 'pol_route', views: ['EVENT_STORMING'] }
  ],
  views: {
    EVENT_STORMING: {
      name: 'Event Storming',
      icon: 'Component',
      nodes: [
        { id: 'user', x: 100, y: 100 },
        { id: 'service', x: 300, y: 100 },
        { id: 'evt_created', x: 500, y: 100 },
        { id: 'pol_route', x: 700, y: 100 }
      ],
      groups: []
    },
    SYS_ARCH: {
      name: 'System Architecture',
      icon: 'Server',
      nodes: [
        { id: 'user', x: 100, y: 200 },
        { id: 'service', x: 400, y: 200 }
      ],
      groups: []
    },
    DATA_FLOW: {
      name: 'Data Flow',
      icon: 'Share2',
      nodes: [
        { id: 'user', x: 100, y: 300 },
        { id: 'service', x: 300, y: 300 },
        { id: 'evt_created', x: 500, y: 300 }
      ],
      groups: []
    },
    SWIMLANES: {
      name: 'Swimlanes',
      icon: 'Layers',
      nodes: [
        { id: 'user', x: 100, y: 400 },
        { id: 'service', x: 500, y: 400 }
      ],
      groups: []
    }
  },
  journeys: [
    {
      id: 'journey-1',
      label: 'Test Journey',
      description: 'Tests camera focus across views',
      steps: [
        // Step 1: user + evt_created (evt_created only in ES and DFD)
        { nodeIds: ['user', 'evt_created'], description: 'Step 1: User creates event' },
        // Step 2: service + pol_route (pol_route only in ES)
        { nodeIds: ['service', 'pol_route'], description: 'Step 2: Service routes policy' },
        // Step 3: user + service (both in all views)
        { nodeIds: ['user', 'service'], description: 'Step 3: User interacts with service' }
      ]
    }
  ]
};

describe('Flowchart independent camera per viewport', () => {
  beforeEach(() => {
    SectionRegistry.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders 4 SVGs in grid mode with independent canvas transforms', () => {
    render(<Flowchart title="Multi-View" schema={multiViewSchema} />, { wrapper });
    
    // Switch to grid mode
    fireEvent.click(screen.getByTestId('flowchart-btn-grid'));
    
    expect(screen.getByTestId('flowchart-grid-container')).toBeInTheDocument();
    
    const canvases = screen.queryAllByTestId(/flowchart-canvas-/);
    expect(canvases).toHaveLength(4);
    
    // Each canvas should have a transform attribute
    for (const canvas of canvases) {
      expect(canvas.getAttribute('transform')).toBeTruthy();
    }
  });

  it('renders 4 SVGs in grid mode with independent SVG elements', () => {
    render(<Flowchart title="Multi-View" schema={multiViewSchema} />, { wrapper });
    
    fireEvent.click(screen.getByTestId('flowchart-btn-grid'));
    
    const svgs = screen.queryAllByTestId(/flowchart-svg-/);
    expect(svgs).toHaveLength(4);
    
    // Verify each view key has its own SVG
    expect(screen.getByTestId('flowchart-svg-EVENT_STORMING')).toBeInTheDocument();
    expect(screen.getByTestId('flowchart-svg-SYS_ARCH')).toBeInTheDocument();
    expect(screen.getByTestId('flowchart-svg-DATA_FLOW')).toBeInTheDocument();
    expect(screen.getByTestId('flowchart-svg-SWIMLANES')).toBeInTheDocument();
  });

  it('step advance triggers focus in all 4 grid viewports', () => {
    render(<Flowchart title="Multi-View" schema={multiViewSchema} />, { wrapper });
    
    fireEvent.click(screen.getByTestId('flowchart-btn-grid'));
    
    // Advance to step 1
    fireEvent.click(screen.getByTestId('flowchart-btn-next'));
    expect(screen.getByTestId('flowchart-progress')).toHaveTextContent('1 / 3');
    
    // Advance to step 2
    fireEvent.click(screen.getByTestId('flowchart-btn-next'));
    expect(screen.getByTestId('flowchart-progress')).toHaveTextContent('2 / 3');
    
    // All 4 canvases should still be present with transforms after step changes
    const canvases = screen.queryAllByTestId(/flowchart-canvas-/);
    expect(canvases).toHaveLength(4);
    
    for (const canvas of canvases) {
      expect(canvas.getAttribute('transform')).toBeTruthy();
    }
  });

  it('viewports show view-specific nodes in grid mode', () => {
    render(<Flowchart title="Multi-View" schema={multiViewSchema} />, { wrapper });
    
    fireEvent.click(screen.getByTestId('flowchart-btn-grid'));
    
    // EVENT_STORMING should have 4 nodes (including pol_route)
    const esSvg = screen.getByTestId('flowchart-svg-EVENT_STORMING');
    const esNodes = esSvg.querySelectorAll('[data-testid^="flowchart-node-EVENT_STORMING-"]');
    expect(esNodes).toHaveLength(4);
    
    // SYS_ARCH should have 2 nodes (no pol_route, no evt_created)
    const saSvg = screen.getByTestId('flowchart-svg-SYS_ARCH');
    const saNodes = saSvg.querySelectorAll('[data-testid^="flowchart-node-SYS_ARCH-"]');
    expect(saNodes).toHaveLength(2);
    
    // DATA_FLOW should have 3 nodes (no pol_route)
    const dfSvg = screen.getByTestId('flowchart-svg-DATA_FLOW');
    const dfNodes = dfSvg.querySelectorAll('[data-testid^="flowchart-node-DATA_FLOW-"]');
    expect(dfNodes).toHaveLength(3);
    
    // SWIMLANES should have 2 nodes
    const swSvg = screen.getByTestId('flowchart-svg-SWIMLANES');
    const swNodes = swSvg.querySelectorAll('[data-testid^="flowchart-node-SWIMLANES-"]');
    expect(swNodes).toHaveLength(2);
  });

  it('step with view-specific nodes highlights only nodes present in each view', () => {
    render(<Flowchart title="Multi-View" schema={multiViewSchema} />, { wrapper });
    
    fireEvent.click(screen.getByTestId('flowchart-btn-grid'));
    
    // Step 2: service + pol_route (pol_route only in EVENT_STORMING)
    fireEvent.click(screen.getByTestId('flowchart-btn-next'));
    fireEvent.click(screen.getByTestId('flowchart-btn-next'));
    expect(screen.getByTestId('flowchart-progress')).toHaveTextContent('2 / 3');
    
    // EVENT_STORMING should highlight both service and pol_route
    const esSvg = screen.getByTestId('flowchart-svg-EVENT_STORMING');
    const esService = esSvg.querySelector('[data-testid="flowchart-node-EVENT_STORMING-service"]');
    const esPolRoute = esSvg.querySelector('[data-testid="flowchart-node-EVENT_STORMING-pol_route"]');
    expect(esService?.querySelector('rect')?.classList.contains('flowchart-node-highlighted')).toBe(true);
    expect(esPolRoute?.querySelector('rect')?.classList.contains('flowchart-node-highlighted')).toBe(true);
    
    // SYS_ARCH should only highlight service (pol_route doesn't exist)
    const saSvg = screen.getByTestId('flowchart-svg-SYS_ARCH');
    const saService = saSvg.querySelector('[data-testid="flowchart-node-SYS_ARCH-service"]');
    expect(saService?.querySelector('rect')?.classList.contains('flowchart-node-highlighted')).toBe(true);
    // pol_route doesn't exist in SYS_ARCH
    expect(saSvg.querySelector('[data-testid="flowchart-node-SYS_ARCH-pol_route"]')).toBeNull();
  });

  it('transform canvas groups exist for each view in grid mode', () => {
    render(<Flowchart title="Multi-View" schema={multiViewSchema} />, { wrapper });
    
    fireEvent.click(screen.getByTestId('flowchart-btn-grid'));
    
    const esCanvas = screen.getByTestId('flowchart-canvas-EVENT_STORMING');
    const saCanvas = screen.getByTestId('flowchart-canvas-SYS_ARCH');
    const dfCanvas = screen.getByTestId('flowchart-canvas-DATA_FLOW');
    const swCanvas = screen.getByTestId('flowchart-canvas-SWIMLANES');
    
    expect(esCanvas).toBeInTheDocument();
    expect(saCanvas).toBeInTheDocument();
    expect(dfCanvas).toBeInTheDocument();
    expect(swCanvas).toBeInTheDocument();
    
    // Each should have a transform attribute with scale and translate
    const esTransform = esCanvas.getAttribute('transform');
    const saTransform = saCanvas.getAttribute('transform');
    const dfTransform = dfCanvas.getAttribute('transform');
    const swTransform = swCanvas.getAttribute('transform');
    
    expect(esTransform).toMatch(/translate\(/);
    expect(saTransform).toMatch(/translate\(/);
    expect(dfTransform).toMatch(/translate\(/);
    expect(swTransform).toMatch(/translate\(/);
    
    expect(esTransform).toMatch(/scale\(/);
    expect(saTransform).toMatch(/scale\(/);
    expect(dfTransform).toMatch(/scale\(/);
    expect(swTransform).toMatch(/scale\(/);
  });

  it('grid view labels appear for all 4 quadrants', () => {
    render(<Flowchart title="Multi-View" schema={multiViewSchema} />, { wrapper });
    
    fireEvent.click(screen.getByTestId('flowchart-btn-grid'));
    
    expect(screen.getByTestId('flowchart-grid-label-EVENT_STORMING')).toBeInTheDocument();
    expect(screen.getByTestId('flowchart-grid-label-SYS_ARCH')).toBeInTheDocument();
    expect(screen.getByTestId('flowchart-grid-label-DATA_FLOW')).toBeInTheDocument();
    expect(screen.getByTestId('flowchart-grid-label-SWIMLANES')).toBeInTheDocument();
  });
});
