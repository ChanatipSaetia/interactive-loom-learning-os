/**
 * Pick anchors — how section components tell Loom Studio's and Loom Viewer's
 * Pick mode which statement drew an element (grill-log-pick-and-comment.md,
 * decision 48). A section component spreads `usePickAnchor(item, 'prop')`
 * onto the element that shows `item` (or one of its props). Outside a
 * `PickAnchorProvider` (the learning app, embeds) the hook returns nothing.
 */
import { createContext, useContext, type ReactNode } from 'react'

export interface PickAnchorScope {
  /** File inside the topic folder, e.g. `sections/quiz.oui`. */
  file: string
  /** Section label shown to people, e.g. its title. */
  label: string
  /** Anchor (`statement` + prop path) of a compiled object, if known. */
  anchorOf(value: unknown): string | undefined
  /** Anchor of the first `component` element whose `id` prop is `id`. */
  anchorOfId?(component: string, id: string): string | undefined
}

/**
 * Every tagged element carries its file and section label too, so a pick
 * still resolves inside portals (dialogs, popovers) outside the section's DOM.
 */
export interface PickAnchorAttributes {
  'data-oui-anchor'?: string
  'data-oui-file'?: string
  'data-oui-section'?: string
}

const PickAnchorContext = createContext<PickAnchorScope | null>(null)

export function PickAnchorProvider({ scope, children }: { scope: PickAnchorScope | null; children: ReactNode }) {
  return <PickAnchorContext.Provider value={scope}>{children}</PickAnchorContext.Provider>
}

export interface PickAnchorFn {
  (value: unknown, prop?: string | number): PickAnchorAttributes
  /**
   * For renderers left with domain IDs only: the element of the first of
   * `components` whose `id` prop is `id` (e.g. `byId(['Step', 'BranchOption'], 'fb_check', 'command')`).
   */
  byId(components: string | readonly string[], id: string, prop?: string | number): PickAnchorAttributes
}

const noAnchor: PickAnchorFn = Object.assign(() => ({}), { byId: () => ({}) })

const withProp = (anchor: string, prop?: string | number) =>
  prop === undefined ? anchor : `${anchor}${typeof prop === 'number' ? `[${prop}]` : prop.startsWith('[') ? prop : `.${prop}`}`

/**
 * Returns `anchor(value, prop?)`, which gives the data attributes marking
 * the element that renders `value` (a compiled object or list from the
 * section data) as pickable. `prop` narrows the anchor to one OpenUI prop of
 * it, named as in the component signature, or to a list index (a number, or
 * a string starting with "["). Use it inside loops, where hooks can't go.
 */
export function usePickAnchors(): PickAnchorFn {
  const scope = useContext(PickAnchorContext)
  if (!scope) return noAnchor
  const attributes = (anchor: string): PickAnchorAttributes =>
    ({ 'data-oui-anchor': anchor, 'data-oui-file': scope.file, 'data-oui-section': scope.label })
  const anchor: PickAnchorFn = (value, prop) => {
    const found = scope.anchorOf(value)
    return found ? attributes(withProp(found, prop)) : {}
  }
  anchor.byId = (components, id, prop) => {
    for (const component of typeof components === 'string' ? [components] : components) {
      const found = scope.anchorOfId?.(component, id)
      if (found) return attributes(withProp(found, prop))
    }
    return {}
  }
  return anchor
}

/** `usePickAnchors()(value, prop)` for a single element. */
export function usePickAnchor(value: unknown, prop?: string | number): PickAnchorAttributes {
  return usePickAnchors()(value, prop)
}
