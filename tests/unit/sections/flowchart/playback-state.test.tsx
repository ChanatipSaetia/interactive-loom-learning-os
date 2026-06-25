import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlaybackState } from '../../../../src/sections/flowchart/usePlaybackState';
import type { UnifiedFlowchartSchema } from '../../../../src/sections/flowchart/types';

const baseSchema: UnifiedFlowchartSchema = {
  entities: {
    node_a: { title: 'Node A', desc: '', viewTypes: { EVENT_STORMING: 'Actor' } },
    node_b: { title: 'Node B', desc: '', viewTypes: { EVENT_STORMING: 'Aggregate' } },
    node_c: { title: 'Node C', desc: '', viewTypes: { EVENT_STORMING: 'Event' } },
  },
  relations: [
    { id: 'r1', from: 'node_a', to: 'node_b', views: ['EVENT_STORMING'] },
    { id: 'r2', from: 'node_b', to: 'node_c', views: ['EVENT_STORMING'] },
  ],
  views: {
    EVENT_STORMING: {
      name: 'Event Storming',
      icon: 'Component',
      nodes: [
        { id: 'node_a', x: 100, y: 100 },
        { id: 'node_b', x: 300, y: 100 },
        { id: 'node_c', x: 500, y: 100 },
      ],
      groups: [],
    },
  },
  journeys: [
    {
      id: 'journey-1',
      label: 'First Journey',
      description: 'Tests playback state',
      steps: [
        { nodeIds: ['node_a'], description: 'Step 1: Node A' },
        { nodeIds: ['node_b'], description: 'Step 2: Node B' },
        { nodeIds: ['node_a', 'node_c'], description: 'Step 3: Node A and C' },
      ],
    },
    {
      id: 'journey-2',
      label: 'Second Journey',
      description: 'Second journey for switching',
      steps: [
        { nodeIds: ['node_c'], description: 'Step 1: Node C' },
        { nodeIds: ['node_a', 'node_b', 'node_c'], description: 'Step 2: All nodes' },
      ],
    },
  ],
};

