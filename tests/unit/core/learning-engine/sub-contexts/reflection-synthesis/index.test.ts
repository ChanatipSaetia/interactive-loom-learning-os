import { describe, it, expect } from 'vitest'
import * as ReflectionSynthesisSubdomain from '../../../../../../src/core/learning-engine/sub-contexts/reflection-synthesis'

describe('ReflectionSynthesis Bounded Context Entry Point', () => {
  it('exports all Zod schemas', () => {
    expect(ReflectionSynthesisSubdomain.ReflectionSequenceSectionSchema).toBeDefined()
    expect(ReflectionSynthesisSubdomain.ReflectionTemplateSectionSchema).toBeDefined()
  })

  it('exports all section components', () => {
    expect(ReflectionSynthesisSubdomain.ReflectionSequenceSection).toBeDefined()
    expect(ReflectionSynthesisSubdomain.ReflectionTemplateSection).toBeDefined()
  })

  it('schemas are zod objects', () => {
    expect(ReflectionSynthesisSubdomain.ReflectionSequenceSectionSchema._def).toBeDefined()
    expect(ReflectionSynthesisSubdomain.ReflectionTemplateSectionSchema._def).toBeDefined()
  })
})
