import { describe, expect, it } from 'vitest'
import { runtimeFixtures } from '../runtime-fixtures/loadRuntimeFixtures'
import {
  EVENT_REVEAL_ORDER,
  MOMENT_IDS,
} from '../runtime-fixtures/types'
import { createInitialRuntimeState } from './state'
import {
  advanceRuntimeBySeconds,
  enterMoment,
  isRuntimeActionLegal,
  transitionRuntimeState,
} from './transitions'
import { simulateAutoRun, simulatePresenterRun } from './simulation'
import type { RuntimeAction, RuntimeState } from './types'

function dispatch(state: RuntimeState, action: RuntimeAction): RuntimeState {
  return transitionRuntimeState(state, action, runtimeFixtures)
}

function start(mode: 'presenter' | 'auto' = 'presenter'): RuntimeState {
  return dispatch(createInitialRuntimeState(mode), { type: 'START' })
}

function presenterAtApprovalGate(): RuntimeState {
  let state = dispatch(start(), { type: 'ADVANCE_TIME', seconds: 90 })
  state = dispatch(state, { type: 'NEXT_MOMENT' })
  state = dispatch(state, { type: 'RESUME' })
  state = dispatch(state, { type: 'ADVANCE_TIME', seconds: 240 })
  state = dispatch(state, { type: 'NEXT_MOMENT' })
  state = dispatch(state, { type: 'RESUME' })
  return dispatch(state, { type: 'ADVANCE_TIME', seconds: 60 })
}

function autoAtApprovalGate(): RuntimeState {
  return dispatch(start('auto'), { type: 'ADVANCE_TIME', seconds: 390 })
}

function approvedAutoAt(seconds: number): RuntimeState {
  const approved = dispatch(autoAtApprovalGate(), { type: 'APPROVE' })
  return dispatch(approved, {
    type: 'ADVANCE_TIME',
    seconds: seconds - 390,
  })
}

function presenterAtFailureGate(): RuntimeState {
  let state = dispatch(presenterAtApprovalGate(), { type: 'APPROVE' })
  state = dispatch(state, { type: 'ADVANCE_TIME', seconds: 45 })
  return state
}

describe('runtime state and moment entry', () => {
  it('constructs the exact authoritative initial state', () => {
    expect(createInitialRuntimeState()).toEqual({
      ...runtimeFixtures.initialState,
      terminalOutcome: 'unresolved',
    })
  })

  it('starts at M01 and applies its entry effects once', () => {
    const started = start()
    expect(started).toMatchObject({
      playbackStatus: 'running',
      currentMomentId: 'M01',
      elapsedSeconds: 0,
      remainingSeconds: 30,
      activeAgentIds: ['agent-customer-complaint'],
      activeSystemIds: ['system-crm'],
      timerActive: true,
    })

    expect(dispatch(started, { type: 'START' })).toBe(started)
    expect(enterMoment(started, runtimeFixtures.timeline.moments[0])).toBe(started)
  })

  it('preserves cumulative event and artifact visibility', () => {
    const atM09 = advanceRuntimeBySeconds(
      dispatch(createInitialRuntimeState('auto'), { type: 'START' }),
      240,
    )

    expect(atM09.currentMomentId).toBe('M09')
    expect(atM09.visibleEventIds).toEqual(EVENT_REVEAL_ORDER.slice(0, 6))
    expect(atM09.availableArtifactIds).toEqual([
      'artifact-summary',
      'artifact-conflict',
    ])
    expect(atM09.conflictStatus).toBe('active')
  })
})

