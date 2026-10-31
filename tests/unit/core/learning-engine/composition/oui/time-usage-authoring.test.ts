import { describe, expect, it } from 'vitest'
import { TIME_USAGE_EXAMPLES, TIME_USAGE_PLANNING_RULE } from '../../../../../../src/core/learning-engine/composition/oui/time-usage-authoring'
import { getLoomSkill } from '../../../../../../src/core/learning-engine/composition/oui/skill'
import { getTutorAppSkill, getTutorViewerSkill } from '../../../../../../src/core/learning-engine/composition/oui/tutor-skills'
import { getAuthoringGuide } from '../../../../../../src/core/learning-engine/composition/oui/authoring-guide'
import { sectionBeatsOf, validateOUINarration, validateOUISection } from '../../../../../../src/core/learning-engine/validation/oui-gateway'

describe('time and usage authoring guidance', () => {
  it('puts proactive visual selection in the writer and both tutor planning workflows', () => {
    for (const skill of [getLoomSkill(), getTutorAppSkill(), getTutorViewerSkill()]) {
      expect(skill).toContain(TIME_USAGE_PLANNING_RULE)
    }
    expect(getLoomSkill()).toContain('Request share is different from CPU utilization')
    expect(getLoomSkill()).toContain('NarrationStep("part2", …)')
  })

  it('includes the worked examples when requesting OpenUI rather than unrelated section types', () => {
    const guide = getAuthoringGuide(['openui'])
    for (const example of TIME_USAGE_EXAMPLES) expect(guide).toContain(example.section)
    expect(getAuthoringGuide(['quiz'])).not.toContain('## Time and Usage Visuals')
  })

  for (const { name, section, narration } of TIME_USAGE_EXAMPLES) {
    it(`${name}: compiles with complete narration and resolvable highlight targets`, () => {
      expect(validateOUISection(section).diagnostics).toEqual([])
      const beats = sectionBeatsOf(section)!.map((beat) => beat.id)
      expect(beats).toEqual(['title', 'part1', 'part2', 'part3'])
      const result = validateOUINarration(narration, section)
      expect(result.diagnostics).toEqual([])
      const steps = result.payload!.steps
      expect([...new Set(steps.map((step) => step.beat))]).toEqual(beats)
      expect(steps.filter((step) => step.beat === 'part2')).toHaveLength(3)
      expect(section).toContain('illustrative')
    })
  }
})
