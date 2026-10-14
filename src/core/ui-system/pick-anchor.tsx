/**
 * Pick anchors — how section components tell Loom Studio's and Loom Viewer's
 * Pick mode which statement drew an element (grill-log-pick-and-comment.md,
 * decision 48). A section component spreads `usePickAnchor(item, 'prop')`
 * onto the element that shows `item` (or one of its props). Outside a
 * `PickAnchorProvider` (the learning app, embeds) the hook returns nothing.
 */
import { createContext, useContext, type ReactNode } from 'react'

export interface PickAnchorScope {
  /** Anchor (`statement` + prop path) of a compiled object, if known. */
  anchorOf(value: unknown): string | undefined
}

export interface PickAnchorAttributes {
  'data-oui-anchor'?: string
}

const PickAnchorContext = createContext<PickAnchorScope | null>(null)

export function PickAnchorProvider({ scope, children }: { scope: PickAnchorScope | null; children: ReactNode }) {
  return <PickAnchorContext.Provider value={scope}>{children}</PickAnchorContext.Provider>
}

/**
 * Data attributes marking the element that renders `value` (a compiled
 * object from the section data) as pickable; `prop` narrows the anchor to
 * one OpenUI prop of it, named as in the component signature.
 */
export function usePickAnchor(value: unknown, prop?: string): PickAnchorAttributes {
  const scope = useContext(PickAnchorContext)
  const anchor = scope?.anchorOf(value)
  if (!anchor) return {}
  return { 'data-oui-anchor': prop ? `${anchor}.${prop}` : anchor }
}
