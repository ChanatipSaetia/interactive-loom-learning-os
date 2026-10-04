import { useCallback, useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

export const TYPEWRITER_CHAR_DELAY = 40;
export const TYPEWRITER_MAX_DURATION = 4000;

interface TypewriterOptions {
  /** Delay per character in ms. */
  charDelay?: number;
  /** Upper bound for the whole text, so long text types faster instead of lagging. */
  maxDuration?: number;
}

/** How long typing `text` takes, so callers can wait for it to finish. */
export function typingDuration(
  text: string,
  { charDelay = TYPEWRITER_CHAR_DELAY, maxDuration = TYPEWRITER_MAX_DURATION }: TypewriterOptions = {}
) {
  return Math.min(text.length * charDelay, maxDuration);
}

/**
 * Reveals `text` one character at a time. Returns how many characters are
 * shown, whether typing is done, and `skip` to reveal the rest at once.
 * Reduced-motion users get the full text immediately.
 */
export function useTypewriter(
  text: string,
  { charDelay = TYPEWRITER_CHAR_DELAY, maxDuration = TYPEWRITER_MAX_DURATION }: TypewriterOptions = {}
) {
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState({ text, count: 0 });

  // Restart from zero whenever the text changes, without an extra effect pass
  const count = state.text === text ? state.count : 0;
  if (state.text !== text) {
    setState({ text, count: 0 });
  }

  const instant = !!reduceMotion || text.length === 0;
  const shown = instant ? text.length : count;
  const done = shown >= text.length;

  useEffect(() => {
    if (instant || done) return;
    const delay = Math.max(8, typingDuration(text, { charDelay, maxDuration }) / text.length);
    const timer = window.setInterval(() => {
      setState(s => (s.text === text ? { text, count: Math.min(s.count + 1, text.length) } : s));
    }, delay);
    return () => window.clearInterval(timer);
  }, [text, instant, done, charDelay, maxDuration]);

  const skip = useCallback(() => {
    setState({ text, count: text.length });
  }, [text]);

  return { shown, done, skip };
}
