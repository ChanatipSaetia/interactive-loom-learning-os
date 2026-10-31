// @ts-expect-error Node's fs has no types in this project (see tests/unit/sections/present/helpers.ts)
import { readFileSync } from 'fs'
import { unzipSync } from 'fflate'
import { describe, it, expect } from 'vitest'
import * as yaml from 'js-yaml'
import { getWriterSkillReferences } from '../../../../../../src/core/learning-engine/composition/oui/skill-references'
import { getLoomAuthoringPrompt } from '../../../../../../src/core/learning-engine/composition/oui/authoring-prompt'
import { BEAT_IDS } from '../../../../../../src/core/learning-engine/composition/oui/narration'
import { SECTION_MENTAL_MODELS } from '../../../../../../src/core/learning-engine/composition/oui/mental-model-guide'
// @ts-expect-error Node's path has no types in this project (same as fs above)
import { posix } from 'path'
import { getLoomSkill } from '../../../../../../src/core/learning-engine/composition/oui/skill'
import { LOOM_SKILL_NAME, LOOM_SKILL_REFERENCE, LOOM_SKILL_ZIP_PATH, LOOM_TUTOR_APP_SKILL, LOOM_TUTOR_VIEWER_SKILL, skillZipPath } from '../../../../../../src/core/learning-engine/composition/oui/llm-guide'
import { getTutorAppSkill, getTutorViewerSkill } from '../../../../../../src/core/learning-engine/composition/oui/tutor-skills'
import { progressNote, stampEvent } from '../../../../../../src/core/supporting/learner-progress'
import { ouiSchemaFiles, skillZipFiles } from '../../../../../../src/core/learning-engine/composition/oui/schema-files'

