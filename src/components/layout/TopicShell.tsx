import { Suspense, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTopics } from '../../core/routes'
import type { SectionConfig } from '../../core/registry'
import { SectionRegistry } from '../../core/registry'
import { useOKFBundled, bundleToSections } from '../../core/okf/sections'
import { ProgressProvider } from '../../core/progress'
import { HUDProvider, useHUD } from '../../core/context/HUDContext'
import { EditorProvider, useEditor } from '../../core/context/EditorContext'
import { EditSectionToggle } from './EditSectionToggle'
import { SplitPaneLayout } from './SplitPaneLayout'
import { EditorPanel } from '../editor/EditorPanel'
import { useSectionEditorBuffer } from '../../core/hooks/useSectionEditorBuffer'
import { X } from 'lucide-react'

interface SectionRendererProps {
  config: SectionConfig
}

function SectionRenderer({ config }: SectionRendererProps) {
  const Component = SectionRegistry.get(config.type)
  if (!Component) {
    return (
      <div className="section-missing" data-section-type={config.type}>
        Section type not registered: {config.type}
      </div>
    )
  }

  return (
    <div className="section-wrapper" data-section-type={config.type}>
      <Suspense fallback={<div className="section-loading">Loading section...</div>}>
        <Component {...config.props} />
      </Suspense>
    </div>
  )
}

function HUDDrawer() {
  const { isOpen, title, body, closeHUD } = useHUD()

  return (
    <div className={`hud-drawer ${isOpen ? 'open' : ''}`} data-testid="hud-drawer">
      <div className="hud-header">
        <span className="hud-title">{title}</span>
        <button className="hud-close" onClick={closeHUD} aria-label="Close details">
          <X size={18} />
        </button>
      </div>
      <div className="hud-body" dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  )
}

function SectionEditToolbar({ sectionIndex }: { sectionIndex: number }) {
  return (
    <div className="section-edit-toolbar" data-testid={`section-edit-toolbar-${sectionIndex}`}>
      <EditSectionToggle sectionIndex={sectionIndex} />
    </div>
  )
}

function LivePreviewSection({ config }: { config: SectionConfig }) {
  return (
    <div className="editor-preview-wrapper" data-testid="editor-preview-wrapper">
      <SectionRenderer config={config} />
    </div>
  )
}

function EditorModeView({ topicLabel }: { topicLabel: string }) {
  const { activeSection } = useEditor()

  const {
    data: editedData,
    rawText,
    parseError,
    setVisualFormField,
    setRawText,
  } = useSectionEditorBuffer(activeSection)

  const previewConfig = useMemo(() => {
    if (!activeSection) return null
    const original = bundleToSections([activeSection])[0]
    return {
      type: original.type,
      props: { ...original.props, ...editedData },
    }
  }, [activeSection, editedData])

  if (!activeSection || !previewConfig) {
    return null
  }

  return (
    <div>
      <div className="editor-mode-header">
        <h2 className="topic-page-title">{topicLabel}</h2>
        <EditSectionToggle />
      </div>
      <SplitPaneLayout
        leftPanel={
          <EditorPanel
            sectionData={editedData}
            parseError={parseError}
            onVisualFormChange={setVisualFormField}
            onRawTextChange={setRawText}
            rawText={rawText}
          />
        }
        rightPanel={<LivePreviewSection config={previewConfig} />}
      />
      <HUDDrawer />
    </div>
  )
}

function TopicShellInner() {
  const { topicId } = useParams()
  const { topics } = useTopics()
  const { editMode } = useEditor()

  const topic = useMemo(() => topics.find((r) => r.id === topicId), [topicId, topics])

  const { bundle, loading, error } = useOKFBundled(topicId ?? '')
  const sections = useMemo(() => (bundle ? bundleToSections(bundle) : []), [bundle])

  if (!topic) {
    return (
      <div className="topic-page">
        <h2 className="topic-page-title">Topic Not Found</h2>
        <p className="topic-page-placeholder">The requested topic does not exist.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="topic-page" data-topic-id={topic.id} data-testid={`${topic.id}-topic`}>
        <h2 className="topic-page-title">{topic.label}</h2>
        <div className="topic-loading">Loading topic data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="topic-page" data-topic-id={topic.id} data-testid={`${topic.id}-topic`}>
        <h2 className="topic-page-title">{topic.label}</h2>
        <div className="topic-error">Failed to load topic: {error.message}</div>
      </div>
    )
  }

  if (editMode) {
    return (
      <div className="topic-page editor-mode" data-topic-id={topic.id} data-testid={`${topic.id}-topic`}>
        <EditorModeView topicLabel={topic.label} />
      </div>
    )
  }

  return (
    <div className="topic-page" data-topic-id={topic.id} data-testid={`${topic.id}-topic`}>
      <h2 className="topic-page-title">{topic.label}</h2>
      {sections.map((section, idx) => (
        <div key={`${topic.id}-${idx}`} className="section-with-toolbar">
          <SectionRenderer config={section} />
          <SectionEditToolbar sectionIndex={idx} />
        </div>
      ))}
      <HUDDrawer />
    </div>
  )
}

function TopicShellWithBundle() {
  const { topicId } = useParams()
  const { bundle } = useOKFBundled(topicId ?? '')

  return (
    <EditorProvider bundle={bundle}>
      <TopicShellInner />
    </EditorProvider>
  )
}

export function TopicShell() {
  return (
    <ProgressProvider>
      <HUDProvider>
        <TopicShellWithBundle />
      </HUDProvider>
    </ProgressProvider>
  )
}

export { SectionRenderer }
