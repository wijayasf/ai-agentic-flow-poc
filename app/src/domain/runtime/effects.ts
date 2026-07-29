import type {
  RuntimeEntryEffect,
  RuntimeMoment,
} from '../runtime-fixtures/types'
import type { RuntimeState } from './types'

function appendUnique<T>(values: readonly T[], value: T): readonly T[] {
  return values.includes(value) ? values : [...values, value]
}

export function applyEntryEffect(
  state: RuntimeState,
  effect: RuntimeEntryEffect,
): RuntimeState {
  switch (effect.type) {
    case 'set_active_agents':
      return { ...state, activeAgentIds: [...effect.agentIds] }
    case 'set_active_systems':
      return { ...state, activeSystemIds: [...effect.systemIds] }
    case 'reveal_event':
      return {
        ...state,
        visibleEventIds: appendUnique(state.visibleEventIds, effect.eventId),
      }
    case 'make_artifact_available':
      return {
        ...state,
        availableArtifactIds: appendUnique(
          state.availableArtifactIds,
          effect.artifactId,
        ),
      }
    case 'set_active_specialist':
      return {
        ...state,
        activeSpecialistAgentId: effect.agentId,
        officerMode: effect.agentId === null ? 'active' : 'standby',
      }
    case 'return_to_officer':
      return {
        ...state,
        officerMode: 'active',
        activeSpecialistAgentId: null,
      }
    case 'set_workflow_step':
      return { ...state, workflowStep: effect.step }
    case 'set_approval_status':
      return { ...state, approvalStatus: effect.value }
    case 'advance_approver':
      return { ...state, approversCompleted: effect.index }
    case 'send_customer_response':
      return { ...state, customerResponseSent: true }
    case 'show_customer_context':
    case 'set_artifact_status':
    case 'hold_state':
    case 'hold_final_state':
      return state
    default:
      return effect satisfies never
  }
}

export function applyMomentEntryEffects(
  state: RuntimeState,
  moment: RuntimeMoment,
): RuntimeState {
  if (
    state.currentMomentId === moment.id ||
    state.completedMomentIds.includes(moment.id)
  ) {
    return state
  }

  return moment.entryEffects.reduce(applyEntryEffect, state)
}
