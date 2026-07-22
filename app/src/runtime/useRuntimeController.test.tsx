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

    expect(result.current.state).toEqual(runtimeFixtures.initialState)
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

  it('completes Auto Mode at exactly 10:00 with one active timer at a time', () => {
    const { result } = renderHook(() => useRuntimeController())

    act(() => result.current.actions.selectMode('auto'))
    act(() => result.current.actions.start())
    act(() => vi.advanceTimersByTime(600_000))

    expect(result.current.state).toEqual({
      ...runtimeFixtures.finalState,
      mode: 'auto',
    })
    expect(result.current.viewModel.timer.elapsedText).toBe('10:00')
    expect(result.current.state.timerActive).toBe(false)
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
    act(() => vi.advanceTimersByTime(165_000))

    expect(result.current.state).toEqual(runtimeFixtures.finalState)
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
    })
    expect(result.current.state.timerActive).toBe(false)
  })
})
