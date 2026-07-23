import { useState, useCallback } from 'react'
import { Save, Download } from 'lucide-react'
import { VisualFormEditor } from './VisualFormEditor'
import { RawYAMLEditor } from './RawYAMLEditor'
import type { OKFSectionData } from '../../core/okf/types'
import type { ValidationError } from '../../core/okf/validate'

type EditorTab = 'form' | 'raw'

interface EditorPanelProps {
  sectionData: OKFSectionData
  validationErrors: ValidationError[]
  onVisualFormChange: (data: OKFSectionData) => void
  onRawTextChange: (text: string) => void
  rawText: string
  isDirty: boolean
  isSaving: boolean
  onSave: () => void
  onDownload: () => void
}

export function EditorPanel({
  sectionData,
  validationErrors,
  onVisualFormChange,
  onRawTextChange,
  rawText,
  isDirty,
  isSaving,
  onSave,
  onDownload,
}: EditorPanelProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('form')

  const handleTabChange = useCallback((tab: EditorTab) => {
    setActiveTab(tab)
  }, [])

  return (
    <div className="editor-panel" data-testid="editor-panel">
      <div className="editor-panel-header">
        <h3>Section Editor</h3>
        <div className="editor-actions">
          <button
            className="editor-action-btn editor-action-btn--save"
            data-testid="editor-save-btn"
            onClick={onSave}
            disabled={!isDirty || isSaving}
            title="Save to disk"
          >
            <Save size={13} />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            className="editor-action-btn"
            data-testid="editor-download-btn"
            onClick={onDownload}
            title="Download section.md and data.yaml"
          >
            <Download size={13} />
            Download
          </button>
        </div>
      </div>
      <div className="editor-tab-bar" data-testid="editor-tab-bar">
        <button
          className={`editor-tab ${activeTab === 'form' ? 'active' : ''}`}
          data-testid="editor-tab-form"
          onClick={() => handleTabChange('form')}
          aria-selected={activeTab === 'form'}
          role="tab"
        >
          Visual Form
        </button>
        <button
          className={`editor-tab ${activeTab === 'raw' ? 'active' : ''}`}
          data-testid="editor-tab-raw"
          onClick={() => handleTabChange('raw')}
          aria-selected={activeTab === 'raw'}
          role="tab"
        >
          Raw YAML
        </button>
      </div>
      <div className="editor-panel-body">
        {activeTab === 'form' ? (
          <VisualFormEditor data={sectionData} onChange={onVisualFormChange} />
        ) : (
          <RawYAMLEditor text={rawText} errors={validationErrors} onChange={onRawTextChange} />
        )}
      </div>
    </div>
  )
}
