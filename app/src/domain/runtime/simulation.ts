import { runtimeFixtures } from '../runtime-fixtures/loadRuntimeFixtures'
import type { RuntimeFixtureBundle } from '../runtime-fixtures/types'
import { createInitialRuntimeState } from './state'
import { transitionRuntimeState } from './transitions'
import type { RuntimeAction, RuntimeState } from './types'

export function reduceRuntimeActions(
  initialState: RuntimeState,
  actions: readonly RuntimeAction[],
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): RuntimeState {
  return actions.reduce(
    (state, action) => transitionRuntimeState(state, action, fixtures),
    initialState,
  )
}

export function simulateAutoRun(
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): RuntimeState {
  const approvalMoment = fixtures.timeline.moments.find(
    (moment) => moment.id === fixtures.timeline.approval.gateMomentId,
  )
  const approvalGateSecond = approvalMoment === undefined
    ? fixtures.timeline.totalScheduledSeconds
    : approvalMoment.startSecond + approvalMoment.durationSeconds

  return reduceRuntimeActions(
    createInitialRuntimeState('auto', fixtures),
    [
      { type: 'START' },
      { type: 'ADVANCE_TIME', seconds: approvalGateSecond },
      { type: 'APPROVE' },
      {
        type: 'ADVANCE_TIME',
        seconds: fixtures.timeline.totalScheduledSeconds - approvalGateSecond,
      },
    ],
    fixtures,
  )
}

export function simulatePresenterRun(
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): RuntimeState {
  const approvalMoment = fixtures.timeline.moments.find(
    (moment) => moment.id === fixtures.timeline.approval.gateMomentId,
  )
  const approvalGateSecond = approvalMoment === undefined
    ? fixtures.timeline.totalScheduledSeconds
    : approvalMoment.startSecond + approvalMoment.durationSeconds

  return reduceRuntimeActions(
    createInitialRuntimeState('presenter', fixtures),
    [
      { type: 'START' },
      { type: 'ADVANCE_TIME', seconds: 35 },
      { type: 'RESUME' },
      { type: 'ADVANCE_TIME', seconds: approvalGateSecond - 35 },
      { type: 'APPROVE' },
      {
        type: 'ADVANCE_TIME',
        seconds: fixtures.timeline.totalScheduledSeconds - approvalGateSecond,
      },
    ],
    fixtures,
  )
}
