import { z } from 'zod'
import { AUTHORING_CORE } from './authoring-core'
import { getLoomAuthoringPrompt } from './authoring-prompt'
import { getAuthoringGuide, guideSectionTypes } from './authoring-guide'
import { COMPONENT_LIBRARIES } from './library'
import { textHash } from '../../../supporting/authoring-editor/assistant/statements'
import { BEAT_IDS } from './narration'
import { getAuthoringWorkflow } from './authoring-workflow'
import { TopicPlanSchema } from './topic-plan'

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
  const types = guideSectionTypes()
  const selected = types.filter((section) => args.sections.includes(section.type))
  const components = args.components.length ? args.components : selected.filter((s) => s.type !== 'openui').map((s) => s.component)
  const unknownSections = args.sections.filter((type) => !types.some((s) => s.type === type))
  const contracts = args.detail === 'index' ? '' : args.detail === 'full'
    ? getAuthoringGuide(['all']).replace(AUTHORING_CORE, '') : getAuthoringGuide([], components, args.library)
  const beats = Object.fromEntries(args.sections.map((type) => [type, BEAT_IDS[type as keyof typeof BEAT_IDS] ?? 'Retrieve the section guide for its supported beats.']))
  const result = {
    schemaVersion: 1, contractVersion: version,
    coreIncluded, core: coreIncluded ? AUTHORING_CORE : null,
    refresh: args.forceRefresh ? 'forced' : args.knownContractVersion === version ? 'current' : args.knownContractVersion ? 'stale' : 'initial',
    contracts, beats,
    ...(args.detail === 'index' ? { sections: types.map(({ type, component }) => ({ type, component })) } : {}),
    diagnostics: [
      ...unknownSections.map((type) => ({ code: 'UNKNOWN_SECTION_TYPE', reference: type })),
      ...(args.sections.includes('openui') && !args.components.length ? [{ code: 'OPENUI_COMPONENTS_REQUIRED', reference: 'Retrieve the openui section guide, then request its selected library-scoped components.' }] : []),
    ],
    estimateMethod: 'utf8-bytes and characters/4; estimated tokens are not billing counts',
  }
  const text = JSON.stringify(result)
  return { ...result, measurement: { bytes: new TextEncoder().encode(text).length, estimatedTokens: Math.ceil(text.length / 4) } }
}
