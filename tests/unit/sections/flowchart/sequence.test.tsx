import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SectionRegistry } from '../../../../src/core/learning-engine/registry';
import Flowchart from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart';
import type { UnifiedFlowchartSchema } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart';

const seqSchema: UnifiedFlowchartSchema = {
  entities: {
    client: { title: 'Client', desc: 'Browser client.', viewTypes: { SEQUENCE: 'Actor' } },
    server: { title: 'Server', desc: 'API server.', viewTypes: { SEQUENCE: 'Service' } },
    database: { title: 'Database', desc: 'Persistent storage.', viewTypes: { SEQUENCE: 'Database' } }
  },
  relations: [
    { id: 's1', from: 'client', to: 'server', views: ['SEQUENCE'], label: 'GET /data' },
    { id: 's2', from: 'server', to: 'database', views: ['SEQUENCE'], label: 'query()' },
    { id: 's3', from: 'database', to: 'server', views: ['SEQUENCE'], label: 'rows' },
    { id: 's4', from: 'server', to: 'client', views: ['SEQUENCE'], label: '200 OK' }
  ],
  views: {
    SEQUENCE: {
      name: 'Sequence Diagram',
      icon: 'List',
      nodes: [
        { id: 'client', grid: [0, 0] },
        { id: 'server', grid: [1, 0] },
        { id: 'database', grid: [2, 0] }
      ],
      groups: []
    }
  },
  journeys: []
};

