import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ReflectionTemplate from '../../../../src/core/learning-engine/sub-contexts/reflection-synthesis/components/reflection-template'

describe('ReflectionTemplate', () => {
  it('renders blanks without leaking zone IDs into the sentence', () => {
    const { container } = render(
      <ReflectionTemplate
        prompt="Complete the statement:"
        template="Adding {zone-1} rewards can {zone-2} motivation."
        chips={[{ id: 'c1', text: 'extrinsic' }, { id: 'c2', text: 'undermine' }]}
        solution={{ 'zone-1': 'c1', 'zone-2': 'c2' }}
      />,
    )
    const sentence = container.querySelector('.template-sentence-container')
    expect(sentence).toHaveTextContent('Adding [ ? ] rewards can [ ? ] motivation.')
    expect(sentence?.textContent).not.toContain('zone-')
    expect(container.querySelectorAll('.reflection-blank-dropzone')).toHaveLength(2)
  })
})