describe('legal transitions', () => {
  it('allows mode selection only while idle or completed', () => {
    const idle = createInitialRuntimeState()
    const autoIdle = dispatch(idle, { type: 'SELECT_MODE', mode: 'auto' })
    expect(autoIdle.mode).toBe('auto')

    const running = dispatch(autoIdle, { type: 'START' })
    expect(dispatch(running, { type: 'SELECT_MODE', mode: 'presenter' })).toBe(running)

    const completed = simulateAutoRun()
    expect(dispatch(completed, { type: 'SELECT_MODE', mode: 'presenter' }).mode).toBe(
      'presenter',
    )
  })

  it('pauses and resumes without consuming or replaying the moment', () => {
    const running = dispatch(start(), { type: 'ADVANCE_TIME', seconds: 12 })
    const paused = dispatch(running, { type: 'PAUSE' })
    const ignoredPassage = dispatch(paused, { type: 'ADVANCE_TIME', seconds: 100 })

    expect(paused.remainingSeconds).toBe(18)
    expect(paused.elapsedSeconds).toBe(12)
    expect(paused.timerActive).toBe(false)
    expect(ignoredPassage).toBe(paused)

    const resumed = dispatch(paused, { type: 'RESUME' })
    expect(resumed).toMatchObject({
      currentMomentId: 'M01',
      playbackStatus: 'running',
      remainingSeconds: 18,
      elapsedSeconds: 12,
      timerActive: true,
    })
    expect(resumed.activeAgentIds).toEqual(['agent-customer-complaint'])
  })

  it('treats NEXT_MOMENT from running as an identity no-op', () => {
    const running = dispatch(start(), { type: 'ADVANCE_TIME', seconds: 12 })
    expect(dispatch(running, { type: 'NEXT_MOMENT' })).toBe(running)
  })

  it('treats NEXT_MOMENT as an identity no-op from every non-Paused status and Auto Mode', () => {
    const idle = createInitialRuntimeState()
    const running = start()
    const waitingApproval = presenterAtApprovalGate()
    const waitingFailureInjection = presenterAtFailureGate()
    const failed = approvedAutoAt(435)
    const recovering = dispatch(failed, { type: 'ADVANCE_TIME', seconds: 20 })
    const completed = simulateAutoRun()
    const pausedAuto = dispatch(start('auto'), { type: 'PAUSE' })

    for (const state of [
      idle,
      running,
      waitingApproval,
      waitingFailureInjection,
      failed,
      recovering,
      completed,
      pausedAuto,
    ]) {
      expect(dispatch(state, { type: 'NEXT_MOMENT' })).toBe(state)
    }
  })

  it('advances exactly one moment from paused and remains paused', () => {
    const atM03 = dispatch(start(), { type: 'ADVANCE_TIME', seconds: 90 })
    const atM04 = dispatch(atM03, { type: 'NEXT_MOMENT' })

    expect(atM04).toMatchObject({
      currentMomentId: 'M04',
      completedMomentIds: ['M01', 'M02', 'M03'],
      elapsedSeconds: 90,
      remainingSeconds: 30,
      playbackStatus: 'paused',
      timerActive: false,
    })
    expect(atM04.visibleEventIds).toEqual(['evt-1', 'evt-2'])
  })

  it('ignores representative illegal actions without changing state', () => {
    const idle = createInitialRuntimeState()
    const actions: RuntimeAction[] = [
      { type: 'PAUSE' },
      { type: 'RESUME' },
      { type: 'NEXT_MOMENT' },
      { type: 'APPROVE' },
      { type: 'REJECT' },
      { type: 'INJECT_FAILURE' },
      { type: 'ADVANCE_TIME', seconds: 30 },
    ]

    for (const action of actions) {
      expect(dispatch(idle, action), action.type).toBe(idle)
    }

    const runningAuto = start('auto')
    expect(dispatch(runningAuto, { type: 'NEXT_MOMENT' })).toBe(runningAuto)
    expect(dispatch(runningAuto, { type: 'ADVANCE_TIME', seconds: -1 })).toBe(
      runningAuto,
    )
  })
})

