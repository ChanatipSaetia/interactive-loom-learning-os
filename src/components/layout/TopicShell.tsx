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

function EditorPlaceholderPanel() {
  return (
    <div className="editor-panel-placeholder" data-testid="editor-panel-placeholder">
      <div className="editor-panel-header">
        <h3>Section Editor</h3>
      </div>
      <div className="editor-panel-body">
        <p>Editor panel will appear here when a section is selected for editing.</p>
      </div>
    </div>
  )
}

function TopicShellInner() {
  const { topicId } = useParams()
  const { topics } = useTopics()
  const { editMode, activeSectionIndex } = useEditor()

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

  const activeSectionConfig =
    activeSectionIndex !== null && activeSectionIndex < sections.length
      ? sections[activeSectionIndex]
      : null

  if (editMode && activeSectionConfig) {
    return (
      <div className="topic-page editor-mode" data-topic-id={topic.id} data-testid={`${topic.id}-topic`}>
        <div className="editor-mode-header">
          <h2 className="topic-page-title">{topic.label}</h2>
          <EditSectionToggle />
        </div>
        <SplitPaneLayout
          leftPanel={<EditorPlaceholderPanel />}
          rightPanel={
            <div className="editor-preview-panel" data-testid="editor-preview-panel">
              <SectionRenderer config={activeSectionConfig} />
            </div>
          }
        />
        <HUDDrawer />
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

export function TopicShell() {
  return (
    <ProgressProvider>
      <HUDProvider>
        <EditorProvider>
          <TopicShellInner />
        </EditorProvider>
      </HUDProvider>
    </ProgressProvider>
  )
}

export { SectionRenderer }
