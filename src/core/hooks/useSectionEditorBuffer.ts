import { useState, useEffect, useRef, useCallback } from 'react'
import * as yaml from 'js-yaml'
import type { OKFBundledSection, OKFSectionMeta, OKFSectionData } from '../okf/types'
import type { ValidationError } from '../okf/validate'
import { parseAndValidateYAML } from '../okf/validate'
import { buildSectionSaveFiles, buildDownloadFiles, triggerDownload } from '../util/okfSave'

const DEBOUNCE_MS = 300

interface EditorBufferState {
  meta: OKFSectionMeta
  data: OKFSectionData
  rawText: string
  validationErrors: ValidationError[]
  isDirty: boolean
  isSaving: boolean
}

interface EditorBufferReturn extends EditorBufferState {
  sectionBody: string
  setVisualFormField: (data: OKFSectionData) => void
  setRawText: (text: string) => void
  saveToDisk: (topicId: string, sectionName: string) => Promise<boolean>
  downloadFiles: () => void
}

export function useSectionEditorBuffer(
  sourceSection: OKFBundledSection | null,
  onChange?: () => void
): EditorBufferReturn {
  const sourceRef = useRef(sourceSection)
  const syncing = useRef(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRaw = useRef<string | null>(null)

  const stringifiedRef = useRef('')

  const [state, setState] = useState<EditorBufferState>(() => {
    const data = sourceSection?.data ?? { type: 'text', paragraphs: [] }
    const meta = sourceSection?.meta ?? { type: 'text', title: '', resource: '.' }
    const raw = yaml.dump(data, { lineWidth: -1, noRefs: true })
    stringifiedRef.current = raw
    return { meta, data, rawText: raw, validationErrors: [], isDirty: false, isSaving: false }
  })

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  useEffect(() => {
    if (sourceSection && sourceSection !== sourceRef.current) {
      sourceRef.current = sourceSection
      const data = sourceSection.data
      const meta = sourceSection.meta
      const raw = yaml.dump(data, { lineWidth: -1, noRefs: true })
      stringifiedRef.current = raw
      setState({ meta, data, rawText: raw, validationErrors: [], isDirty: false, isSaving: false })
    }
  }, [sourceSection])

  const flushDebounced = useCallback(() => {
    const raw = pendingRaw.current
    if (raw === null) return
    pendingRaw.current = null

    const metaType = sourceRef.current?.meta?.type
    const result = parseAndValidateYAML(raw, metaType)

    const sourceData = sourceRef.current?.data
    let dirty = false
    if (sourceData && result.data) {
      const normalized = yaml.dump(result.data, { lineWidth: -1, noRefs: true })
      dirty = normalized !== yaml.dump(sourceData, { lineWidth: -1, noRefs: true })
    } else if (result.data) {
      dirty = true
    }

    if (result.data && result.errors.length === 0) {
      // Valid: update data and clear errors
      syncing.current = true
      setState((prev) => ({
        ...prev,
        data: result.data!,
        rawText: raw,
        validationErrors: [],
        isDirty: dirty,
      }))
      syncing.current = false
      onChange?.()
    } else if (result.errors.length > 0) {
      // Invalid: keep last-good data (prev.data), show errors, update rawText
      setState((prev) => ({
        ...prev,
        rawText: raw,
        validationErrors: result.errors,
        isDirty: dirty,
      }))
    }
  }, [onChange])

  const setVisualFormField = useCallback(
    (data: OKFSectionData) => {
      if (syncing.current) return
      const raw = yaml.dump(data, { lineWidth: -1, noRefs: true })
      stringifiedRef.current = raw
      const sourceData = sourceRef.current?.data
      const dirty = sourceData ? raw !== yaml.dump(sourceData, { lineWidth: -1, noRefs: true }) : false
      setState((prev) => ({
        ...prev,
        data,
        rawText: raw,
        validationErrors: [],
        isDirty: dirty,
      }))
      onChange?.()
    },
    [onChange]
  )

  const setRawText = useCallback(
    (text: string) => {
      if (syncing.current) return

      // Cancel previous debounce
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      // Update rawText immediately for responsive UX
      setState((prev) => ({ ...prev, rawText: text }))

      // Store pending and schedule debounced validation
      pendingRaw.current = text
      debounceTimer.current = setTimeout(flushDebounced, DEBOUNCE_MS)
    },
    [flushDebounced]
  )

  const saveToDisk = useCallback(async (topicId: string, sectionName: string): Promise<boolean> => {
    const sectionBody = sourceRef.current?.sectionBody ?? ''
    const files = buildSectionSaveFiles(state.meta, state.rawText, sectionBody)

    setState((prev) => ({ ...prev, isSaving: true }))

    try {
      const res = await fetch('/api/okf/save-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          sectionName,
          sectionMd: files.sectionMd,
          dataYaml: files.dataYaml,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Save failed' }))
        throw new Error(err.error ?? 'Save failed')
      }
      setState((prev) => ({ ...prev, isDirty: false, isSaving: false }))
      return true
    } catch (e: unknown) {
      setState((prev) => ({ ...prev, isSaving: false }))
      throw e
    }
  }, [state.meta, state.rawText])

  const downloadFiles = useCallback(() => {
    const sectionBody = sourceRef.current?.sectionBody ?? ''
    const downloads = buildDownloadFiles(state.meta, state.rawText, sectionBody)
    triggerDownload(downloads.sectionMd)
    setTimeout(() => triggerDownload(downloads.dataYaml), 200)
  }, [state.meta, state.rawText])

  return {
    meta: state.meta,
    data: state.data,
    rawText: state.rawText,
    validationErrors: state.validationErrors,
    isDirty: state.isDirty,
    isSaving: state.isSaving,
    sectionBody: sourceRef.current?.sectionBody ?? '',
    setVisualFormField,
    setRawText,
    saveToDisk,
    downloadFiles,
  }
}
