import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runtimeFixtures } from '../domain/runtime-fixtures/loadRuntimeFixtures'
import { useRuntimeController } from './useRuntimeController'

describe('useRuntimeController', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with the exact Presenter idle state and selector controls', () => {
    const { result } = renderHook(() => useRuntimeController())

    expect(result.current.state).toEqual({
      ...runtimeFixtures.initialState,
      terminalOutcome: 'unresolved',
    })
    expect(result.current.viewModel.controls).toMatchObject({
      canStart: true,
      canRestart: true,
      canSelectPresenter: true,
      canSelectAuto: true,
    })
  })

  it('uses one interval lifecycle, freezes on pause, and cleans up on unmount', () => {
    const setIntervalSpy = vi.spyOn(window, 'setInterval')
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval')
    const { result, unmount } = renderHook(() => useRuntimeController())

    act(() => result.current.actions.start())
    expect(setIntervalSpy).toHaveBeenCalledTimes(1)

    act(() => vi.advanceTimersByTime(12_000))
    expect(result.current.state.elapsedSeconds).toBe(12)
    expect(setIntervalSpy).toHaveBeenCalledTimes(1)

    act(() => result.current.actions.pause())
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1)

    act(() => vi.advanceTimersByTime(30_000))
    expect(result.current.state.elapsedSeconds).toBe(12)

    act(() => result.current.actions.resume())
    expect(setIntervalSpy).toHaveBeenCalledTimes(2)
    unmount()
    expect(clearIntervalSpy).toHaveBeenCalledTimes(2)
  })

  it('Auto Mode auto-approves at exactly 10 seconds and completes the full flow', () => {
    const { result } = renderHook(() => useRuntimeController())

    act(() => result.current.actions.selectMode('auto'))
    act(() => result.current.actions.start())

    // M13 runs its 30-second duration then enters waiting_approval at t=390s
    act(() => vi.advanceTimersByTime(390_000))
    expect(result.current.state).toMatchObject({
      currentMomentId: 'M13',
      playbackStatus: 'waiting_approval',
      approvalStatus: 'pending',
      elapsedSeconds: 390,
      timerActive: false,
    })
    expect(result.current.viewModel.controls.canApprove).toBe(true)
    expect(result.current.viewModel.controls.canReject).toBe(true)

    // 9 seconds is not enough to trigger auto-approval
    act(() => vi.advanceTimersByTime(9_000))
    expect(result.current.state.playbackStatus).toBe('waiting_approval')
    expect(result.current.state.approvalStatus).toBe('pending')

    // At exactly 10 seconds the countdown fires
    act(() => vi.advanceTimersByTime(1_000))
    expect(result.current.state).toMatchObject({
      currentMomentId: 'M14',
      approvalStatus: 'approved',
      playbackStatus: 'running',
      timerActive: true,
    })

    // M14–M20 timeline (180s): runs then pauses at M20 for the 8-second Learning pause
    act(() => vi.advanceTimersByTime(180_000))
    expect(result.current.state).toMatchObject({
      currentMomentId: 'M20',
      playbackStatus: 'paused',
      elapsedSeconds: 570,
      timerActive: false,
    })

    // 8-second Learning pause: Auto Mode auto-continues via dedicated timeout
    act(() => vi.advanceTimersByTime(8_000))
    expect(result.current.state.playbackStatus).toBe('running')

    // M21 completes the remaining 30 seconds
    act(() => vi.advanceTimersByTime(30_000))
    expect(result.current.state).toEqual({
      ...runtimeFixtures.finalState,
      mode: 'auto',
      terminalOutcome: 'approved',
    })
    expect(result.current.viewModel.timer.elapsedText).toBe('10:00')
    expect(result.current.state.timerActive).toBe(false)
  })

  it('Presenter Mode does not auto-approve even after 10 seconds at the approval gate', () => {
    const { result } = renderHook(() => useRuntimeController())

    // Default mode is presenter
    act(() => result.current.actions.start())
    act(() => vi.advanceTimersByTime(90_000))
    act(() => result.current.actions.nextMoment())
    act(() => result.current.actions.resume())
    act(() => vi.advanceTimersByTime(240_000))
    act(() => result.current.actions.nextMoment())
    act(() => result.current.actions.resume())
    act(() => vi.advanceTimersByTime(60_000))

    expect(result.current.state).toMatchObject({
      currentMomentId: 'M13',
      playbackStatus: 'waiting_approval',
      mode: 'presenter',
    })

    // 30 seconds beyond the auto-approve window — no approval occurs in presenter mode
    act(() => vi.advanceTimersByTime(30_000))
    expect(result.current.state.playbackStatus).toBe('waiting_approval')
    expect(result.current.state.approvalStatus).toBe('pending')

    // Explicit Approve still works
    act(() => result.current.actions.approve())
    expect(result.current.state).toMatchObject({
      currentMomentId: 'M14',
      approvalStatus: 'approved',
    })
  })

  it('restart while auto-approval countdown is pending cancels the countdown', () => {
    const { result } = renderHook(() => useRuntimeController())

    act(() => result.current.actions.selectMode('auto'))
    act(() => result.current.actions.start())
    act(() => vi.advanceTimersByTime(390_000))
    expect(result.current.state.playbackStatus).toBe('waiting_approval')

    // 5 seconds into the 10-second window
    act(() => vi.advanceTimersByTime(5_000))
    expect(result.current.state.playbackStatus).toBe('waiting_approval')

    // Restart clears the countdown
    act(() => result.current.actions.restart())
    expect(result.current.state.playbackStatus).toBe('idle')
    expect(result.current.state.approvalStatus).toBe('not_required')

    // Advancing 10 more seconds produces no approval
    act(() => vi.advanceTimersByTime(10_000))
    expect(result.current.state.playbackStatus).toBe('idle')
  })

  it('honors every Presenter pause and gate before completing at 600 seconds', () => {
    const { result } = renderHook(() => useRuntimeController())

    act(() => result.current.actions.start())
    act(() => vi.advanceTimersByTime(90_000))
    expect(result.current.state).toMatchObject({
      currentMomentId: 'M03',
      playbackStatus: 'paused',
      elapsedSeconds: 90,
    })

    act(() => result.current.actions.nextMoment())
    expect(result.current.state).toMatchObject({
      currentMomentId: 'M04',
      playbackStatus: 'paused',
    })
    act(() => result.current.actions.resume())
    act(() => vi.advanceTimersByTime(240_000))
    expect(result.current.state).toMatchObject({
      currentMomentId: 'M11',
      playbackStatus: 'paused',
      elapsedSeconds: 330,
    })

    act(() => result.current.actions.nextMoment())
    act(() => result.current.actions.resume())
    act(() => vi.advanceTimersByTime(60_000))
    expect(result.current.state).toMatchObject({
      currentMomentId: 'M13',
      playbackStatus: 'waiting_approval',
      elapsedSeconds: 390,
    })
    expect(result.current.viewModel.controls.canApprove).toBe(true)

    act(() => result.current.actions.approve())
    act(() => vi.advanceTimersByTime(45_000))
    expect(result.current.state).toMatchObject({
      currentMomentId: 'M15',
      playbackStatus: 'waiting_failure_injection',
      elapsedSeconds: 435,
    })
    expect(result.current.viewModel.controls.canInjectFailure).toBe(true)

    act(() => result.current.actions.injectFailure())
    expect(result.current.state).toMatchObject({
      currentMomentId: 'M16',
      playbackStatus: 'failed',
      remainingSeconds: 20,
    })

    // M16–M20 timeline (135s): contractor recovery → Learning pause
    act(() => vi.advanceTimersByTime(135_000))
    expect(result.current.state).toMatchObject({
      currentMomentId: 'M20',
      playbackStatus: 'paused',
      elapsedSeconds: 570,
    })

    // Explicit Continue at the Learning pause
    act(() => result.current.actions.resume())

    // M21 completes the final 30 seconds
    act(() => vi.advanceTimersByTime(30_000))

    expect(result.current.state).toEqual({
      ...runtimeFixtures.finalState,
      terminalOutcome: 'approved',
    })
    expect(result.current.state.elapsedSeconds).toBe(600)
  })

  it('restarts cleanly, clears time ownership, and preserves the selected mode', () => {
    const { result } = renderHook(() => useRuntimeController())

    act(() => result.current.actions.selectMode('auto'))
    act(() => result.current.actions.start())
    act(() => vi.advanceTimersByTime(42_000))
    act(() => result.current.actions.restart())

    expect(result.current.state).toEqual({
      ...runtimeFixtures.initialState,
      mode: 'auto',
      terminalOutcome: 'unresolved',
    })
    expect(result.current.state.timerActive).toBe(false)
    expect(result.current.viewModel.earlyStory).toMatchObject({
      phase: 'idle',
      isIdle: true,
      showCustomerTyping: false,
      showCustomerIdentity: false,
      showCustomerMessage: false,
      visibleAttachmentCount: 0,
      showAiTyping: false,
      showAiAcknowledgement: false,
    })
  })

  it('records rejection once, stops timing, and fully clears it on restart', () => {
    const { result } = renderHook(() => useRuntimeController())

    act(() => result.current.actions.selectMode('auto'))
    act(() => result.current.actions.start())
    act(() => vi.advanceTimersByTime(390_000))
    act(() => result.current.actions.reject())

    expect(result.current.state).toMatchObject({
      playbackStatus: 'completed',
      approvalStatus: 'rejected',
      terminalOutcome: 'escalated',
      timerActive: false,
    })
    const rejected = result.current.state
    act(() => result.current.actions.reject())
    act(() => result.current.actions.approve())
    expect(result.current.state).toBe(rejected)

    act(() => result.current.actions.restart())
    expect(result.current.state).toEqual({
      ...runtimeFixtures.initialState,
      mode: 'auto',
      terminalOutcome: 'unresolved',
    })
  })
})

