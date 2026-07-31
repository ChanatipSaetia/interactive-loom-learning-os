import type { OKFSectionData, OKFSectionMeta } from '../../../../okf/types'
import {
  QuizFormEditor,
  ConceptMapFormEditor,
  FlashcardsFormEditor,
  TradeoffSandboxFormEditor,
  ScenarioFormEditor,
  DecisionTreeFormEditor,
  FormulaSandboxFormEditor,
  FlowchartFormEditor,
  IntroFormEditor,
  TextFormEditor,
  BulletsFormEditor,
  TaxonomyBrowserFormEditor,
  ReflectionSequenceFormEditor,
  ReflectionTemplateFormEditor,
} from '../../..'
import { DynamicSchemaForm } from './DynamicSchemaForm'
import { FrontmatterFormEditor } from './FrontmatterFormEditor'


interface VisualFormEditorProps {
  data: OKFSectionData
  meta?: OKFSectionMeta
  onChange: (data: OKFSectionData) => void
  onMetaChange?: (meta: OKFSectionMeta) => void
}

function isType<T extends OKFSectionData['type']>(data: OKFSectionData, type: T): data is Extract<OKFSectionData, { type: T }> {
  return data.type === type
}

export function VisualFormEditor({ data, meta, onChange, onMetaChange }: VisualFormEditorProps) {
  const renderSectionForm = () => {
    if (isType(data, 'intro')) {
      return <IntroFormEditor data={data} onChange={onChange} />
    }

    if (isType(data, 'quiz')) {
      return <QuizFormEditor data={data} onChange={onChange} />
    }

    if (isType(data, 'concept-map')) {
      return <ConceptMapFormEditor data={data} onChange={onChange} />
    }

    if (isType(data, 'flashcards')) {
      return <FlashcardsFormEditor data={data} onChange={onChange} />
    }

    if (isType(data, 'tradeoff-sandbox')) {
      return <TradeoffSandboxFormEditor data={data} onChange={onChange} />
    }

    if (isType(data, 'scenario')) {
      return <ScenarioFormEditor data={data} onChange={onChange} />
    }

    if (isType(data, 'decision-tree')) {
      return <DecisionTreeFormEditor data={data} onChange={onChange} />
    }

    if (isType(data, 'formula-sandbox')) {
      return <FormulaSandboxFormEditor data={data} onChange={onChange} />
    }

    if (isType(data, 'flowchart')) {
      return <FlowchartFormEditor data={data} onChange={onChange} />
    }

    if (isType(data, 'text')) {
      return <TextFormEditor data={data} onChange={onChange} />
    }

    if (isType(data, 'bullets')) {
      return <BulletsFormEditor data={data} onChange={onChange} />
    }

    if (isType(data, 'taxonomy-browser')) {
      return <TaxonomyBrowserFormEditor data={data} onChange={onChange} />
    }

    if (isType(data, 'reflection-sequence')) {
      return <ReflectionSequenceFormEditor data={data} onChange={onChange} />
    }

    if (isType(data, 'reflection-template')) {
      return <ReflectionTemplateFormEditor data={data} onChange={onChange} />
    }

    return (
      <DynamicSchemaForm
        data={data as unknown as Record<string, unknown>}
        onChange={(updated) => onChange(updated as unknown as OKFSectionData)}
      />
    )
  }

  return (
    <div className="visual-form-editor-container" data-testid="visual-form-editor">
      {meta && onMetaChange && (
        <FrontmatterFormEditor meta={meta} onChange={onMetaChange} />
      )}
      {renderSectionForm()}
    </div>
  )
}

