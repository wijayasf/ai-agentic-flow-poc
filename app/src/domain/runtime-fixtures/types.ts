export const MOMENT_IDS = [
  'M01',
  'M02',
  'M03',
  'M04',
  'M05',
  'M06',
  'M07',
  'M08',
  'M09',
  'M10',
  'M11',
  'M12',
  'M13',
  'M14',
  'M15',
  'M16',
  'M17',
  'M18',
  'M19',
  'M20',
  'M21',
] as const

export const EVENT_IDS = [
  'evt-1',
  'evt-2',
  'evt-3',
  'evt-4',
  'evt-5',
  'evt-6',
  'evt-7',
  'evt-8',
  'evt-9',
  'evt-10',
  'evt-11',
  'evt-12',
] as const

export const EVENT_REVEAL_ORDER = [
  'evt-1',
  'evt-2',
  'evt-6',
  'evt-3',
  'evt-7',
  'evt-4',
  'evt-8',
  'evt-5',
  'evt-9',
  'evt-10',
  'evt-11',
  'evt-12',
] as const

export const ARTIFACT_IDS = [
  'artifact-summary',
  'artifact-conflict',
  'artifact-approval',
  'artifact-prevention',
] as const

export const AGENT_IDS = [
  'agent-customer-complaint',
  'agent-policy',
  'agent-workflow',
  'agent-finance',
] as const

export const SYSTEM_IDS = [
  'system-crm',
  'system-policy-repository',
  'system-sap-cx',
  'system-sap-s4hana',
] as const

export const SCENE_IDS = [
  'scene-intake',
  'scene-investigation',
  'scene-conflict',
  'scene-approval',
  'scene-failure-recovery',
  'scene-resolution',
] as const

export const RUNTIME_STAGES = [
  'Intake',
  'Investigation',
  'Conflict',
  'Approval',
  'Resolution',
] as const

export const APPROVED_EFFECT_TYPES = [
  'show_customer_context',
  'set_active_agents',
  'set_active_systems',
  'reveal_event',
  'make_artifact_available',
  'synchronize_investigation',
  'set_conflict_status',
  'hold_state',
  'show_resolution_plan',
  'set_approval_status',
  'set_artifact_status',
  'show_failure_injection_cue',
  'set_failure_status',
  'set_recovery_status',
  'set_recommendation_visible',
  'finalize_metrics',
  'hold_final_state',
] as const

export type MomentId = (typeof MOMENT_IDS)[number]
export type EventId = (typeof EVENT_IDS)[number]
export type ArtifactId = (typeof ARTIFACT_IDS)[number]
export type AgentId = (typeof AGENT_IDS)[number]
export type SystemId = (typeof SYSTEM_IDS)[number]
export type SceneId = (typeof SCENE_IDS)[number]
export type RuntimeStage = (typeof RUNTIME_STAGES)[number]
export type RuntimeEffectType = (typeof APPROVED_EFFECT_TYPES)[number]

export type DemoMode = 'presenter' | 'auto'
export type RuntimePlaybackStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'waiting_approval'
  | 'failed'
  | 'recovering'
  | 'completed'
export type RuntimeCompletionAction =
  | 'advance'
  | 'pause'
  | 'wait_for_approval'
  | 'wait_for_failure_injection'
  | 'inject_failure_and_advance'
  | 'complete'
export type ConflictStatus = 'neutral' | 'active' | 'resolved'
export type ApprovalStatus = 'not_required' | 'pending' | 'approved' | 'rejected'
export type FailureStatus = 'not_injected' | 'active' | 'recovered'
export type RecoveryStatus = 'not_started' | 'recovering' | 'completed'

export type RuntimeEntryEffect =
  | { readonly type: 'show_customer_context' }
  | { readonly type: 'set_active_agents'; readonly agentIds: readonly AgentId[] }
  | { readonly type: 'set_active_systems'; readonly systemIds: readonly SystemId[] }
  | { readonly type: 'reveal_event'; readonly eventId: EventId }
  | { readonly type: 'make_artifact_available'; readonly artifactId: ArtifactId }
  | { readonly type: 'synchronize_investigation' }
  | { readonly type: 'set_conflict_status'; readonly value: 'active' | 'resolved' }
  | { readonly type: 'hold_state' }
  | { readonly type: 'show_resolution_plan' }
  | { readonly type: 'set_approval_status'; readonly value: 'pending' | 'approved' }
  | {
      readonly type: 'set_artifact_status'
      readonly artifactId: ArtifactId
      readonly value: 'approved'
    }
  | { readonly type: 'show_failure_injection_cue' }
  | { readonly type: 'set_failure_status'; readonly value: 'active' | 'recovered' }
  | { readonly type: 'set_recovery_status'; readonly value: 'recovering' | 'completed' }
  | { readonly type: 'set_recommendation_visible'; readonly value: true }
  | { readonly type: 'finalize_metrics' }
  | { readonly type: 'hold_final_state' }

