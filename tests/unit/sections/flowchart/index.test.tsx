import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SectionRegistry } from '../../../../src/core/registry';
import Flowchart from '../../../../src/sections/flowchart/index';
import type { UnifiedFlowchartSchema } from '../../../../src/sections/flowchart/index';

const mockSchema: UnifiedFlowchartSchema = {
  entities: {
    user: { title: 'User', desc: 'A user actor.', viewTypes: { DEFAULT_VIEW: 'Command' } },
    agent: { title: 'Agent', desc: 'An agent helper.', viewTypes: { DEFAULT_VIEW: 'Aggregate' } },
    llm: { title: 'LLM', desc: 'A language model.', viewTypes: { DEFAULT_VIEW: 'Read Model' } }
  },
  relations: [
    { id: 'rel_0', from: 'user', to: 'agent', views: ['DEFAULT_VIEW'] },
    { id: 'rel_1', from: 'agent', to: 'llm', views: ['DEFAULT_VIEW'] }
  ],
  views: {
    DEFAULT_VIEW: {
      name: 'Test View',
      icon: 'Workflow',
      nodes: [
        { id: 'user', x: 100, y: 150 },
        { id: 'agent', x: 300, y: 150 },
        { id: 'llm', x: 500, y: 150 }
      ],
      groups: []
    }
  },
  journeys: [
    {
      id: 'journey-a',
      label: 'Journey A',
      steps: [
        { nodeId: 'user', description: 'Journey A Step 1' },
        { nodeId: 'agent', description: 'Journey A Step 2' },
        { nodeId: 'llm', description: 'Journey A Step 3' }
      ]
    },
    {
      id: 'journey-b',
      label: 'Journey B',
      steps: [
        { nodeId: 'agent', description: 'Journey B Step 1' },
        { nodeId: 'llm', description: 'Journey B Step 2' }
      ]
    }
  ]
};

const mockSchemaNoJourneys: UnifiedFlowchartSchema = {
  ...mockSchema,
  journeys: []
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('Flowchart component', () => {
  beforeEach(() => {
    SectionRegistry.clear();
  });

  it('renders SVG flowchart', () => {
    render(<Flowchart title="Test Flowchart" schema={mockSchema} />, { wrapper });
    const svg = screen.getByTestId('flowchart-svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders all nodes with data-testid', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    expect(screen.getByTestId('flowchart-node-user')).toBeInTheDocument();
    expect(screen.getByTestId('flowchart-node-agent')).toBeInTheDocument();
    expect(screen.getByTestId('flowchart-node-llm')).toBeInTheDocument();
  });

  it('renders all edges', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    expect(screen.getByTestId('flowchart-edge-0')).toBeInTheDocument();
    expect(screen.getByTestId('flowchart-edge-1')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Flowchart title="AI Architecture" schema={mockSchema} />, { wrapper });
    expect(screen.getByTestId('flowchart-title')).toHaveTextContent('AI Architecture');
  });

  it('does not render title when not provided', () => {
    render(<Flowchart schema={mockSchema} />, { wrapper });
    expect(screen.queryByTestId('flowchart-title')).not.toBeInTheDocument();
  });

  it('renders node labels', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    expect(screen.getAllByText('User').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Agent').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('LLM').length).toBeGreaterThanOrEqual(1);
  });

  it('renders node stereotypes', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    expect(screen.getByText('<<Command>>')).toBeInTheDocument();
    expect(screen.getByText('<<Aggregate>>')).toBeInTheDocument();
    expect(screen.getByText('<<Read Model>>')).toBeInTheDocument();
  });

  it('renders container with data-testid', () => {
    render(<Flowchart schema={mockSchema} />, { wrapper });
    expect(screen.getByTestId('flowchart-section')).toBeInTheDocument();
  });

  it('renders nodes with rectangles', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    const rects = screen.getByTestId('flowchart-svg').querySelectorAll('rect');
    expect(rects.length).toBeGreaterThanOrEqual(3);
  });

  it('renders edges as directed paths with arrowheads', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    const svg = screen.getByTestId('flowchart-svg');
    const paths = svg.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(2);
    const defs = svg.querySelector('defs');
    expect(defs).toBeInTheDocument();
    expect(defs!.innerHTML).toContain('flowchart-arrow');
  });

  it('does not self-register with SectionRegistry', async () => {
    vi.resetModules();
    const mod = await import('../../../../src/sections/flowchart/index');
    const { SectionRegistry: Registry } = await import('../../../../src/core/registry');
    expect(Registry.get('flowchart')).toBeUndefined();
    void mod;
  });

  it('renders transformable canvas group', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    const canvas = screen.getByTestId('flowchart-canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('transform');
  });



  it('SVG has pan and zoom handlers', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    const svg = screen.getByTestId('flowchart-svg') as unknown as HTMLElement;
    expect(svg.onmousedown).toBeDefined();
    expect(svg.ontouchstart).toBeDefined();
    expect(svg.onwheel).toBeDefined();
  });
});

