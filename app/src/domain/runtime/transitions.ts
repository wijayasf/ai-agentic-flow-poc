import { runtimeFixtures } from '../runtime-fixtures/loadRuntimeFixtures'
import type {
  MomentId,
  RuntimeFixtureBundle,
  RuntimeMoment,
} from '../runtime-fixtures/types'
import { applyMomentEntryEffects } from './effects'
import { createCompletedRuntimeState, createInitialRuntimeState } from './state'
import type { RuntimeAction, RuntimeState } from './types'

function findMoment(
  momentId: MomentId | null,
  fixtures: RuntimeFixtureBundle,
): RuntimeMoment | null {
  if (momentId === null) return null
  return fixtures.timeline.moments.find((moment) => moment.id === momentId) ?? null
}

function nextMoment(
  moment: RuntimeMoment,
  fixtures: RuntimeFixtureBundle,
): RuntimeMoment | null {
  return fixtures.timeline.moments[moment.order] ?? null
}

function withCompletedMoment(
  state: RuntimeState,
  moment: RuntimeMoment,
): RuntimeState {
  const completedMomentIds = state.completedMomentIds.includes(moment.id)
    ? state.completedMomentIds
    : [...state.completedMomentIds, moment.id]

  return {
    ...state,
    completedMomentIds,
    elapsedSeconds: moment.startSecond + moment.durationSeconds,
    remainingSeconds: 0,
  }
}

export function enterMoment(
  state: RuntimeState,
  moment: RuntimeMoment,
): RuntimeState {
  if (
    state.currentMomentId === moment.id ||
    state.completedMomentIds.includes(moment.id)
  ) {
    return state
  }

  const effected = applyMomentEntryEffects(state, moment)
  return {
    ...effected,
    playbackStatus: moment.expected.playbackStatus,
    currentMomentId: moment.id,
    remainingSeconds: moment.durationSeconds,
    timerActive: true,
  }
}

function resolveBoundary(
  state: RuntimeState,
  moment: RuntimeMoment,
  fixtures: RuntimeFixtureBundle,
): RuntimeState {
  const completion = moment.completion[state.mode]

  switch (completion) {
    case 'advance': {
      const next = nextMoment(moment, fixtures)
      return next === null
        ? createCompletedRuntimeState(state.mode, fixtures)
        : enterMoment(state, next)
    }
    case 'pause':
      return { ...state, playbackStatus: 'paused', timerActive: false }
    case 'wait_for_approval':
      return { ...state, playbackStatus: 'waiting_approval', timerActive: false }
    case 'complete':
      return createCompletedRuntimeState(state.mode, fixtures)
    default:
      return completion satisfies never
  }
}

export function advanceRuntimeBySeconds(
  state: RuntimeState,
  seconds: number,
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): RuntimeState {
  if (!state.timerActive || !Number.isFinite(seconds) || seconds <= 0) return state

  let remainingAdvance = seconds
  let nextState = state

  while (remainingAdvance > 0 && nextState.timerActive) {
    const moment = findMoment(nextState.currentMomentId, fixtures)
    if (moment === null || nextState.remainingSeconds === null) return nextState

    const currentRemaining = nextState.remainingSeconds
    const consumed = Math.min(remainingAdvance, currentRemaining)
    const remainingSeconds = currentRemaining - consumed
    nextState = {
      ...nextState,
      elapsedSeconds: nextState.elapsedSeconds + consumed,
      remainingSeconds,
    }
    remainingAdvance -= consumed

    if (remainingSeconds > 0) return nextState

    nextState = resolveBoundary(
      withCompletedMoment(nextState, moment),
      moment,
      fixtures,
    )
  }

  return nextState
}

