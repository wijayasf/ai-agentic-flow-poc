import { useCallback, useEffect, useMemo, useReducer } from 'react'
import type { DemoMode } from '../domain/runtime-fixtures/types'
import {
  createInitialRuntimeState,
  runtimeReducer,
  selectRuntimeViewModel,
} from '../domain/runtime'
import type { RuntimeController } from './types'

const TIMER_TICK_MILLISECONDS = 1_000
const TIMER_TICK_SECONDS = 1
const AUTO_APPROVE_DELAY_MILLISECONDS = 10_000
const AUTO_LEARNING_PAUSE_MILLISECONDS = 8_000
const LEARNING_PAUSE_MOMENT_ID = 'M20' as const

export function useRuntimeController(): RuntimeController {
  const [state, dispatch] = useReducer(
    runtimeReducer,
    undefined,
    createInitialRuntimeState,
  )

  useEffect(() => {
    if (!state.timerActive) return undefined

    const intervalId = window.setInterval(() => {
      dispatch({ type: 'ADVANCE_TIME', seconds: TIMER_TICK_SECONDS })
    }, TIMER_TICK_MILLISECONDS)

    return () => window.clearInterval(intervalId)
  }, [state.timerActive])

  // Auto Mode: automatically approve after 10 wall-clock seconds at the approval gate.
  // The timeline timer is frozen during waiting_approval, so a dedicated one-shot
  // timeout drives the countdown. Cleanup fires on any state change that removes
  // either condition (restart → idle, manual approve/reject, mode switch).
  useEffect(() => {
    if (state.mode !== 'auto') return undefined
    if (state.playbackStatus !== 'waiting_approval') return undefined

    const timeoutId = window.setTimeout(() => {
      dispatch({ type: 'APPROVE' })
    }, AUTO_APPROVE_DELAY_MILLISECONDS)

    return () => window.clearTimeout(timeoutId)
  }, [state.mode, state.playbackStatus])

  // Auto Mode: continue past the Learning pause after 8 wall-clock seconds.
  // The timeline timer is frozen during the Learning pause (paused at M20), so a
  // dedicated one-shot timeout drives continuation. The approval timeout and this
  // timeout are mutually exclusive: approval requires waiting_approval; this
  // requires paused at M20. Cleanup fires on restart, mode switch, or any state
  // change that removes the paused-at-M20 condition.
  useEffect(() => {
    if (state.mode !== 'auto') return undefined
    if (state.playbackStatus !== 'paused') return undefined
    if (state.currentMomentId !== LEARNING_PAUSE_MOMENT_ID) return undefined

    const timeoutId = window.setTimeout(() => {
      dispatch({ type: 'RESUME' })
    }, AUTO_LEARNING_PAUSE_MILLISECONDS)

    return () => window.clearTimeout(timeoutId)
  }, [state.mode, state.playbackStatus, state.currentMomentId])

  const selectMode = useCallback((mode: DemoMode) => {
    dispatch({ type: 'SELECT_MODE', mode })
  }, [])
  const start = useCallback(() => dispatch({ type: 'START' }), [])
  const pause = useCallback(() => dispatch({ type: 'PAUSE' }), [])
  const resume = useCallback(() => dispatch({ type: 'RESUME' }), [])
  const nextMoment = useCallback(() => dispatch({ type: 'NEXT_MOMENT' }), [])
  const restart = useCallback(() => dispatch({ type: 'RESTART' }), [])
  const approve = useCallback(() => dispatch({ type: 'APPROVE' }), [])
  const reject = useCallback(() => dispatch({ type: 'REJECT' }), [])
  const injectFailure = useCallback(
    () => dispatch({ type: 'INJECT_FAILURE' }),
    [],
  )

  const actions = useMemo(
    () => ({
      selectMode,
      start,
      pause,
      resume,
      nextMoment,
      restart,
      approve,
      reject,
      injectFailure,
    }),
    [
      approve,
      reject,
      injectFailure,
      nextMoment,
      pause,
      restart,
      resume,
      selectMode,
      start,
    ],
  )
  const viewModel = useMemo(() => selectRuntimeViewModel(state), [state])

  return { state, viewModel, actions }
}
