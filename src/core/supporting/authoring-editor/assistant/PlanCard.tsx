/**
 * The plan card (grill-log-ai-assistant.md, decision 139): the sections a
 * `propose_plan` call suggests, each with a checkbox, and Build these, which
 * sends one message with the ticked items. A newer plan makes it stale.
 */
import { useMemo, useState } from 'react'
import { FilePlus2, Hammer, ListChecks, PencilLine } from 'lucide-react'
import { readPlan } from './edit-tools'
import type { ToolStepCall } from './thread'
import type { AssistantState } from './useAssistant'

export function PlanCard({ assistant, messageId, call, built, stale }: { assistant: AssistantState; messageId: string; call: ToolStepCall; built: boolean; stale: boolean }) {
  const plan = useMemo(() => readPlan(call.args), [call.args])
  const [unticked, setUnticked] = useState<Set<number>>(() => new Set())
  if (!plan) return null
  const ticked = plan.items.map((_, i) => i).filter((i) => !unticked.has(i))
  const closed = built || stale
  const toggle = (i: number) => setUnticked((current) => {
    const next = new Set(current)
    if (next.has(i)) next.delete(i)
    else next.add(i)
    return next
  })
  return (
    <div className={`ai-edit ai-plan${closed ? ' is-rejected' : ''}`} data-testid="ai-plan" data-state={built ? 'built' : stale ? 'stale' : 'open'}>
      <div className="ai-edit-head">
        <ListChecks size={14} aria-hidden />
        <strong>Plan</strong>
        {plan.goal && <span className="ai-edit-summary">{plan.goal}</span>}
        {closed && <span className="ai-edit-state ai-edit-state--rejected">{built ? 'Built' : 'Replaced by a newer plan'}</span>}
      </div>
      <ol className="ai-staged-list">
        {plan.items.map((item, i) => (
          <li key={i} className="ai-staged-change ai-plan-item" data-testid="ai-plan-item">
            <label className="ai-check">
              <input type="checkbox" checked={!unticked.has(i)} disabled={closed || assistant.busy} onChange={() => toggle(i)} data-testid="ai-plan-tick" />
              <span className="ai-plan-text">
                <span className="ai-plan-title">
                  {item.action === 'edit' ? <PencilLine size={12} aria-hidden /> : <FilePlus2 size={12} aria-hidden />}
                  <b>{item.title}</b>
                  <code>{item.type}{item.name ? ` · ${item.name}` : ''}</code>
                </span>
                {item.idea && <span className="ai-note">{item.idea}</span>}
              </span>
            </label>
          </li>
        ))}
      </ol>
      {!closed && (
        <div className="ai-edit-actions">
          <button
            type="button"
            className="ai-button ai-button--primary"
            disabled={assistant.busy || !ticked.length}
            onClick={() => void assistant.buildPlan(messageId, call.id, ticked)}
            data-testid="ai-plan-build"
          >
            <Hammer size={13} /> Build {ticked.length === plan.items.length ? 'these' : `${ticked.length} of ${plan.items.length}`}
          </button>
          <span className="ai-note">Or ask for changes to the plan in the bar below.</span>
        </div>
      )}
    </div>
  )
}
