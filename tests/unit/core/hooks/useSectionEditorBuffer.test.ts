import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as yaml from 'js-yaml'
import { useSectionEditorBuffer } from '../../../../src/core/hooks/useSectionEditorBuffer'
import type { OKFBundledSection, OKFSectionData } from '../../../../src/core/okf/types'

describe('useSectionEditorBuffer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockTextSection: OKFBundledSection = {
    meta: { type: 'text', title: 'Test Section', resource: 'test.md' },
    data: { type: 'text', paragraphs: ['Hello world', 'Second paragraph'] },
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
  }

  it('initializes buffer from source section', () => {
    const { result } = renderHook(() => useSectionEditorBuffer(mockTextSection))

    expect(result.current.data).toEqual(mockTextSection.data)
    expect(result.current.meta).toEqual(mockTextSection.meta)
    expect(result.current.rawText).toBe(yaml.dump(mockTextSection.data, { lineWidth: -1, noRefs: true }))
    expect(result.current.parseError).toBeNull()
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
  })

  it('updates data and raw text when visual form changes', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useSectionEditorBuffer(mockTextSection, onChange))

    const newData: OKFSectionData = { type: 'text', paragraphs: ['Modified paragraph'] }
    act(() => {
      result.current.setVisualFormField(newData)
    })

    expect(result.current.data).toEqual(newData)
    expect(result.current.rawText).toBe(yaml.dump(newData, { lineWidth: -1, noRefs: true }))
    expect(result.current.parseError).toBeNull()
    expect(result.current.isDirty).toBe(true)
    expect(onChange).toHaveBeenCalled()
  })

  it('updates data and raw text when valid YAML is entered', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useSectionEditorBuffer(mockTextSection, onChange))

    const newYaml = 'type: text\nparagraphs:\n  - New paragraph from raw YAML'
    const expectedParsed = yaml.load(newYaml) as OKFSectionData

    act(() => {
      result.current.setRawText(newYaml)
    })

    expect(result.current.data).toEqual(expectedParsed)
    expect(result.current.rawText).toBe(newYaml)
    expect(result.current.parseError).toBeNull()
    expect(result.current.isDirty).toBe(true)
    expect(onChange).toHaveBeenCalled()
  })

  it('shows parse error for invalid YAML without clearing last valid data', () => {
    const { result } = renderHook(() => useSectionEditorBuffer(mockTextSection))

    const validData = { ...result.current.data }

    act(() => {
      result.current.setRawText('invalid: yaml: [')
    })

    expect(result.current.parseError).not.toBeNull()
    expect(result.current.data).toEqual(validData)
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
    expect(result.current.data).toEqual(yaml.load(rawUpdated))
    expect(result.current.parseError).toBeNull()
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
  })
})