describe('Presenter gates and deterministic recovery', () => {
  it('pauses at M03 and M11 and NEXT_MOMENT enters one paused successor', () => {
    const atM03 = dispatch(start(), { type: 'ADVANCE_TIME', seconds: 90 })
    expect(atM03).toMatchObject({
      currentMomentId: 'M03',
      playbackStatus: 'paused',
      elapsedSeconds: 90,
      remainingSeconds: 0,
    })

    const atM04 = dispatch(atM03, { type: 'NEXT_MOMENT' })
    expect(atM04).toMatchObject({
      currentMomentId: 'M04',
      playbackStatus: 'paused',
      elapsedSeconds: 90,
      remainingSeconds: 30,
    })

    const runningM04 = dispatch(atM04, { type: 'RESUME' })
    const atM11 = dispatch(runningM04, { type: 'ADVANCE_TIME', seconds: 240 })
    expect(atM11).toMatchObject({
      currentMomentId: 'M11',
      playbackStatus: 'paused',
      elapsedSeconds: 330,
    })

    const atM12 = dispatch(atM11, { type: 'NEXT_MOMENT' })
    expect(atM12).toMatchObject({
      currentMomentId: 'M12',
      playbackStatus: 'paused',
      elapsedSeconds: 330,
      remainingSeconds: 30,
    })
  })

  it('cannot bypass approval and approves exactly once', () => {
    const state = presenterAtApprovalGate()

    expect(state).toMatchObject({
      currentMomentId: 'M13',
      playbackStatus: 'waiting_approval',
      approvalStatus: 'pending',
      elapsedSeconds: 390,
      timerActive: false,
    })
    expect(isRuntimeActionLegal(state, { type: 'NEXT_MOMENT' })).toBe(false)
    expect(dispatch(state, { type: 'NEXT_MOMENT' })).toBe(state)

    const approved = dispatch(state, { type: 'APPROVE' })
    expect(approved).toMatchObject({
      currentMomentId: 'M14',
      approvalStatus: 'approved',
      playbackStatus: 'running',
    })
    expect(approved.visibleEventIds.at(-1)).toBe('evt-10')
    expect(dispatch(approved, { type: 'APPROVE' })).toBe(approved)
    expect(dispatch(approved, { type: 'REJECT' })).toBe(approved)
  })

  it('stops both modes at one explicit approval gate', () => {
    const presenter = presenterAtApprovalGate()
    const auto = autoAtApprovalGate()

    for (const state of [presenter, auto]) {
      expect(state).toMatchObject({
        currentMomentId: 'M13',
        playbackStatus: 'waiting_approval',
        approvalStatus: 'pending',
        terminalOutcome: 'unresolved',
        elapsedSeconds: 390,
        timerActive: false,
      })
      expect(isRuntimeActionLegal(state, { type: 'APPROVE' })).toBe(true)
      expect(isRuntimeActionLegal(state, { type: 'REJECT' })).toBe(true)
      expect(dispatch(state, { type: 'SELECT_MODE', mode: 'auto' })).toBe(state)
      expect(dispatch(state, { type: 'SELECT_MODE', mode: 'presenter' })).toBe(
        state,
      )
      expect(dispatch(state, { type: 'ADVANCE_TIME', seconds: 300 })).toBe(state)
    }
  })

  it('rejects exactly once and creates a terminal escalation without approved artifacts', () => {
    const gate = autoAtApprovalGate()
    const rejected = dispatch(gate, { type: 'REJECT' })

    expect(rejected).toMatchObject({
      currentMomentId: 'M13',
      playbackStatus: 'completed',
      approvalStatus: 'rejected',
      terminalOutcome: 'escalated',
      timerActive: false,
    })
    expect(rejected.availableArtifactIds).toEqual([
      'artifact-summary',
      'artifact-conflict',
    ])
    expect(rejected.availableArtifactIds).not.toContain('artifact-approval')
    expect(rejected.recommendationVisible).toBe(false)
    expect(dispatch(rejected, { type: 'REJECT' })).toBe(rejected)
    expect(dispatch(rejected, { type: 'APPROVE' })).toBe(rejected)
  })

  it('enforces the M15 injection cue and owned failure/recovery progression', () => {
    const state = presenterAtFailureGate()

    expect(state).toMatchObject({
      currentMomentId: 'M15',
      playbackStatus: 'waiting_failure_injection',
      remainingSeconds: 0,
      elapsedSeconds: 435,
      timerActive: false,
    })
    expect(state.completedMomentIds.at(-1)).toBe('M15')
    expect(state.completedMomentIds.filter((id) => id === 'M15')).toHaveLength(1)
    expect(isRuntimeActionLegal(state, { type: 'INJECT_FAILURE' })).toBe(true)
    expect(isRuntimeActionLegal(state, { type: 'NEXT_MOMENT' })).toBe(false)
    expect(dispatch(state, { type: 'ADVANCE_TIME', seconds: 30 })).toBe(state)
    expect(dispatch(state, { type: 'RESUME' })).toBe(state)
    expect(dispatch(state, { type: 'NEXT_MOMENT' })).toBe(state)

    const failed = dispatch(state, { type: 'INJECT_FAILURE' })
    expect(failed).toMatchObject({
      currentMomentId: 'M16',
      playbackStatus: 'failed',
      failureStatus: 'active',
      timerActive: true,
    })
    expect(failed.visibleEventIds.at(-1)).toBe('evt-11')
    expect(failed.visibleEventIds.filter((id) => id === 'evt-11')).toHaveLength(1)
    expect(failed.remainingSeconds).toBe(20)
    expect(dispatch(failed, { type: 'INJECT_FAILURE' })).toBe(failed)
    expect(isRuntimeActionLegal(failed, { type: 'PAUSE' })).toBe(false)

    const recovering = dispatch(failed, { type: 'ADVANCE_TIME', seconds: 20 })
    expect(recovering).toMatchObject({
      currentMomentId: 'M17',
      playbackStatus: 'recovering',
      recoveryStatus: 'recovering',
    })

    const recovered = dispatch(recovering, { type: 'ADVANCE_TIME', seconds: 25 })
    expect(recovered).toMatchObject({
      currentMomentId: 'M18',
      playbackStatus: 'running',
      failureStatus: 'recovered',
      recoveryStatus: 'completed',
    })
    expect(recovered.visibleEventIds.at(-1)).toBe('evt-12')
  })

  it('ignores INJECT_FAILURE outside Waiting Failure Injection', () => {
    const idle = createInitialRuntimeState()
    const running = start()
    const paused = dispatch(running, { type: 'PAUSE' })
    const waitingApproval = presenterAtApprovalGate()
    const failed = approvedAutoAt(435)
    const recovering = dispatch(failed, { type: 'ADVANCE_TIME', seconds: 20 })
    const completed = simulateAutoRun()

    for (const state of [
      idle,
      running,
      paused,
      waitingApproval,
      failed,
      recovering,
      completed,
    ]) {
      expect(dispatch(state, { type: 'INJECT_FAILURE' })).toBe(state)
    }
  })
})

