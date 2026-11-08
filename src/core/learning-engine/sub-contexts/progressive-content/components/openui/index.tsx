import { useCallback, useInsertionEffect, useMemo, useState } from 'react'
import { Renderer, type ActionEvent, type OpenUIError } from '@openuidev/react-lang'
import '@openuidev/react-ui/components.css'
import { ScrollReveal } from '../../../../../ui-system/motion/scroll-reveal'
import { SectionTitleBar } from '../../../../../delivery/web-app-shell/SectionTitleBar'
import { OpenUIHelpModal } from './OpenUIHelpModal'
import { ensureLoomOpenUITheme } from './theme'
import './openui.css'
import { createLoomReactLibrary, renderLearningActivity } from '../../../../composition/oui/react'

export interface OpenUISectionProps {
  title?: string
  heading?: string
  /** OpenUI Lang program written against the standard component library. */
  source: string
  animate?: boolean
  sectionIndex?: number
  onEvent?: (event: { type: string; [key: string]: unknown }) => void
}

function handleAction(event: ActionEvent) {
  // Loom content is static: the only built-in action with a meaning here is opening a link.
  if (event.type === 'open_url' && typeof event.params.url === 'string') {
    window.open(event.params.url, '_blank', 'noopener,noreferrer')
  }
}

function OpenUISection({ title, heading, source, animate = false, sectionIndex = 0, onEvent }: OpenUISectionProps) {
  const library = useMemo(() => createLoomReactLibrary((config, statementId) => renderLearningActivity(config, statementId, onEvent)), [onEvent])
  const [errors, setErrors] = useState<OpenUIError[]>([])
  const onError = useCallback((next: OpenUIError[]) => setErrors(next), [])

  useInsertionEffect(() => ensureLoomOpenUITheme(), [])

  const content = (
    <>
      <SectionTitleBar
        title={title}
        sectionIndex={sectionIndex}
        HelpModal={OpenUIHelpModal}
        titleTestId="openui-title"
      />

      {heading && (
        <h4 className="openui-section-heading" data-testid="openui-heading">
          {heading}
        </h4>
      )}

      <div className="loom-openui-scope openui-section-body" data-testid="openui-content">
        <Renderer
          response={source}
          library={library}
          onAction={handleAction}
          onError={onError}
          publishObservability={false}
        />
      </div>

      {errors.length > 0 && (
        <ul className="openui-section-errors" data-testid="openui-errors">
          {errors.map((e, i) => (
            <li key={i}>{e.message}</li>
          ))}
        </ul>
      )}
    </>
  )

  return (
    <div className="openui-section" data-testid="openui-section">
      {animate ? <ScrollReveal>{content}</ScrollReveal> : content}
    </div>
  )
}

export default OpenUISection
