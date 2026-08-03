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

  useEffect(() => {
    return () => {
      controller.dispose()
    }
  }, [controller])

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
    }
  }, [controller, state.playbackStatus])

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
