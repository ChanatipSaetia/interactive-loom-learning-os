import { useState, useCallback } from 'react'
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
}

export function EditorPanel({
  sectionData,
  validationErrors,
  onVisualFormChange,
  onRawTextChange,
  rawText,
}: EditorPanelProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('form')

  const handleTabChange = useCallback((tab: EditorTab) => {
    setActiveTab(tab)
  }, [])

  return (
    <div className="editor-panel" data-testid="editor-panel">
      <div className="editor-panel-header">
        <h3>Section Editor</h3>
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
