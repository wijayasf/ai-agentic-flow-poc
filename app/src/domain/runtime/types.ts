import type {
  ArtifactId,
  DemoMode,
  RuntimeEvent,
  RuntimeMoment,
  RuntimePlaybackStatus,
  RuntimeStage,
  RuntimeStateFixture,
  SceneId,
} from '../runtime-fixtures/types'

export type RuntimeDomainPlaybackStatus =
  | RuntimePlaybackStatus
  | 'waiting_failure_injection'

export type RuntimeState = Omit<RuntimeStateFixture, 'playbackStatus'> & {
  readonly playbackStatus: RuntimeDomainPlaybackStatus
}

export type RuntimeAction =
  | { readonly type: 'SELECT_MODE'; readonly mode: DemoMode }
  | { readonly type: 'START' }
  | { readonly type: 'PAUSE' }
  | { readonly type: 'RESUME' }
  | { readonly type: 'NEXT_MOMENT' }
  | { readonly type: 'APPROVE' }
  | { readonly type: 'INJECT_FAILURE' }
  | { readonly type: 'ADVANCE_TIME'; readonly seconds: number }
  | { readonly type: 'RESTART' }

export interface RuntimeControlAvailability {
  readonly canStart: boolean
  readonly canPause: boolean
  readonly canResume: boolean
  readonly canNextMoment: boolean
  readonly canRestart: boolean
  readonly canInjectFailure: boolean
  readonly canApprove: boolean
  readonly canSelectPresenter: boolean
  readonly canSelectAuto: boolean
}

export type StagePresentationState = 'completed' | 'current' | 'upcoming'

export interface StagePresentation {
  readonly stage: RuntimeStage
  readonly state: StagePresentationState
}

export type ArtifactPresentationStatus = 'locked' | 'available' | 'pending' | 'approved'

export interface ArtifactPresentation {
  readonly id: ArtifactId
  readonly order: number
  readonly name: string
  readonly status: ArtifactPresentationStatus
}

export type RuntimeContext =
  | { readonly type: 'neutral'; readonly copy: null }
  | { readonly type: 'approval'; readonly copy: string }
  | { readonly type: 'failure'; readonly copy: string }
  | { readonly type: 'recovery'; readonly copy: string }
  | { readonly type: 'recovered'; readonly copy: string }
  | { readonly type: 'recommendation'; readonly copy: string }

export interface RuntimeTimerPresentation {
  readonly elapsedSeconds: number
  readonly totalSeconds: number
  readonly remainingSeconds: number | null
  readonly elapsedText: string
  readonly totalText: string
  readonly active: boolean
}

export interface RuntimeViewModel {
  readonly mode: DemoMode
  readonly playbackStatus: RuntimeState['playbackStatus']
  readonly currentMoment: RuntimeMoment | null
  readonly currentSceneId: SceneId | null
  readonly currentStage: RuntimeStage | null
  readonly stages: readonly StagePresentation[]
  readonly visibleEvents: readonly RuntimeEvent[]
  readonly toolActivity: number
  readonly artifacts: readonly ArtifactPresentation[]
  readonly artifactsProduced: number
  readonly activeAgentCount: number
  readonly conflictStatus: RuntimeState['conflictStatus']
  readonly context: RuntimeContext
  readonly timer: RuntimeTimerPresentation
  readonly controls: RuntimeControlAvailability
}
