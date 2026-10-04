import { useState, useCallback } from 'react'
import { Plus, Trash2, HelpCircle, ArrowUp, ArrowDown, Type, Bold, Italic, Code, Link as LinkIcon, FileText } from 'lucide-react'
import { TextHelpModal } from './TextHelpModal'
import type { OKFTextSectionData } from '../../../../composition/okf/types'
import { OUIFieldKey } from '../../../OUIFieldKey'
import * as OUI from '../../openui'

interface TextFormEditorProps {
  data: OKFTextSectionData
  onChange: (data: OKFTextSectionData) => void
}

export function TextFormEditor({ data, onChange }: TextFormEditorProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const paragraphs = data.paragraphs || []

  const handleParagraphChange = useCallback(
    (index: number, text: string) => {
      const updated = [...paragraphs]
      updated[index] = text
      onChange({ ...data, paragraphs: updated })
    },
    [data, paragraphs, onChange]
  )

  const handleAddParagraph = useCallback(() => {
    onChange({ ...data, paragraphs: [...paragraphs, ''] })
  }, [data, paragraphs, onChange])

  const handleRemoveParagraph = useCallback(
    (index: number) => {
      const updated = paragraphs.filter((_, i) => i !== index)
      onChange({ ...data, paragraphs: updated })
    },
    [data, paragraphs, onChange]
  )

  const handleMoveParagraph = useCallback(
    (fromIdx: number, toIdx: number) => {
      if (toIdx < 0 || toIdx >= paragraphs.length) return
      const updated = [...paragraphs]
      const [moved] = updated.splice(fromIdx, 1)
      updated.splice(toIdx, 0, moved)
      onChange({ ...data, paragraphs: updated })
    },
    [data, paragraphs, onChange]
  )

  const insertMarkdown = useCallback(
    (index: number, prefix: string, suffix: string = '') => {
      const current = paragraphs[index] || ''
      const updatedText = current ? `${current} ${prefix}text${suffix}` : `${prefix}text${suffix}`
      handleParagraphChange(index, updatedText)
    },
    [paragraphs, handleParagraphChange]
  )

  return (
    <div className="visual-form" data-testid="text-form-editor">
      {/* Editor Section Header */}
      <div className="visual-form-section-header" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} className="text-primary" />
          <span className="visual-form-key" style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Rich Text Paragraphs ({paragraphs.length})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="form-add-btn"
            onClick={handleAddParagraph}
            data-testid="text-add-paragraph"
            type="button"
          >
            <Plus size={13} /> Add Paragraph
          </button>
          <button
            className="fc-help-btn"
            onClick={() => setIsHelpOpen(true)}
            data-testid="text-editor-help-btn"
            type="button"
          >
            <HelpCircle size={13} />
            <span>Guide</span>
          </button>
        </div>
      </div>

      <TextHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Paragraphs List */}
      <div className="visual-form-object-list">
        {paragraphs.map((text, i) => (
          <div key={i} className="visual-form-card" data-testid={`text-paragraph-card-${i}`}>
            <div className="visual-form-card-header">
              <span className="card-header-title">
                <Type size={14} className="text-primary" />
                <span>Paragraph #{i + 1}</span>
              </span>

              <div className="form-action-group">
                <button
                  className="form-reorder-btn"
                  onClick={() => insertMarkdown(i, '**', '**')}
                  type="button"
                  title="Insert bold markdown"
                >
                  <Bold size={12} />
                </button>
                <button
                  className="form-reorder-btn"
                  onClick={() => insertMarkdown(i, '*', '*')}
                  type="button"
                  title="Insert italic markdown"
                >
                  <Italic size={12} />
                </button>
                <button
                  className="form-reorder-btn"
                  onClick={() => insertMarkdown(i, '`', '`')}
                  type="button"
                  title="Insert inline code"
                >
                  <Code size={12} />
                </button>
                <button
                  className="form-reorder-btn"
                  onClick={() => insertMarkdown(i, '[', '](https://example.com)')}
                  type="button"
                  title="Insert link markdown"
                >
                  <LinkIcon size={12} />
                </button>

                <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border)', margin: '0 4px' }} />

                <button
                  className="form-reorder-btn"
                  onClick={() => handleMoveParagraph(i, i - 1)}
                  disabled={i === 0}
                  data-testid={`text-move-up-${i}`}
                  type="button"
                  title="Move up"
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  className="form-reorder-btn"
                  onClick={() => handleMoveParagraph(i, i + 1)}
                  disabled={i === paragraphs.length - 1}
                  data-testid={`text-move-down-${i}`}
                  type="button"
                  title="Move down"
                >
                  <ArrowDown size={12} />
                </button>
                {paragraphs.length > 1 && (
                  <button
                    className="form-remove-btn"
                    onClick={() => handleRemoveParagraph(i)}
                    data-testid={`text-remove-${i}`}
                    type="button"
                    title="Remove paragraph"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="visual-form-card-body">
              <div className="visual-form-field">
                <label className="visual-form-label">
                  <span className="visual-form-key" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <OUIFieldKey of={OUI.Text} field="paragraphs">Markdown Prose Content</OUIFieldKey>
                    <span style={{ textTransform: 'none', color: 'var(--ctp-subtext0)' }}>
                      {text.length} chars
                    </span>
                  </span>
                  <textarea
                    className="visual-form-textarea"
                    value={text}
                    onChange={(e) => handleParagraphChange(i, e.target.value)}
                    placeholder="Enter paragraph text (supports markdown, **bold**, `code`, [link](url))..."
                    rows={4}
                    data-testid={`text-paragraph-input-${i}`}
                  />
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