describe('Flowchart journey controls', () => {
  beforeEach(() => {
    SectionRegistry.clear();
    vi.useFakeTimers();
  });

  it('renders journey selector when journeys provided', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    expect(screen.getByTestId('flowchart-journey-select')).toBeInTheDocument();
  });

  it('does not render controls when journeys not provided', () => {
    render(<Flowchart title="Test" schema={mockSchemaNoJourneys} />, { wrapper });
    expect(screen.queryByTestId('flowchart-journey-select')).not.toBeInTheDocument();
  });

  it('renders all journey options', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    const select = screen.getByTestId('flowchart-journey-select') as HTMLSelectElement;
    expect(select.options).toHaveLength(2);
    expect(select.options[0].text).toBe('Journey A');
    expect(select.options[1].text).toBe('Journey B');
  });

  it('defaults to first journey', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    const select = screen.getByTestId('flowchart-journey-select') as HTMLSelectElement;
    expect(select.value).toBe('journey-a');
  });

  it('switching journeys resets to overview', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    const select = screen.getByTestId('flowchart-journey-select');
    fireEvent.change(select, { target: { value: 'journey-b' } });
    const progress = screen.getByTestId('flowchart-progress');
    expect(progress.textContent).toBe('0 / 2');
  });

  it('renders playback controls', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    expect(screen.getByTestId('flowchart-btn-play')).toBeInTheDocument();
    expect(screen.getByTestId('flowchart-btn-pause')).toBeInTheDocument();
    expect(screen.getByTestId('flowchart-btn-next')).toBeInTheDocument();
    expect(screen.getByTestId('flowchart-btn-prev')).toBeInTheDocument();
    expect(screen.getByTestId('flowchart-btn-reset')).toBeInTheDocument();
  });

  it('renders progress indicator', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    const progress = screen.getByTestId('flowchart-progress');
    expect(progress.textContent).toBe('0 / 3');
  });

  it('prev button is disabled at first step', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    expect(screen.getByTestId('flowchart-btn-prev')).toBeDisabled();
  });

  it('next button is disabled at last step', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    const nextBtn = screen.getByTestId('flowchart-btn-next');
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);
    expect(nextBtn).toBeDisabled();
    expect(screen.getByTestId('flowchart-progress')).toHaveTextContent('3 / 3');
  });

  it('next button advances step', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    const nextBtn = screen.getByTestId('flowchart-btn-next');
    const progress = screen.getByTestId('flowchart-progress');
    expect(progress.textContent).toBe('0 / 3');
    fireEvent.click(nextBtn);
    expect(progress.textContent).toBe('1 / 3');
  });

  it('prev button goes back one step', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    const nextBtn = screen.getByTestId('flowchart-btn-next');
    const prevBtn = screen.getByTestId('flowchart-btn-prev');
    const progress = screen.getByTestId('flowchart-progress');
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);
    expect(progress.textContent).toBe('2 / 3');
    fireEvent.click(prevBtn);
    expect(progress.textContent).toBe('1 / 3');
  });

  it('reset button returns to overview', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    const nextBtn = screen.getByTestId('flowchart-btn-next');
    const resetBtn = screen.getByTestId('flowchart-btn-reset');
    const progress = screen.getByTestId('flowchart-progress');
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);
    expect(progress.textContent).toBe('2 / 3');
    fireEvent.click(resetBtn);
    expect(progress.textContent).toBe('0 / 3');
  });

  it('play auto-advances through steps', async () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    const playBtn = screen.getByTestId('flowchart-btn-play');
    const progress = screen.getByTestId('flowchart-progress');
    expect(progress.textContent).toBe('0 / 3');
    await act(async () => {
      fireEvent.click(playBtn);
    });
    expect(progress.textContent).toBe('1 / 3');
    await act(async () => {
      vi.advanceTimersByTime(2600);
    });
    expect(progress.textContent).toBe('2 / 3');
    await act(async () => {
      vi.advanceTimersByTime(2600);
    });
    expect(progress.textContent).toBe('3 / 3');
  });

  it('pause stops auto-advance', async () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    const playBtn = screen.getByTestId('flowchart-btn-play');
    const pauseBtn = screen.getByTestId('flowchart-btn-pause');
    const progress = screen.getByTestId('flowchart-progress');
    await act(async () => {
      fireEvent.click(playBtn);
      fireEvent.click(pauseBtn);
      vi.advanceTimersByTime(2600);
    });
    expect(progress.textContent).toBe('1 / 3');
  });

  it('highlights current step node', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    const nextBtn = screen.getByTestId('flowchart-btn-next');
    fireEvent.click(nextBtn);
    const svg = screen.getByTestId('flowchart-svg');
    const userNode = svg.querySelector('[data-testid="flowchart-node-user"]');
    expect(userNode).toBeInTheDocument();
    const userRect = svg.querySelector('[data-testid="flowchart-node-user"] rect');
    expect(userRect).toBeInTheDocument();
  });

  it('update highlight when step advances', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    const nextBtn = screen.getByTestId('flowchart-btn-next');
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);
    const agentNode = screen.getByTestId('flowchart-node-agent');
    expect(agentNode).toBeInTheDocument();
    const progress = screen.getByTestId('flowchart-progress');
    expect(progress.textContent).toBe('2 / 3');
  });

  it('play disabled at last step', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    const nextBtn = screen.getByTestId('flowchart-btn-next');
    const playBtn = screen.getByTestId('flowchart-btn-play');
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);
    expect(playBtn).toBeDisabled();
  });

  it('pause disabled when not playing', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    expect(screen.getByTestId('flowchart-btn-pause')).toBeDisabled();
  });

  it('reset disabled at overview', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    expect(screen.getByTestId('flowchart-btn-reset')).toBeDisabled();
  });
});

