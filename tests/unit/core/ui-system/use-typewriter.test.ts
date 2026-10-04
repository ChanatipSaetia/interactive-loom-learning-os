import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTypewriter } from '../../../../src/core/ui-system/motion/use-typewriter';

const reducedMotion = vi.hoisted(() => ({ value: false }));
vi.mock('motion/react', () => ({ useReducedMotion: () => reducedMotion.value }));

describe('useTypewriter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    reducedMotion.value = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reveals the text one character per tick', () => {
    const { result } = renderHook(() => useTypewriter('abcd', { charDelay: 10 }));
    expect(result.current.shown).toBe(0);
    act(() => { vi.advanceTimersByTime(20); });
    expect(result.current.shown).toBe(2);
    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current.shown).toBe(4);
    expect(result.current.done).toBe(true);
  });

  it('speeds up long text to finish within maxDuration', () => {
    const text = 'x'.repeat(200);
    const { result } = renderHook(() => useTypewriter(text, { charDelay: 30, maxDuration: 1600 }));
    act(() => { vi.advanceTimersByTime(1600); });
    expect(result.current.done).toBe(true);
  });

  it('restarts when the text changes', () => {
    const { result, rerender } = renderHook(({ text }) => useTypewriter(text, { charDelay: 10 }), {
      initialProps: { text: 'abcd' }
    });
    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current.done).toBe(true);
    rerender({ text: 'efgh' });
    expect(result.current.shown).toBe(0);
    expect(result.current.done).toBe(false);
  });

  it('skip reveals everything at once', () => {
    const { result } = renderHook(() => useTypewriter('abcd', { charDelay: 10 }));
    act(() => { result.current.skip(); });
    expect(result.current.shown).toBe(4);
    expect(result.current.done).toBe(true);
  });

  it('shows the full text immediately for reduced motion', () => {
    reducedMotion.value = true;
    const { result } = renderHook(() => useTypewriter('abcd'));
    expect(result.current.shown).toBe(4);
    expect(result.current.done).toBe(true);
  });
});
