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
  'M22',
  'M23',
  'M24',
  'M25',
  'M26',
  'M27',
  'M28',
  'M29',
  'M30',
  'M31',
  'M32',
  'M33',
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
  'evt-13',
  'evt-14',
  'evt-15',
  'evt-16',
  'evt-17',
  'evt-18',
  'evt-19',
] as const

export const EVENT_REVEAL_ORDER = [
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
  'evt-13',
  'evt-14',
  'evt-15',
  'evt-16',
  'evt-17',
  'evt-18',
  'evt-19',
] as const

export const ARTIFACT_IDS = [
  'artifact-complaint',
  'artifact-policy',
  'artifact-workflow',
  'artifact-finance',
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
  'scene-workflow',
  'scene-approval',
  'scene-resolution',
] as const

export const RUNTIME_STAGES = [
  'Intake',
  'Investigation',
  'Workflow',
  'Approval',
  'Resolution',
] as const

export const APPROVED_EFFECT_TYPES = [
  'show_customer_context',
  'set_active_agents',
  'set_active_systems',
  'reveal_event',
  'make_artifact_available',
  'set_active_specialist',
  'return_to_officer',
  'set_workflow_step',
  'set_approval_status',
  'set_artifact_status',
  'advance_approver',
  'send_customer_response',
  'hold_state',
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
  | 'completed'
export type RuntimeCompletionAction =
  | 'advance'
  | 'pause'
  | 'wait_for_approval'
  | 'complete'
export type ApprovalStatus = 'not_required' | 'pending' | 'approved' | 'rejected'
export type OfficerMode = 'standby' | 'active'
export type WorkflowStep = 0 | 1 | 2 | 3 | 4
export type ApproverIndex = 1 | 2 | 3 | 4

export type RuntimeEntryEffect =
  | { readonly type: 'show_customer_context' }
  | { readonly type: 'set_active_agents'; readonly agentIds: readonly AgentId[] }
  | { readonly type: 'set_active_systems'; readonly systemIds: readonly SystemId[] }
  | { readonly type: 'reveal_event'; readonly eventId: EventId }
  | { readonly type: 'make_artifact_available'; readonly artifactId: ArtifactId }
  | { readonly type: 'set_active_specialist'; readonly agentId: AgentId | null }
  | { readonly type: 'return_to_officer' }
  | { readonly type: 'set_workflow_step'; readonly step: WorkflowStep }
  | { readonly type: 'set_approval_status'; readonly value: 'pending' | 'approved' }
  | {
      readonly type: 'set_artifact_status'
      readonly artifactId: ArtifactId
      readonly value: 'approved'
    }
  | { readonly type: 'advance_approver'; readonly index: ApproverIndex }
  | { readonly type: 'send_customer_response' }
  | { readonly type: 'hold_state' }
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
  readonly activeSpecialistAgentId: AgentId | null
  readonly officerMode: OfficerMode
  readonly workflowStep: WorkflowStep
  readonly approversCompleted: 0 | 1 | 2 | 3 | 4
  readonly customerResponseSent: boolean
  readonly approvalStatus: ApprovalStatus
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
  readonly activeSpecialistAgentId: AgentId | null
  readonly officerMode: OfficerMode
  readonly workflowStep: WorkflowStep
  readonly approversCompleted: 0 | 1 | 2 | 3 | 4
  readonly customerResponseSent: boolean
  readonly approvalStatus: ApprovalStatus
  readonly timerActive: boolean
}

export interface ApproverDefinition {
  readonly index: ApproverIndex
  readonly name: string
  readonly role: string
  readonly momentId: MomentId
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
    readonly approvers: readonly ApproverDefinition[]
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
    }>
  }
  readonly timeline: RuntimeTimelineFixture
  readonly initialState: RuntimeStateFixture
  readonly finalState: RuntimeStateFixture
}
