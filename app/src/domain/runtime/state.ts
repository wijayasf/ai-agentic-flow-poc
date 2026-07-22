import { runtimeFixtures } from '../runtime-fixtures/loadRuntimeFixtures'
import type { DemoMode, RuntimeFixtureBundle } from '../runtime-fixtures/types'
import type { RuntimeState } from './types'

function cloneState(state: RuntimeState): RuntimeState {
  return {
    ...state,
    completedMomentIds: [...state.completedMomentIds],
    visibleEventIds: [...state.visibleEventIds],
    availableArtifactIds: [...state.availableArtifactIds],
    activeAgentIds: [...state.activeAgentIds],
    activeSystemIds: [...state.activeSystemIds],
  }
}

export function createInitialRuntimeState(
  mode: DemoMode = runtimeFixtures.initialState.mode,
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): RuntimeState {
  return { ...cloneState(fixtures.initialState), mode }
}

export function createCompletedRuntimeState(
  mode: DemoMode,
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): RuntimeState {
  return { ...cloneState(fixtures.finalState), mode }
}
