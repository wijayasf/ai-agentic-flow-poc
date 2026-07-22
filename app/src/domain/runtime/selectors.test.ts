import { describe, expect, it } from 'vitest'
import { createInitialRuntimeState } from './state'
import {
  selectArtifacts,
  selectControlAvailability,
  selectContext,
  selectRuntimeViewModel,
  selectTimer,
  selectVisibleEvents,
} from './selectors'
import { simulateAutoRun } from './simulation'
import { transitionRuntimeState } from './transitions'
import type { RuntimeState } from './types'

function autoAt(seconds: number): RuntimeState {
  const started = transitionRuntimeState(createInitialRuntimeState('auto'), {
    type: 'START',
  })
  return transitionRuntimeState(started, { type: 'ADVANCE_TIME', seconds })
}

function presenterAtFailureGate(): RuntimeState {
  let state = transitionRuntimeState(createInitialRuntimeState(), { type: 'START' })
  state = transitionRuntimeState(state, { type: 'ADVANCE_TIME', seconds: 90 })
  state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
  state = transitionRuntimeState(state, { type: 'RESUME' })
  state = transitionRuntimeState(state, { type: 'ADVANCE_TIME', seconds: 240 })
  state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
  state = transitionRuntimeState(state, { type: 'RESUME' })
  state = transitionRuntimeState(state, { type: 'ADVANCE_TIME', seconds: 60 })
  state = transitionRuntimeState(state, { type: 'APPROVE' })
  return transitionRuntimeState(state, { type: 'ADVANCE_TIME', seconds: 45 })
}

describe('pure runtime selectors', () => {
  it('derives the complete idle view model without mutating state', () => {
    const idle = createInitialRuntimeState()
    const view = selectRuntimeViewModel(idle)

    expect(view).toMatchObject({
      mode: 'presenter',
      playbackStatus: 'idle',
      currentMoment: null,
      currentSceneId: null,
      currentStage: null,
      toolActivity: 0,
      artifactsProduced: 0,
      activeAgentCount: 0,
      conflictStatus: 'neutral',
    })
    expect(view.stages.every((stage) => stage.state === 'upcoming')).toBe(true)
    expect(view.artifacts.every((artifact) => artifact.status === 'locked')).toBe(true)
    expect(view.controls).toEqual({
      canStart: true,
      canPause: false,
      canResume: false,
      canNextMoment: false,
      canRestart: true,
      canInjectFailure: false,
      canApprove: false,
      canSelectPresenter: true,
      canSelectAuto: true,
    })
    expect(idle).toEqual(createInitialRuntimeState())
  })

  it('projects visible events in authoritative reveal order', () => {
    const state = autoAt(300)
    expect(selectVisibleEvents(state).map((event) => event.id)).toEqual([
      'evt-1',
      'evt-2',
      'evt-6',
      'evt-3',
      'evt-7',
      'evt-4',
      'evt-8',
    ])
  })

  it('derives artifact pending and approved presentation', () => {
    const autoM13 = autoAt(360)
    expect(
      selectArtifacts(autoM13).find((artifact) => artifact.id === 'artifact-approval')
        ?.status,
    ).toBe('pending')

    const autoM14 = autoAt(390)
    expect(
      selectArtifacts(autoM14).find((artifact) => artifact.id === 'artifact-approval')
        ?.status,
    ).toBe('approved')
  })

  it('derives approval, failure, recovery, recovered, and recommendation context', () => {
    let presenter = transitionRuntimeState(createInitialRuntimeState(), { type: 'START' })
    presenter = transitionRuntimeState(presenter, { type: 'ADVANCE_TIME', seconds: 90 })
    presenter = transitionRuntimeState(presenter, { type: 'RESUME' })
    presenter = transitionRuntimeState(presenter, { type: 'ADVANCE_TIME', seconds: 240 })
    presenter = transitionRuntimeState(presenter, { type: 'RESUME' })
    presenter = transitionRuntimeState(presenter, { type: 'ADVANCE_TIME', seconds: 60 })
    expect(selectContext(presenter).type).toBe('approval')

    expect(selectContext(autoAt(435)).type).toBe('failure')
    expect(selectContext(autoAt(455)).type).toBe('recovery')
    expect(selectContext(autoAt(480)).type).toBe('recovered')
    expect(selectContext(autoAt(540)).type).toBe('recommendation')
  })

  it('derives exact timer text and control availability at gates', () => {
    const failed = autoAt(435)
    expect(selectTimer(failed)).toMatchObject({
      elapsedSeconds: 435,
      totalSeconds: 600,
      remainingSeconds: 20,
      elapsedText: '07:15',
      totalText: '10:00',
      active: true,
    })
    expect(selectControlAvailability(failed)).toEqual({
      canStart: false,
      canPause: false,
      canResume: false,
      canNextMoment: false,
      canRestart: true,
      canInjectFailure: false,
      canApprove: false,
      canSelectPresenter: false,
      canSelectAuto: false,
    })
  })

  it('allows only failure injection and restart at the M15 Presenter gate', () => {
    const waiting = presenterAtFailureGate()
    expect(waiting.playbackStatus).toBe('waiting_failure_injection')
    expect(selectControlAvailability(waiting)).toEqual({
      canStart: false,
      canPause: false,
      canResume: false,
      canNextMoment: false,
      canRestart: true,
      canApprove: false,
      canInjectFailure: true,
      canSelectPresenter: false,
      canSelectAuto: false,
    })
  })

  it('derives stable completed metrics and controls', () => {
    const view = selectRuntimeViewModel(simulateAutoRun())
    expect(view).toMatchObject({
      playbackStatus: 'completed',
      currentSceneId: 'scene-resolution',
      currentStage: 'Resolution',
      toolActivity: 12,
      artifactsProduced: 4,
      activeAgentCount: 4,
      conflictStatus: 'resolved',
    })
    expect(view.context.type).toBe('recommendation')
    expect(view.controls.canRestart).toBe(true)
    expect(view.controls.canSelectPresenter).toBe(true)
    expect(view.controls.canSelectAuto).toBe(true)
    expect(view.controls.canStart).toBe(false)
  })
})