describe('Loom agent skill', () => {
  it('guides the authoring bot to choose meaningful icons and let content determine pages', () => {
    expect(getWriterSkillReferences()['references/sections/bullets.md']).toContain('Icons are independent')
    expect(getWriterSkillReferences()['references/sections/bullets.md']).toContain('Let Present measure and paginate')
    expect(getWriterSkillReferences()['references/sections/bullets.md']).toContain('**bold phrases**')
    expect(getWriterSkillReferences()['references/sections/bullets.md']).toContain('Bullet("Prepare **access**", null, "key")')
  })

  it('has valid frontmatter for Claude Code and opencode', () => {
    const [, frontmatter] = getLoomSkill().split('---\n')
    const meta = yaml.load(frontmatter) as { name: string; description: string }
    expect(meta.name).toBe(LOOM_SKILL_NAME)
    expect(meta.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    expect(meta.description.length).toBeGreaterThan(0)
    expect(meta.description.length).toBeLessThanOrEqual(1024)
  })

  it('writes topic folders, not a single .loom.oui file, by default', () => {
    const skill = getWriterSkillReferences()['references/workflow/output.md'] + getWriterSkillReferences()['references/workflow/validation.md']
    expect(skill).toContain('Always write a **topic folder**')
    expect(skill).toContain('public/content/<topic-id>/')
    expect(skill).toContain('write a single `<topic-id>.loom.oui` file only when the user asks for one file')
    expect(skill).toContain('**In a chat app without a project folder**')
    expect(skill).toContain('**Open folder**')
  })

  it('ships focused references in both distributions without the old full prompt', () => {
    const files = ouiSchemaFiles()
    for (const dir of [`public/llm/skills/${LOOM_SKILL_NAME}`, `.claude/skills/${LOOM_SKILL_NAME}`]) {
      expect(files[`${dir}/SKILL.md`]).toBe(getLoomSkill())
      expect(files[`${dir}/${LOOM_SKILL_REFERENCE}`]).toBeUndefined()
      for (const [path, text] of Object.entries(getWriterSkillReferences())) expect(files[`${dir}/${path}`]).toBe(text)
    }
  })

  it('keeps the entry point small and all local Markdown links resolvable in the package', () => {
    const files = { 'SKILL.md': getLoomSkill(), ...getWriterSkillReferences() }
    expect(new TextEncoder().encode(getLoomSkill()).length).toBeLessThan(8000)
    expect(getLoomSkill()).not.toContain('Read `references/loom-authoring-prompt.md` in full')
    for (const [file, text] of Object.entries(files)) {
      const prose = text.replace(/```[\s\S]*?```|`[^`\n]*`/g, '')
      for (const match of prose.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
        const target = match[1].split('#')[0]
        // The authoring rules demonstrate Markdown with [links](url).
        if (!target || target === 'url' || /^(https?:|#)/.test(target)) continue
        const resolved = posix.normalize(posix.join(posix.dirname(file), target))
        expect(files[resolved as keyof typeof files], `${file} → ${target}`).toBeDefined()
      }
    }
  })

  it('preserves every canonical Loom signature and field description exactly once', () => {
    const prompt = getLoomAuthoringPrompt().split('## Component Signatures')[1].split('## Hoisting')[0]
    const references = Object.values(getWriterSkillReferences()).join('\n')
    for (const line of prompt.split('\n').filter(line => /^[A-Z][A-Za-z0-9]*\(/.test(line) || line.startsWith('  - '))) {
      // Identical field descriptions can belong to several different components.
      expect(references.split('\n').filter(candidate => candidate === line).length, line)
        .toBe(prompt.split('\n').filter(candidate => candidate === line).length)
    }
  })

  it('routes every section to its own beat contract and keeps narration syntax shared', () => {
    const files = getWriterSkillReferences()
    for (const { type } of SECTION_MENTAL_MODELS) {
      expect(files[`references/sections/${type}.md`]).toContain(BEAT_IDS[type])
      expect(getLoomSkill()).toContain(`references/sections/${type}.md`)
    }
    expect(files['references/core/narration.md']).toContain('NarrationStep(beat:')
    expect(files['references/core/narration.md']).not.toContain('| Section type | Beats |')
  })

  it('publishes a fresh zip with the skill folder at its root (npm run oui:schema)', () => {
    const zipped = unzipSync(readFileSync(`public/${LOOM_SKILL_ZIP_PATH}`))
    const expected = skillZipFiles()
    expect(Object.keys(zipped).sort()).toEqual(Object.keys(expected).sort())
    for (const [name, text] of Object.entries(expected)) expect(new TextDecoder().decode(zipped[name]), name).toBe(text)
    expect(expected[`${LOOM_SKILL_NAME}/SKILL.md`]).toBe(getLoomSkill())
  })
})

describe('Loom learner skills (slice 6)', () => {
  const skills = { [LOOM_TUTOR_APP_SKILL]: getTutorAppSkill(), [LOOM_TUTOR_VIEWER_SKILL]: getTutorViewerSkill() }

  it('have valid frontmatter', () => {
    for (const [name, skill] of Object.entries(skills)) {
      const meta = yaml.load(skill.split('---\n')[1]) as { name: string; description: string }
      expect(meta.name).toBe(name)
      expect(meta.description.length).toBeLessThanOrEqual(1024)
    }
  })

  it('describe the progress note Loom writes, and the Loom folder', () => {
    const note = progressNote({ id: 't', sections: [{ name: 'quiz', title: 'Quiz' }] }, [
      stampEvent({ topic: 't', item: 'sections/quiz.oui#q1', kind: 'answered', result: 'wrong' }, 'test'),
    ])
    const headings = note.text.split('\n').filter((line) => line.startsWith('## ') || /^[a-z-]+: /.test(line)).map((line) => line.replace(/: .*/, ':'))
    for (const skill of Object.values(skills)) {
      for (const heading of headings) expect(skill).toContain(heading)
      expect(skill).toContain('Loom/<domain-id>/progress/<topic>-<date>.md')
      expect(skill).toContain('<domain-id>/\n    domain.oui')
      expect(skill).toContain('topics/<topic-id>.loom.oui')
      expect(skill).toContain('20–30% of the new topic callbacks')
    }
  })

  it('use the domain layout: the app skill asks the server for it, the Viewer skill carries the storage guide', () => {
    expect(getTutorAppSkill()).toContain('Call `get_storage_guide` once')
    expect(getTutorAppSkill()).toContain('`// @loom-domain <domain-id>` as its second line')
    expect(getTutorAppSkill()).toContain('show it with `show_domain`')
    expect(getTutorAppSkill()).toContain('Never show them unasked')
    expect(getTutorViewerSkill()).toContain("## Where Loom keeps the learner's topics and progress")
    expect(getTutorViewerSkill()).toContain('**Replace, never duplicate:**')
    // The old flat folders come up only to move files out of them
    for (const skill of Object.values(skills)) expect(skill).not.toMatch(/(as|to) `Loom\/(topics|progress)\//)
  })

  it('leave the authoring prompt to the server in the app skill, and carry it in the Viewer skill', () => {
    const files = ouiSchemaFiles()
    for (const dir of ['public/llm/skills', '.claude/skills']) {
      expect(files[`${dir}/${LOOM_TUTOR_APP_SKILL}/SKILL.md`]).toBe(getTutorAppSkill())
      expect(files[`${dir}/${LOOM_TUTOR_APP_SKILL}/${LOOM_SKILL_REFERENCE}`]).toBeUndefined()
      expect(files[`${dir}/${LOOM_TUTOR_VIEWER_SKILL}/${LOOM_SKILL_REFERENCE}`]).toBe(files['public/llm/loom-authoring-prompt.md'])
    }
    expect(getTutorAppSkill()).toContain('get_authoring_guide')
    expect(getTutorAppSkill()).toContain('Save my progress')
    expect(getTutorViewerSkill()).toContain(LOOM_SKILL_REFERENCE)
    expect(getTutorViewerSkill()).toContain('Copy progress')
  })

  it('write short topics in the app by default, and full lessons when asked (Viewer keeps full lessons)', () => {
    const app = getTutorAppSkill()
    expect(app).toContain('By default write a **short topic**')
    expect(app).toContain('**1–3 sections**')
    expect(app).toContain('**Write a full lesson only when the learner asks for one**')
    expect(getTutorViewerSkill()).not.toContain('short topic')
    expect(getTutorViewerSkill()).toContain('about 5–8 sections')
  })

  it('encourage keeping progress in the learner\'s drive, and say how to connect one', () => {
    for (const skill of Object.values(skills)) {
      expect(skill).toContain('encourage the learner to turn one on')
      expect(skill).toContain('Settings → Connectors → Google Drive')
      expect(skill).toContain('Offer each save rather than wait to be asked')
      expect(skill).toContain('remind them to keep their progress')
    }
  })

  it('publish fresh zips (npm run oui:schema)', () => {
    for (const name of [LOOM_TUTOR_APP_SKILL, LOOM_TUTOR_VIEWER_SKILL]) {
      const zipped = unzipSync(readFileSync(`public/${skillZipPath(name)}`))
      const expected = skillZipFiles(name)
      expect(Object.keys(zipped).sort()).toEqual(Object.keys(expected).sort())
      for (const [file, text] of Object.entries(expected)) expect(new TextDecoder().decode(zipped[file]), file).toBe(text)
    }
  })
})