export interface RuntimeEvent {
  readonly id: EventId
  readonly time: string
  readonly agent: string
  readonly action: string
  readonly skill: string
  readonly output: string
}

export interface RuntimeMomentExpectedState {
  readonly playbackStatus: RuntimePlaybackStatus
  readonly activeAgentIds: readonly AgentId[]
  readonly activeSystemIds: readonly SystemId[]
  readonly conflictStatus: ConflictStatus
  readonly approvalStatus: ApprovalStatus
  readonly failureStatus: FailureStatus
  readonly recoveryStatus: RecoveryStatus
  readonly recommendationVisible: boolean
  readonly toolActivity: number
  readonly artifactsProduced: number
}

export interface RuntimeMoment {
  readonly id: MomentId
  readonly order: number
  readonly startSecond: number
  readonly durationSeconds: number
  readonly sceneId: SceneId
  readonly stage: RuntimeStage
  readonly title: string
  readonly description: string
  readonly entryEffects: readonly RuntimeEntryEffect[]
  readonly visibleEventIds: readonly EventId[]
  readonly availableArtifactIds: readonly ArtifactId[]
  readonly approvalGate: null | {
    readonly actions: readonly ['approve', 'reject']
    readonly continuationMomentId: MomentId
    readonly copy: string
  }
  readonly failureGate: null | {
    readonly action: 'inject_failure'
    readonly continuationMomentId: MomentId
    readonly failureCode: 'CONTRACTOR_REJECTED'
  }
  readonly completion: {
    readonly presenter: RuntimeCompletionAction
    readonly auto: RuntimeCompletionAction
  }
  readonly expected: RuntimeMomentExpectedState
}

export interface RuntimeStateFixture {
  readonly mode: DemoMode
  readonly playbackStatus: RuntimePlaybackStatus
  readonly currentMomentId: MomentId | null
  readonly completedMomentIds: readonly MomentId[]
  readonly elapsedSeconds: number
  readonly remainingSeconds: number | null
  readonly visibleEventIds: readonly EventId[]
  readonly availableArtifactIds: readonly ArtifactId[]
  readonly activeAgentIds: readonly AgentId[]
  readonly activeSystemIds: readonly SystemId[]
  readonly conflictStatus: ConflictStatus
  readonly approvalStatus: ApprovalStatus
  readonly failureStatus: FailureStatus
  readonly recoveryStatus: RecoveryStatus
  readonly recommendationVisible: boolean
  readonly timerActive: boolean
}

export interface RuntimeTimelineFixture {
  readonly version: string
  readonly scenarioId: string
  readonly totalScheduledSeconds: number
  readonly eventRevealOrder: readonly EventId[]
  readonly catalog: {
    readonly agentIds: readonly AgentId[]
    readonly systemIds: readonly SystemId[]
  }
  readonly approval: {
    readonly gateMomentId: MomentId
    readonly approvedMomentId: MomentId
    readonly continuationMomentId: MomentId
    readonly copy: string
    readonly numericAmountAllowed: false
  }
  readonly failureRecovery: {
    readonly cueMomentId: MomentId
    readonly failureMomentId: MomentId
    readonly recoveringMomentId: MomentId
    readonly recoveredMomentId: MomentId
    readonly failureCode: 'CONTRACTOR_REJECTED'
    readonly failureCopy: string
    readonly recoveryCopy: string
  }
  readonly recommendation: {
    readonly availableAtMomentId: MomentId
    readonly copy: string
  }
  readonly artifactAvailabilityRules: ReadonlyArray<{
    readonly artifactId: ArtifactId
    readonly availableAtMomentId: MomentId
    readonly approvedAtMomentId: MomentId | null
    readonly contentVisibleAtMomentId: MomentId
    readonly prerequisiteEventIds: readonly EventId[]
    readonly prerequisiteStage: RuntimeStage
  }>
  readonly moments: readonly RuntimeMoment[]
}

export interface RuntimeFixtureBundle {
  readonly index: Record<string, string>
  readonly events: { readonly events: readonly RuntimeEvent[] }
  readonly artifacts: {
    readonly artifacts: ReadonlyArray<{
      readonly id: ArtifactId
      readonly order: number
      readonly name: string
    }>
  }
  readonly scenario: {
    readonly id: string
    readonly totalDurationSeconds: number
    readonly stages: readonly RuntimeStage[]
    readonly scenes: ReadonlyArray<{
      readonly id: SceneId
      readonly stage: number
      readonly presenterPause: boolean
      readonly failureCode?: 'CONTRACTOR_REJECTED'
    }>
  }
  readonly timeline: RuntimeTimelineFixture
  readonly initialState: RuntimeStateFixture
  readonly finalState: RuntimeStateFixture
}
