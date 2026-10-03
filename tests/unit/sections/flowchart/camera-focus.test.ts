import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCamera, getNodesBBox } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/useCamera';
import type { FlowchartViewNode } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/types';

// Jump straight to the animation's end values
vi.mock('animejs', () => ({
  animate: (proxy: Record<string, number>, params: Record<string, unknown>) => {
    ['tx', 'ty', 'sc'].forEach(k => { proxy[k] = params[k] as number; });
    (params.onUpdate as () => void)();
    (params.onComplete as () => void)();
    return { pause: () => {} };
  }
}));

const nodes = [
  { id: 'a', x: 100, y: 100 },
  { id: 'b', x: 300, y: 100 }
] as FlowchartViewNode[];

function setup() {
  const positionedNodesRef = { current: nodes };
  const hook = renderHook(() => useCamera({ positionedNodesRef }));
  hook.result.current.svgRef.current = { clientWidth: 800, clientHeight: 600 } as SVGSVGElement;
  return hook;
}

/** Screen-space top and bottom of the nodes' focus box. */
function screenBox(t: { scale: number; translateY: number }) {
  const bbox = getNodesBBox(nodes, ['a', 'b'])!;
  return { top: bbox.minY * t.scale + t.translateY, bottom: bbox.maxY * t.scale + t.translateY };
}

describe('useCamera focusOnNodes', () => {
  it('getNodesBBox ignores unknown ids', () => {
    expect(getNodesBBox(nodes, ['missing'])).toBeNull();
    expect(getNodesBBox(nodes, ['a', 'missing'])).toEqual({ minX: 30, minY: 50, maxX: 170, maxY: 150 });
  });

  it('centers the nodes above the dock by default', () => {
    const { result } = setup();
    let placement;
    act(() => { placement = result.current.focusOnNodes(['a', 'b']); });
    expect(placement).toBe('below');
    const { top, bottom } = screenBox(result.current.transform);
    // Without measured insets the bottom 200px is kept for the dock
    expect((top + bottom) / 2).toBeCloseTo(200);
  });

  it('frames the free area between measured overlays', () => {
    const { result } = setup();
    act(() => { result.current.focusOnNodes(['a', 'b'], { insets: { top: 60, bottom: 100 } }); });
    const { top, bottom } = screenBox(result.current.transform);
    expect(top).toBeGreaterThanOrEqual(60);
    expect(bottom).toBeLessThanOrEqual(500);
    expect((top + bottom) / 2).toBeCloseTo(280);
  });

  it('keeps the caption under the nodes when it fits, centered as one group', () => {
    const { result } = setup();
    let placement;
    act(() => {
      placement = result.current.focusOnNodes(['a', 'b'], {
        insets: { top: 0, bottom: 0 },
        caption: { width: 300, height: 80, gap: 10 }
      });
    });
    expect(placement).toBe('below');
    expect(result.current.transform.scale).toBe(0.5);
    const { top, bottom } = screenBox(result.current.transform);
    expect((top + bottom + 90) / 2).toBeCloseTo(300);
  });

  it('moves the caption beside the nodes when there is no height for it below', () => {
    const { result } = setup();
    let placement;
    act(() => {
      // Free area is clamped to 40% (240px, 208px inside padding); a 180px
      // caption below would leave the nodes 18px
      placement = result.current.focusOnNodes(['a', 'b'], {
        insets: { top: 100, bottom: 340 },
        caption: { width: 200, height: 180, gap: 10 }
      });
    });
    expect(placement).toBe('right');
    // Beside the caption the nodes get the full height, up to the max scale
    expect(result.current.transform.scale).toBe(0.5);
    const t = result.current.transform;
    const bbox = getNodesBBox(nodes, ['a', 'b'])!;
    const nodesW = (bbox.maxX - bbox.minX) * t.scale;
    const left = bbox.minX * t.scale + t.translateX;
    // Nodes + gap + caption centered horizontally
    expect(left + (nodesW + 10 + 200) / 2).toBeCloseTo(400);
  });
});
