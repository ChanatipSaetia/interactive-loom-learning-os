import type { ComponentType } from 'react'
import { Registry } from './generic-registry'
import type { SectionConfig } from './index'
import { show, withTitleBeat, type Beat, type PresentRendererProps, type SectionPresenter } from '../sub-contexts/present-kernel'

interface RegisteredPresenter {
  toBeats: (data: Record<string, unknown>) => Beat[]
  /** Loads the renderer once; later calls return the same promise. */
  load: () => Promise<ComponentType<PresentRendererProps>>
}

const presenters = new Registry<RegisteredPresenter>()

/**
 * Present mode renderers by section type, alongside `SectionRegistry` (grill-log-presenting-mode.md).
 * The stage loads renderers itself rather than through React.lazy, so it knows when a section's DOM
 * exists and can animate it.
 */
export const PresentRegistry = {
  register<D>(type: string, presenter: SectionPresenter<D>) {
    let loading: Promise<ComponentType<PresentRendererProps>> | null = null
    presenters.register(type, {
      toBeats: presenter.toBeats as RegisteredPresenter['toBeats'],
      load: () => (loading ??= presenter.load().then((m) => m.default as unknown as ComponentType<PresentRendererProps>)),
    })
  },
  get(type: string) {
    return presenters.get(type)
  },
  list() {
    return presenters.list()
  },
  clear() {
    presenters.clear()
  },
}

/**
 * The beats of a section, after its title beat (decision 114). A type without a presenter yet is one beat, `all`, that shows its Read
 * component, so any topic plays from start to end.
 */
export function beatsOf(config: SectionConfig): Beat[] {
  const beats = presenters.get(config.type)?.toBeats(config.props)
  return withTitleBeat(config.type, beats && beats.length > 0 ? beats : [show('all', 'The whole section')])
}
