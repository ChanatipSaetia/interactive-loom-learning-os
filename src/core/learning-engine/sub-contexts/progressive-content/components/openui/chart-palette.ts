import { useMemo, useSyncExternalStore } from 'react'

/**
 * Chart series colors, as Loom palette tokens, in the order series take them.
 * Every Loom theme redefines these, so charts follow the active theme. Hues
 * alternate so neighbouring series stay apart (lavender and sky come last:
 * some themes make them equal to mauve and blue).
 */
export const LOOM_CHART_TOKENS = [
  '--ctp-blue',
  '--ctp-peach',
  '--ctp-green',
  '--ctp-mauve',
  '--ctp-yellow',
  '--ctp-teal',
  '--ctp-pink',
  '--ctp-red',
  '--ctp-sapphire',
  '--ctp-flamingo',
  '--ctp-maroon',
  '--ctp-lavender',
] as const

/**
 * Concrete colors of the chart tokens under the active theme. Recharts writes
 * them into SVG attributes (`fill`, `stop-color`), where `var()` isn't reliable,
 * so they're read from the computed style; `var()` is only the fallback when
 * there is no document or the token is missing.
 */
export function resolveLoomChartColors(root: Element | undefined = typeof document !== 'undefined' ? document.documentElement : undefined): string[] {
  const style = root ? getComputedStyle(root) : undefined
  return LOOM_CHART_TOKENS.map((token) => style?.getPropertyValue(token).trim() || `var(${token})`)
}

/**
 * Arrange `colors` so OpenUI's chart palette distribution hands series
 * `colors[0]`, `colors[1]`, … in order. OpenUI picks `count` colors from the
 * middle of a palette outwards (it is built for shade ramps); for `count` ≥ 3
 * that is a contiguous window starting at `floor(n/2) - floor((count-1)/2)` of
 * an `n`-long palette, and for 2 it picks the neighbours of the middle.
 */
export function paletteForSeries(colors: readonly string[], count: number): string[] {
  if (colors.length === 0) return []
  const wanted = Array.from({ length: Math.max(count, 1) }, (_, i) => colors[i % colors.length])
  if (wanted.length === 1) return wanted
  if (wanted.length === 2) return [wanted[0], wanted[0], wanted[1]]
  // Odd count: the window is the whole palette. Even: it starts at 1 and wraps.
  return wanted.length % 2 === 1 ? wanted : wanted.map((_, i) => wanted[(i + wanted.length - 1) % wanted.length])
}

// Theme switches rewrite `<html data-theme>`; re-read the colors when it changes.
function subscribe(onChange: () => void): () => void {
  if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') return () => {}
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] })
  return () => observer.disconnect()
}

const getSnapshot = () => resolveLoomChartColors().join('|')
const getServerSnapshot = () => LOOM_CHART_TOKENS.map((token) => `var(${token})`).join('|')

/** The chart colors of the active Loom theme; updates when the theme changes. */
export function useLoomChartColors(): string[] {
  const key = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return useMemo(() => key.split('|'), [key])
}
