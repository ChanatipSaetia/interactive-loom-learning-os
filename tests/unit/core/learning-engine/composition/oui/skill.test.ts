// @ts-expect-error Node's fs has no types in this project (see tests/unit/sections/present/helpers.ts)
import { readFileSync } from 'fs'
import { unzipSync } from 'fflate'
import { describe, it, expect } from 'vitest'
import * as yaml from 'js-yaml'
import { getLoomSkill } from '../../../../../../src/core/learning-engine/composition/oui/skill'
import { LOOM_SKILL_NAME, LOOM_SKILL_REFERENCE, LOOM_SKILL_ZIP_PATH, LOOM_TUTOR_APP_SKILL, LOOM_TUTOR_VIEWER_SKILL, skillZipPath } from '../../../../../../src/core/learning-engine/composition/oui/llm-guide'
import { getTutorAppSkill, getTutorViewerSkill } from '../../../../../../src/core/learning-engine/composition/oui/tutor-skills'
import { progressNote, stampEvent } from '../../../../../../src/core/supporting/learner-progress'
import { ouiSchemaFiles, skillZipFiles } from '../../../../../../src/core/learning-engine/composition/oui/schema-files'

describe('Loom agent skill', () => {
  it('has valid frontmatter for Claude Code and opencode', () => {
    const [, frontmatter] = getLoomSkill().split('---\n')
    const meta = yaml.load(frontmatter) as { name: string; description: string }
    expect(meta.name).toBe(LOOM_SKILL_NAME)
    expect(meta.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    expect(meta.description.length).toBeGreaterThan(0)
    expect(meta.description.length).toBeLessThanOrEqual(1024)
  })

  it('writes topic folders, not a single .loom.oui file, by default', () => {
    const skill = getLoomSkill()
    expect(skill).toContain('Always write a **topic folder**')
    expect(skill).toContain('public/content/<topic-id>/')
    expect(skill).toContain('write a single `<topic-id>.loom.oui` file only when the user asks for one file')
    expect(skill).toContain('**In a chat app without a project folder**')
    expect(skill).toContain('**Open folder**')
  })

  it('ships the authoring prompt as its reference, published and in the repo', () => {
    const files = ouiSchemaFiles()
    for (const dir of [`public/llm/skills/${LOOM_SKILL_NAME}`, `.claude/skills/${LOOM_SKILL_NAME}`]) {
      expect(files[`${dir}/SKILL.md`]).toBe(getLoomSkill())
      expect(files[`${dir}/${LOOM_SKILL_REFERENCE}`]).toBe(files['public/llm/loom-authoring-prompt.md'])
    }
    expect(getLoomSkill()).toContain(LOOM_SKILL_REFERENCE)
  })

  it('publishes a fresh zip with the skill folder at its root (npm run oui:schema)', () => {
    const zipped = unzipSync(readFileSync(`public/${LOOM_SKILL_ZIP_PATH}`))
    const expected = skillZipFiles()
    expect(Object.keys(zipped).sort()).toEqual([`${LOOM_SKILL_NAME}/SKILL.md`, `${LOOM_SKILL_NAME}/${LOOM_SKILL_REFERENCE}`].sort())
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
    for (const skill of Object.values(skills)) expect(skill).not.toMatch(/Loom\/(topics|progress)\//)
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
