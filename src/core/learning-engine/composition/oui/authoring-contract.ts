import { z } from 'zod'
import { AUTHORING_CORE } from './authoring-core'
import { getLoomAuthoringPrompt } from './authoring-prompt'
import { getAuthoringGuide, guideSectionTypes } from './authoring-guide'
import { componentClosure, componentEntries } from './assistant-prompt'
import { COMPONENT_LIBRARIES, OUI_SECTION_TYPES } from './library'
import { textHash } from '../../../supporting/authoring-editor/assistant/statements'
import { BEAT_IDS } from './narration'
import { getAuthoringWorkflow } from './authoring-workflow'
import { TopicPlanSchema } from './topic-plan'
import { getCapabilityIndex } from './capability-catalog'

export const AuthoringContractInput = z.object({
  detail: z.enum(['index', 'focused', 'full']),
  sections: z.array(z.string().max(120)).max(20).default([]),
  components: z.array(z.string().max(120)).max(100).default([]),
  library: z.enum(COMPONENT_LIBRARIES).optional(),
  knownContractVersion: z.string().max(120).optional(),
  forceRefresh: z.boolean().default(false),
}).strict()

/** Content revision covers canonical signatures, rules, narration and workflow text. */
export function authoringContractVersion() {
  return `oui-core-v1:${textHash(AUTHORING_CORE + getLoomAuthoringPrompt() + getAuthoringWorkflow('mcp') + JSON.stringify(z.toJSONSchema(TopicPlanSchema)))}`
}

export function getAuthoringContract(input: z.input<typeof AuthoringContractInput>) {
  const args = AuthoringContractInput.parse(input)
  const version = authoringContractVersion()
  const coreIncluded = args.forceRefresh || args.knownContractVersion !== version
  // A fresh host also needs exact manifest/narration signatures, even when its
  // selected section closure never calls Topic. Derive them from the same library.
  const coreContracts = coreIncluded ? getAuthoringGuide([], ['Topic', 'Narration', 'Page']).split('\n').filter((line) => /^[A-Z][A-Za-z0-9]*\(/.test(line)).join('\n') : null
  const types = guideSectionTypes()
  const selected = types.filter((section) => args.sections.includes(section.type))
  const components = args.components.length ? args.components : selected.filter((s) => s.type !== 'openui').map((s) => s.component)
  const unknownSections = args.sections.filter((type) => !types.some((s) => s.type === type))
  const contracts = args.detail === 'index' ? '' : args.detail === 'full'
    ? getAuthoringGuide(['all']).replace(AUTHORING_CORE, '') : [
      '## Focused component contracts',
      'root = Page("Title", body, heading?). Generic children are alternatives. Query/Mutation host tools are deferred. See core and beats.',
      componentEntries(componentClosure(components, undefined, 'selected')),
    ].join('\n\n')
  const beatSections = [...new Set([...args.sections, ...components.filter((name) => !['Page', 'Topic', 'Narration'].includes(name)).map((name) => OUI_SECTION_TYPES.get(name) ?? 'openui')])]
  const beats = Object.fromEntries(beatSections.map((type) => [type, BEAT_IDS[type as keyof typeof BEAT_IDS] ?? 'Retrieve the section guide for its supported beats.']))
  const result = {
    schemaVersion: 1, contractVersion: version,
    coreIncluded, core: coreIncluded ? AUTHORING_CORE : null, coreContracts,
    refresh: args.forceRefresh ? 'forced' : args.knownContractVersion === version ? 'current' : args.knownContractVersion ? 'stale' : 'initial',
    contracts, beats,
    ...(args.detail === 'index' ? getCapabilityIndex() : {}),
    diagnostics: [
      ...components.filter((name) => !componentClosure([name], args.library).includes(name)).map((name) => ({ code: 'UNKNOWN_COMPONENT', reference: name, recovery: 'Check the library and component name, retry with forceRefresh, then retrieve the selected legacy section guide without library/components. If unavailable, report the blocker and revalidate any changed representation; never silently substitute Text.' })),
      ...unknownSections.map((type) => ({ code: 'UNKNOWN_SECTION_TYPE', reference: type })),
      ...(args.sections.includes('openui') && !args.components.length ? [{ code: 'COMPONENTS_REQUIRED', reference: 'Choose a composition by learner task from the capability index, then request its actual components (e.g. Table; or Stack, Card, CardHeader, TextContent). Focused retrieval includes section rules, beats and required model dependencies; use the full section guide for additional examples.' }] : []),
    ],
    estimateMethod: 'utf8-bytes and characters/4; estimated tokens are not billing counts',
  }
  const text = JSON.stringify(result)
  return { ...result, measurement: { bytes: new TextEncoder().encode(text).length, estimatedTokens: Math.ceil(text.length / 4) } }
}
