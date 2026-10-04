import type { OKFSectionMeta } from '../../../learning-engine/composition/okf/types'
import { LOOM_OUI_COMPONENTS } from '../../../learning-engine/composition/oui/library'
import { OUIFieldHelp } from '../../../learning-engine/sub-contexts'

interface FrontmatterFormEditorProps {
  meta: OKFSectionMeta
  onChange: (meta: OKFSectionMeta) => void
}

export function FrontmatterFormEditor({ meta, onChange }: FrontmatterFormEditorProps) {
  // `title` / `heading` are shared by every section component; any one documents them.
  const section = LOOM_OUI_COMPONENTS.find((c) => c.sectionType === meta.type)
  return (
    <div className="frontmatter-editor-block mb-4 p-3 border border-border rounded-md bg-surface0/30" data-testid="frontmatter-editor-block">
      <div className="text-xs font-semibold uppercase text-subtext0 tracking-wider mb-2">
        Section Settings
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-text mb-1" htmlFor="meta-title-input">
            Section Title (title){section && <OUIFieldHelp of={section} field="title" />}
          </label>
          <input
            id="meta-title-input"
            data-testid="meta-title-input"
            type="text"
            className="w-full px-2.5 py-1.5 text-xs bg-base border border-border rounded text-text focus:outline-none focus:border-primary"
            value={meta.title ?? ''}
            placeholder="e.g. Overview & Architecture"
            onChange={(e) => onChange({ ...meta, title: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text mb-1" htmlFor="meta-heading-input">
            Section Heading (heading){section && <OUIFieldHelp of={section} field="heading" />}
          </label>
          <input
            id="meta-heading-input"
            data-testid="meta-heading-input"
            type="text"
            className="w-full px-2.5 py-1.5 text-xs bg-base border border-border rounded text-text focus:outline-none focus:border-primary"
            value={meta.heading ?? ''}
            placeholder="e.g. Core System Breakdown"
            onChange={(e) => onChange({ ...meta, heading: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
