// Provider-neutral local CLI. Input contains aggregate traces, never prompts/keys.
import { readFileSync, writeFileSync } from 'node:fs'
import { evaluateWorkflowRuns } from '../src/evaluation/workflow-run'
const [input, output] = process.argv.slice(2)
if (!input || !output) throw Error('Usage: npm run evaluate:workflow -- input.json output.json')
const report = evaluateWorkflowRuns(JSON.parse(readFileSync(input, 'utf8')))
writeFileSync(output, JSON.stringify(report, null, 2) + '\n')
console.log(`Wrote ${report.groups.length} aggregate evaluation groups`)
