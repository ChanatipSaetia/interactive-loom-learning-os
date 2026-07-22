import { useState, useEffect, useRef, useCallback } from 'react'
import * as yaml from 'js-yaml'
import type { OKFBundledSection, OKFSectionMeta, OKFSectionData } from '../okf/types'

interface EditorBufferState {
  meta: OKFSectionMeta
  data: OKFSectionData
  rawText: string
  parseError: string | null
  isDirty: boolean
}

interface EditorBufferReturn extends EditorBufferState {
  setVisualFormField: (data: OKFSectionData) => void
  setRawText: (text: string) => void
}

export function useSectionEditorBuffer(
  sourceSection: OKFBundledSection | null,
  onChange?: () => void
): EditorBufferReturn {
  const sourceRef = useRef(sourceSection)
  const syncing = useRef(false)

  const stringifiedRef = useRef('')

  const [state, setState] = useState<EditorBufferState>(() => {
    const data = sourceSection?.data ?? { type: 'text', paragraphs: [] }
    const meta = sourceSection?.meta ?? { type: 'text', title: '', resource: '.' }
    const raw = yaml.dump(data, { lineWidth: -1, noRefs: true })
    stringifiedRef.current = raw
    return { meta, data, rawText: raw, parseError: null, isDirty: false }
  })

  useEffect(() => {
    if (sourceSection && sourceSection !== sourceRef.current) {
      sourceRef.current = sourceSection
      const data = sourceSection.data
      const meta = sourceSection.meta
      const raw = yaml.dump(data, { lineWidth: -1, noRefs: true })
      stringifiedRef.current = raw
      setState({ meta, data, rawText: raw, parseError: null, isDirty: false })
    }
  }, [sourceSection])

  const setVisualFormField = useCallback(
    (data: OKFSectionData) => {
      if (syncing.current) return
      const raw = yaml.dump(data, { lineWidth: -1, noRefs: true })
      stringifiedRef.current = raw
      const sourceData = sourceRef.current?.data
      const dirty = sourceData ? raw !== yaml.dump(sourceData, { lineWidth: -1, noRefs: true }) : false
      setState((prev) => ({ ...prev, data, rawText: raw, parseError: null, isDirty: dirty }))
      onChange?.()
    },
    [onChange]
  )

  const setRawText = useCallback(
    (text: string) => {
      if (syncing.current) return
      try {
        const parsed = yaml.load(text) as OKFSectionData
        stringifiedRef.current = text
        syncing.current = true
        const sourceData = sourceRef.current?.data
        const normalized = yaml.dump(parsed, { lineWidth: -1, noRefs: true })
        const dirty = sourceData ? normalized !== yaml.dump(sourceData, { lineWidth: -1, noRefs: true }) : false
        setState((prev) => ({ ...prev, data: parsed, rawText: text, parseError: null, isDirty: dirty }))
        onChange?.()
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        setState((prev) => ({ ...prev, rawText: text, parseError: message }))
      }
      syncing.current = false
    },
    [onChange]
  )

  return {
    meta: state.meta,
    data: state.data,
    rawText: state.rawText,
    parseError: state.parseError,
    isDirty: state.isDirty,
    setVisualFormField,
    setRawText,
  }
}
