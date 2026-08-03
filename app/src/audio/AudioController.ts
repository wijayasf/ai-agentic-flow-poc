import { AUDIO_ASSETS, AUDIO_LEVELS, AUDIO_TIMING_MS } from './audioAssets'

type FadeHandle = { cancel: () => void }

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

function fadeVolume(
  el: HTMLAudioElement,
  to: number,
  durationMs: number,
  onDone?: () => void,
): FadeHandle {
  if (!isBrowser() || typeof window.requestAnimationFrame !== 'function') {
    el.volume = Math.max(0, Math.min(1, to))
    onDone?.()
    return { cancel: () => {} }
  }
  const from = el.volume
  const start = nowMs()
  let rafId = 0
  let cancelled = false
  const step = () => {
    if (cancelled) return
    const t = durationMs <= 0 ? 1 : Math.min(1, (nowMs() - start) / durationMs)
    const next = from + (to - from) * t
    el.volume = Math.max(0, Math.min(1, next))
    if (t < 1) {
      rafId = window.requestAnimationFrame(step)
    } else if (onDone !== undefined) {
      onDone()
    }
  }
  rafId = window.requestAnimationFrame(step)
  return {
    cancel: () => {
      cancelled = true
      if (rafId !== 0) window.cancelAnimationFrame(rafId)
    },
  }
}

function tryCreateAudio(src: string, options?: {
  readonly loop?: boolean
  readonly preload?: 'auto' | 'metadata' | 'none'
}): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null
  try {
    const el = new Audio(src)
    el.loop = options?.loop ?? false
    el.preload = options?.preload ?? 'auto'
    el.crossOrigin = 'anonymous'
    el.volume = 0
    try { el.load() } catch { /* noop */ }
    return el
  } catch {
    return null
  }
}

function safePlay(el: HTMLAudioElement): Promise<void> {
  try {
    const result = el.play()
    if (result === undefined) return Promise.resolve()
    return result.then(
      () => undefined,
      () => undefined,
    )
  } catch {
    return Promise.resolve()
  }
}

export interface AudioController {
  readonly setMuted: (muted: boolean) => void
  readonly startMusic: () => void
  readonly stopMusic: () => void
  readonly endMusic: () => void
  readonly playApprovalNotify: () => void
  readonly playApproveConfirm: () => void
  readonly playApprovalChainComplete: () => void
  readonly playCaseComplete: () => void
}

export function createAudioController(): AudioController {
  const music = tryCreateAudio(AUDIO_ASSETS.ambientMusic, { loop: true })
  const approvalNotify = tryCreateAudio(AUDIO_ASSETS.approvalNotify)
  const approveConfirm = tryCreateAudio(AUDIO_ASSETS.approveConfirm)
  // Dedicated element so approve-click and chain-complete never fight over
  // currentTime / volume, even though they share the same underlying MP3.
  const approvalChainComplete = tryCreateAudio(AUDIO_ASSETS.approveConfirm)
  const caseComplete = tryCreateAudio(AUDIO_ASSETS.caseComplete)

  let muted = false
  let musicIntent: 'stopped' | 'playing' = 'stopped'
  let musicFade: FadeHandle | null = null
  let duckFade: FadeHandle | null = null
  let duckHoldTimer: number | null = null
  let lastChimeAt = 0

  const clearDuckHold = () => {
    if (duckHoldTimer !== null && isBrowser()) {
      window.clearTimeout(duckHoldTimer)
      duckHoldTimer = null
    }
  }

  const cancelMusicFade = () => {
    if (musicFade !== null) {
      musicFade.cancel()
      musicFade = null
    }
  }

  const cancelDuckFade = () => {
    if (duckFade !== null) {
      duckFade.cancel()
      duckFade = null
    }
    clearDuckHold()
  }

  const musicTargetVolume = (): number => (muted ? 0 : AUDIO_LEVELS.musicTarget)

  const applyMuteState = () => {
    if (music === null) return
    if (muted) {
      cancelMusicFade()
      cancelDuckFade()
      music.volume = 0
    } else if (musicIntent === 'playing') {
      cancelMusicFade()
      musicFade = fadeVolume(music, musicTargetVolume(), AUDIO_TIMING_MS.musicRestore)
    }
  }

  const duckThenRestore = () => {
    if (music === null) return
    if (musicIntent !== 'playing' || muted) return
    cancelDuckFade()
    duckFade = fadeVolume(music, AUDIO_LEVELS.musicDucked, AUDIO_TIMING_MS.musicDuck)
    duckHoldTimer = isBrowser()
      ? window.setTimeout(() => {
          duckHoldTimer = null
          if (music === null || muted || musicIntent !== 'playing') return
          duckFade = fadeVolume(music, musicTargetVolume(), AUDIO_TIMING_MS.musicRestore)
        }, AUDIO_TIMING_MS.duckHold)
      : null
  }

  const playChime = (el: HTMLAudioElement | null, volume: number) => {
    if (el === null) return
    if (muted) return
    const t = nowMs()
    if (t - lastChimeAt < AUDIO_TIMING_MS.chimeCooldown) return
    lastChimeAt = t
    try { el.currentTime = 0 } catch { /* seek not supported before load */ }
    el.volume = Math.max(0, Math.min(1, volume))
    void safePlay(el)
    duckThenRestore()
  }

  const startMusic = () => {
    if (music === null) return
    musicIntent = 'playing'
    cancelMusicFade()
    cancelDuckFade()
    if (music.paused) {
      try { music.currentTime = 0 } catch { /* noop */ }
      music.volume = 0
      void safePlay(music)
    }
    musicFade = fadeVolume(music, musicTargetVolume(), AUDIO_TIMING_MS.musicFadeIn)
  }

  const fadeMusicToStop = (fadeMs: number) => {
    if (music === null) return
    musicIntent = 'stopped'
    cancelDuckFade()
    cancelMusicFade()
    const el = music
    musicFade = fadeVolume(el, 0, fadeMs, () => {
      try { el.pause() } catch { /* noop */ }
      try { el.currentTime = 0 } catch { /* noop */ }
    })
  }

  const stopMusic = () => fadeMusicToStop(AUDIO_TIMING_MS.musicFadeOut)
  const endMusic = () => fadeMusicToStop(AUDIO_TIMING_MS.musicFadeEnd)

  const setMuted = (next: boolean) => {
    if (muted === next) return
    muted = next
    applyMuteState()
  }

  return {
    setMuted,
    startMusic,
    stopMusic,
    endMusic,
    playApprovalNotify: () => playChime(approvalNotify, AUDIO_LEVELS.approvalNotify),
    playApproveConfirm: () => playChime(approveConfirm, AUDIO_LEVELS.approveConfirm),
    playApprovalChainComplete: () => playChime(approvalChainComplete, AUDIO_LEVELS.approvalChainComplete),
    playCaseComplete: () => playChime(caseComplete, AUDIO_LEVELS.caseComplete),
  }
}
