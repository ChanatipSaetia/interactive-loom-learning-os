import { useInsertionEffect } from 'react'
import { Renderer, type ActionEvent } from '@openuidev/react-lang'
import '@openuidev/react-ui/components.css'
import { beatMarks, type PresentRendererProps } from '../../../present-kernel'
import type { OpenUIPresentData } from '../../present'
import { ensureLoomOpenUITheme } from './theme'
import { loomOpenUILibrary } from './themed-charts'
import './openui.css'
import '../present.css'

function handleAction(event: ActionEvent) {
  if (event.type === 'open_url' && typeof event.params.url === 'string') {
    window.open(event.params.url, '_blank', 'noopener,noreferrer')
  }
}

/** Standard OpenUI section in Present mode: one beat, each top-level child fading in (decision 78). */
export default function PresentOpenUI({ data, beat }: PresentRendererProps<OpenUIPresentData>) {
  const mark = beatMarks(beat)
  useInsertionEffect(() => ensureLoomOpenUITheme(), [])
  return (
    <div className="openui-section present-openui">
      {data.heading && <h4 className="openui-section-heading" {...mark(0, { motion: 'fade' })}>{data.heading}</h4>}
      <div className="loom-openui-scope openui-section-body" {...mark(0, { motion: 'children' })}>
        <Renderer response={data.source} library={loomOpenUILibrary} onAction={handleAction} publishObservability={false} />
      </div>
    </div>
  )
}
