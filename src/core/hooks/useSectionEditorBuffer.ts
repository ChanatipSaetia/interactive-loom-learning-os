import { useState, useEffect, useRef, useCallback } from 'react'
import * as yaml from 'js-yaml'
import type { OKFBundledSection, OKFSectionMeta, OKFSectionData } from '../okf/types'
import type { ValidationError, SemanticValidationError, SchemaValidationError, YAMLSyntaxError } from '../okf/validate'
import { validateOKFSection } from '../validation/gateway'
import type { ValidationDiagnostic, ValidationResult } from '../validation/gateway'
import { buildSectionSaveFiles, buildDownloadFiles, triggerDownload } from '../util/okfSave'
import { inRepoStorage } from '../okf/reader'

const DEBOUNCE_MS = 300

interface EditorBufferState {
  meta: OKFSectionMeta
  data: OKFSectionData
  rawText: string
  validationErrors: ValidationError[]
  validationDiagnostics: ValidationDiagnostic[]
  validationStatus: ValidationResult['status']
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

// Convert gateway diagnostics to legacy ValidationError[] for backward-compatible UI
function diagnosticsToLegacyErrors(diagnostics: ValidationDiagnostic[]): ValidationError[] {
  return diagnostics.map((d) => {
    if (d.tier === 1) {
      return {
        kind: 'syntax' as const,
        message: d.message,
        line: d.line,
        snippet: undefined,
      } as YAMLSyntaxError
    } else if (d.tier === 3) {
      return {
        kind: 'semantic' as const,
        field: d.field || 'root',
        message: d.message,
        fixHint: d.fixHint,
      } as SemanticValidationError
    } else {
      return {
        kind: 'schema' as const,
        field: d.field || 'root',
        message: d.message,
        fixHint: d.fixHint,
      } as SchemaValidationError
    }
  })
}

export function useSectionEditorBuffer(
  sourceSection: OKFBundledSection | null,
  onChange?: () => void
): EditorBufferReturn {
  const sourceRef = useRef(sourceSection)
  const syncing = useRef(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRaw = useRef<string | null>(null)

  // Persist last-valid data across invalid edits so Live Preview never blanks
  const lastValidDataRef = useRef<OKFSectionData | null>(null)

  const stringifiedRef = useRef('')

  const [state, setState] = useState<EditorBufferState>(() => {
    const data = sourceSection?.data ?? { type: 'text', paragraphs: [] }
    const meta = sourceSection?.meta ?? { type: 'text', title: '', resource: '.' }
    const raw = yaml.dump(data, { lineWidth: -1, noRefs: true })
    stringifiedRef.current = raw
    lastValidDataRef.current = data
    return {
      meta,
      data,
      rawText: raw,
      validationErrors: [],
      validationDiagnostics: [],
      validationStatus: 'valid',
      isDirty: false,
      isSaving: false,
    }
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
      lastValidDataRef.current = data
      setState({
        meta,
        data,
        rawText: raw,
        validationErrors: [],
        validationDiagnostics: [],
        validationStatus: 'valid',
        isDirty: false,
        isSaving: false,
      })
    }
  }, [sourceSection])

  const flushDebounced = useCallback(() => {
    const raw = pendingRaw.current
    if (raw === null) return
    pendingRaw.current = null

    const metaType = sourceRef.current?.meta?.type
    const result = validateOKFSection(raw, metaType)

    const sourceData = sourceRef.current?.data
    let dirty = false
    if (sourceData && result.payload) {
      const normalized = yaml.dump(result.payload, { lineWidth: -1, noRefs: true })
      dirty = normalized !== yaml.dump(sourceData, { lineWidth: -1, noRefs: true })
    } else if (result.payload) {
      dirty = true
    }

    const legacyErrors = diagnosticsToLegacyErrors(result.diagnostics)

    if (result.status === 'valid' || (result.status === 'warning' && result.payload)) {
      // Valid or warnings-only: update data with validated payload, clear/carry errors
      const newData = result.payload as unknown as OKFSectionData
      lastValidDataRef.current = newData
      syncing.current = true
      setState((prev) => ({
        ...prev,
        data: newData,
        rawText: raw,
        validationErrors: legacyErrors,
        validationDiagnostics: result.diagnostics,
        validationStatus: result.status,
        isDirty: dirty,
      }))
      syncing.current = false
      onChange?.()
    } else if (result.diagnostics.length > 0) {
      // Error: keep last-valid data for Live Preview, show diagnostics
      const previewData = lastValidDataRef.current
      setState((prev) => ({
        ...prev,
        data: previewData ?? prev.data,
        rawText: raw,
        validationErrors: legacyErrors,
        validationDiagnostics: result.diagnostics,
        validationStatus: result.status,
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

      // Validate the visual form data immediately through the gateway
      const result = validateOKFSection(raw, data.type)
      const legacyErrors = diagnosticsToLegacyErrors(result.diagnostics)

      if (result.status === 'valid' || result.status === 'warning') {
        lastValidDataRef.current = data
      }

      setState((prev) => ({
        ...prev,
        data: lastValidDataRef.current ?? data,
        rawText: raw,
        validationErrors: legacyErrors,
        validationDiagnostics: result.diagnostics,
        validationStatus: result.status,
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
      // Use storage adapter for disk persistence (Phase 3.2 delivery port)
      await inRepoStorage.saveSection(topicId, sectionName, state.data, files.sectionMd)
      setState((prev) => ({ ...prev, isDirty: false, isSaving: false }))
      return true
    } catch (e: unknown) {
      setState((prev) => ({ ...prev, isSaving: false }))
      throw e
    }
  }, [state.meta, state.rawText, state.data])

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
    validationDiagnostics: state.validationDiagnostics,
    validationStatus: state.validationStatus,
    isDirty: state.isDirty,
    isSaving: state.isSaving,
    sectionBody: sourceRef.current?.sectionBody ?? '',
    setVisualFormField,
    setRawText,
    saveToDisk,
    downloadFiles,
  }
}
