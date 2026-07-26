import { runtimeFixtures } from '../runtime-fixtures/loadRuntimeFixtures'
import type {
  DemoMode,
  RuntimeFixtureBundle,
  RuntimeStateFixture,
} from '../runtime-fixtures/types'
import type { RuntimeState } from './types'

function cloneState(
  state: RuntimeStateFixture,
  terminalOutcome: RuntimeState['terminalOutcome'],
): RuntimeState {
  return {
    ...state,
    terminalOutcome,
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
  return { ...cloneState(fixtures.initialState, 'unresolved'), mode }
}

export function createCompletedRuntimeState(
  mode: DemoMode,
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): RuntimeState {
  return { ...cloneState(fixtures.finalState, 'approved'), mode }
}
