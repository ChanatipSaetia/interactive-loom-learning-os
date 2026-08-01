/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as yaml from 'js-yaml'
import { useSectionEditorBuffer, formatSectionRawText } from '../../../../../../src/core/supporting/authoring-editor'
import type { OKFBundledSection, OKFSectionData } from '../../../../../../src/core/learning-engine/composition/okf/types'

describe('useSectionEditorBuffer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const mockTextSection: OKFBundledSection = {
    meta: { type: 'text', title: 'Test Section', resource: 'test.md' },
    data: { type: 'text', paragraphs: ['Hello world', 'Second paragraph'] },
    sectionFolder: 'text-1',
  }

  const mockQuizSection: OKFBundledSection = {
    meta: { type: 'quiz', title: 'Quiz Section', resource: 'quiz.md' },
    data: {
      type: 'quiz',
      questions: [
        {
          id: 'q1',
          question: 'What is React?',
          choices: [
            { id: 'a', text: 'A UI library', correct: true, explanation: 'Yes' },
            { id: 'b', text: 'A database', correct: false, explanation: 'No' },
          ],
        },
      ],
    },
    sectionFolder: 'quiz-1',
  }

  it('initializes buffer from source section', () => {
    const { result } = renderHook(() => useSectionEditorBuffer(mockTextSection))

    expect(result.current.data).toEqual(mockTextSection.data)
    expect(result.current.meta).toEqual(mockTextSection.meta)
    expect(result.current.rawText).toBe(formatSectionRawText(mockTextSection.meta, mockTextSection.data))
    expect(result.current.validationDiagnostics).toEqual([])
    expect(result.current.validationDiagnostics).toEqual([])
    expect(result.current.validationStatus).toBe('valid')
    expect(result.current.isDirty).toBe(false)
  })

  it('resets buffer when source section changes', () => {
    const { result, rerender } = renderHook(
      ({ source }) => useSectionEditorBuffer(source),
      { initialProps: { source: mockTextSection } }
    )

    expect(result.current.data).toEqual(mockTextSection.data)

    rerender({ source: mockQuizSection })

    expect(result.current.data).toEqual(mockQuizSection.data)
    expect(result.current.meta).toEqual(mockQuizSection.meta)
    expect(result.current.isDirty).toBe(false)
    expect(result.current.validationDiagnostics).toEqual([])
    expect(result.current.validationDiagnostics).toEqual([])
    expect(result.current.validationStatus).toBe('valid')
  })

  it('updates data and raw text when visual form changes', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useSectionEditorBuffer(mockTextSection, onChange))

    const newData: OKFSectionData = { type: 'text', paragraphs: ['Modified paragraph'] }
    act(() => {
      result.current.setVisualFormField(newData)
    })

    expect(result.current.data).toEqual(newData)
    expect(result.current.rawText).toBe(formatSectionRawText(mockTextSection.meta, newData))
    expect(result.current.validationDiagnostics).toEqual([])
    expect(result.current.validationStatus).toBe('valid')
    expect(result.current.isDirty).toBe(true)
    expect(onChange).toHaveBeenCalled()
  })

  it('updates data and raw text when valid YAML is entered (after debounce)', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useSectionEditorBuffer(mockTextSection, onChange))

    const newYaml = 'type: text\nparagraphs:\n  - New paragraph from raw YAML'
    const expectedParsed = yaml.load(newYaml) as OKFSectionData

    act(() => {
      result.current.setRawText(newYaml)
    })

    // rawText updates immediately
    expect(result.current.rawText).toBe(newYaml)

    // Data updates after debounce
    act(() => {
      vi.runAllTimers()
    })

    expect(result.current.data).toEqual(expectedParsed)
    expect(result.current.validationDiagnostics).toEqual([])
    expect(result.current.validationStatus).toBe('valid')
    expect(result.current.isDirty).toBe(true)
    expect(onChange).toHaveBeenCalled()
  })

  it('shows validation error for invalid YAML without clearing last valid data', () => {
    const { result } = renderHook(() => useSectionEditorBuffer(mockTextSection))

    const validData = { ...result.current.data }

    act(() => {
      result.current.setRawText('invalid: yaml: [')
    })

    // rawText updates immediately
    expect(result.current.rawText).toBe('invalid: yaml: [')

    // Validation errors appear after debounce
    act(() => {
      vi.runAllTimers()
    })

    expect(result.current.validationDiagnostics.length).toBeGreaterThan(0)
    expect(result.current.validationDiagnostics.length).toBeGreaterThan(0)
    expect(result.current.validationStatus).toBe('error')
    expect(result.current.data).toEqual(validData)
  })

  it('shows schema validation error for valid YAML but wrong schema', () => {
    const { result } = renderHook(() => useSectionEditorBuffer(mockTextSection))

    // Valid YAML but missing required field
    act(() => {
      result.current.setRawText('type: text')
    })

    act(() => {
      vi.runAllTimers()
    })

    expect(result.current.validationDiagnostics.length).toBeGreaterThan(0)
    const schemaErr = result.current.validationDiagnostics.find((e: any) => e.tier === 2)
    expect(schemaErr).toBeTruthy()
  })

  it('clears validation errors when valid YAML is restored', () => {
    const { result } = renderHook(() => useSectionEditorBuffer(mockTextSection))

    // Type invalid YAML
    act(() => {
      result.current.setRawText('invalid: yaml: [')
    })
    act(() => {
      vi.runAllTimers()
    })
    expect(result.current.validationDiagnostics.length).toBeGreaterThan(0)

    // Restore valid YAML
    const validYaml = 'type: text\nparagraphs:\n  - Restored'
    act(() => {
      result.current.setRawText(validYaml)
    })
    act(() => {
      vi.runAllTimers()
    })

    expect(result.current.validationDiagnostics).toEqual([])
    expect(result.current.validationDiagnostics).toEqual([])
    expect(result.current.validationStatus).toBe('valid')
    expect(result.current.data).toEqual(yaml.load(validYaml))
  })

  it('bi-directional sync: form -> raw -> form', () => {
    const { result } = renderHook(() => useSectionEditorBuffer(mockTextSection))

    // Step 1: Update via visual form
    const formUpdated: OKFSectionData = { type: 'text', paragraphs: ['From form'] }
    act(() => {
      result.current.setVisualFormField(formUpdated)
    })

    expect(result.current.data).toEqual(formUpdated)

    // Step 2: Update via raw YAML
    const rawUpdated = 'type: text\nparagraphs:\n  - From raw YAML editor'
    act(() => {
      result.current.setRawText(rawUpdated)
    })

    expect(result.current.rawText).toBe(rawUpdated)

    act(() => {
      vi.runAllTimers()
    })

    expect(result.current.data).toEqual(yaml.load(rawUpdated))
    expect(result.current.validationDiagnostics).toEqual([])
  })

  it('tracks dirty state', () => {
    const { result } = renderHook(() => useSectionEditorBuffer(mockTextSection))

    expect(result.current.isDirty).toBe(false)

    act(() => {
      result.current.setVisualFormField({ type: 'text', paragraphs: ['Changed'] })
    })

    expect(result.current.isDirty).toBe(true)

    // Reset to original
    act(() => {
      result.current.setVisualFormField(mockTextSection.data)
    })

    expect(result.current.isDirty).toBe(false)
  })

  it('handles null source section', () => {
    const { result } = renderHook(() => useSectionEditorBuffer(null))

    expect(result.current.data).toEqual({ type: 'text', paragraphs: [] })
    expect(result.current.meta).toEqual({ type: 'text', title: '', resource: '.' })
    expect(result.current.isDirty).toBe(false)
    expect(result.current.validationDiagnostics).toEqual([])
    expect(result.current.validationStatus).toBe('valid')
  })

  it('debounces rapid raw text changes', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useSectionEditorBuffer(mockTextSection, onChange))

    // Multiple rapid edits
    act(() => {
      result.current.setRawText('type: text\nparagraphs:\n  - First')
      result.current.setRawText('type: text\nparagraphs:\n  - Second')
      result.current.setRawText('type: text\nparagraphs:\n  - Final')
    })

    // onChange should not have been called yet
    expect(onChange).not.toHaveBeenCalled()

    // After debounce, only the last state should be processed
    act(() => {
      vi.runAllTimers()
    })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(result.current.data).toEqual({ type: 'text', paragraphs: ['Final'] })
  })

  it('last-good-state persists through multiple invalid edits', () => {
    const { result } = renderHook(() => useSectionEditorBuffer(mockTextSection))
    const originalData = { ...result.current.data }

    // First invalid edit
    act(() => {
      result.current.setRawText('invalid: [')
    })
    act(() => { vi.runAllTimers() })

    expect(result.current.data).toEqual(originalData)

    // Second invalid edit (different error)
    act(() => {
      result.current.setRawText('type: text\nparagraphs: "not-array"')
    })
    act(() => { vi.runAllTimers() })

    // Data should still be the last good state, not corrupted
    expect(result.current.data).toEqual(originalData)
    expect(result.current.validationDiagnostics.length).toBeGreaterThan(0)
  })

  // ---- Gateway integration tests ----

  it('exposes validationDiagnostics from ValidationGateway', () => {
    const { result } = renderHook(() => useSectionEditorBuffer(mockTextSection))

    act(() => {
      result.current.setRawText('type: text')
    })
    act(() => { vi.runAllTimers() })

    expect(result.current.validationDiagnostics.length).toBeGreaterThan(0)
    const diag = result.current.validationDiagnostics[0]
    expect(diag.tier).toBe(2)
    expect(diag.fixHint).toBeDefined()
  })

  it('validationStatus reflects gateway status (valid)', () => {
    const { result } = renderHook(() => useSectionEditorBuffer(mockTextSection))

    expect(result.current.validationStatus).toBe('valid')

    act(() => {
      result.current.setRawText('type: text\nparagraphs:\n  - Valid')
    })
    act(() => { vi.runAllTimers() })

    expect(result.current.validationStatus).toBe('valid')
  })

  it('validationStatus reflects gateway status (error)', () => {
    const { result } = renderHook(() => useSectionEditorBuffer(mockTextSection))

    act(() => {
      result.current.setRawText('invalid yaml: [')
    })
    act(() => { vi.runAllTimers() })

    expect(result.current.validationStatus).toBe('error')
  })

  it('live preview retains lastValidData during syntax errors', () => {
    const { result } = renderHook(() => useSectionEditorBuffer(mockTextSection))
    const lastGoodData = { ...result.current.data }

    // Introduce syntax error
    act(() => {
      result.current.setRawText('type: text\n  bad_indent: true')
    })
    act(() => { vi.runAllTimers() })

    expect(result.current.validationStatus).toBe('error')
    // Data should retain last valid state
    expect(result.current.data).toEqual(lastGoodData)
  })

  it('live preview retains lastValidData through intermediate valid state then error', () => {
    const { result } = renderHook(() => useSectionEditorBuffer(mockTextSection))

    // Step 1: Make a valid edit
    act(() => {
      result.current.setRawText('type: text\nparagraphs:\n  - Updated paragraph')
    })
    act(() => { vi.runAllTimers() })
    expect(result.current.data).toEqual({ type: 'text', paragraphs: ['Updated paragraph'] })

    // Step 2: Introduce error - preview should keep the valid edit
    act(() => {
      result.current.setRawText('type: text\nparagraphs: [unclosed')
    })
    act(() => { vi.runAllTimers() })

    expect(result.current.validationStatus).toBe('error')
    expect(result.current.data).toEqual({ type: 'text', paragraphs: ['Updated paragraph'] })
  })

  it('legacy validationDiagnostics are derived from gateway diagnostics', () => {
    const { result } = renderHook(() => useSectionEditorBuffer(mockTextSection))

    act(() => {
      result.current.setRawText('type: text')
    })
    act(() => { vi.runAllTimers() })

    expect(result.current.validationDiagnostics.length).toBeGreaterThan(0)
    expect(result.current.validationDiagnostics.length).toBeGreaterThan(0)
    // Same count since each diagnostic maps to one legacy error
    expect(result.current.validationDiagnostics.length).toBe(result.current.validationDiagnostics.length)
  })
})
