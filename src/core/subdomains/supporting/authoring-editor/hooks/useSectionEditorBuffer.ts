import { useState, useEffect, useRef, useCallback } from 'react'
import * as yaml from 'js-yaml'
import type { OKFBundledSection, OKFSectionMeta, OKFSectionData } from '../../../../okf/types'
import type { ValidationError, SemanticValidationError, SchemaValidationError, YAMLSyntaxError } from '../../../../okf/validate'
import { validateOKFSection } from '../../../../validation/gateway'
import type { ValidationDiagnostic, ValidationResult } from '../../../../validation/gateway'
import { buildSectionSaveFiles, buildDownloadFiles, triggerDownload } from '../services/okfSave'
import { inRepoStorage, clearOKFCache } from '../../../../okf/reader'

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

export interface EditorBufferReturn extends EditorBufferState {
  sectionBody: string
  setVisualFormField: (data: OKFSectionData) => void
  setVisualFormMeta: (meta: OKFSectionMeta) => void
  setRawText: (text: string) => void
  saveToDisk: (topicId: string, sectionName: string) => Promise<boolean>
  downloadFiles: () => void
}

export function formatSectionRawText(meta: OKFSectionMeta, data: OKFSectionData): string {
  const fmObj: Record<string, unknown> = {
    type: meta.type || data.type,
  }
  if (meta.title !== undefined && meta.title !== '') fmObj.title = meta.title
  if (meta.heading !== undefined && meta.heading !== '') fmObj.heading = meta.heading
  if (meta.ordered !== undefined) fmObj.ordered = meta.ordered
  if (meta.resource) fmObj.resource = meta.resource
  if (meta.intro) fmObj.intro = meta.intro

  const fmYaml = yaml.dump(fmObj, { lineWidth: -1, noRefs: true }).trim()
  const dataYaml = yaml.dump(data, { lineWidth: -1, noRefs: true }).trim()

  return `---\n${fmYaml}\n---\n\n${dataYaml}`
}

export function parseSectionRawText(
  raw: string,
  defaultMeta: OKFSectionMeta,
  _defaultData?: OKFSectionData
): { meta: OKFSectionMeta; dataYaml: string } {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('---')) {
    return { meta: defaultMeta, dataYaml: trimmed }
  }

  const secondDivider = trimmed.indexOf('---', 3)
  if (secondDivider === -1) {
    return { meta: defaultMeta, dataYaml: trimmed }
  }

  const fmStr = trimmed.slice(3, secondDivider).trim()
  const dataStr = trimmed.slice(secondDivider + 3).trim()

  let parsedFm: Record<string, unknown> = {}
  try {
    const loaded = yaml.load(fmStr)
    if (loaded && typeof loaded === 'object' && !Array.isArray(loaded)) {
      parsedFm = loaded as Record<string, unknown>
    }
  } catch {
    parsedFm = {}
  }

  const meta: OKFSectionMeta = {
    ...defaultMeta,
    type: (parsedFm.type as string) || defaultMeta.type,
    ...(parsedFm.title !== undefined ? { title: String(parsedFm.title) } : {}),
    ...(parsedFm.heading !== undefined ? { heading: String(parsedFm.heading) } : {}),
    ...(parsedFm.ordered !== undefined ? { ordered: Boolean(parsedFm.ordered) } : {}),
    ...(parsedFm.intro !== undefined ? { intro: parsedFm.intro as OKFSectionMeta['intro'] } : {}),
  }

  return { meta, dataYaml: dataStr }
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
    const raw = formatSectionRawText(meta, data)
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
      const raw = formatSectionRawText(meta, data)
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

    const defaultMeta = sourceRef.current?.meta ?? state.meta
    const defaultData = sourceRef.current?.data ?? state.data

    const { meta: parsedMeta, dataYaml } = parseSectionRawText(raw, defaultMeta, defaultData)
    const result = validateOKFSection(dataYaml, parsedMeta.type)

    const sourceData = sourceRef.current?.data
    const sourceMeta = sourceRef.current?.meta
    let dirty = false
    if (sourceData && sourceMeta && result.payload) {
      const currentFormatted = formatSectionRawText(parsedMeta, result.payload as unknown as OKFSectionData)
      const origFormatted = formatSectionRawText(sourceMeta, sourceData)
      dirty = currentFormatted !== origFormatted
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
        meta: parsedMeta,
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
        meta: parsedMeta,
        data: previewData ?? prev.data,
        rawText: raw,
        validationErrors: legacyErrors,
        validationDiagnostics: result.diagnostics,
        validationStatus: result.status,
        isDirty: dirty,
      }))
    }
  }, [onChange, state.meta, state.data])

  const setVisualFormField = useCallback(
    (data: OKFSectionData) => {
      if (syncing.current) return
      const raw = formatSectionRawText(state.meta, data)
      stringifiedRef.current = raw
      const sourceData = sourceRef.current?.data
      const sourceMeta = sourceRef.current?.meta
      const dirty = sourceData && sourceMeta ? raw !== formatSectionRawText(sourceMeta, sourceData) : true

      // Validate the visual form data immediately through the gateway
      const dataYaml = yaml.dump(data, { lineWidth: -1, noRefs: true })
      const result = validateOKFSection(dataYaml, data.type)
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
    [onChange, state.meta]
  )

  const setVisualFormMeta = useCallback(
    (meta: OKFSectionMeta) => {
      if (syncing.current) return
      const raw = formatSectionRawText(meta, state.data)
      stringifiedRef.current = raw
      const sourceData = sourceRef.current?.data
      const sourceMeta = sourceRef.current?.meta
      const dirty = sourceData && sourceMeta ? raw !== formatSectionRawText(sourceMeta, sourceData) : true

      setState((prev) => ({
        ...prev,
        meta,
        rawText: raw,
        isDirty: dirty,
      }))
      onChange?.()
    },
    [onChange, state.data]
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
    const dataYaml = yaml.dump(state.data, { lineWidth: -1, noRefs: true })
    const files = buildSectionSaveFiles(state.meta, dataYaml, sectionBody)

    setState((prev) => ({ ...prev, isSaving: true }))

    try {
      // Use storage adapter for disk persistence (Phase 3.2 delivery port)
      await inRepoStorage.saveSection(topicId, sectionName, state.data, files.sectionMd)
      if (sourceRef.current) {
        sourceRef.current.data = state.data
        sourceRef.current.meta = state.meta
      }
      clearOKFCache()
      setState((prev) => ({ ...prev, isDirty: false, isSaving: false }))
      return true
    } catch (e: unknown) {
      setState((prev) => ({ ...prev, isSaving: false }))
      throw e
    }
  }, [state.meta, state.data])

  const downloadFiles = useCallback(() => {
    const sectionBody = sourceRef.current?.sectionBody ?? ''
    const dataYaml = yaml.dump(state.data, { lineWidth: -1, noRefs: true })
    const downloads = buildDownloadFiles(state.meta, dataYaml, sectionBody)
    triggerDownload(downloads.sectionMd)
    setTimeout(() => triggerDownload(downloads.dataYaml), 200)
  }, [state.meta, state.data])

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
    setVisualFormMeta,
    setRawText,
    saveToDisk,
    downloadFiles,
  }
}
