import { describe, it, expect } from 'vitest'
import * as yaml from 'js-yaml'
import { getLoomSkill } from '../../../../../../src/core/learning-engine/composition/oui/skill'
import { LOOM_SKILL_NAME, LOOM_SKILL_REFERENCE } from '../../../../../../src/core/learning-engine/composition/oui/llm-guide'
import { ouiSchemaFiles } from '../../../../../../src/core/learning-engine/composition/oui/schema-files'

describe('Loom agent skill', () => {
  it('has valid frontmatter for Claude Code and opencode', () => {
    const [, frontmatter] = getLoomSkill().split('---\n')
    const meta = yaml.load(frontmatter) as { name: string; description: string }
    expect(meta.name).toBe(LOOM_SKILL_NAME)
    expect(meta.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    expect(meta.description.length).toBeGreaterThan(0)
    expect(meta.description.length).toBeLessThanOrEqual(1024)
  })

  it('ships the authoring prompt as its reference, published and in the repo', () => {
    const files = ouiSchemaFiles()
    for (const dir of [`public/llm/skills/${LOOM_SKILL_NAME}`, `.claude/skills/${LOOM_SKILL_NAME}`]) {
      expect(files[`${dir}/SKILL.md`]).toBe(getLoomSkill())
      expect(files[`${dir}/${LOOM_SKILL_REFERENCE}`]).toBe(files['public/llm/loom-authoring-prompt.md'])
    }
    expect(getLoomSkill()).toContain(LOOM_SKILL_REFERENCE)
  })
})
