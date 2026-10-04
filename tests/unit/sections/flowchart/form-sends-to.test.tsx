import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FlowchartFormEditor } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/FlowchartFormEditor';
import { ref } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/abstract-flow/types';
import type { AbstractFlow } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/abstract-flow/types';

const flow: AbstractFlow = {
  actors: { dev: { title: 'Developer', desc: '' } },
  systems: { client: { title: 'Client', desc: '', type: 'aggregate' }, server: { title: 'Server', desc: '', type: 'aggregate' } },
  steps: [
    {
      type: 'linear', id: 'hello', initiatedBy: ref('dev'), policy: 'On start', command: 'Say hello',
      handledBy: ref('client'), resultEvents: [{ id: 'said', title: 'Hello said' }], continuesAs: 'fork',
    },
    {
      type: 'branch', id: 'fork', event: 'said',
      branches: [{ id: 'ok', label: 'OK', policy: 'If ok', command: 'Accept', handledBy: ref('server'), sendsTo: ref('dev'), resultEvents: [{ id: 'accepted', title: 'Accepted' }] }],
    },
  ],
  journeys: [],
};

describe('FlowchartFormEditor sendsTo', () => {
  it('offers every actor and system as a recipient and saves the choice as a reference', () => {
    const onChange = vi.fn();
    render(<FlowchartFormEditor data={{ type: 'flowchart', flow } as never} onChange={onChange} />);
    const select = screen.getByTestId('flowchart-step-0-sendsTo') as HTMLSelectElement;
    expect([...select.options].map(o => o.value)).toEqual(['', 'dev', 'client', 'server']);
    fireEvent.change(select, { target: { value: 'server' } });
    expect(onChange.mock.calls[0][0].flow.steps[0].sendsTo).toEqual(ref('server'));
  });

  it('shows and clears the recipient of a branch option', () => {
    const onChange = vi.fn();
    render(<FlowchartFormEditor data={{ type: 'flowchart', flow } as never} onChange={onChange} />);
    const select = screen.getByTestId('flowchart-step-1-branch-0-sendsTo') as HTMLSelectElement;
    expect(select.value).toBe('dev');
    fireEvent.change(select, { target: { value: '' } });
    expect(onChange.mock.calls[0][0].flow.steps[1].branches[0].sendsTo).toBeUndefined();
  });
});
