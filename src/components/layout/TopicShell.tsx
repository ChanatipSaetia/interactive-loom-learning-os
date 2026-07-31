import { Suspense, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTopics } from '../../core/routes'
import type { SectionConfig } from '../../core/registry'
import { SectionRegistry } from '../../core/registry'
import { useOKFBundled, bundleToSections } from '../../core/okf/sections'
import { ProgressProvider } from '../../core/subdomains/supporting/learner-progress'
import { HUDProvider, useHUD } from '../../core/context/HUDContext'
import { EditorProvider, useEditor, useEditorSafe } from '../../core/context/EditorContext'
import { EditSectionToggle } from './EditSectionToggle'
import { SplitPaneLayout } from './SplitPaneLayout'
import { EditorPanel, useSectionEditorBuffer } from '../../core/subdomains/supporting/authoring-editor'
import { ToastProvider, useToast } from '../ui/Toast'
import { X } from 'lucide-react'

interface SectionRendererProps {
  config: SectionConfig
  sectionIndex: number
}

function SectionRenderer({ config, sectionIndex }: SectionRendererProps) {
  const Component = SectionRegistry.get(config.type)
  if (!Component) {
    return (
      <div className="section-missing" data-section-type={config.type}>
        Section type not registered: {config.type}
      </div>
    )
  }

  return (
    <div className="section-wrapper" data-section-type={config.type} data-section-index={sectionIndex}>
      <Suspense fallback={<div className="section-loading">Loading section...</div>}>
        <Component sectionIndex={sectionIndex} {...config.props} />
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

function LivePreviewSection({ config }: { config: SectionConfig }) {
  const { activeSectionIndex } = useEditor()
  return (
    <div className="editor-preview-wrapper" data-testid="editor-preview-wrapper">
      <SectionRenderer config={config} sectionIndex={activeSectionIndex ?? 0} />
    </div>
  )
}

function EditorModeView({ topicLabel, reload }: { topicLabel: string; reload?: () => Promise<void> }) {
  const { topicId } = useParams()
  const { activeSection, activeSectionIndex, toggleEdit } = useEditor()
  const { showToast } = useToast()

  const {
    meta: editedMeta,
    data: editedData,
    rawText,
    validationErrors,
    validationDiagnostics,
    validationStatus,
    isDirty,
    isSaving,
    setVisualFormField,
    setVisualFormMeta,
    setRawText,
    saveToDisk,
    downloadFiles,
  } = useSectionEditorBuffer(activeSection)

  const previewConfig = useMemo(() => {
    if (!activeSection) return null
    const original = bundleToSections([activeSection])[0]
    return {
      type: original.type,
      props: {
        ...original.props,
        ...editedData,
        ...(editedMeta.title ? { title: editedMeta.title } : {}),
        ...(editedMeta.heading ? { heading: editedMeta.heading } : {}),
      },
    }
  }, [activeSection, editedData, editedMeta])

  const sectionName = useMemo(() => {
    if (!activeSection) return ''
    return activeSection.sectionFolder ?? `section-${activeSectionIndex ?? 0}`
  }, [activeSection, activeSectionIndex])

  const handleSave = async () => {
    if (!topicId || !sectionName || !isDirty) return
    try {
      await saveToDisk(topicId, sectionName)
      if (reload) {
        await reload()
      }
      showToast('success', 'Section saved to disk')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      showToast('error', `Save failed: ${msg}`)
    }
  }

  const handleDownload = () => {
    downloadFiles()
  }

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
            sectionMeta={editedMeta}
            validationErrors={validationErrors}
            validationDiagnostics={validationDiagnostics}
            validationStatus={validationStatus}
            onVisualFormChange={setVisualFormField}
            onVisualMetaChange={setVisualFormMeta}
            onRawTextChange={setRawText}
            rawText={rawText}
            isDirty={isDirty}
            isSaving={isSaving}
            onSave={handleSave}
            onDownload={handleDownload}
            onDone={() => toggleEdit()}
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

  const { bundle, loading, error, reload } = useOKFBundled(topicId ?? '')
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
        <EditorModeView topicLabel={topic.label} reload={reload} />
      </div>
    )
  }

  return (
    <div className="topic-page topic-container" data-topic-id={topic.id} data-testid={`${topic.id}-topic`}>
      <h2 className="topic-page-title">{topic.label}</h2>
      <div className="topic-content topic-container-content">
        {sections.map((section, idx) => (
          <SectionRenderer key={`${topic.id}-${idx}`} config={section} sectionIndex={idx} />
        ))}
      </div>
      <HUDDrawer />
    </div>
  )
}

function TopicShellWithBundle() {
  const { topicId } = useParams()
  const { bundle } = useOKFBundled(topicId ?? '')
  const editor = useEditorSafe()

  useEffect(() => {
    if (editor?.setBundle) {
      editor.setBundle(bundle ?? null)
    }
  }, [bundle, editor])

  useEffect(() => {
    if (editor?.editMode) {
      editor.setEditMode(false)
    }
  }, [topicId])

  if (!editor) {
    return (
      <EditorProvider bundle={bundle}>
        <TopicShellInner />
      </EditorProvider>
    )
  }

  return <TopicShellInner />
}

export function TopicShell() {
  return (
    <ProgressProvider>
      <HUDProvider>
        <ToastProvider>
          <TopicShellWithBundle />
        </ToastProvider>
      </HUDProvider>
    </ProgressProvider>
  )
}

export { SectionRenderer }
