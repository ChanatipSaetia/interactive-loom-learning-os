import { describe, expect, it } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import BulletsSection from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/bullets'
import PresentBullets from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/bullets/PresentBullets'
import { BulletText } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/bullets/BulletText'
import { bulletsBeats } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/present'
import { beatSpeech } from '../../../../src/core/supporting/presentation/narration'

const data = { items: [{ text: 'Prepare **account access** first.', children: [{ text: 'Check **repository permissions** before starting.' }] }] }

describe('bold emphasis in bullets', () => {
  it('renders emphasis in a Read parent and its expanded sub-item', () => {
    const { container, getByRole } = render(<BulletsSection {...data} animate={false} />)
    expect(container.querySelector('.bullet-text-parent strong')).toHaveTextContent('account access')
    fireEvent.click(getByRole('button', { name: /Prepare account access first/ }))
    expect(container.querySelector('.bullet-children .bullet-text strong')).toHaveTextContent('repository permissions')
    expect(container.textContent).not.toContain('**')
  })

  it('uses matching formatted content in Present and its measuring copy, and narrates plain words', () => {
    const { container } = render(<PresentBullets data={data} beats={bulletsBeats(data)} beat={1} sectionIndex={0} active />)
    const page = container.querySelector('.present-bullet-page:not([hidden])')!
    expect(page.querySelector('.is-parent strong')).toHaveTextContent('account access')
    expect(page.querySelector('.is-child strong')).toHaveTextContent('repository permissions')
    expect(container.querySelectorAll('.present-bullets-measure [data-measure-row] strong')).toHaveLength(2)
    expect(beatSpeech(container, 1).map((part) => part.text).join(' ')).toBe('Check repository permissions before starting.')
  })

  it('handles multiple bold phrases, escaped delimiters and literal HTML safely', () => {
    const { container } = render(<BulletText text={'**First** and **second**. \\*\\*literal\\*\\* <img src=x onerror=alert(1)>'} />)
    expect([...container.querySelectorAll('strong')].map((el) => el.textContent)).toEqual(['First', 'second'])
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain('**literal**')
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>')
  })
})
