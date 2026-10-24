/**
 * The authoring prompt for the hosted endpoint (`vite.worker.config.ts` puts
 * this module in place of `authoring-prompt.ts`): the published file, which
 * `npm run oui:schema` writes from the same source and a unit test keeps
 * fresh. Building the prompt costs more CPU than a free Workers request has.
 */
import prompt from '../../public/llm/loom-authoring-prompt.md?raw'

export function getLoomAuthoringPrompt(): string {
  return prompt
}
