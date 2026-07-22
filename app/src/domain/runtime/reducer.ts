import { runtimeFixtures } from '../runtime-fixtures/loadRuntimeFixtures'
import type { RuntimeFixtureBundle } from '../runtime-fixtures/types'
import { transitionRuntimeState } from './transitions'
import type { RuntimeAction, RuntimeState } from './types'

export function runtimeReducer(
  state: RuntimeState,
  action: RuntimeAction,
): RuntimeState {
  return transitionRuntimeState(state, action, runtimeFixtures)
}

export function createRuntimeReducer(fixtures: RuntimeFixtureBundle) {
  return (state: RuntimeState, action: RuntimeAction): RuntimeState =>
    transitionRuntimeState(state, action, fixtures)
}
