import { describe, expect, it } from 'vitest'
import { DOMAIN_SIGNATURE, LIBRARY_SIGNATURE, getStorageGuide } from '../../../../../../src/core/learning-engine/composition/oui/storage-guide'
import { getLoomOUILibrary } from '../../../../../../src/core/learning-engine/composition/oui/library'
import { progressNote, progressNotePath, stampEvent } from '../../../../../../src/core/supporting/learner-progress'
import { compileOUITopic } from '../../../../../../src/core/learning-engine/composition/oui/compile'

describe('storage guide', () => {
  const guide = getStorageGuide()

  it('shows the library\'s own signatures for domain.oui and index.oui', () => {
    const spec = getLoomOUILibrary().toSpec().components
    expect(spec.Domain.signature).toBe(DOMAIN_SIGNATURE)
    expect(spec.Library.signature).toBe(LIBRARY_SIGNATURE)
    expect(guide).toContain(DOMAIN_SIGNATURE)
    expect(guide).toContain(spec.DomainRef.signature)
    expect(guide).toContain(spec.TopicRef.signature)
  })

  it('names the paths Loom writes progress notes to, rooted at My Drive', () => {
    expect(progressNotePath('punch-basics', '2026-10-24', 'fight-animation')).toBe('Loom/fight-animation/progress/punch-basics-2026-10-24.md')
    expect(guide).toContain('progress/<topic-id>-YYYY-MM-DD.md')
    expect(guide).toContain('**My Drive** in Google Drive, not a shared drive')
    const note = progressNote({ id: 'punch-basics', domain: 'fight-animation', sections: [] }, [stampEvent({ topic: 'punch-basics', item: 'sections/a.oui', kind: 'seen' }, 'x')])
    for (const key of ['loom-progress: 1', 'domain: fight-animation', 'topic: punch-basics']) {
      expect(note.text).toContain(key)
      expect(guide).toContain(key.split(': ')[0] + ':')
    }
  })

  it('carries the rules: pick a domain, replace not duplicate, plain text, plan from one domain, find moved files, warn on moves', () => {
    for (const rule of ['**Pick the domain.**', '**Replace, never duplicate:**', 'no conversion to Google Docs', '## Planning what comes next in a domain', '## Finding files that were moved', 'say so first', '**`show_domain`** when they ask about one domain', 'Do not show either unasked', '## Moving from the old layout', 'Remove the old copies only after the new ones are saved']) expect(guide).toContain(rule)
  })

  it('its domain.oui example is a valid Domain', () => {
    const example = /root = Domain\(.*\)$/m.exec(guide)![0]
    expect(example).toContain('TopicRef("punch-basics")')
    // Parses with the Loom library (as Topic files do); the root is a Domain
    const parsed = compileOUITopic(example)
    expect(parsed.issues.filter((i) => /parse|syntax/i.test(i.message))).toEqual([])
  })
})
