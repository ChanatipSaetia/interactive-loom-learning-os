import { useState } from 'react'
import { HelpCircle, Blocks } from 'lucide-react'
import { OpenUIHelpModal } from './OpenUIHelpModal'
import type { OKFOpenUISectionData } from '../../../../composition/okf/types'

interface OpenUIFormEditorProps {
  data: OKFOpenUISectionData
  onChange: (data: OKFOpenUISectionData) => void
}

export function OpenUIFormEditor({ data, onChange }: OpenUIFormEditorProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const source = data.source ?? ''

  return (
    <div className="visual-form" data-testid="openui-form-editor">
      <div className="visual-form-section-header" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Blocks size={16} className="text-primary" />
          <span className="visual-form-key" style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            OpenUI Program
          </span>
        </div>
        <button
          className="fc-help-btn"
          onClick={() => setIsHelpOpen(true)}
          data-testid="openui-editor-help-btn"
          type="button"
        >
          <HelpCircle size={13} />
          <span>Guide</span>
        </button>
      </div>

      <OpenUIHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Standard OpenUI Lang (root = …)</span>
          <textarea
            className="visual-form-textarea"
            value={source}
            onChange={(e) => onChange({ ...data, source: e.target.value })}
            placeholder={'root = Card([CardHeader("Title"), TextContent("Hello")])'}
            rows={16}
            spellCheck={false}
            style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)' }}
            data-testid="openui-source-input"
          />
        </label>
      </div>
    </div>
  )
}
