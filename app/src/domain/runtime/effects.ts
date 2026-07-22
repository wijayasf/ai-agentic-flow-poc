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
    case 'set_conflict_status':
      return { ...state, conflictStatus: effect.value }
    case 'set_approval_status':
      return { ...state, approvalStatus: effect.value }
    case 'set_failure_status':
      return { ...state, failureStatus: effect.value }
    case 'set_recovery_status':
      return { ...state, recoveryStatus: effect.value }
    case 'set_recommendation_visible':
      return { ...state, recommendationVisible: effect.value }
    case 'show_customer_context':
    case 'synchronize_investigation':
    case 'hold_state':
    case 'show_resolution_plan':
    case 'set_artifact_status':
    case 'show_failure_injection_cue':
    case 'finalize_metrics':
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
