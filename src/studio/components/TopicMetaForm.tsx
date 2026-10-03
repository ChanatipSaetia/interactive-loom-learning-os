import type { TopicMetadata, TopicWorkspace } from '../../core/supporting/authoring-editor/workspace'

interface Props {
  workspace: TopicWorkspace
  metadata: TopicMetadata
}

/** Edits the catalog metadata stored in topic.oui (saved with Save). */
export function TopicMetaForm({ workspace, metadata }: Props) {
  const update = (patch: Partial<TopicMetadata>) => workspace.updateMetadata(patch)

  return (
    <section className="studio-panel studio-topic-form" data-testid="studio-topic-form">
      <h2>Topic settings</h2>
      <p className="studio-hint">Shown in the learning app's catalog. Saved to <code>topic.oui</code>.</p>
      <label className="studio-field">
        <span>Title</span>
        <input value={metadata.title} onChange={(e) => update({ title: e.target.value })} data-testid="studio-topic-title" />
      </label>
      <label className="studio-field">
        <span>Category</span>
        <input value={metadata.category} onChange={(e) => update({ category: e.target.value })} />
      </label>
      <label className="studio-field">
        <span>Description</span>
        <textarea rows={3} value={metadata.description} onChange={(e) => update({ description: e.target.value })} />
      </label>
      <label className="studio-field">
        <span>Tags <small>(comma-separated)</small></span>
        <input
          value={(metadata.tags ?? []).join(', ')}
          onChange={(e) => update({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
        />
      </label>
      <div className="studio-field-row">
        <label className="studio-field">
          <span>Difficulty</span>
          <input value={metadata.difficulty ?? ''} placeholder="e.g. beginner" onChange={(e) => update({ difficulty: e.target.value || undefined })} />
        </label>
        <label className="studio-field">
          <span>Updated</span>
          <input type="date" value={metadata.updatedAt ?? ''} onChange={(e) => update({ updatedAt: e.target.value || undefined })} />
        </label>
        <label className="studio-field studio-field--checkbox">
          <input type="checkbox" checked={!!metadata.isNew} onChange={(e) => update({ isNew: e.target.checked || undefined })} />
          <span>Mark as new</span>
        </label>
      </div>
    </section>
  )
}
