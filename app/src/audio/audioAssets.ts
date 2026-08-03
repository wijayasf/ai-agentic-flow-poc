const base = import.meta.env.BASE_URL

export const AUDIO_ASSETS = {
  ambientMusic: `${base}assets/audio/ambient-brighter-plans.mp3`,
  approvalNotify: `${base}assets/audio/chime-sino.mp3`,
  approveConfirm: `${base}assets/audio/chime-bell.mp3`,
  caseComplete: `${base}assets/audio/chime-bell.mp3`,
} as const

export const AUDIO_LEVELS = {
  musicTarget: 0.12,
  musicDucked: 0.04,
  approvalNotify: 0.32,
  approveConfirm: 0.24,
  // Softer than approveConfirm on purpose: this is the closure accent,
  // not the click acknowledgement. Audience should feel "chain settled",
  // not "another action just happened".
  approvalChainComplete: 0.16,
  caseComplete: 0.28,
} as const

export const AUDIO_TIMING_MS = {
  musicFadeIn: 2400,
  musicFadeOut: 1400,
  musicFadeEnd: 3000,
  musicDuck: 260,
  musicRestore: 900,
  chimeCooldown: 900,
  duckHold: 1600,
} as const
