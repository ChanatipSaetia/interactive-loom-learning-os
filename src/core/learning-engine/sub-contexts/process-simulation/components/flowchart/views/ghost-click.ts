import { useRef } from 'react';
import type { SyntheticEvent } from 'react';

/**
 * Edges toggle on both `touchend` (so a tap works inside the pan/zoom canvas) and `click` (mouse).
 * A tap fires both, which would select the edge and immediately deselect it. The returned check
 * reports the click that follows a handled touch, so the handler can ignore it.
 */
export function useGhostClickGuard(): (e: SyntheticEvent) => boolean {
  const lastTouch = useRef(0);
  return (e: SyntheticEvent) => {
    if (e.type === 'touchend') {
      lastTouch.current = Date.now();
      return false;
    }
    return e.type === 'click' && Date.now() - lastTouch.current < 800;
  };
}