export function isRuntimeActionLegal(
  state: RuntimeState,
  action: RuntimeAction,
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): boolean {
  const moment = findMoment(state.currentMomentId, fixtures)

  switch (action.type) {
    case 'SELECT_MODE':
      return state.playbackStatus === 'idle' || state.playbackStatus === 'completed'
    case 'START':
      return state.playbackStatus === 'idle'
    case 'PAUSE':
      return state.playbackStatus === 'running' && state.timerActive
    case 'RESUME':
      return state.playbackStatus === 'paused' && moment !== null
    case 'NEXT_MOMENT':
      // Legal in presenter mode whenever the timer is either running or
      // paused (excluding approval gate and terminal states). This lets the
      // presenter advance past any intentional pause AND fast-forward the
      // remainder of the current moment without needing a separate Resume.
      return (
        state.mode === 'presenter' &&
        (state.playbackStatus === 'paused' ||
          state.playbackStatus === 'running') &&
        moment !== null &&
        nextMoment(moment, fixtures) !== null &&
        moment.approvalGate === null
      )
    case 'APPROVE':
    case 'REJECT':
      return (
        state.playbackStatus === 'waiting_approval' &&
        moment?.approvalGate !== null &&
        moment?.approvalGate !== undefined &&
        state.approvalStatus === 'pending'
      )
    case 'ADVANCE_TIME':
      return (
        state.timerActive &&
        Number.isFinite(action.seconds) &&
        action.seconds > 0 &&
        state.playbackStatus === 'running'
      )
    case 'RESTART':
      return true
    default:
      return action satisfies never
  }
}

export function transitionRuntimeState(
  state: RuntimeState,
  action: RuntimeAction,
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): RuntimeState {
  if (!isRuntimeActionLegal(state, action, fixtures)) return state

  const moment = findMoment(state.currentMomentId, fixtures)

  switch (action.type) {
    case 'SELECT_MODE':
      return state.mode === action.mode ? state : { ...state, mode: action.mode }
    case 'START':
      return enterMoment(state, fixtures.timeline.moments[0])
    case 'PAUSE':
      return { ...state, playbackStatus: 'paused', timerActive: false }
    case 'RESUME': {
      if (moment === null) return state
      if (state.remainingSeconds === 0) {
        const next = nextMoment(moment, fixtures)
        return next === null
          ? createCompletedRuntimeState(state.mode, fixtures)
          : enterMoment(state, next)
      }
      return {
        ...state,
        playbackStatus: moment.expected.playbackStatus,
        timerActive: true,
      }
    }
    case 'NEXT_MOMENT': {
      if (moment === null) return state
      const completed = withCompletedMoment(state, moment)
      const next = nextMoment(moment, fixtures)
      if (next === null) return state
      const entered = enterMoment(completed, next)
      // Approval-chain tail: once the fourth approver is recorded, let the
      // timer run so the flow auto-cascades out of the approval scene without
      // requiring a Resume click.
      if (entered.approversCompleted === 4) return entered
      // Approval gate: if Next Moment lands on a moment whose mode-specific
      // completion is 'wait_for_approval', apply the gate state immediately
      // so the presenter proceeds straight from Finance recommendation to
      // Human Approval without watching an artificial pre-gate timer run.
      if (next.completion[state.mode] === 'wait_for_approval') {
        return {
          ...entered,
          playbackStatus: 'waiting_approval',
          timerActive: false,
        }
      }
      return {
        ...entered,
        playbackStatus: 'paused',
        timerActive: false,
      }
    }
    case 'APPROVE': {
      const approved = findMoment(
        moment?.approvalGate?.continuationMomentId ?? null,
        fixtures,
      )
      if (approved === null) return state
      const entered = enterMoment(
        { ...state, terminalOutcome: 'unresolved' },
        approved,
      )
      // Presenter mode: pause so Next Moment paces each remaining approver
      // without needing Resume. Auto mode: let the timer run so the flow
      // auto-cascades through the approval chain and out into disbursement.
      if (state.mode === 'presenter') {
        return { ...entered, playbackStatus: 'paused', timerActive: false }
      }
      return entered
    }
    case 'REJECT': {
      return {
        ...state,
        playbackStatus: 'completed',
        approvalStatus: 'rejected',
        terminalOutcome: 'escalated',
        officerMode: 'standby',
        remainingSeconds: 0,
        timerActive: false,
      }
    }
    case 'ADVANCE_TIME':
      return advanceRuntimeBySeconds(state, action.seconds, fixtures)
    case 'RESTART':
      return createInitialRuntimeState(state.mode, fixtures)
    default:
      return action satisfies never
  }
}
