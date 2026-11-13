/** Split existing canonical policies into individually readable virtual files. */
import { getStorageGuide } from './storage-guide'
import { getTutorGuide } from './tutor-skills'
import { getAuthoringWorkflow } from './authoring-workflow'
import { MENTAL_MODEL_GUIDE } from './mental-model-guide'

export function guideReferences(): Record<string, string> {
  const result: Record<string, string> = {}
  const tutor = getTutorGuide()
    .replace(getAuthoringWorkflow('mcp'), '## Authoring a topic\n\nFollow [the creation workflow](loom://references/workflow/understand.md) one step at a time. Each step links to the next contract; do not load all stages at once.')
    .replace(MENTAL_MODEL_GUIDE, '## Choosing capabilities\n\nRead [the capability index](loom://references/capabilities/index.md), then only the relevant learning capabilities and selection guidance.')
  for (const [folder, source] of [['storage', getStorageGuide()], ['tutoring', tutor]] as const) {
    const parts: string[] = []
    let current: string[] = [], fence: string | undefined
    for (const line of source.split('\n')) {
      const marker = /^\s*(```+|~~~+)/.exec(line)?.[1]
      if (marker && !fence) fence = marker[0]
      else if (marker && fence === marker[0]) fence = undefined
      if (!fence && /^## /.test(line)) { parts.push(current.join('\n')); current = [] }
      current.push(line)
    }
    parts.push(current.join('\n'))
    result[`${folder}/overview.md`] = parts[0].trim()
    for (const part of parts.slice(1)) {
      const heading = part.split('\n')[0].replace(/^## /, '')
      const slug = heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const path = `${folder}/${slug}.md`
      if (result[path]) throw new Error(`Duplicate reference: ${path}`)
      result[path] = part.trim()
    }
  }
  return result
}
