// @ts-expect-error Node's fs has no types in this project (see tests/unit/sections/present/helpers.ts)
import { readFileSync } from 'fs'
import { unzipSync } from 'fflate'
import { describe, it, expect } from 'vitest'
import * as yaml from 'js-yaml'
import { getLoomSkill } from '../../../../../../src/core/learning-engine/composition/oui/skill'
import { LOOM_SKILL_NAME, LOOM_SKILL_REFERENCE, LOOM_SKILL_ZIP_PATH } from '../../../../../../src/core/learning-engine/composition/oui/llm-guide'
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
