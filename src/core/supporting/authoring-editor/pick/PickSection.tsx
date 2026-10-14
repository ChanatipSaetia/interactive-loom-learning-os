import { useMemo, type ReactNode } from 'react'
import type { OUIAnchor, OUISourceMap } from '../../../learning-engine/composition/oui/compile'
import { PickAnchorProvider, type PickAnchorScope } from '../../../ui-system/pick-anchor'

const format = (anchor: OUIAnchor | undefined) => (anchor ? `${anchor.statement}${anchor.path}` : undefined)

/**
 * Marks one rendered file (a section, or the topic header) for Pick mode.
 * A pick anywhere inside that no closer anchor claims points at the whole
 * file (`#root`). With a source map, components inside can mark their own
 * elements through `usePickAnchor`.
 */
export function PickSection({ file, label, sourceMap, className, children }: {
  /** Path inside the topic folder, e.g. `sections/quiz-basics.oui`. */
  file: string
  /** Shown to people in the outline and the tray, e.g. the section title. */
  label: string
  sourceMap?: OUISourceMap
  className?: string
  children: ReactNode
}) {
  const scope = useMemo<PickAnchorScope>(() => ({
    file,
    label,
    anchorOf: (value) => format(sourceMap?.anchorOf(value)),
    anchorOfId: (component, id) => format(sourceMap?.anchorOfId(component, id)),
  }), [file, label, sourceMap])

  return (
    <div className={className ? `pick-section ${className}` : 'pick-section'} data-oui-file={file} data-oui-anchor="root" data-oui-section={label}>
      <PickAnchorProvider scope={scope}>{children}</PickAnchorProvider>
    </div>
  )
}