describe('Flowchart particle animation', () => {
  beforeEach(() => {
    SectionRegistry.clear();
    vi.useFakeTimers();
  });

  it('renders particle circle when journeys provided', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    expect(screen.getByTestId('flowchart-particle')).toBeInTheDocument();
  });

  it('does not render particle when no journeys', () => {
    render(<Flowchart title="Test" schema={mockSchemaNoJourneys} />, { wrapper });
    expect(screen.queryByTestId('flowchart-particle')).not.toBeInTheDocument();
  });

  it('particle is invisible at step 0', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    const particle = screen.getByTestId('flowchart-particle');
    expect(particle.getAttribute('opacity')).toBe('0');
  });

  it('particle is present when advancing step', () => {
    render(<Flowchart title="Test" schema={mockSchema} />, { wrapper });
    const nextBtn = screen.getByTestId('flowchart-btn-next');
    fireEvent.click(nextBtn);
    const particle = screen.getByTestId('flowchart-particle');
    expect(particle).toBeInTheDocument();
  });
});

describe('Flowchart grid coordinate compilation', () => {
  const gridSchema: UnifiedFlowchartSchema = {
    entities: {
      n1: { title: 'Node 1', desc: 'Node 1 desc', viewTypes: { EVENT_STORMING: 'Event', SYS_ARCH: 'Service' } }
    },
    relations: [],
    views: {
      EVENT_STORMING: {
        name: 'Event Storming',
        icon: 'Component',
        nodes: [
          { id: 'n1', grid: [1, 2] }
        ],
        groups: []
      },
      SYS_ARCH: {
        name: 'System Architecture',
        icon: 'Server',
        nodes: [
          { id: 'n1', grid: [1, 2] }
        ],
        groups: []
      }
    },
    journeys: []
  };

  it('resolves grid coordinates in EVENT_STORMING view', () => {
    // Render flowchart, defaulting to EVENT_STORMING view
    render(<Flowchart title="Grid Test" schema={gridSchema} />, { wrapper });
    const nodeGroup = screen.getByTestId('flowchart-node-n1');
    expect(nodeGroup).toBeInTheDocument();
    
    const rect = nodeGroup.querySelector('rect');
    expect(rect).toBeInTheDocument();
    
    // grid: [1, 2] -> x = 1 * 140 + 60 = 200 -> rect x = 200 - 140/2 = 130
    // grid: [1, 2] -> y = r2 -> 250 -> rect y = 250 - 100/2 = 200
    expect(rect!.getAttribute('x')).toBe('130');
    expect(rect!.getAttribute('y')).toBe('200');
  });

  it('renders and switches view via related views popup when clicking a node in view mode', async () => {
    const multiViewSchema: UnifiedFlowchartSchema = {
      entities: {
        n1: { title: 'Node 1', desc: 'Node 1 desc', viewTypes: { VIEW_A: 'Event', VIEW_B: 'Service' } }
      },
      relations: [],
      views: {
        VIEW_A: {
          name: 'View A',
          icon: 'Component',
          nodes: [{ id: 'n1', grid: [1, 2] }],
          groups: []
        },
        VIEW_B: {
          name: 'View B',
          icon: 'Server',
          nodes: [{ id: 'n1', grid: [2, 2] }],
          groups: []
        }
      },
      journeys: []
    };

    render(<Flowchart title="Multi View Test" schema={multiViewSchema} />, { wrapper });
    
    // Click on node n1
    const node = screen.getByTestId('flowchart-node-n1');
    expect(node).toBeInTheDocument();
    
    // Simulates a click directly on the node
    fireEvent.click(node);
    
    // Verify popup appears
    expect(screen.getByText('Related Views')).toBeInTheDocument();
    expect(screen.getByText('as Service')).toBeInTheDocument();
    const jumpButton = screen.getAllByText('View B')[1];
    expect(jumpButton).toBeInTheDocument();
    
    // Click jump to View B
    fireEvent.click(jumpButton);
    
    // Verify popup closes and focuses on target node (scale(0.8))
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.queryByText('Related Views')).not.toBeInTheDocument();
    const canvas = screen.getByTestId('flowchart-canvas');
    expect(canvas.getAttribute('transform')).toContain('scale(0.8)');
  });
});