const multiViewSeqSchema: UnifiedFlowchartSchema = {
  entities: {
    client: { title: 'Client', desc: 'Browser client.', viewTypes: { EVENT_STORMING: 'Actor', SEQUENCE: 'Actor' } },
    server: { title: 'Server', desc: 'API server.', viewTypes: { EVENT_STORMING: 'Service', SEQUENCE: 'Service' } }
  },
  relations: [
    { id: 'e1', from: 'client', to: 'server', views: ['EVENT_STORMING'] },
    { id: 's1', from: 'client', to: 'server', views: ['SEQUENCE'], label: 'request' },
    { id: 's2', from: 'server', to: 'client', views: ['SEQUENCE'], label: 'response' }
  ],
  views: {
    EVENT_STORMING: {
      name: 'Event Storming',
      icon: 'Component',
      nodes: [
        { id: 'client', x: 100, y: 150 },
        { id: 'server', x: 300, y: 150 }
      ],
      groups: []
    },
    SEQUENCE: {
      name: 'Sequence Diagram',
      icon: 'List',
      nodes: [
        { id: 'client', grid: [0, 0] },
        { id: 'server', grid: [1, 0] }
      ],
      groups: []
    }
  },
  journeys: []
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('Flowchart SEQUENCE view', () => {
  beforeEach(() => {
    SectionRegistry.clear();
    vi.useRealTimers();
  });

  it('renders SEQUENCE SVG canvas', () => {
    render(<Flowchart title="Seq Test" schema={seqSchema} />, { wrapper });
    expect(screen.getByTestId('flowchart-svg-SEQUENCE')).toBeInTheDocument();
  });

  it('renders lifelines for each column', () => {
    render(<Flowchart title="Seq Test" schema={seqSchema} />, { wrapper });
    expect(screen.getByTestId('flowchart-lifeline-SEQUENCE-0')).toBeInTheDocument();
    expect(screen.getByTestId('flowchart-lifeline-SEQUENCE-1')).toBeInTheDocument();
    expect(screen.getByTestId('flowchart-lifeline-SEQUENCE-2')).toBeInTheDocument();
  });

  it('renders top participant boxes', () => {
    render(<Flowchart title="Seq Test" schema={seqSchema} />, { wrapper });
    expect(screen.getByTestId('flowchart-seq-top-SEQUENCE-client')).toBeInTheDocument();
    expect(screen.getByTestId('flowchart-seq-top-SEQUENCE-server')).toBeInTheDocument();
    expect(screen.getByTestId('flowchart-seq-top-SEQUENCE-database')).toBeInTheDocument();
  });

  it('renders bottom participant boxes', () => {
    render(<Flowchart title="Seq Test" schema={seqSchema} />, { wrapper });
    expect(screen.getByTestId('flowchart-seq-bottom-SEQUENCE-client')).toBeInTheDocument();
    expect(screen.getByTestId('flowchart-seq-bottom-SEQUENCE-server')).toBeInTheDocument();
    expect(screen.getByTestId('flowchart-seq-bottom-SEQUENCE-database')).toBeInTheDocument();
  });

  it('renders message arrows for each relation', () => {
    render(<Flowchart title="Seq Test" schema={seqSchema} />, { wrapper });
    expect(screen.getByTestId('flowchart-seq-msg-SEQUENCE-0')).toBeInTheDocument();
    expect(screen.getByTestId('flowchart-seq-msg-SEQUENCE-1')).toBeInTheDocument();
    expect(screen.getByTestId('flowchart-seq-msg-SEQUENCE-2')).toBeInTheDocument();
    expect(screen.getByTestId('flowchart-seq-msg-SEQUENCE-3')).toBeInTheDocument();
  });

  it('renders message labels on arrows', () => {
    render(<Flowchart title="Seq Test" schema={seqSchema} />, { wrapper });
    expect(screen.getByTestId('flowchart-seq-msg-label-SEQUENCE-0')).toHaveTextContent('GET /data');
    expect(screen.getByTestId('flowchart-seq-msg-label-SEQUENCE-1')).toHaveTextContent('query()');
    expect(screen.getByTestId('flowchart-seq-msg-label-SEQUENCE-2')).toHaveTextContent('rows');
    expect(screen.getByTestId('flowchart-seq-msg-label-SEQUENCE-3')).toHaveTextContent('200 OK');
  });

  it('renders participant titles in top boxes', () => {
    render(<Flowchart title="Seq Test" schema={seqSchema} />, { wrapper });
    expect(screen.getAllByText('Client').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Server').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Database').length).toBeGreaterThanOrEqual(2);
  });

  it('renders lifelines as dashed lines', () => {
    render(<Flowchart title="Seq Test" schema={seqSchema} />, { wrapper });
    const lifeline = screen.getByTestId('flowchart-lifeline-SEQUENCE-0');
    const line = lifeline.querySelector('line');
    expect(line).toBeInTheDocument();
    expect(line!.getAttribute('stroke-dasharray')).toBe('6 6');
  });

  it('renders return messages as dashed lines', () => {
    render(<Flowchart title="Seq Test" schema={seqSchema} />, { wrapper });
    const msg2 = screen.getByTestId('flowchart-seq-msg-SEQUENCE-2');
    const line = msg2.querySelector('line.flowchart-edge');
    expect(line!.getAttribute('stroke-dasharray')).toBe('8 8');
    const msg3 = screen.getByTestId('flowchart-seq-msg-SEQUENCE-3');
    const line3 = msg3.querySelector('line.flowchart-edge');
    expect(line3!.getAttribute('stroke-dasharray')).toBe('8 8');
  });

  it('renders forward messages as solid lines', () => {
    render(<Flowchart title="Seq Test" schema={seqSchema} />, { wrapper });
    const msg0 = screen.getByTestId('flowchart-seq-msg-SEQUENCE-0');
    const line = msg0.querySelector('line.flowchart-edge');
    expect(line!.getAttribute('stroke-dasharray')).toBe('8 8');
  });

  it('renders view tab for SEQUENCE when multiple views exist', () => {
    render(<Flowchart title="Multi View" schema={multiViewSeqSchema} />, { wrapper });
    expect(screen.getByTestId('flowchart-view-tabs')).toBeInTheDocument();
    const tabs = screen.getByTestId('flowchart-view-tabs');
    expect(tabs.textContent).toContain('Sequence Diagram');
  });

  it('switches to SEQUENCE view from tab', () => {
    render(<Flowchart title="Multi View" schema={multiViewSeqSchema} />, { wrapper });
    const tabs = screen.getByTestId('flowchart-view-tabs');
    const buttons = tabs.querySelectorAll('button');
    let seqTabBtn: HTMLElement | null = null;
    buttons.forEach(btn => {
      if (btn.textContent?.includes('Sequence Diagram')) {
        seqTabBtn = btn as HTMLElement;
      }
    });
    if (seqTabBtn) {
      fireEvent.click(seqTabBtn);
    }
    expect(screen.getByTestId('flowchart-svg-SEQUENCE')).toBeInTheDocument();
    expect(screen.getByTestId('flowchart-lifeline-SEQUENCE-0')).toBeInTheDocument();
  });


  it('renders SEQUENCE condition boundary groups', () => {
    const schemaWithGroups: UnifiedFlowchartSchema = {
      ...seqSchema,
      views: {
        SEQUENCE: {
          name: 'Sequence Diagram',
          icon: 'List',
          nodes: [
            { id: 'client', grid: [0, 0] },
            { id: 'server', grid: [1, 0] }
          ],
          groups: [
            {
              id: 'alt_group',
              title: 'alt [Score < 90%]',
              nodeIds: ['client', 'server'],
              y: 110,
              h: 80,
              borderColor: '#e78284',
              color: 'rgba(231, 130, 132, 0.05)',
              textColor: '#c6d0f5'
            }
          ]
        }
      }
    };

    render(<Flowchart title="Seq Group Test" schema={schemaWithGroups} />, { wrapper });
    
    const groupElement = screen.getByTestId('flowchart-seq-group-SEQUENCE-alt_group');
    expect(groupElement).toBeInTheDocument();
    expect(groupElement.querySelector('rect')).toBeInTheDocument();
    expect(groupElement.querySelector('text')).toHaveTextContent('alt [Score < 90%]');
  });
});
