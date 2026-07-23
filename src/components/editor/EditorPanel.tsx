import { useState, useCallback, type ChangeEvent } from 'react'
import { Save, Download, Layers } from 'lucide-react'
import { VisualFormEditor } from './VisualFormEditor'
import { RawYAMLEditor } from './RawYAMLEditor'
import type { OKFSectionData } from '../../core/okf/types'
import type { ValidationError } from '../../core/okf/validate'

type EditorTab = 'form' | 'raw'

export const SECTION_TYPES: { type: OKFSectionData['type']; label: string }[] = [
  { type: 'intro', label: 'Intro Hero (intro)' },
  { type: 'text', label: 'Rich Text (text)' },
  { type: 'bullets', label: 'Bullet Points List (bullets)' },
  { type: 'flowchart', label: 'Unified Flowchart (flowchart)' },
  { type: 'scenario', label: 'Application Scenario (scenario)' },
  { type: 'tradeoff-sandbox', label: 'Tradeoff Sandbox (tradeoff-sandbox)' },
  { type: 'decision-tree', label: 'Architectural Decision Tree (decision-tree)' },
  { type: 'taxonomy-browser', label: 'Taxonomy Browser (taxonomy-browser)' },
  { type: 'flashcards', label: 'Vocabulary Flashcards (flashcards)' },
  { type: 'quiz', label: 'Interactive Practice Quiz (quiz)' },
  { type: 'concept-map', label: 'Concept Map (concept-map)' },
  { type: 'image-gallery', label: 'Image Gallery (image-gallery)' },
  { type: 'formula-sandbox', label: 'Formula Sandbox (formula-sandbox)' },
  { type: 'reflection-sequence', label: 'Reflection Sequence (reflection-sequence)' },
  { type: 'reflection-template', label: 'Reflection Template (reflection-template)' },
]

export function createDefaultSectionData(type: string): OKFSectionData {
  switch (type) {
    case 'intro':
      return {
        type: 'intro',
        title: 'New Intro Section',
        subtitle: 'Overview subtitle description',
        what: { summary: 'Overview summary text' },
        why: { summary: 'Why this topic matters' },
      }
    case 'text':
      return {
        type: 'text',
        paragraphs: ['Enter text paragraph content...'],
      }
    case 'bullets':
      return {
        type: 'bullets',
        items: [{ text: 'Key Concept Bullet Point' }],
      }
    case 'flowchart':
      return {
        type: 'flowchart',
        flow: { actors: {}, systems: {}, steps: [], journeys: [] },
      }
    case 'scenario':
      return {
        type: 'scenario',
        id: 'scenario-1',
        title: 'Application Scenario',
        intro: 'Scenario introduction',
        startNode: 'start',
        nodes: {
          start: {
            id: 'start',
            prompt: 'Initial scenario situation prompt',
          },
        },
      }
    case 'tradeoff-sandbox':
      return {
        type: 'tradeoff-sandbox',
        scenarios: [
          {
            id: 's1',
            title: 'Scenario 1',
            description: 'Parameter trade-off comparison',
            metrics: [],
            steps: [],
          },
        ],
      }
    case 'decision-tree':
      return {
        type: 'decision-tree',
        id: 'dt-1',
        title: 'Decision Tree',
        root: 'start',
        nodes: {
          start: {
            id: 'start',
            prompt: 'Architectural decision point prompt',
          },
        },
      }
    case 'taxonomy-browser':
      return {
        type: 'taxonomy-browser',
        categories: [
          {
            icon: 'Layers',
            title: 'Category 1',
            subtitle: 'Category Subtitle',
            description: 'Taxonomy category description',
            details: 'Category details',
            analogy: 'Analogy description',
            primaryFocus: 'Primary focus area',
            inScope: ['In Scope Item 1'],
            outOfScope: ['Out of Scope Item 1'],
            color: 'var(--primary)',
          },
        ],
      }
    case 'flashcards':
      return {
        type: 'flashcards',
        terms: [
          {
            id: 't1',
            word: 'Sample Term',
            pronunciation: '',
            category: 'general',
            shortDefinition: 'Short definition quote',
            detailedDefinition: 'Detailed explanation text',
            whyItMatters: 'Architectural importance',
          },
        ],
      }
    case 'quiz':
      return {
        type: 'quiz',
        questions: [
          {
            id: 'q1',
            question: 'Sample Question?',
            choices: [
              { id: 'c1', text: 'Option A', correct: true, explanation: 'Explanation A' },
              { id: 'c2', text: 'Option B', correct: false, explanation: 'Explanation B' },
            ],
          },
        ],
      }
    case 'concept-map':
      return {
        type: 'concept-map',
        nodes: {
          'node-1': { id: 'node-1', title: 'Core Concept', category: 'core' },
        },
        edges: [],
      }
    case 'image-gallery':
      return {
        type: 'image-gallery',
        items: [
          {
            id: 'img-1',
            url: '',
            caption: 'Sample Image Caption',
          },
        ],
      }
    case 'formula-sandbox':
      return {
        type: 'formula-sandbox',
        variables: [
          { id: 'v1', label: 'Variable 1', min: 0, max: 100, step: 1, defaultValue: 10 },
        ],
        metrics: [
          { id: 'm1', label: 'Metric 1', formula: 'v1 * 2', description: 'Calculated metric' },
        ],
      }
    case 'reflection-sequence':
      return {
        type: 'reflection-sequence',
        challenges: [
          {
            prompt: 'Arrange the process steps in order:',
            items: [{ id: 'step-1', text: 'Step 1' }],
            solution: ['step-1'],
          },
        ],
      }
    case 'reflection-template':
      return {
        type: 'reflection-template',
        challenges: [
          {
            prompt: 'Fill in the blanks:',
            template: 'The primary architecture is {slot1}.',
            chips: [{ id: 'chip-1', text: 'Microservices' }],
            solution: { slot1: 'chip-1' },
          },
        ],
      }
    default:
      return {
        type: 'text',
        paragraphs: ['Enter content...'],
      }
  }
}

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

  const handleTypeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const newType = e.target.value
      if (newType !== sectionData.type) {
        const newData = createDefaultSectionData(newType)
        onVisualFormChange(newData)
      }
    },
    [sectionData.type, onVisualFormChange]
  )

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

      {/* Section Type Selector Bar */}
      <div className="editor-type-selector-bar" data-testid="editor-type-selector-bar">
        <Layers size={13} className="text-primary" />
        <label className="editor-type-label" htmlFor="editor-type-select">
          Section Type:
        </label>
        <select
          id="editor-type-select"
          className="editor-type-select"
          data-testid="editor-type-select"
          value={sectionData.type}
          onChange={handleTypeChange}
        >
          {SECTION_TYPES.map((t) => (
            <option key={t.type} value={t.type}>
              {t.label}
            </option>
          ))}
        </select>
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