describe('usePlaybackState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with first journey and step -1', () => {
    const { result } = renderHook(() => usePlaybackState({ schema: baseSchema }));

    expect(result.current.currentJourneyId).toBe('journey-1');
    expect(result.current.currentStep).toBe(-1);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.activeNodeIds).toBeNull();
    expect(result.current.highlightedNodeId).toBeNull();
  });

  it('sets currentJourney to the first journey on init', () => {
    const { result } = renderHook(() => usePlaybackState({ schema: baseSchema }));

    expect(result.current.currentJourney).toBeDefined();
    expect(result.current.currentJourney?.id).toBe('journey-1');
    expect(result.current.currentJourney?.steps.length).toBe(3);
  });

  it('handleNext advances step from -1 to 0', () => {
    const { result } = renderHook(() => usePlaybackState({ schema: baseSchema }));

    act(() => { result.current.handleNext(); });

    expect(result.current.currentStep).toBe(0);
    expect(result.current.activeNodeIds).toEqual(['node_a']);
    expect(result.current.highlightedNodeId).toBe('node_a');
  });

  it('handleNext advances through all steps', () => {
    const { result } = renderHook(() => usePlaybackState({ schema: baseSchema }));

    act(() => { result.current.handleNext(); });
    act(() => { result.current.handleNext(); });

    expect(result.current.currentStep).toBe(1);
    expect(result.current.activeNodeIds).toEqual(['node_b']);

    act(() => { result.current.handleNext(); });

    expect(result.current.currentStep).toBe(2);
    expect(result.current.activeNodeIds).toEqual(['node_a', 'node_c']);
  });

  it('handleNext does not advance beyond last step', () => {
    const { result } = renderHook(() => usePlaybackState({ schema: baseSchema }));

    act(() => { result.current.handleNext(); });
    act(() => { result.current.handleNext(); });
    act(() => { result.current.handleNext(); });
    act(() => { result.current.handleNext(); });

    expect(result.current.currentStep).toBe(2);
  });

  it('handlePrev retreats from step 0 to -1', () => {
    const { result } = renderHook(() => usePlaybackState({ schema: baseSchema }));

    act(() => { result.current.handleNext(); });
    act(() => { result.current.handlePrev(); });

    expect(result.current.currentStep).toBe(-1);
    expect(result.current.activeNodeIds).toBeNull();
  });

  it('handlePrev does not go below -1', () => {
    const { result } = renderHook(() => usePlaybackState({ schema: baseSchema }));

    act(() => {
      result.current.handlePrev();
    });

    expect(result.current.currentStep).toBe(-1);
  });

  it('handleReset returns to step -1 and stops playback', () => {
    const { result } = renderHook(() => usePlaybackState({ schema: baseSchema }));

    act(() => { result.current.handleNext(); });
    act(() => { result.current.handleNext(); });
    act(() => { result.current.handlePlay(); });

    expect(result.current.currentStep).toBeGreaterThanOrEqual(0);
    expect(result.current.isPlaying).toBe(true);

    act(() => { result.current.handleReset(); });

    expect(result.current.currentStep).toBe(-1);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.activeNodeIds).toBeNull();
  });

  it('setCurrentJourneyId resets step and stops playback', () => {
    const { result } = renderHook(() => usePlaybackState({ schema: baseSchema }));

    act(() => { result.current.handleNext(); });
    act(() => { result.current.handleNext(); });
    act(() => { result.current.handlePlay(); });

    act(() => { result.current.setCurrentJourneyId('journey-2'); });

    expect(result.current.currentJourneyId).toBe('journey-2');
    expect(result.current.currentStep).toBe(-1);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentJourney?.steps.length).toBe(2);
  });

  it('handlePlay starts playback from step 0 when at -1', () => {
    const { result } = renderHook(() => usePlaybackState({ schema: baseSchema }));

    act(() => {
      result.current.handlePlay();
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.currentStep).toBe(0);
  });

  it('handlePlay resumes from current step when not at -1', () => {
    const { result } = renderHook(() => usePlaybackState({ schema: baseSchema }));

    act(() => {
      result.current.handleNext();
      result.current.handlePlay();
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.currentStep).toBe(0);
  });

  it('handlePause stops playback without changing step', () => {
    const { result } = renderHook(() => usePlaybackState({ schema: baseSchema }));

    act(() => {
      result.current.handlePlay();
      result.current.handlePause();
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentStep).toBe(0);
  });

  it('auto-advances steps during playback', () => {
    const { result } = renderHook(() => usePlaybackState({ schema: baseSchema }));

    act(() => {
      result.current.handlePlay();
    });

    expect(result.current.currentStep).toBe(0);

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(result.current.currentStep).toBe(1);

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(result.current.currentStep).toBe(2);
  });

  it('stops auto-advance at last step', () => {
    const { result } = renderHook(() => usePlaybackState({ schema: baseSchema }));

    act(() => {
      result.current.handlePlay();
    });

    // Advance through all steps
    for (let i = 0; i < 5; i++) {
      act(() => {
        vi.advanceTimersByTime(2500);
      });
    }

    expect(result.current.currentStep).toBe(2);
    expect(result.current.isPlaying).toBe(false);
  });

  it('activeNodeIds returns null when step is -1', () => {
    const { result } = renderHook(() => usePlaybackState({ schema: baseSchema }));

    expect(result.current.activeNodeIds).toBeNull();
  });

  it('activeNodeIds returns correct node set per step', () => {
    const { result } = renderHook(() => usePlaybackState({ schema: baseSchema }));

    act(() => { result.current.handleNext(); });
    expect(result.current.activeNodeIds).toEqual(['node_a']);

    act(() => { result.current.handleNext(); });
    expect(result.current.activeNodeIds).toEqual(['node_b']);

    act(() => { result.current.handleNext(); });
    expect(result.current.activeNodeIds).toEqual(['node_a', 'node_c']);
  });

  it('highlightedNodeId is first node of active set', () => {
    const { result } = renderHook(() => usePlaybackState({ schema: baseSchema }));

    act(() => { result.current.handleNext(); });
    act(() => { result.current.handleNext(); });

    expect(result.current.highlightedNodeId).toBe('node_b');

    act(() => { result.current.handleNext(); });

    expect(result.current.highlightedNodeId).toBe('node_a');
  });

  it('prevHighlightedNodeId tracks previous step highlight', () => {
    const { result } = renderHook(() => usePlaybackState({ schema: baseSchema }));

    act(() => { result.current.handleNext(); });
    act(() => { result.current.handleNext(); });

    expect(result.current.prevHighlightedNodeId).toBe('node_a');
    expect(result.current.highlightedNodeId).toBe('node_b');
  });

  it('prevHighlightedNodeId is null at step 0', () => {
    const { result } = renderHook(() => usePlaybackState({ schema: baseSchema }));

    act(() => { result.current.handleNext(); });

    expect(result.current.currentStep).toBe(0);
    expect(result.current.prevHighlightedNodeId).toBeNull();
  });

  it('resetAll resets step and playback state', () => {
    const { result } = renderHook(() => usePlaybackState({ schema: baseSchema }));

    act(() => { result.current.handleNext(); });
    act(() => { result.current.handleNext(); });
    act(() => { result.current.handlePlay(); });
    act(() => { result.current.resetAll(); });

    expect(result.current.currentStep).toBe(-1);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.activeNodeIds).toBeNull();
  });

  it('multiple next/prev cycles maintain consistent state', () => {
    const { result } = renderHook(() => usePlaybackState({ schema: baseSchema }));

    act(() => { result.current.handleNext(); });
    act(() => { result.current.handleNext(); });
    act(() => { result.current.handlePrev(); });
    act(() => { result.current.handleNext(); });
    act(() => { result.current.handleNext(); });

    expect(result.current.currentStep).toBe(2);
    expect(result.current.activeNodeIds).toEqual(['node_a', 'node_c']);
  });

  it('setCurrentStep updates the current step directly', () => {
    const { result } = renderHook(() => usePlaybackState({ schema: baseSchema }));

    act(() => { result.current.setCurrentStep(1); });

    expect(result.current.currentStep).toBe(1);
    expect(result.current.activeNodeIds).toEqual(['node_b']);
    expect(result.current.highlightedNodeId).toBe('node_b');
  });
});
