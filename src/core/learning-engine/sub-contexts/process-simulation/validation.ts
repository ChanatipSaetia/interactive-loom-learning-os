/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ValidationDiagnostic, ValidationContext } from '../../validation/types'
import { contextToDiagnostic } from '../../validation/types'
import { deriveSchema } from './model/derive'
import { TYPES } from './components/flowchart/types'

const EVENT_TYPES = new Set(['event', 'Event', 'EVENT', TYPES.EVENT])
const ACTOR_TYPES = new Set(['actor', 'Actor', 'ACTOR', 'user', 'User', 'USER', TYPES.USER])
const SYSTEM_TYPES = new Set([
  'aggregate', 'Aggregate', 'AGGREGATE', TYPES.AGGREGATE,
  'external', 'External', 'EXTERNAL', 'external api', 'External API', TYPES.EXTERNAL,
  'service', 'Service', 'SERVICE', TYPES.SERVICE,
  'database', 'Database', 'DATABASE', TYPES.DATABASE,
  'system', 'System', 'SYSTEM',
])

/**
 * Tier 3: Semantic Reference Integrity for Process & Event Workflow Simulation.
 * Validates 'scenario' and 'flowchart' cross-references.
 */
export function validateProcessSimulationTier3(
  data: Record<string, unknown>,
  sectionType: string,
  context?: ValidationContext
): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = []
  const ctx = contextToDiagnostic(context)

  switch (sectionType) {
    case 'scenario': {
      const nodes = (data.nodes || {}) as Record<string, any>
      const startNode = data.startNode as string | undefined
      const validNodeKeys = Object.keys(nodes)

      if (startNode && !nodes[startNode]) {
        diagnostics.push({
          tier: 3,
          field: 'startNode',
          message: `startNode "${startNode}" does not exist in scenario nodes.`,
          fixHint: `Change startNode to one of: [${validNodeKeys.map((k) => `"${k}"`).join(', ')}]`,
          ...ctx,
        })
      }

      for (const [nodeId, node] of Object.entries(nodes)) {
        if (!node || typeof node !== 'object') continue
        const choices = Array.isArray(node.choices) ? node.choices : []
        choices.forEach((choice: any, idx: number) => {
          if (choice && choice.next && typeof choice.next === 'string') {
            if (!nodes[choice.next]) {
              diagnostics.push({
                tier: 3,
                field: `nodes.${nodeId}.choices[${idx}].next`,
                message: `Choice "${choice.text || idx}" in node "${nodeId}" targets non-existent node "${choice.next}".`,
                fixHint: `Update "next" to point to a valid node: [${validNodeKeys.map((k) => `"${k}"`).join(', ')}]`,
                ...ctx,
              })
            }
          }
        })
      }
      break
    }

    case 'flowchart': {
      let entities = (data.entities || {}) as Record<string, any>
      let relations = (Array.isArray(data.relations) ? data.relations : []) as any[]

      // Derive schema if raw flow / steps / actors / systems format is provided
      if (Object.keys(entities).length === 0 && (data.flow || data.steps || data.actors || data.systems)) {
        try {
          const flowObj = (data.flow as any) || {
            actors: data.actors || {},
            systems: data.systems || {},
            steps: data.steps || [],
            journeys: data.journeys || [],
          }
          const derived = deriveSchema(flowObj)
          entities = (derived.entities || {}) as Record<string, any>
          relations = Array.isArray(derived.relations) ? derived.relations : []
        } catch {
          // If deriveSchema fails, schema structural validation will catch it
        }
      }

      const entityIds = new Set(Object.keys(entities))

      // Journey steps must reference a step: a linear step id or a branch option id.
      // Anything else silently degrades to a single highlighted node.
      const rawFlow = (data.flow as any) || (data.steps ? data : null)
      if (rawFlow && Array.isArray(rawFlow.steps)) {
        const stepIds = new Set<string>()
        const eventToSteps = new Map<string, string[]>()
        for (const step of rawFlow.steps as any[]) {
          if (!step || typeof step !== 'object') continue
          const targets = step.type === 'branch' ? (Array.isArray(step.branches) ? step.branches : []) : [step]
          for (const t of targets) {
            if (!t || typeof t.id !== 'string') continue
            stepIds.add(t.id)
            for (const evt of Array.isArray(t.resultEvents) ? t.resultEvents : []) {
              if (evt && typeof evt.id === 'string') eventToSteps.set(evt.id, [...(eventToSteps.get(evt.id) ?? []), t.id])
            }
          }
        }
        const rawJourneys = Array.isArray(rawFlow.journeys) ? rawFlow.journeys : []
        for (const [jIdx, journey] of rawJourneys.entries()) {
          const jSteps = Array.isArray(journey?.steps) ? journey.steps : []
          for (const [sIdx, ref] of jSteps.entries()) {
            const stepId = ref?.stepId
            if (typeof stepId !== 'string' || stepIds.has(stepId)) continue
            const producers = eventToSteps.get(stepId)
            diagnostics.push({
              tier: 3,
              field: `journeys[${jIdx}].steps[${sIdx}].stepId`,
              message: producers
                ? `Journey "${journey.id ?? jIdx}" step "${ref.name ?? sIdx}" references result event "${stepId}" instead of a step, so playback highlights only that event.`
                : `Journey "${journey.id ?? jIdx}" step "${ref.name ?? sIdx}" references unknown step "${stepId}".`,
              fixHint: producers
                ? `Use the step that produces it: stepId: ${producers.join(' or stepId: ')}`
                : `Use a linear step id or branch option id: [${[...stepIds].map((id) => `"${id}"`).join(', ')}]`,
              ...ctx,
            })
          }
        }
      }

      for (const [idx, rel] of relations.entries()) {
        if (!rel || typeof rel !== 'object') continue
        if (rel.from && !entityIds.has(String(rel.from))) {
          diagnostics.push({
            tier: 3,
            field: `relations[${idx}].from`,
            message: `Relation #${idx} references unknown entity "${rel.from}".`,
            fixHint: `Valid entity IDs: [${[...entityIds].map((e) => `"${e}"`).join(', ')}]`,
            ...ctx,
          })
        }
        if (rel.to && !entityIds.has(String(rel.to))) {
          diagnostics.push({
            tier: 3,
            field: `relations[${idx}].to`,
            message: `Relation #${idx} references unknown entity "${rel.to}".`,
            fixHint: `Valid entity IDs: [${[...entityIds].map((e) => `"${e}"`).join(', ')}]`,
            ...ctx,
          })
        }
      }

      const journeys = Array.isArray(data.journeys) ? data.journeys : []
      for (const [jIdx, journey] of journeys.entries()) {
        if (!journey || typeof journey !== 'object') continue
        const steps = Array.isArray(journey.steps) ? journey.steps : []
        for (const [sIdx, step] of steps.entries()) {
          if (!step || typeof step !== 'object') continue
          const stepNodeIds = Array.isArray(step.nodeIds) ? step.nodeIds : []
          for (const [nIdx, nodeId] of stepNodeIds.entries()) {
            if (!entityIds.has(nodeId)) {
              diagnostics.push({
                tier: 3,
                field: `journeys[${jIdx}].steps[${sIdx}].nodeIds[${nIdx}]`,
                message: `Step "${step.title || sIdx}" in journey "${journey.id || jIdx}" references unknown entity "${nodeId}".`,
                fixHint: `Valid entity IDs: [${[...entityIds].map((e) => `"${e}"`).join(', ')}]`,
                ...ctx,
              })
            }
          }
        }
      }

      const views = data.views
      if (views && typeof views === 'object' && !Array.isArray(views)) {
        for (const [viewName, view] of Object.entries(views)) {
          if (!view || typeof view !== 'object') continue
          const viewNodes = Array.isArray(view.nodes) ? view.nodes : []
          for (const [nIdx, vn] of viewNodes.entries()) {
            if (vn && vn.id && !entityIds.has(String(vn.id))) {
              diagnostics.push({
                tier: 3,
                field: `views.${viewName}.nodes[${nIdx}].id`,
                message: `View "${viewName}" node references unknown entity "${vn.id}".`,
                fixHint: `Valid entity IDs: [${[...entityIds].map((e) => `"${e}"`).join(', ')}]`,
                ...ctx,
              })
            }
          }
          const viewGroups = Array.isArray(view.groups) ? view.groups : []
          for (const [gIdx, group] of viewGroups.entries()) {
            if (!group || typeof group !== 'object') continue
            const groupNodeIds = Array.isArray(group.nodeIds) ? group.nodeIds : []
            for (const [nIdx, nodeId] of groupNodeIds.entries()) {
              if (!entityIds.has(nodeId)) {
                diagnostics.push({
                  tier: 3,
                  field: `views.${viewName}.groups[${gIdx}].nodeIds[${nIdx}]`,
                  message: `Group "${group.title || gIdx}" in view "${viewName}" references unknown entity "${nodeId}".`,
                  fixHint: `Valid entity IDs: [${[...entityIds].map((e) => `"${e}"`).join(', ')}]`,
                  ...ctx,
                })
              }
            }
          }
        }
      }

      const stateInitRefs: string[] = []
      for (const [entityId, entity] of Object.entries(entities)) {
        if (!entity || typeof entity !== 'object') continue
        const sm = entity.stateMachine
        if (sm && typeof sm === 'object') {
          const initialState = sm.initialState
          const states = Array.isArray(sm.states) ? sm.states : []
          const stateIds = new Set(states.map((s: any) => s?.id).filter(Boolean))
          if (initialState && !stateIds.has(String(initialState))) {
            stateInitRefs.push(`${entityId}: initialState "${initialState}" not in states [${[...stateIds].join(', ')}]`)
          }
        }
      }
      for (const ref of stateInitRefs) {
        diagnostics.push({
          tier: 3,
          field: 'entities.*.stateMachine.initialState',
          message: `State machine reference: ${ref}`,
          fixHint: 'Ensure initialState matches one of the defined state IDs.',
          ...ctx,
        })
      }

      // --- Tier 3 check: Ensure all Actor and System nodes connect to at least one Event node ---
      if (Object.keys(entities).length > 0) {
        const eventNodeIds = new Set<string>()
        for (const [id, entity] of Object.entries(entities)) {
          if (!entity || typeof entity !== 'object') continue
          const typeStr = String(entity.type || '')
          if (EVENT_TYPES.has(typeStr) || id.startsWith('evt_')) {
            eventNodeIds.add(id)
          }
        }

        const adjMap = new Map<string, Set<string>>()
        for (const id of Object.keys(entities)) {
          adjMap.set(id, new Set())
        }

        for (const rel of relations) {
          if (!rel || typeof rel !== 'object') continue
          const from = String(rel.from || '')
          const to = String(rel.to || '')
          if (from && to && entityIds.has(from) && entityIds.has(to)) {
            adjMap.get(from)!.add(to)
            adjMap.get(to)!.add(from)
          }
        }

        const connectedToEvent = new Set<string>(eventNodeIds)
        const queue: string[] = [...eventNodeIds]

        while (queue.length > 0) {
          const curr = queue.shift()!
          const neighbors = adjMap.get(curr)
          if (neighbors) {
            for (const neighbor of neighbors) {
              if (!connectedToEvent.has(neighbor)) {
                connectedToEvent.add(neighbor)
                queue.push(neighbor)
              }
            }
          }
        }

        const rawActors = ((data.flow as any)?.actors || data.actors || {}) as Record<string, any>
        const rawSystems = ((data.flow as any)?.systems || data.systems || {}) as Record<string, any>
        const rawSteps = ((data.flow as any)?.steps || data.steps || []) as any[]

        const getRefId = (ref: any): string => (typeof ref === 'string' ? ref : ref?.id || '')

        // Invariant 1: Every declared actor and system must be attached to at least one step
        const referencedInSteps = new Set<string>()
        for (const step of Array.isArray(rawSteps) ? rawSteps : []) {
          if (step && typeof step === 'object') {
            if (step.type === 'linear') {
              if (step.initiatedBy) referencedInSteps.add(getRefId(step.initiatedBy))
              if (step.handledBy) referencedInSteps.add(getRefId(step.handledBy))
              if (step.delegatesTo) referencedInSteps.add(getRefId(step.delegatesTo))
              if (step.sendsTo) referencedInSteps.add(getRefId(step.sendsTo))
            } else if (step.type === 'branch') {
              for (const b of step.branches || []) {
                if (b.initiatedBy) referencedInSteps.add(getRefId(b.initiatedBy))
                if (b.handledBy) referencedInSteps.add(getRefId(b.handledBy))
                if (b.delegatesTo) referencedInSteps.add(getRefId(b.delegatesTo))
                if (b.sendsTo) referencedInSteps.add(getRefId(b.sendsTo))
              }
            }
          }
        }

        for (const actorId of Object.keys(rawActors)) {
          if (!referencedInSteps.has(actorId)) {
            diagnostics.push({
              tier: 3,
              field: `actors.${actorId}`,
              message: `Actor "${actorId}" is declared in actors.yaml but not attached to any step in steps.yaml.`,
              fixHint: `Reference actor "${actorId}" in a step's initiatedBy or sendsTo field, or remove it from actors.yaml.`,
              ...ctx,
            })
          }
        }

        for (const sysId of Object.keys(rawSystems)) {
          if (!referencedInSteps.has(sysId)) {
            diagnostics.push({
              tier: 3,
              field: `systems.${sysId}`,
              message: `System "${sysId}" is declared in systems.yaml but not attached to any step in steps.yaml.`,
              fixHint: `Reference system "${sysId}" in a step's handledBy, delegatesTo or sendsTo field, or remove it from systems.yaml.`,
              ...ctx,
            })
          }
        }

        // Invariant 2: step references point at declared participants.
        // handledBy is optional (a step no system runs), but must name a system when given;
        // delegatesTo needs a handler to delegate from; sendsTo names an actor or a system.
        const checkStepRefs = (s: any, kind: 'Step' | 'Branch option') => {
          const where = `${kind} "${s.id}" command "${s.command}"`
          if (s.handledBy) {
            const h = getRefId(s.handledBy)
            if (!rawSystems[h]) {
              diagnostics.push({
                tier: 3,
                field: `steps.${s.id}`,
                message: `${where} is handledBy "${h}", which is not a valid system in systems.yaml.`,
                fixHint: `Change handledBy in "${s.id}" to a system from systems.yaml, or remove it if no system runs this command.`,
                ...ctx,
              })
            }
          }
          if (s.delegatesTo && !s.handledBy) {
            diagnostics.push({
              tier: 3,
              field: `steps.${s.id}.delegatesTo`,
              message: `${where} delegates to "${getRefId(s.delegatesTo)}" but has no handledBy to delegate from.`,
              fixHint: `Add handledBy to "${s.id}", or remove delegatesTo.`,
              ...ctx,
            })
          }
          if (s.sendsTo) {
            const r = getRefId(s.sendsTo)
            if (!rawActors[r] && !rawSystems[r]) {
              diagnostics.push({
                tier: 3,
                field: `steps.${s.id}.sendsTo`,
                message: `${where} sendsTo "${r}", which is not declared in actors.yaml or systems.yaml.`,
                fixHint: `Use one of: [${[...Object.keys(rawActors), ...Object.keys(rawSystems)].map((id) => `"${id}"`).join(', ')}]`,
                ...ctx,
              })
            }
          }
        }
        for (const step of Array.isArray(rawSteps) ? rawSteps : []) {
          if (!step || typeof step !== 'object') continue
          if (step.type === 'linear') checkStepRefs(step, 'Step')
          else if (step.type === 'branch') (step.branches || []).forEach((b: any) => b && checkStepRefs(b, 'Branch option'))
        }

        for (const [entityId, entity] of Object.entries(entities)) {
          if (!entity || typeof entity !== 'object') continue
          const typeStr = String(entity.type || '')

          const isActor = ACTOR_TYPES.has(typeStr) || Boolean(rawActors[entityId])
          const isSystem = SYSTEM_TYPES.has(typeStr) || Boolean(rawSystems[entityId])

          if (!isActor && !isSystem) continue
          // Skip event nodes themselves
          if (EVENT_TYPES.has(typeStr) || entityId.startsWith('evt_')) continue

          const isConnected = connectedToEvent.has(entityId)
          if (!isConnected) {
            const roleLabel = isActor ? 'Actor' : 'System'
            diagnostics.push({
              tier: 3,
              field: `entities.${entityId}`,
              message: `${roleLabel} node "${entityId}" ("${entity.title || entityId}") is not connected to any Event node in the flowchart graph.`,
              fixHint: `Connect ${roleLabel.toLowerCase()} node "${entityId}" to an Event node via relations or steps, or remove the unused node.`,
              ...ctx,
            })
          }
        }
      }
      break
    }
  }

  return diagnostics
}

