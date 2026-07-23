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

  const learningMoment = fixtures.timeline.moments.find(
    (moment) => moment.id === fixtures.timeline.recommendation.availableAtMomentId,
  )
  const learningPauseEnd = learningMoment === undefined
    ? fixtures.timeline.totalScheduledSeconds
    : learningMoment.startSecond + learningMoment.durationSeconds

  return reduceRuntimeActions(
    createInitialRuntimeState('auto', fixtures),
    [
      { type: 'START' },
      { type: 'ADVANCE_TIME', seconds: approvalGateSecond },
      { type: 'APPROVE' },
      { type: 'ADVANCE_TIME', seconds: learningPauseEnd - approvalGateSecond },
      { type: 'RESUME' },
      { type: 'ADVANCE_TIME', seconds: fixtures.timeline.totalScheduledSeconds - learningPauseEnd },
    ],
    fixtures,
  )
}

export function simulatePresenterRun(
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): RuntimeState {
  return reduceRuntimeActions(
    createInitialRuntimeState('presenter', fixtures),
    [
      { type: 'START' },
      { type: 'ADVANCE_TIME', seconds: 90 },
      { type: 'NEXT_MOMENT' },
      { type: 'RESUME' },
      { type: 'ADVANCE_TIME', seconds: 240 },
      { type: 'NEXT_MOMENT' },
      { type: 'RESUME' },
      { type: 'ADVANCE_TIME', seconds: 60 },
      { type: 'APPROVE' },
      { type: 'ADVANCE_TIME', seconds: 45 },
      { type: 'INJECT_FAILURE' },
      { type: 'ADVANCE_TIME', seconds: 135 },
      { type: 'RESUME' },
      { type: 'ADVANCE_TIME', seconds: 30 },
    ],
    fixtures,
  )
}
