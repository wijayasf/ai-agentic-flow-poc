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
