import type { OKFSectionData } from '../../core/okf/types'
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
  DynamicSchemaForm,
} from './forms'

interface VisualFormEditorProps {
  data: OKFSectionData
  onChange: (data: OKFSectionData) => void
}

function isType<T extends OKFSectionData['type']>(data: OKFSectionData, type: T): data is Extract<OKFSectionData, { type: T }> {
  return data.type === type
}

export function VisualFormEditor({ data, onChange }: VisualFormEditorProps) {
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

  return (
    <DynamicSchemaForm
      data={data as unknown as Record<string, unknown>}
      onChange={(updated) => onChange(updated as unknown as OKFSectionData)}
    />
  )
}