describe('RS-05 Learning pause (Scene 6)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function renderAuto() {
    const { result } = renderHook(() => useRuntimeController())
    act(() => result.current.actions.selectMode('auto'))
    return result
  }

  function advanceToAutoLearningPause(result: ReturnType<typeof renderAuto>) {
    act(() => result.current.actions.start())
    act(() => vi.advanceTimersByTime(390_000))  // → M13 approval gate
    act(() => vi.advanceTimersByTime(10_000))    // → auto-approve → M14
    act(() => vi.advanceTimersByTime(180_000))   // → M20 Learning pause
  }

  it('Presenter Mode pauses at the Learning moment (M20)', () => {
    const { result } = renderHook(() => useRuntimeController())

    act(() => result.current.actions.start())
    act(() => vi.advanceTimersByTime(90_000))
    act(() => result.current.actions.nextMoment())
    act(() => result.current.actions.resume())
    act(() => vi.advanceTimersByTime(240_000))
    act(() => result.current.actions.nextMoment())
    act(() => result.current.actions.resume())
    act(() => vi.advanceTimersByTime(60_000))
    act(() => result.current.actions.approve())
    act(() => vi.advanceTimersByTime(45_000))
    act(() => result.current.actions.injectFailure())
    act(() => vi.advanceTimersByTime(135_000))

    expect(result.current.state).toMatchObject({
      currentMomentId: 'M20',
      playbackStatus: 'paused',
      elapsedSeconds: 570,
      timerActive: false,
    })
    expect(result.current.viewModel.controls.canResume).toBe(true)
    expect(result.current.viewModel.controls.canStart).toBe(false)
  })

  it('Presenter Mode does not continue automatically at the Learning pause', () => {
    const { result } = renderHook(() => useRuntimeController())

    act(() => result.current.actions.start())
    act(() => vi.advanceTimersByTime(90_000))
    act(() => result.current.actions.nextMoment())
    act(() => result.current.actions.resume())
    act(() => vi.advanceTimersByTime(240_000))
    act(() => result.current.actions.nextMoment())
    act(() => result.current.actions.resume())
    act(() => vi.advanceTimersByTime(60_000))
    act(() => result.current.actions.approve())
    act(() => vi.advanceTimersByTime(45_000))
    act(() => result.current.actions.injectFailure())
    act(() => vi.advanceTimersByTime(135_000))
    expect(result.current.state.playbackStatus).toBe('paused')

    // Advance well past the 8-second auto timeout — presenter mode must not continue
    act(() => vi.advanceTimersByTime(30_000))
    expect(result.current.state.playbackStatus).toBe('paused')
    expect(result.current.state.currentMomentId).toBe('M20')
  })

  it('Explicit Continue (Resume) at Learning pause progresses to completion', () => {
    const { result } = renderHook(() => useRuntimeController())

    act(() => result.current.actions.start())
    act(() => vi.advanceTimersByTime(90_000))
    act(() => result.current.actions.nextMoment())
    act(() => result.current.actions.resume())
    act(() => vi.advanceTimersByTime(240_000))
    act(() => result.current.actions.nextMoment())
    act(() => result.current.actions.resume())
    act(() => vi.advanceTimersByTime(60_000))
    act(() => result.current.actions.approve())
    act(() => vi.advanceTimersByTime(45_000))
    act(() => result.current.actions.injectFailure())
    act(() => vi.advanceTimersByTime(135_000))
    expect(result.current.state.currentMomentId).toBe('M20')

    act(() => result.current.actions.resume())
    expect(result.current.state.currentMomentId).toBe('M21')
    expect(result.current.state.playbackStatus).toBe('running')

    act(() => vi.advanceTimersByTime(30_000))
    expect(result.current.state.playbackStatus).toBe('completed')
    expect(result.current.state.terminalOutcome).toBe('approved')
  })

  it('Continue at Learning pause triggers progression only once', () => {
    const { result } = renderHook(() => useRuntimeController())

    act(() => result.current.actions.start())
    act(() => vi.advanceTimersByTime(90_000))
    act(() => result.current.actions.nextMoment())
    act(() => result.current.actions.resume())
    act(() => vi.advanceTimersByTime(240_000))
    act(() => result.current.actions.nextMoment())
    act(() => result.current.actions.resume())
    act(() => vi.advanceTimersByTime(60_000))
    act(() => result.current.actions.approve())
    act(() => vi.advanceTimersByTime(45_000))
    act(() => result.current.actions.injectFailure())
    act(() => vi.advanceTimersByTime(135_000))

    act(() => result.current.actions.resume())
    const afterResume = result.current.state
    expect(afterResume.currentMomentId).toBe('M21')

    // Second resume at M21 (while running) does nothing — not paused
    act(() => result.current.actions.resume())
    expect(result.current.state).toBe(afterResume)
  })

  it('Auto Mode reaches the Learning pause at M20', () => {
    const result = renderAuto()
    advanceToAutoLearningPause(result)

    expect(result.current.state).toMatchObject({
      currentMomentId: 'M20',
      playbackStatus: 'paused',
      elapsedSeconds: 570,
      timerActive: false,
    })
  })

  it('Auto Mode does not continue before 8 seconds at the Learning pause', () => {
    const result = renderAuto()
    advanceToAutoLearningPause(result)
    expect(result.current.state.playbackStatus).toBe('paused')

    act(() => vi.advanceTimersByTime(7_999))
    expect(result.current.state.playbackStatus).toBe('paused')
    expect(result.current.state.currentMomentId).toBe('M20')
  })

  it('Auto Mode continues at exactly 8 seconds and enters M21 running', () => {
    const result = renderAuto()
    advanceToAutoLearningPause(result)
    expect(result.current.state.playbackStatus).toBe('paused')

    act(() => vi.advanceTimersByTime(8_000))
    expect(result.current.state).toMatchObject({
      currentMomentId: 'M21',
      playbackStatus: 'running',
      timerActive: true,
    })
  })

  it('Auto Mode continues only once — no duplicate continuation after M21 starts', () => {
    const result = renderAuto()
    advanceToAutoLearningPause(result)

    act(() => vi.advanceTimersByTime(8_000))
    const stateAfterContinue = result.current.state
    expect(stateAfterContinue.currentMomentId).toBe('M21')

    // Advance past another 8s — no second RESUME fires (M21 is not paused)
    act(() => vi.advanceTimersByTime(8_000))
    expect(result.current.state.currentMomentId).toBe('M21')
  })

  it('Restart during the Learning pause cancels the 8-second timeout', () => {
    const result = renderAuto()
    advanceToAutoLearningPause(result)
    expect(result.current.state.currentMomentId).toBe('M20')

    act(() => result.current.actions.restart())
    expect(result.current.state.playbackStatus).toBe('idle')
    expect(result.current.state.mode).toBe('auto')

    // Advancing 10s should not trigger any Learning or approval continuation
    act(() => vi.advanceTimersByTime(10_000))
    expect(result.current.state.playbackStatus).toBe('idle')
  })

  it('Final completion remains reachable after the Learning pause', () => {
    const result = renderAuto()
    advanceToAutoLearningPause(result)

    act(() => vi.advanceTimersByTime(8_000))   // Learning timeout → M21
    act(() => vi.advanceTimersByTime(30_000))  // M21 → completion

    expect(result.current.state).toEqual({
      ...runtimeFixtures.finalState,
      mode: 'auto',
      terminalOutcome: 'approved',
    })
    expect(result.current.state.elapsedSeconds).toBe(600)
  })

  it('Learning pause occurs after contractor recovery (M18 before M20)', () => {
    const result = renderAuto()
    advanceToAutoLearningPause(result)

    expect(result.current.state.failureStatus).toBe('recovered')
    expect(result.current.state.recoveryStatus).toBe('completed')
    expect(result.current.state.currentMomentId).toBe('M20')
    expect(result.current.state.completedMomentIds).toContain('M18')
  })

  it('Learning pause occurs after the approved final outcome artifacts are available', () => {
    const result = renderAuto()
    advanceToAutoLearningPause(result)

    expect(result.current.state.approvalStatus).toBe('approved')
    expect(result.current.state.recommendationVisible).toBe(true)
    expect(result.current.state.availableArtifactIds).toContain('artifact-prevention')
    // All 4 artifacts produced; recommendation visible; context = recommendation
    // (terminalOutcome becomes 'approved' only after M21 completes)
    expect(result.current.viewModel.artifactsProduced).toBe(4)
    expect(result.current.viewModel.context.type).toBe('recommendation')
  })

  it('Approval 10-second timeout behavior is unchanged', () => {
    const result = renderAuto()
    act(() => result.current.actions.start())
    act(() => vi.advanceTimersByTime(390_000))
    expect(result.current.state.playbackStatus).toBe('waiting_approval')

    act(() => vi.advanceTimersByTime(9_000))
    expect(result.current.state.playbackStatus).toBe('waiting_approval')

    act(() => vi.advanceTimersByTime(1_000))
    expect(result.current.state).toMatchObject({
      currentMomentId: 'M14',
      approvalStatus: 'approved',
      playbackStatus: 'running',
    })
  })

  it('Contractor rejection and rerouting behavior is unchanged through the Learning pause', () => {
    const result = renderAuto()
    advanceToAutoLearningPause(result)

    // M16 (CONTRACTOR_REJECTED) and M17 (TASK_REROUTED) are in completedMomentIds
    expect(result.current.state.completedMomentIds).toContain('M16')
    expect(result.current.state.completedMomentIds).toContain('M17')
    expect(result.current.state.failureStatus).toBe('recovered')

    const events = result.current.viewModel.visibleEvents
    expect(events.find((e) => e.id === 'evt-11')?.output).toBe('CONTRACTOR_REJECTED')
    expect(events.find((e) => e.id === 'evt-12')?.output).toBe('TASK_REROUTED')
  })

  it('Three deterministic Auto Mode runs produce the same final state through Learning pause', () => {
    const states: ReturnType<typeof renderAuto>[] = []
    for (let i = 0; i < 3; i++) {
      const r = renderAuto()
      advanceToAutoLearningPause(r)
      act(() => vi.advanceTimersByTime(8_000))
      act(() => vi.advanceTimersByTime(30_000))
      states.push(r)
    }
    expect(states[0].current.state).toEqual(states[1].current.state)
    expect(states[1].current.state).toEqual(states[2].current.state)
    expect(states[0].current.state.playbackStatus).toBe('completed')
  })
})
