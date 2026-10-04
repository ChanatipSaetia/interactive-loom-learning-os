import { useState, useCallback } from 'react'
import { Users, Server, GitCommit, GitBranch, Compass, Plus, Trash2, HelpCircle } from 'lucide-react'
import { FlowchartHelpModal } from './FlowchartHelpModal'
import type { OKFFlowSectionData } from '../../../../composition/okf/types'
import type {
  AbstractFlow,
  ActorDecl,
  SystemDecl,
  FlowStep,
  LinearStep,
  BranchStep,
  BranchOption,
  FlowJourney,
  JourneyStepRef,
  ResultEvent,
} from './abstract-flow/types'
import { ref } from './abstract-flow/types'
import { OUIFieldKey } from '../../../OUIFieldKey'
import * as OUI from '../../openui'

interface FlowchartFormEditorProps {
  data: OKFFlowSectionData
  onChange: (data: OKFFlowSectionData) => void
}

type FlowchartSubTab = 'actors' | 'systems' | 'steps' | 'journeys'

export function FlowchartFormEditor({ data, onChange }: FlowchartFormEditorProps) {
  const [activeSubTab, setActiveSubTab] = useState<FlowchartSubTab>('steps')
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const flow: AbstractFlow = (data.flow as AbstractFlow) || { actors: {}, systems: {}, steps: [], journeys: [] }
  const actors = flow.actors || {}
  const systems = flow.systems || {}
  const steps = (flow.steps || []) as any[]
  const journeys = (flow.journeys || []) as FlowJourney[]

  const updateFlow = useCallback(
    (updater: (prevFlow: AbstractFlow) => AbstractFlow) => {
      onChange({
        ...data,
        flow: updater(flow),
      })
    },
    [data, flow, onChange]
  )

  // --- Actor Handlers ---
  const handleActorChange = useCallback(
    (actorKey: string, updated: ActorDecl) => {
      updateFlow((prev) => ({
        ...prev,
        actors: { ...prev.actors, [actorKey]: updated },
      }))
    },
    [updateFlow]
  )

  const handleActorKeyChange = useCallback(
    (oldKey: string, newKey: string) => {
      if (!newKey || newKey === oldKey || actors[newKey]) return
      updateFlow((prev) => {
        const updated = { ...prev.actors }
        const actorVal = updated[oldKey]
        delete updated[oldKey]
        updated[newKey] = actorVal
        return { ...prev, actors: updated }
      })
    },
    [actors, updateFlow]
  )

  const handleAddActor = useCallback(() => {
    const newKey = `actor_${Object.keys(actors).length + 1}`
    updateFlow((prev) => ({
      ...prev,
      actors: {
        ...prev.actors,
        [newKey]: { title: 'New Actor', desc: 'Actor description' },
      },
    }))
  }, [actors, updateFlow])

  const handleRemoveActor = useCallback(
    (actorKey: string) => {
      updateFlow((prev) => {
        const updated = { ...prev.actors }
        delete updated[actorKey]
        return { ...prev, actors: updated }
      })
    },
    [updateFlow]
  )

  // --- System Handlers ---
  const handleSystemChange = useCallback(
    (sysKey: string, updated: SystemDecl) => {
      updateFlow((prev) => ({
        ...prev,
        systems: { ...prev.systems, [sysKey]: updated },
      }))
    },
    [updateFlow]
  )

  const handleSystemKeyChange = useCallback(
    (oldKey: string, newKey: string) => {
      if (!newKey || newKey === oldKey || systems[newKey]) return
      updateFlow((prev) => {
        const updated = { ...prev.systems }
        const sysVal = updated[oldKey]
        delete updated[oldKey]
        updated[newKey] = sysVal
        return { ...prev, systems: updated }
      })
    },
    [systems, updateFlow]
  )

  const handleAddSystem = useCallback(() => {
    const newKey = `sys_${Object.keys(systems).length + 1}`
    updateFlow((prev) => ({
      ...prev,
      systems: {
        ...prev.systems,
        [newKey]: { title: 'New System', desc: 'System description', type: 'aggregate' },
      },
    }))
  }, [systems, updateFlow])

  const handleRemoveSystem = useCallback(
    (sysKey: string) => {
      updateFlow((prev) => {
        const updated = { ...prev.systems }
        delete updated[sysKey]
        return { ...prev, systems: updated }
      })
    },
    [updateFlow]
  )

  // --- System State Machine Handlers ---
  const handleToggleStateMachine = useCallback(
    (sysKey: string) => {
      const currentSys = systems[sysKey]
      if (!currentSys) return

      if (currentSys.stateMachine) {
        const { stateMachine: _, ...rest } = currentSys
        handleSystemChange(sysKey, rest as SystemDecl)
      } else {
        handleSystemChange(sysKey, {
          ...currentSys,
          stateMachine: {
            states: [
              { id: 'IDLE', label: 'Idle', color: 'var(--ctp-overlay1)' },
              { id: 'ACTIVE', label: 'Active', color: 'var(--ctp-green)' },
            ],
            initialState: 'IDLE',
          },
        })
      }
    },
    [systems, handleSystemChange]
  )

  const handleAddSystemState = useCallback(
    (sysKey: string) => {
      const currentSys = systems[sysKey]
      if (!currentSys || !currentSys.stateMachine) return
      const states = currentSys.stateMachine.states || []
      const nextIdx = states.length + 1
      const newState = {
        id: `STATE_${nextIdx}`,
        label: `State ${nextIdx}`,
        color: 'var(--ctp-blue)',
      }
      handleSystemChange(sysKey, {
        ...currentSys,
        stateMachine: {
          ...currentSys.stateMachine,
          states: [...states, newState],
        },
      })
    },
    [systems, handleSystemChange]
  )

  const handleRemoveSystemState = useCallback(
    (sysKey: string, stateIdx: number) => {
      const currentSys = systems[sysKey]
      if (!currentSys || !currentSys.stateMachine) return
      const states = (currentSys.stateMachine.states || []).filter((_, idx) => idx !== stateIdx)
      handleSystemChange(sysKey, {
        ...currentSys,
        stateMachine: {
          ...currentSys.stateMachine,
          states,
          initialState: states[0]?.id || '',
        },
      })
    },
    [systems, handleSystemChange]
  )

  // --- Step Handlers ---
  const handleStepChange = useCallback(
    (index: number, updatedStep: FlowStep) => {
      updateFlow((prev) => {
        const updatedSteps = [...prev.steps]
        updatedSteps[index] = updatedStep
        return { ...prev, steps: updatedSteps }
      })
    },
    [updateFlow]
  )

  const handleToggleStepType = useCallback(
    (index: number, targetType: 'linear' | 'branch') => {
      const current = steps[index]
      if (!current || current.type === targetType) return

      if (targetType === 'branch') {
        const linear = current as LinearStep
        const branchStep: BranchStep = {
          type: 'branch',
          id: current.id,
          event: `evt_${current.id}`,
          continuesAs: current.continuesAs,
          branches: [
            {
              id: `${current.id}_opt1`,
              label: 'Branch 1',
              policy: linear.policy || 'Branch Policy',
              command: linear.command || 'Branch Command',
              handledBy: linear.handledBy || ref(Object.keys(systems)[0] || 'system'),
              resultEvents: linear.resultEvents?.length ? linear.resultEvents : [{ id: `evt_${current.id}_1`, title: 'Branch Event' }],
              continuesAs: linear.continuesAs,
            },
          ],
        }
        handleStepChange(index, branchStep)
      } else {
        const branch = current as BranchStep
        const firstOpt = branch.branches?.[0]
        const linearStep: LinearStep = {
          type: 'linear',
          id: current.id,
          policy: firstOpt?.policy || 'Policy',
          command: firstOpt?.command || 'Command',
          handledBy: firstOpt?.handledBy || ref(Object.keys(systems)[0] || 'system'),
          resultEvents: firstOpt?.resultEvents?.length ? firstOpt.resultEvents : [{ id: `evt_${current.id}`, title: 'Event' }],
          continuesAs: current.continuesAs || firstOpt?.continuesAs,
        }
        handleStepChange(index, linearStep)
      }
    },
    [steps, systems, handleStepChange]
  )

  const handleAddStep = useCallback(
    (stepType: 'linear' | 'branch' = 'linear') => {
      const stepNum = steps.length + 1
      const defaultSystem = ref(Object.keys(systems)[0] || 'system')

      if (stepType === 'linear') {
        const newStep: LinearStep = {
          id: `step_${stepNum}`,
          type: 'linear',
          policy: `Policy ${stepNum}`,
          command: `Command ${stepNum}`,
          handledBy: defaultSystem,
          resultEvents: [{ id: `evt_${stepNum}`, title: `Event ${stepNum}` }],
        }
        updateFlow((prev) => ({
          ...prev,
          steps: [...prev.steps, newStep],
        }))
      } else {
        const newBranchStep: BranchStep = {
          id: `branch_step_${stepNum}`,
          type: 'branch',
          event: `evt_${stepNum}`,
          branches: [
            {
              id: `branch_${stepNum}_opt1`,
              label: `Path A`,
              policy: `Policy ${stepNum} A`,
              command: `Command ${stepNum} A`,
              handledBy: defaultSystem,
              resultEvents: [{ id: `evt_${stepNum}_a`, title: `Event ${stepNum} A` }],
            },
          ],
        }
        updateFlow((prev) => ({
          ...prev,
          steps: [...prev.steps, newBranchStep],
        }))
      }
    },
    [steps.length, systems, updateFlow]
  )

  const handleRemoveStep = useCallback(
    (index: number) => {
      updateFlow((prev) => ({
        ...prev,
        steps: prev.steps.filter((_: FlowStep, i: number) => i !== index),
      }))
    },
    [updateFlow]
  )

  // --- Linear Step Result Events Handlers ---
  const handleAddLinearResultEvent = useCallback(
    (stepIdx: number) => {
      const step = steps[stepIdx]
      if (!step || step.type !== 'linear') return
      const linear = step as LinearStep
      const evtNum = (linear.resultEvents || []).length + 1
      const newEvt: ResultEvent = {
        id: `${linear.id}_evt${evtNum}`,
        title: `Event ${evtNum}`,
      }
      handleStepChange(stepIdx, {
        ...linear,
        resultEvents: [...(linear.resultEvents || []), newEvt],
      })
    },
    [steps, handleStepChange]
  )

  const handleRemoveLinearResultEvent = useCallback(
    (stepIdx: number, evtIdx: number) => {
      const step = steps[stepIdx]
      if (!step || step.type !== 'linear') return
      const linear = step as LinearStep
      const newEvts = (linear.resultEvents || []).filter((_, i) => i !== evtIdx)
      handleStepChange(stepIdx, {
        ...linear,
        resultEvents: newEvts,
      })
    },
    [steps, handleStepChange]
  )

  // --- Branch Step Branch Options Handlers ---
  const handleAddBranchOption = useCallback(
    (stepIdx: number) => {
      const step = steps[stepIdx]
      if (!step || step.type !== 'branch') return
      const branchStep = step as BranchStep
      const optNum = (branchStep.branches || []).length + 1
      const defaultSystem = ref(Object.keys(systems)[0] || 'system')
      const newOpt: BranchOption = {
        id: `${branchStep.id}_opt${optNum}`,
        label: `Path ${optNum}`,
        policy: `Policy ${optNum}`,
        command: `Command ${optNum}`,
        handledBy: defaultSystem,
        resultEvents: [{ id: `${branchStep.id}_evt${optNum}`, title: `Result Event ${optNum}` }],
      }
      handleStepChange(stepIdx, {
        ...branchStep,
        branches: [...(branchStep.branches || []), newOpt],
      })
    },
    [steps, systems, handleStepChange]
  )

  const handleRemoveBranchOption = useCallback(
    (stepIdx: number, branchOptIdx: number) => {
      const step = steps[stepIdx]
      if (!step || step.type !== 'branch') return
      const branchStep = step as BranchStep
      const newBranches = (branchStep.branches || []).filter((_, i) => i !== branchOptIdx)
      handleStepChange(stepIdx, {
        ...branchStep,
        branches: newBranches,
      })
    },
    [steps, handleStepChange]
  )

  const handleBranchOptionChange = useCallback(
    (stepIdx: number, branchOptIdx: number, updatedOpt: BranchOption) => {
      const step = steps[stepIdx]
      if (!step || step.type !== 'branch') return
      const branchStep = step as BranchStep
      const newBranches = [...(branchStep.branches || [])]
      newBranches[branchOptIdx] = updatedOpt
      handleStepChange(stepIdx, {
        ...branchStep,
        branches: newBranches,
      })
    },
    [steps, handleStepChange]
  )

  const handleAddBranchResultEvent = useCallback(
    (stepIdx: number, branchOptIdx: number) => {
      const step = steps[stepIdx]
      if (!step || step.type !== 'branch') return
      const branchStep = step as BranchStep
      const branchOpt = branchStep.branches[branchOptIdx]
      if (!branchOpt) return
      const evtNum = (branchOpt.resultEvents || []).length + 1
      const newEvt: ResultEvent = {
        id: `${branchOpt.id}_evt${evtNum}`,
        title: `Event ${evtNum}`,
      }
      const newBranches = [...branchStep.branches]
      newBranches[branchOptIdx] = {
        ...branchOpt,
        resultEvents: [...(branchOpt.resultEvents || []), newEvt],
      }
      handleStepChange(stepIdx, {
        ...branchStep,
        branches: newBranches,
      })
    },
    [steps, handleStepChange]
  )

  const handleRemoveBranchResultEvent = useCallback(
    (stepIdx: number, branchOptIdx: number, evtIdx: number) => {
      const step = steps[stepIdx]
      if (!step || step.type !== 'branch') return
      const branchStep = step as BranchStep
      const branchOpt = branchStep.branches[branchOptIdx]
      if (!branchOpt) return
      const newEvts = (branchOpt.resultEvents || []).filter((_, i) => i !== evtIdx)
      const newBranches = [...branchStep.branches]
      newBranches[branchOptIdx] = {
        ...branchOpt,
        resultEvents: newEvts,
      }
      handleStepChange(stepIdx, {
        ...branchStep,
        branches: newBranches,
      })
    },
    [steps, handleStepChange]
  )

  // --- Journey Handlers ---
  const handleJourneyChange = useCallback(
    (index: number, updatedJourney: FlowJourney) => {
      updateFlow((prev) => {
        const updatedJourneys = [...prev.journeys]
        updatedJourneys[index] = updatedJourney
        return { ...prev, journeys: updatedJourneys }
      })
    },
    [updateFlow]
  )

  const handleAddJourney = useCallback(() => {
    const journeyNum = journeys.length + 1
    const newJourney: FlowJourney = {
      id: `j${journeyNum}`,
      label: `Journey ${journeyNum}`,
      description: 'Journey description',
      steps: [],
    }
    updateFlow((prev) => ({
      ...prev,
      journeys: [...prev.journeys, newJourney],
    }))
  }, [journeys.length, updateFlow])

  const handleRemoveJourney = useCallback(
    (index: number) => {
      updateFlow((prev) => ({
        ...prev,
        journeys: prev.journeys.filter((_: FlowJourney, i: number) => i !== index),
      }))
    },
    [updateFlow]
  )

  // Collect all selectable step IDs (top-level linear step IDs and branch option IDs)
  const allSelectableSteps: Array<{ id: string; label: string }> = []
  steps.forEach((s) => {
    if (s.type === 'linear') {
      allSelectableSteps.push({ id: s.id, label: `${s.id} (Linear Step)` })
    } else if (s.type === 'branch') {
      const branchStep = s as BranchStep
      allSelectableSteps.push({ id: s.id, label: `${s.id} (Branch Step root)` })
      ;(branchStep.branches || []).forEach((b) => {
        allSelectableSteps.push({ id: b.id, label: `  ↳ ${b.id} (${b.label || 'Branch Path'})` })
      })
    }
  })

  return (
    <div className="visual-form flowchart-form-editor" data-testid="flowchart-form-editor">
      {/* Flowchart Sub-Tabs Header */}
      <div className="flowchart-sub-tabs" data-testid="flowchart-sub-tabs">
        <button
          className={`flowchart-sub-tab ${activeSubTab === 'steps' ? 'active' : ''}`}
          data-testid="flowchart-tab-steps"
          onClick={() => setActiveSubTab('steps')}
          type="button"
        >
          <GitCommit size={14} />
          <span>Steps</span>
          <span className="sub-tab-badge">{steps.length}</span>
        </button>
        <button
          className={`flowchart-sub-tab ${activeSubTab === 'actors' ? 'active' : ''}`}
          data-testid="flowchart-tab-actors"
          onClick={() => setActiveSubTab('actors')}
          type="button"
        >
          <Users size={14} />
          <span>Actors</span>
          <span className="sub-tab-badge">{Object.keys(actors).length}</span>
        </button>
        <button
          className={`flowchart-sub-tab ${activeSubTab === 'systems' ? 'active' : ''}`}
          data-testid="flowchart-tab-systems"
          onClick={() => setActiveSubTab('systems')}
          type="button"
        >
          <Server size={14} />
          <span>Systems</span>
          <span className="sub-tab-badge">{Object.keys(systems).length}</span>
        </button>
        <button
          className={`flowchart-sub-tab ${activeSubTab === 'journeys' ? 'active' : ''}`}
          data-testid="flowchart-tab-journeys"
          onClick={() => setActiveSubTab('journeys')}
          type="button"
        >
          <Compass size={14} />
          <span>Journeys</span>
          <span className="sub-tab-badge">{journeys.length}</span>
        </button>

        <button
          className="flowchart-help-btn"
          onClick={() => setIsHelpOpen(true)}
          data-testid="flowchart-editor-help-btn"
          type="button"
          style={{ marginLeft: 'auto' }}
          title="Flowchart & Event Storming Concepts Guide"
        >
          <HelpCircle size={13} />
          <span>Guide</span>
        </button>
      </div>

      <FlowchartHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* --- ACTORS SUB-TAB --- */}
      {activeSubTab === 'actors' && (
        <div className="flowchart-tab-content" data-testid="flowchart-content-actors">
          <div className="visual-form-field visual-form-field--array">
            <div className="visual-form-section-header">
              <OUIFieldKey of={OUI.Flowchart} field="actors">Declared Actors ({Object.keys(actors).length})</OUIFieldKey>
              <button
                className="form-add-btn"
                onClick={handleAddActor}
                data-testid="flowchart-add-actor"
                type="button"
              >
                <Plus size={13} /> Add Actor
              </button>
            </div>

            <div className="visual-form-object-list">
              {Object.entries(actors).map(([key, actor], idx) => (
                <div className="visual-form-card" key={key} data-testid={`flowchart-actor-${key}`}>
                  <div className="visual-form-card-header">
                    <span className="card-header-title">
                      <Users size={13} /> Actor #{idx + 1}: <code className="card-code-pill">{key}</code>
                    </span>
                    <button
                      className="form-remove-btn"
                      onClick={() => handleRemoveActor(key)}
                      data-testid={`flowchart-actor-remove-${key}`}
                      type="button"
                      title="Remove actor"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="visual-form-card-body">
                    <div className="visual-form-grid-2">
                      <div className="visual-form-field">
                        <label className="visual-form-label">
                          <OUIFieldKey of={OUI.Actor} field="id">ID / Key</OUIFieldKey>
                          <input
                            className="visual-form-input"
                            value={key}
                            onChange={(e) => handleActorKeyChange(key, e.target.value)}
                            data-testid={`flowchart-actor-${key}-key`}
                          />
                        </label>
                      </div>
                      <div className="visual-form-field">
                        <label className="visual-form-label">
                          <OUIFieldKey of={OUI.Actor} field="title">Title</OUIFieldKey>
                          <input
                            className="visual-form-input"
                            value={actor.title}
                            onChange={(e) => handleActorChange(key, { ...actor, title: e.target.value })}
                            data-testid={`flowchart-actor-${key}-title`}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="visual-form-field">
                      <label className="visual-form-label">
                        <OUIFieldKey of={OUI.Actor} field="desc">Description</OUIFieldKey>
                        <input
                          className="visual-form-input"
                          value={actor.desc}
                          onChange={(e) => handleActorChange(key, { ...actor, desc: e.target.value })}
                          data-testid={`flowchart-actor-${key}-desc`}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- SYSTEMS SUB-TAB --- */}
      {activeSubTab === 'systems' && (
        <div className="flowchart-tab-content" data-testid="flowchart-content-systems">
          <div className="visual-form-field visual-form-field--array">
            <div className="visual-form-section-header">
              <OUIFieldKey of={OUI.Flowchart} field="systems">Declared Systems ({Object.keys(systems).length})</OUIFieldKey>
              <button
                className="form-add-btn"
                onClick={handleAddSystem}
                data-testid="flowchart-add-system"
                type="button"
              >
                <Plus size={13} /> Add System
              </button>
            </div>

            <div className="visual-form-object-list">
              {Object.entries(systems).map(([key, sys], idx) => (
                <div className="visual-form-card" key={key} data-testid={`flowchart-system-${key}`}>
                  <div className="visual-form-card-header">
                    <span className="card-header-title">
                      <Server size={13} /> System #{idx + 1}: <code className="card-code-pill">{key}</code>
                    </span>
                    <button
                      className="form-remove-btn"
                      onClick={() => handleRemoveSystem(key)}
                      data-testid={`flowchart-system-remove-${key}`}
                      type="button"
                      title="Remove system"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="visual-form-card-body">
                    <div className="visual-form-grid-3">
                      <div className="visual-form-field">
                        <label className="visual-form-label">
                          <OUIFieldKey of={OUI.System} field="id">ID / Key</OUIFieldKey>
                          <input
                            className="visual-form-input"
                            value={key}
                            onChange={(e) => handleSystemKeyChange(key, e.target.value)}
                            data-testid={`flowchart-system-${key}-key`}
                          />
                        </label>
                      </div>
                      <div className="visual-form-field">
                        <label className="visual-form-label">
                          <OUIFieldKey of={OUI.System} field="title">Title</OUIFieldKey>
                          <input
                            className="visual-form-input"
                            value={sys.title}
                            onChange={(e) => handleSystemChange(key, { ...sys, title: e.target.value })}
                            data-testid={`flowchart-system-${key}-title`}
                          />
                        </label>
                      </div>
                      <div className="visual-form-field">
                        <label className="visual-form-label">
                          <OUIFieldKey of={OUI.System} field="kind">System Type</OUIFieldKey>
                          <select
                            className="visual-form-select"
                            value={sys.type}
                            onChange={(e) =>
                              handleSystemChange(key, {
                                ...sys,
                                type: e.target.value as 'aggregate' | 'external',
                              })
                            }
                            data-testid={`flowchart-system-${key}-type`}
                          >
                            <option value="aggregate">Aggregate</option>
                            <option value="external">External</option>
                          </select>
                        </label>
                      </div>
                    </div>
                    <div className="visual-form-field">
                      <label className="visual-form-label">
                        <OUIFieldKey of={OUI.System} field="desc">Description</OUIFieldKey>
                        <input
                          className="visual-form-input"
                          value={sys.desc}
                          onChange={(e) => handleSystemChange(key, { ...sys, desc: e.target.value })}
                          data-testid={`flowchart-system-${key}-desc`}
                        />
                      </label>
                    </div>

                    {/* --- System State Machine Section --- */}
                    <div className="visual-form-field visual-form-field--sub">
                      <div className="visual-form-section-header">
                        <OUIFieldKey of={OUI.System} field="stateMachine">
                          State Machine ({sys.stateMachine ? `${sys.stateMachine.states.length} states` : 'Disabled'})
                        </OUIFieldKey>
                        <button
                          className="form-add-btn form-add-btn--sm"
                          onClick={() => handleToggleStateMachine(key)}
                          data-testid={`flowchart-system-${key}-toggle-sm`}
                          type="button"
                        >
                          {sys.stateMachine ? 'Disable State Machine' : 'Enable State Machine'}
                        </button>
                      </div>

                      {sys.stateMachine && (
                        <div className="visual-form-card visual-form-card--sub">
                          <div className="visual-form-grid-2">
                            <div className="visual-form-field">
                              <label className="visual-form-label">
                                <OUIFieldKey of={OUI.StateMachine} field="initialState">Initial State ID</OUIFieldKey>
                                <select
                                  className="visual-form-select"
                                  value={sys.stateMachine.initialState}
                                  onChange={(e) =>
                                    handleSystemChange(key, {
                                      ...sys,
                                      stateMachine: {
                                        ...sys.stateMachine!,
                                        initialState: e.target.value,
                                      },
                                    })
                                  }
                                  data-testid={`flowchart-system-${key}-initial-state`}
                                >
                                  {sys.stateMachine.states.map((st) => (
                                    <option key={st.id} value={st.id}>
                                      {st.id} ({st.label})
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                            <div className="visual-form-field">
                              <div className="visual-form-section-header" style={{ marginBottom: 0 }}>
                                <OUIFieldKey of={OUI.StateMachine} field="states">States ({sys.stateMachine.states.length})</OUIFieldKey>
                                <button
                                  className="form-add-btn form-add-btn--sm"
                                  onClick={() => handleAddSystemState(key)}
                                  data-testid={`flowchart-system-${key}-add-state`}
                                  type="button"
                                >
                                  <Plus size={12} /> Add State
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="visual-form-object-list" style={{ marginTop: '8px' }}>
                            {sys.stateMachine.states.map((st, stIdx) => (
                              <div
                                className="visual-form-card visual-form-card--sub"
                                key={st.id || stIdx}
                                data-testid={`flowchart-system-${key}-state-${stIdx}`}
                              >
                                <div className="visual-form-card-header">
                                  <span className="card-header-title">
                                    State #{stIdx + 1}: <code className="card-code-pill">{st.id}</code>
                                  </span>
                                  <button
                                    className="form-remove-btn"
                                    onClick={() => handleRemoveSystemState(key, stIdx)}
                                    data-testid={`flowchart-system-${key}-state-remove-${stIdx}`}
                                    type="button"
                                    title="Remove state"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                <div className="visual-form-grid-3">
                                  <input
                                    className="visual-form-input"
                                    value={st.id}
                                    onChange={(e) => {
                                      const updatedStates = [...sys.stateMachine!.states]
                                      updatedStates[stIdx] = { ...st, id: e.target.value }
                                      handleSystemChange(key, {
                                        ...sys,
                                        stateMachine: {
                                          ...sys.stateMachine!,
                                          states: updatedStates,
                                        },
                                      })
                                    }}
                                    placeholder="State ID"
                                    data-testid={`flowchart-system-${key}-state-${stIdx}-id`}
                                  />
                                  <input
                                    className="visual-form-input"
                                    value={st.label}
                                    onChange={(e) => {
                                      const updatedStates = [...sys.stateMachine!.states]
                                      updatedStates[stIdx] = { ...st, label: e.target.value }
                                      handleSystemChange(key, {
                                        ...sys,
                                        stateMachine: {
                                          ...sys.stateMachine!,
                                          states: updatedStates,
                                        },
                                      })
                                    }}
                                    placeholder="Label"
                                    data-testid={`flowchart-system-${key}-state-${stIdx}-label`}
                                  />
                                  <input
                                    className="visual-form-input"
                                    value={st.color}
                                    onChange={(e) => {
                                      const updatedStates = [...sys.stateMachine!.states]
                                      updatedStates[stIdx] = { ...st, color: e.target.value }
                                      handleSystemChange(key, {
                                        ...sys,
                                        stateMachine: {
                                          ...sys.stateMachine!,
                                          states: updatedStates,
                                        },
                                      })
                                    }}
                                    placeholder="Color (var(--ctp-...))"
                                    data-testid={`flowchart-system-${key}-state-${stIdx}-color`}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- STEPS SUB-TAB --- */}
      {activeSubTab === 'steps' && (
        <div className="flowchart-tab-content" data-testid="flowchart-content-steps">
          <div className="visual-form-field visual-form-field--array">
            <div className="visual-form-section-header">
              <OUIFieldKey of={OUI.Flowchart} field="steps">Flow Steps ({steps.length})</OUIFieldKey>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="form-add-btn"
                  onClick={() => handleAddStep('linear')}
                  data-testid="flowchart-add-step"
                  type="button"
                >
                  <Plus size={13} /> Add Linear Step
                </button>
                <button
                  className="form-add-btn"
                  onClick={() => handleAddStep('branch')}
                  data-testid="flowchart-add-branch-step"
                  type="button"
                >
                  <GitBranch size={13} /> Add Branch Step
                </button>
              </div>
            </div>

            <div className="visual-form-object-list">
              {steps.map((step, idx) => {
                const isLinear = step.type === 'linear'
                const linearStep = isLinear ? (step as LinearStep) : null
                const branchStep = !isLinear ? (step as BranchStep) : null

                return (
                  <div className="visual-form-card" key={step.id || idx} data-testid={`flowchart-step-${idx}`}>
                    <div className="visual-form-card-header">
                      <span className="card-header-title">
                        {isLinear ? <GitCommit size={13} /> : <GitBranch size={13} />} Step #{idx + 1}:{' '}
                        <code className="card-code-pill">{step.id}</code> ({step.type})
                      </span>
                      <button
                        className="form-remove-btn"
                        onClick={() => handleRemoveStep(idx)}
                        data-testid={`flowchart-step-remove-${idx}`}
                        type="button"
                        title="Remove step"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="visual-form-card-body">
                      <div className="visual-form-grid-3">
                        <div className="visual-form-field">
                          <label className="visual-form-label">
                            <OUIFieldKey of={OUI.Step} field="id">Step ID</OUIFieldKey>
                            <input
                              className="visual-form-input"
                              value={step.id}
                              onChange={(e) =>
                                handleStepChange(idx, { ...step, id: e.target.value })
                              }
                              data-testid={`flowchart-step-${idx}-id`}
                            />
                          </label>
                        </div>

                        <div className="visual-form-field">
                          <label className="visual-form-label">
                            <span className="visual-form-key">Step Type</span>
                            <select
                              className="visual-form-select"
                              value={step.type}
                              onChange={(e) =>
                                handleToggleStepType(idx, e.target.value as 'linear' | 'branch')
                              }
                              data-testid={`flowchart-step-${idx}-type`}
                            >
                              <option value="linear">Linear Step</option>
                              <option value="branch">Branch Step</option>
                            </select>
                          </label>
                        </div>

                        <div className="visual-form-field">
                          <label className="visual-form-label">
                            <OUIFieldKey of={OUI.Step} field="continuesAs">Continues As (Next Step)</OUIFieldKey>
                            <select
                              className="visual-form-select"
                              value={step.continuesAs || ''}
                              onChange={(e) =>
                                handleStepChange(idx, {
                                  ...step,
                                  continuesAs: e.target.value || undefined,
                                })
                              }
                              data-testid={`flowchart-step-${idx}-continuesAs`}
                            >
                              <option value="">(none - terminal step)</option>
                              {steps.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.id}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </div>

                      {/* --- LINEAR STEP EDITING --- */}
                      {isLinear && linearStep && (
                        <>
                          <div className="visual-form-grid-2">
                            <div className="visual-form-field">
                              <label className="visual-form-label">
                                <OUIFieldKey of={OUI.Step} field="policy">Policy</OUIFieldKey>
                                <input
                                  className="visual-form-input"
                                  value={linearStep.policy}
                                  onChange={(e) =>
                                    handleStepChange(idx, {
                                      ...linearStep,
                                      policy: e.target.value,
                                    })
                                  }
                                  data-testid={`flowchart-step-${idx}-policy`}
                                />
                              </label>
                            </div>
                            <div className="visual-form-field">
                              <label className="visual-form-label">
                                <OUIFieldKey of={OUI.Step} field="command">Command</OUIFieldKey>
                                <input
                                  className="visual-form-input"
                                  value={linearStep.command}
                                  onChange={(e) =>
                                    handleStepChange(idx, {
                                      ...linearStep,
                                      command: e.target.value,
                                    })
                                  }
                                  data-testid={`flowchart-step-${idx}-command`}
                                />
                              </label>
                            </div>
                          </div>

                          <div className="visual-form-field">
                            <label className="visual-form-label">
                              <OUIFieldKey of={OUI.Step} field="description">Description (Optional)</OUIFieldKey>
                              <input
                                className="visual-form-input"
                                value={linearStep.description || ''}
                                onChange={(e) =>
                                  handleStepChange(idx, {
                                    ...linearStep,
                                    description: e.target.value || undefined,
                                  })
                                }
                                placeholder="Step description"
                                data-testid={`flowchart-step-${idx}-desc`}
                              />
                            </label>
                          </div>

                          <div className="visual-form-grid-3">
                            <div className="visual-form-field">
                              <label className="visual-form-label">
                                <OUIFieldKey of={OUI.Step} field="initiatedBy">Initiated By (Actor)</OUIFieldKey>
                                <select
                                  className="visual-form-select"
                                  value={linearStep.initiatedBy?.id || ''}
                                  onChange={(e) =>
                                    handleStepChange(idx, {
                                      ...linearStep,
                                      initiatedBy: e.target.value
                                        ? ref(e.target.value)
                                        : undefined,
                                    })
                                  }
                                  data-testid={`flowchart-step-${idx}-initiatedBy`}
                                >
                                  <option value="">(none - unassigned)</option>
                                  {Object.keys(actors).map((actorKey) => (
                                    <option key={actorKey} value={actorKey}>
                                      {actorKey} ({actors[actorKey]?.title || actorKey})
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                            <div className="visual-form-field">
                              <label className="visual-form-label">
                                <OUIFieldKey of={OUI.Step} field="handledBy">Handled By (System)</OUIFieldKey>
                                <select
                                  className="visual-form-select"
                                  value={linearStep.handledBy?.id || ''}
                                  onChange={(e) =>
                                    handleStepChange(idx, {
                                      ...linearStep,
                                      handledBy: e.target.value ? ref(e.target.value) : undefined,
                                    })
                                  }
                                  data-testid={`flowchart-step-${idx}-handledBy`}
                                >
                                  <option value="">(none - no system runs it)</option>
                                  {Object.keys(systems).map((sysKey) => (
                                    <option key={sysKey} value={sysKey}>
                                      {sysKey} ({systems[sysKey]?.title || sysKey})
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                            <div className="visual-form-field">
                              <label className="visual-form-label">
                                <OUIFieldKey of={OUI.Step} field="delegatesTo">Delegates To (Secondary)</OUIFieldKey>
                                <select
                                  className="visual-form-select"
                                  value={linearStep.delegatesTo?.id || ''}
                                  onChange={(e) =>
                                    handleStepChange(idx, {
                                      ...linearStep,
                                      delegatesTo: e.target.value
                                        ? ref(e.target.value)
                                        : undefined,
                                    })
                                  }
                                  data-testid={`flowchart-step-${idx}-delegatesTo`}
                                >
                                  <option value="">(none)</option>
                                  {Object.keys(systems).map((sysKey) => (
                                    <option key={sysKey} value={sysKey}>
                                      {sysKey} ({systems[sysKey]?.title || sysKey})
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                            <div className="visual-form-field">
                              <label className="visual-form-label">
                                <OUIFieldKey of={OUI.Step} field="sendsTo">Sends To (Recipient)</OUIFieldKey>
                                <select
                                  className="visual-form-select"
                                  value={linearStep.sendsTo?.id || ''}
                                  onChange={(e) =>
                                    handleStepChange(idx, {
                                      ...linearStep,
                                      sendsTo: e.target.value ? ref(e.target.value) : undefined,
                                    })
                                  }
                                  data-testid={`flowchart-step-${idx}-sendsTo`}
                                >
                                  <option value="">(none - nothing is sent)</option>
                                  {[...Object.keys(actors), ...Object.keys(systems)].map((key) => (
                                    <option key={key} value={key}>
                                      {key} ({actors[key]?.title || systems[key]?.title || key})
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          </div>

                          {/* Result Events List */}
                          <div className="visual-form-field">
                            <div className="visual-form-section-header">
                              <OUIFieldKey of={OUI.Step} field="events">
                                Result Events ({(linearStep.resultEvents || []).length})
                              </OUIFieldKey>
                              <button
                                className="form-add-btn form-add-btn--sm"
                                onClick={() => handleAddLinearResultEvent(idx)}
                                data-testid={`flowchart-step-${idx}-add-evt`}
                                type="button"
                              >
                                <Plus size={12} /> Add Event
                              </button>
                            </div>
                            <div className="visual-form-object-list">
                              {(linearStep.resultEvents || []).map((evt, eIdx) => (
                                <div
                                  className="visual-form-card visual-form-card--sub"
                                  key={evt.id || eIdx}
                                  data-testid={`flowchart-step-${idx}-evt-${eIdx}`}
                                >
                                  <div className="visual-form-card-header">
                                    <span className="card-header-title">
                                      Event #{eIdx + 1}: <code className="card-code-pill">{evt.id}</code>
                                    </span>
                                    <button
                                      className="form-remove-btn"
                                      onClick={() => handleRemoveLinearResultEvent(idx, eIdx)}
                                      data-testid={`flowchart-step-${idx}-evt-remove-${eIdx}`}
                                      type="button"
                                      title="Remove event"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                  <div className="visual-form-grid-3">
                                    <input
                                      className="visual-form-input"
                                      value={evt.id}
                                      onChange={(e) => {
                                        const newEvts = [...linearStep.resultEvents]
                                        newEvts[eIdx] = { ...evt, id: e.target.value }
                                        handleStepChange(idx, {
                                          ...linearStep,
                                          resultEvents: newEvts,
                                        })
                                      }}
                                      placeholder="Event ID"
                                      data-testid={`flowchart-step-${idx}-evt-${eIdx}-id`}
                                    />
                                    <input
                                      className="visual-form-input"
                                      value={evt.title}
                                      onChange={(e) => {
                                        const newEvts = [...linearStep.resultEvents]
                                        newEvts[eIdx] = { ...evt, title: e.target.value }
                                        handleStepChange(idx, {
                                          ...linearStep,
                                          resultEvents: newEvts,
                                        })
                                      }}
                                      placeholder="Event Title"
                                      data-testid={`flowchart-step-${idx}-evt-${eIdx}-title`}
                                    />
                                    <input
                                      className="visual-form-input"
                                      value={evt.desc || ''}
                                      onChange={(e) => {
                                        const newEvts = [...linearStep.resultEvents]
                                        newEvts[eIdx] = { ...evt, desc: e.target.value || undefined }
                                        handleStepChange(idx, {
                                          ...linearStep,
                                          resultEvents: newEvts,
                                        })
                                      }}
                                      placeholder="Event Description (optional)"
                                      data-testid={`flowchart-step-${idx}-evt-${eIdx}-desc`}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* --- BRANCH STEP EDITING --- */}
                      {!isLinear && branchStep && (
                        <>
                          <div className="visual-form-grid-2">
                            <div className="visual-form-field">
                              <label className="visual-form-label">
                                <OUIFieldKey of={OUI.Branch} field="event">Triggering Event ID</OUIFieldKey>
                                <input
                                  className="visual-form-input"
                                  value={branchStep.event || ''}
                                  onChange={(e) =>
                                    handleStepChange(idx, {
                                      ...branchStep,
                                      event: e.target.value,
                                    })
                                  }
                                  placeholder="Event triggering branch (e.g. reasoned)"
                                  data-testid={`flowchart-step-${idx}-event`}
                                />
                              </label>
                            </div>
                          </div>

                          {/* Branch Options List */}
                          <div className="visual-form-field">
                            <div className="visual-form-section-header">
                              <OUIFieldKey of={OUI.Branch} field="options">
                                Branch Paths ({(branchStep.branches || []).length})
                              </OUIFieldKey>
                              <button
                                className="form-add-btn form-add-btn--sm"
                                onClick={() => handleAddBranchOption(idx)}
                                data-testid={`flowchart-step-${idx}-add-branch-opt`}
                                type="button"
                              >
                                <Plus size={12} /> Add Branch Path
                              </button>
                            </div>

                            <div className="visual-form-object-list">
                              {(branchStep.branches || []).map((bOpt, bIdx) => (
                                <div
                                  className="visual-form-card visual-form-card--sub"
                                  key={bOpt.id || bIdx}
                                  data-testid={`flowchart-step-${idx}-branch-${bIdx}`}
                                >
                                  <div className="visual-form-card-header">
                                    <span className="card-header-title">
                                      <GitBranch size={13} /> Path #{bIdx + 1}:{' '}
                                      <code className="card-code-pill">{bOpt.id}</code> ({bOpt.label || 'Branch'})
                                    </span>
                                    <button
                                      className="form-remove-btn"
                                      onClick={() => handleRemoveBranchOption(idx, bIdx)}
                                      data-testid={`flowchart-step-${idx}-branch-remove-${bIdx}`}
                                      type="button"
                                      title="Remove branch path"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>

                                  <div className="visual-form-card-body">
                                    <div className="visual-form-grid-3">
                                      <div className="visual-form-field">
                                        <label className="visual-form-label">
                                          <OUIFieldKey of={OUI.BranchOption} field="id">Path ID</OUIFieldKey>
                                          <input
                                            className="visual-form-input"
                                            value={bOpt.id}
                                            onChange={(e) =>
                                              handleBranchOptionChange(idx, bIdx, {
                                                ...bOpt,
                                                id: e.target.value,
                                              })
                                            }
                                            data-testid={`flowchart-step-${idx}-branch-${bIdx}-id`}
                                          />
                                        </label>
                                      </div>
                                      <div className="visual-form-field">
                                        <label className="visual-form-label">
                                          <OUIFieldKey of={OUI.BranchOption} field="label">Label</OUIFieldKey>
                                          <input
                                            className="visual-form-input"
                                            value={bOpt.label}
                                            onChange={(e) =>
                                              handleBranchOptionChange(idx, bIdx, {
                                                ...bOpt,
                                                label: e.target.value,
                                              })
                                            }
                                            placeholder="Label on edge"
                                            data-testid={`flowchart-step-${idx}-branch-${bIdx}-label`}
                                          />
                                        </label>
                                      </div>
                                      <div className="visual-form-field">
                                        <label className="visual-form-label" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
                                          <input
                                            type="checkbox"
                                            checked={!!bOpt.dashed}
                                            onChange={(e) =>
                                              handleBranchOptionChange(idx, bIdx, {
                                                ...bOpt,
                                                dashed: e.target.checked,
                                              })
                                            }
                                            data-testid={`flowchart-step-${idx}-branch-${bIdx}-dashed`}
                                          />
                                          <OUIFieldKey of={OUI.BranchOption} field="dashed">Dashed Line</OUIFieldKey>
                                        </label>
                                      </div>
                                    </div>

                                    <div className="visual-form-grid-2">
                                      <div className="visual-form-field">
                                        <label className="visual-form-label">
                                          <OUIFieldKey of={OUI.BranchOption} field="policy">Policy</OUIFieldKey>
                                          <input
                                            className="visual-form-input"
                                            value={bOpt.policy}
                                            onChange={(e) =>
                                              handleBranchOptionChange(idx, bIdx, {
                                                ...bOpt,
                                                policy: e.target.value,
                                              })
                                            }
                                            data-testid={`flowchart-step-${idx}-branch-${bIdx}-policy`}
                                          />
                                        </label>
                                      </div>
                                      <div className="visual-form-field">
                                        <label className="visual-form-label">
                                          <OUIFieldKey of={OUI.BranchOption} field="command">Command</OUIFieldKey>
                                          <input
                                            className="visual-form-input"
                                            value={bOpt.command}
                                            onChange={(e) =>
                                              handleBranchOptionChange(idx, bIdx, {
                                                ...bOpt,
                                                command: e.target.value,
                                              })
                                            }
                                            data-testid={`flowchart-step-${idx}-branch-${bIdx}-command`}
                                          />
                                        </label>
                                      </div>
                                    </div>

                                    <div className="visual-form-grid-3">
                                      <div className="visual-form-field">
                                        <label className="visual-form-label">
                                          <OUIFieldKey of={OUI.BranchOption} field="handledBy">Handled By (System)</OUIFieldKey>
                                          <select
                                            className="visual-form-select"
                                            value={bOpt.handledBy?.id || ''}
                                            onChange={(e) =>
                                              handleBranchOptionChange(idx, bIdx, {
                                                ...bOpt,
                                                handledBy: e.target.value ? ref(e.target.value) : undefined,
                                              })
                                            }
                                            data-testid={`flowchart-step-${idx}-branch-${bIdx}-handledBy`}
                                          >
                                            <option value="">(none - no system runs it)</option>
                                            {Object.keys(systems).map((sysKey) => (
                                              <option key={sysKey} value={sysKey}>
                                                {sysKey} ({systems[sysKey]?.title || sysKey})
                                              </option>
                                            ))}
                                          </select>
                                        </label>
                                      </div>
                                      <div className="visual-form-field">
                                        <label className="visual-form-label">
                                          <OUIFieldKey of={OUI.BranchOption} field="delegatesTo">Delegates To (Secondary)</OUIFieldKey>
                                          <select
                                            className="visual-form-select"
                                            value={bOpt.delegatesTo?.id || ''}
                                            onChange={(e) =>
                                              handleBranchOptionChange(idx, bIdx, {
                                                ...bOpt,
                                                delegatesTo: e.target.value ? ref(e.target.value) : undefined,
                                              })
                                            }
                                            data-testid={`flowchart-step-${idx}-branch-${bIdx}-delegatesTo`}
                                          >
                                            <option value="">(none)</option>
                                            {Object.keys(systems).map((sysKey) => (
                                              <option key={sysKey} value={sysKey}>
                                                {sysKey} ({systems[sysKey]?.title || sysKey})
                                              </option>
                                            ))}
                                          </select>
                                        </label>
                                      </div>
                                      <div className="visual-form-field">
                                        <label className="visual-form-label">
                                          <OUIFieldKey of={OUI.BranchOption} field="sendsTo">Sends To (Recipient)</OUIFieldKey>
                                          <select
                                            className="visual-form-select"
                                            value={bOpt.sendsTo?.id || ''}
                                            onChange={(e) =>
                                              handleBranchOptionChange(idx, bIdx, {
                                                ...bOpt,
                                                sendsTo: e.target.value ? ref(e.target.value) : undefined,
                                              })
                                            }
                                            data-testid={`flowchart-step-${idx}-branch-${bIdx}-sendsTo`}
                                          >
                                            <option value="">(none - nothing is sent)</option>
                                            {[...Object.keys(actors), ...Object.keys(systems)].map((key) => (
                                              <option key={key} value={key}>
                                                {key} ({actors[key]?.title || systems[key]?.title || key})
                                              </option>
                                            ))}
                                          </select>
                                        </label>
                                      </div>
                                      <div className="visual-form-field">
                                        <label className="visual-form-label">
                                          <OUIFieldKey of={OUI.BranchOption} field="continuesAs">Continues As (Next Step)</OUIFieldKey>
                                          <select
                                            className="visual-form-select"
                                            value={bOpt.continuesAs || ''}
                                            onChange={(e) =>
                                              handleBranchOptionChange(idx, bIdx, {
                                                ...bOpt,
                                                continuesAs: e.target.value || undefined,
                                              })
                                            }
                                            data-testid={`flowchart-step-${idx}-branch-${bIdx}-continuesAs`}
                                          >
                                            <option value="">(none)</option>
                                            {steps.map((s) => (
                                              <option key={s.id} value={s.id}>
                                                {s.id}
                                              </option>
                                            ))}
                                          </select>
                                        </label>
                                      </div>
                                    </div>

                                    {/* Branch Result Events */}
                                    <div className="visual-form-field">
                                      <div className="visual-form-section-header">
                                        <OUIFieldKey of={OUI.BranchOption} field="events">
                                          Result Events ({(bOpt.resultEvents || []).length})
                                        </OUIFieldKey>
                                        <button
                                          className="form-add-btn form-add-btn--sm"
                                          onClick={() => handleAddBranchResultEvent(idx, bIdx)}
                                          data-testid={`flowchart-step-${idx}-branch-${bIdx}-add-evt`}
                                          type="button"
                                        >
                                          <Plus size={12} /> Add Event
                                        </button>
                                      </div>

                                      <div className="visual-form-object-list">
                                        {(bOpt.resultEvents || []).map((evt, eIdx) => (
                                          <div
                                            className="visual-form-card visual-form-card--sub"
                                            key={evt.id || eIdx}
                                            data-testid={`flowchart-step-${idx}-branch-${bIdx}-evt-${eIdx}`}
                                          >
                                            <div className="visual-form-card-header">
                                              <span className="card-header-title">
                                                Event #{eIdx + 1}: <code className="card-code-pill">{evt.id}</code>
                                              </span>
                                              <button
                                                className="form-remove-btn"
                                                onClick={() => handleRemoveBranchResultEvent(idx, bIdx, eIdx)}
                                                data-testid={`flowchart-step-${idx}-branch-${bIdx}-evt-remove-${eIdx}`}
                                                type="button"
                                                title="Remove event"
                                              >
                                                <Trash2 size={12} />
                                              </button>
                                            </div>
                                            <div className="visual-form-grid-3">
                                              <input
                                                className="visual-form-input"
                                                value={evt.id}
                                                onChange={(e) => {
                                                  const newEvts = [...bOpt.resultEvents]
                                                  newEvts[eIdx] = { ...evt, id: e.target.value }
                                                  handleBranchOptionChange(idx, bIdx, {
                                                    ...bOpt,
                                                    resultEvents: newEvts,
                                                  })
                                                }}
                                                placeholder="Event ID"
                                                data-testid={`flowchart-step-${idx}-branch-${bIdx}-evt-${eIdx}-id`}
                                              />
                                              <input
                                                className="visual-form-input"
                                                value={evt.title}
                                                onChange={(e) => {
                                                  const newEvts = [...bOpt.resultEvents]
                                                  newEvts[eIdx] = { ...evt, title: e.target.value }
                                                  handleBranchOptionChange(idx, bIdx, {
                                                    ...bOpt,
                                                    resultEvents: newEvts,
                                                  })
                                                }}
                                                placeholder="Event Title"
                                                data-testid={`flowchart-step-${idx}-branch-${bIdx}-evt-${eIdx}-title`}
                                              />
                                              <input
                                                className="visual-form-input"
                                                value={evt.desc || ''}
                                                onChange={(e) => {
                                                  const newEvts = [...bOpt.resultEvents]
                                                  newEvts[eIdx] = { ...evt, desc: e.target.value || undefined }
                                                  handleBranchOptionChange(idx, bIdx, {
                                                    ...bOpt,
                                                    resultEvents: newEvts,
                                                  })
                                                }}
                                                placeholder="Event Description (optional)"
                                                data-testid={`flowchart-step-${idx}-branch-${bIdx}-evt-${eIdx}-desc`}
                                              />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- JOURNEYS SUB-TAB --- */}
      {activeSubTab === 'journeys' && (
        <div className="flowchart-tab-content" data-testid="flowchart-content-journeys">
          <div className="visual-form-field visual-form-field--array">
            <div className="visual-form-section-header">
              <OUIFieldKey of={OUI.Flowchart} field="journeys">Flow Journeys ({journeys.length})</OUIFieldKey>
              <button
                className="form-add-btn"
                onClick={handleAddJourney}
                data-testid="flowchart-add-journey"
                type="button"
              >
                <Plus size={13} /> Add Journey
              </button>
            </div>

            <div className="visual-form-object-list">
              {journeys.map((j: FlowJourney, idx: number) => (
                <div className="visual-form-card" key={j.id || idx} data-testid={`flowchart-journey-${idx}`}>
                  <div className="visual-form-card-header">
                    <span className="card-header-title">
                      <Compass size={13} /> Journey #{idx + 1}: <code className="card-code-pill">{j.id}</code>
                    </span>
                    <button
                      className="form-remove-btn"
                      onClick={() => handleRemoveJourney(idx)}
                      data-testid={`flowchart-journey-remove-${idx}`}
                      type="button"
                      title="Remove journey"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="visual-form-card-body">
                    <div className="visual-form-grid-2">
                      <div className="visual-form-field">
                        <label className="visual-form-label">
                          <OUIFieldKey of={OUI.Journey} field="id">ID</OUIFieldKey>
                          <input
                            className="visual-form-input"
                            value={j.id}
                            onChange={(e) =>
                              handleJourneyChange(idx, { ...j, id: e.target.value })
                            }
                            data-testid={`flowchart-journey-${idx}-id`}
                          />
                        </label>
                      </div>
                      <div className="visual-form-field">
                        <label className="visual-form-label">
                          <OUIFieldKey of={OUI.Journey} field="label">Label</OUIFieldKey>
                          <input
                            className="visual-form-input"
                            value={j.label}
                            onChange={(e) =>
                              handleJourneyChange(idx, { ...j, label: e.target.value })
                            }
                            data-testid={`flowchart-journey-${idx}-label`}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="visual-form-field">
                      <label className="visual-form-label">
                        <OUIFieldKey of={OUI.Journey} field="description">Description</OUIFieldKey>
                        <input
                          className="visual-form-input"
                          value={j.description}
                          onChange={(e) =>
                            handleJourneyChange(idx, { ...j, description: e.target.value })
                          }
                          data-testid={`flowchart-journey-${idx}-desc`}
                        />
                      </label>
                    </div>

                    {/* Journey Steps List */}
                    <div className="visual-form-field">
                      <div className="visual-form-section-header">
                        <OUIFieldKey of={OUI.Journey} field="steps">Journey Steps ({j.steps.length})</OUIFieldKey>
                        <button
                          className="form-add-btn form-add-btn--sm"
                          onClick={() => {
                            const firstSelectableId = allSelectableSteps[0]?.id || 'step_1'
                            const newJStep: JourneyStepRef = {
                              stepId: firstSelectableId,
                              name: `Step ${j.steps.length + 1}`,
                              description: 'Step explanation',
                            }
                            handleJourneyChange(idx, {
                              ...j,
                              steps: [...j.steps, newJStep],
                            })
                          }}
                          data-testid={`flowchart-journey-${idx}-add-step`}
                          type="button"
                        >
                          <Plus size={12} /> Add Step Ref
                        </button>
                      </div>

                      <div className="visual-form-object-list">
                        {j.steps.map((js: any, jsIdx: number) => (
                          <div
                            className="visual-form-card visual-form-card--sub"
                            key={jsIdx}
                            data-testid={`flowchart-journey-${idx}-step-${jsIdx}`}
                          >
                            <div className="visual-form-card-header">
                              <span className="card-header-title">
                                <span className="card-code-pill">Step #{jsIdx + 1}</span>
                              </span>
                              <button
                                className="form-remove-btn"
                                onClick={() => {
                                  const updatedSteps = j.steps.filter((_: any, i: number) => i !== jsIdx)
                                  handleJourneyChange(idx, { ...j, steps: updatedSteps })
                                }}
                                type="button"
                                title="Remove journey step ref"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>

                            <div className="visual-form-card-body">
                              <div className="visual-form-grid-3">
                                <div className="visual-form-field">
                                  <label className="visual-form-label">
                                    <OUIFieldKey of={OUI.JourneyStep} field="step">Ref Step ID</OUIFieldKey>
                                    <select
                                      className="visual-form-select"
                                      value={js.stepId}
                                      onChange={(e) => {
                                        const updatedSteps = [...j.steps]
                                        updatedSteps[jsIdx] = { ...js, stepId: e.target.value }
                                        handleJourneyChange(idx, { ...j, steps: updatedSteps })
                                      }}
                                      data-testid={`flowchart-journey-${idx}-step-${jsIdx}-stepId`}
                                    >
                                      <option value="">(select step)</option>
                                      {allSelectableSteps.map((opt) => (
                                        <option key={opt.id} value={opt.id}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                </div>

                                <div className="visual-form-field">
                                  <label className="visual-form-label">
                                    <OUIFieldKey of={OUI.JourneyStep} field="name">Display Name</OUIFieldKey>
                                    <input
                                      className="visual-form-input"
                                      value={js.name}
                                      onChange={(e) => {
                                        const updatedSteps = [...j.steps]
                                        updatedSteps[jsIdx] = { ...js, name: e.target.value }
                                        handleJourneyChange(idx, { ...j, steps: updatedSteps })
                                      }}
                                      placeholder="Display Name"
                                      data-testid={`flowchart-journey-${idx}-step-${jsIdx}-name`}
                                    />
                                  </label>
                                </div>

                                <div className="visual-form-field">
                                  <label className="visual-form-label">
                                    <OUIFieldKey of={OUI.JourneyStep} field="processGroup">Process Group</OUIFieldKey>
                                    <select
                                      className="visual-form-select"
                                      value={js.processGroup || ''}
                                      onChange={(e) => {
                                        const updatedSteps = [...j.steps]
                                        updatedSteps[jsIdx] = {
                                          ...js,
                                          processGroup: (e.target.value as JourneyStepRef['processGroup']) || undefined,
                                        }
                                        handleJourneyChange(idx, { ...j, steps: updatedSteps })
                                      }}
                                      data-testid={`flowchart-journey-${idx}-step-${jsIdx}-processGroup`}
                                    >
                                      <option value="">(none)</option>
                                      <option value="planning">Planning</option>
                                      <option value="execution">Execution</option>
                                      <option value="evaluation">Evaluation</option>
                                      <option value="escalation">Escalation</option>
                                    </select>
                                  </label>
                                </div>
                              </div>

                              <div className="visual-form-field">
                                <label className="visual-form-label">
                                  <OUIFieldKey of={OUI.JourneyStep} field="description">Playback Description</OUIFieldKey>
                                  <textarea
                                    className="visual-form-textarea"
                                    value={js.description}
                                    onChange={(e) => {
                                      const updatedSteps = [...j.steps]
                                      updatedSteps[jsIdx] = { ...js, description: e.target.value }
                                      handleJourneyChange(idx, { ...j, steps: updatedSteps })
                                    }}
                                    rows={2}
                                    placeholder="Explanation shown during journey playback"
                                    data-testid={`flowchart-journey-${idx}-step-${jsIdx}-description`}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
