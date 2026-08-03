import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RuntimeControllerActions } from '../runtime'
import type { RuntimeState } from '../domain/runtime'
import { createAudioController } from './AudioController'

const MUTE_STORAGE_KEY = 'ai-agentic-flow.audio.muted'

function readInitialMuted(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(MUTE_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function persistMuted(muted: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(MUTE_STORAGE_KEY, muted ? 'true' : 'false')
  } catch {
    /* ignore */
  }
}

export interface AudioSession {
  readonly muted: boolean
  readonly toggleMute: () => void
  readonly wrapActions: (actions: RuntimeControllerActions) => RuntimeControllerActions
}

export function useAudioSession(state: RuntimeState): AudioSession {
  const [controller] = useState(createAudioController)

  const [muted, setMuted] = useState<boolean>(readInitialMuted)

  useEffect(() => {
    controller.setMuted(muted)
    persistMuted(muted)
  }, [controller, muted])

  // No unmount-cleanup dispose here: React 18 StrictMode dev double-invokes
  // effect cleanup at mount, which would tear down the <audio> elements
  // (src='' -> subsequent play() rejects NotSupportedError). The controller
  // owns three lightweight <audio> elements that live for the page lifetime
  // and are GC'd on real page unload.

  const prevPlaybackStatusRef = useRef(state.playbackStatus)
  useEffect(() => {
    const prev = prevPlaybackStatusRef.current
    prevPlaybackStatusRef.current = state.playbackStatus
    if (prev === state.playbackStatus) return
    if (prev !== 'waiting_approval' && state.playbackStatus === 'waiting_approval') {
      controller.playApprovalNotify()
    }
    if (prev !== 'completed' && state.playbackStatus === 'completed') {
      controller.playCaseComplete()
      // Keynote-style wrap: chime punctuates, music gracefully retires while
      // the presenter closes on the outcome. No more looping into silence.
      controller.endMusic()
    }
  }, [controller, state.playbackStatus])

  // Closure accent when the final approver signs off. Fires on the rising
  // edge 0..3 -> 4 only, so Restart (4 -> 0) is silent and re-renders at
  // the settled value are silent. Uses the same useRef-diff pattern as
  // playbackStatus above; StrictMode-safe.
  const prevApproversCompletedRef = useRef(state.approversCompleted)
  useEffect(() => {
    const prev = prevApproversCompletedRef.current
    prevApproversCompletedRef.current = state.approversCompleted
    if (prev === state.approversCompleted) return
    if (prev !== 4 && state.approversCompleted === 4) {
      controller.playApprovalChainComplete()
    }
  }, [controller, state.approversCompleted])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
      if (event.key !== 'm' && event.key !== 'M') return
      const target = event.target as HTMLElement | null
      if (target !== null) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        if (target.isContentEditable) return
      }
      event.preventDefault()
      setMuted((current) => !current)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const toggleMute = useCallback(() => {
    setMuted((current) => !current)
  }, [])

  const wrapActions = useCallback(
    (actions: RuntimeControllerActions): RuntimeControllerActions => ({
      ...actions,
      start: () => {
        controller.startMusic()
        actions.start()
      },
      restart: () => {
        controller.stopMusic()
        actions.restart()
      },
      approve: () => {
        controller.playApproveConfirm()
        actions.approve()
      },
    }),
    [controller],
  )

  return useMemo(
    () => ({
      muted,
      toggleMute,
      wrapActions,
    }),
    [muted, toggleMute, wrapActions],
  )
}