describe('completion, restart, and determinism', () => {
  it('completes Auto Mode at exactly 600 scheduled seconds', () => {
    const completed = simulateAutoRun()
    expect(completed).toEqual({
      ...runtimeFixtures.finalState,
      mode: 'auto',
      terminalOutcome: 'approved',
    })
    expect(completed.elapsedSeconds).toBe(600)
    expect(completed.completedMomentIds).toEqual(MOMENT_IDS)
    expect(completed.visibleEventIds).toEqual(EVENT_REVEAL_ORDER)
    expect(completed.timerActive).toBe(false)
  })

  it('completes Presenter Mode through all explicit gates', () => {
    const completed = simulatePresenterRun()
    expect(completed).toEqual({
      ...runtimeFixtures.finalState,
      terminalOutcome: 'approved',
    })
    expect(completed.elapsedSeconds).toBe(600)
  })

  it('produces identical results for three complete runs in each mode', () => {
    const autoRuns = Array.from({ length: 3 }, () => simulateAutoRun())
    const presenterRuns = Array.from({ length: 3 }, () => simulatePresenterRun())
    expect(autoRuns[1]).toEqual(autoRuns[0])
    expect(autoRuns[2]).toEqual(autoRuns[0])
    expect(presenterRuns[1]).toEqual(presenterRuns[0])
    expect(presenterRuns[2]).toEqual(presenterRuns[0])
  })

  it('restarts exactly and preserves the selected mode from every runtime phase', () => {
    const running = start('auto')
    const paused = dispatch(running, { type: 'PAUSE' })
    const failed = approvedAutoAt(435)
    const recovering = dispatch(failed, { type: 'ADVANCE_TIME', seconds: 20 })
    const completed = simulateAutoRun()
    const rejected = dispatch(autoAtApprovalGate(), { type: 'REJECT' })

    const waitingApproval = presenterAtApprovalGate()
    const waitingFailureInjection = presenterAtFailureGate()

    for (const state of [running, paused, failed, recovering, completed, rejected]) {
      expect(dispatch(state, { type: 'RESTART' })).toEqual(
        createInitialRuntimeState('auto'),
      )
    }

    expect(waitingApproval.playbackStatus).toBe('waiting_approval')
    expect(dispatch(waitingApproval, { type: 'RESTART' })).toEqual(
      createInitialRuntimeState('presenter'),
    )
    expect(waitingFailureInjection.playbackStatus).toBe(
      'waiting_failure_injection',
    )
    expect(dispatch(waitingFailureInjection, { type: 'RESTART' })).toEqual(
      createInitialRuntimeState('presenter'),
    )

    const initial = createInitialRuntimeState('auto')
    expect(dispatch(initial, { type: 'RESTART' })).toEqual(initial)
  })
})
