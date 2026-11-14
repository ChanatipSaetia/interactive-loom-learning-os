import { ReferenceLinks } from '../../../../../ui-system/primitives/reference-links'
import { parseOUIElements } from '../../../../composition/oui/compile'
import { proseAnchors, proseBlocks, proseRootAlias } from '../../../../composition/oui/page-prose'
import { usePickAnchorScope } from '../../../../../ui-system/pick-anchor'
import { useCallback, useInsertionEffect, useMemo, useState, useEffect, useRef } from 'react'
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

  const contentRef = useRef<HTMLDivElement>(null)
  const pickScope = usePickAnchorScope()
  useEffect(() => {
    const element = contentRef.current
    const root = parseOUIElements(source)
    if (!element || !root || !pickScope || !proseBlocks(root)) return
    const anchors = proseAnchors(root, true, proseRootAlias(source))
    const tag = () => {
      const blocks = element.querySelectorAll<HTMLElement>('.openui-text-content')
      if (blocks.length !== anchors.length) return
      blocks.forEach((block, index) => {
        block.setAttribute('data-oui-anchor', anchors[index])
        block.setAttribute('data-oui-file', pickScope.file)
        block.setAttribute('data-oui-section', pickScope.label)
      })
    }
    tag()
    const observer = new MutationObserver(tag)
    observer.observe(element, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [source, pickScope])

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

      <div ref={contentRef} className="loom-openui-scope openui-section-body" data-testid="openui-content">
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
      <ReferenceLinks scope={contentRef} contentKey={source} />
      {animate ? <ScrollReveal>{content}</ScrollReveal> : content}
    </div>
  )
}

export default OpenUISection
