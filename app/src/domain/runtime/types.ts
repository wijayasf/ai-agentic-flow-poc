import type {
  AgentId,
  ApprovalStatus,
  ArtifactId,
  DemoMode,
  OfficerMode,
  RuntimeMoment,
  RuntimePlaybackStatus,
  RuntimeStage,
  RuntimeStateFixture,
  SceneId,
  WorkflowStep,
} from '../runtime-fixtures/types'

export type RuntimeDomainPlaybackStatus = RuntimePlaybackStatus

export type TerminalOutcome = 'unresolved' | 'approved' | 'escalated'

export type RuntimeState = RuntimeStateFixture & {
  readonly terminalOutcome: TerminalOutcome
}

export type RuntimeAction =
  | { readonly type: 'SELECT_MODE'; readonly mode: DemoMode }
  | { readonly type: 'START' }
  | { readonly type: 'PAUSE' }
  | { readonly type: 'RESUME' }
  | { readonly type: 'NEXT_MOMENT' }
  | { readonly type: 'APPROVE' }
  | { readonly type: 'REJECT' }
  | { readonly type: 'ADVANCE_TIME'; readonly seconds: number }
  | { readonly type: 'RESTART' }

export interface RuntimeControlAvailability {
  readonly canStart: boolean
  readonly canPause: boolean
  readonly canResume: boolean
  readonly canNextMoment: boolean
  readonly canRestart: boolean
  readonly canApprove: boolean
  readonly canReject: boolean
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
  | { readonly type: 'approving'; readonly copy: string }
  | { readonly type: 'resolution'; readonly copy: string }
  | { readonly type: 'recommendation'; readonly copy: string }

export interface RuntimeTimerPresentation {
  readonly elapsedSeconds: number
  readonly totalSeconds: number
  readonly remainingSeconds: number | null
  readonly elapsedText: string
  readonly totalText: string
  readonly active: boolean
}

export type EarlyStoryPhase =
  | 'idle'
  | 'customer_typing'
  | 'customer_identity'
  | 'customer_message'
  | 'leakage_photo'
  | 'handover_agreement'
  | 'payment_receipt'
  | 'ai_typing'
  | 'acknowledged'
  | 'investigation'

export interface EarlyStoryPresentation {
  readonly phase: EarlyStoryPhase
  readonly isIdle: boolean
  readonly showCustomerTyping: boolean
  readonly showCustomerIdentity: boolean
  readonly showCustomerMessage: boolean
  readonly visibleAttachmentCount: 0 | 1 | 2 | 3
  readonly showAiTyping: boolean
  readonly showAiAcknowledgement: boolean
  readonly showIntakeContext: boolean
  readonly workflowIntroduced: boolean
}

export type AgentLifecycleStatus =
  | 'waiting'
  | 'working'
  | 'needs_review'
  | 'awaiting_approval'
  | 'completed'
  | 'blocked'

export interface AgentLifecyclePresentation {
  readonly agentId: AgentId
  readonly status: AgentLifecycleStatus
}

export interface NowNextPresentation {
  readonly now: string
  readonly next: string | null
}

export type RuntimeFocusTarget =
  | 'customer-panel'
  | AgentId
  | 'officer'
  | 'approval'
  | 'resolution'
  | null

export interface DecisionRationalePresentation {
  readonly agentId: AgentId | 'officer'
  readonly state: 'working' | 'result' | 'blocked'
  readonly title: string
  readonly bullets: readonly string[]
}

export interface RuntimeTransitionPresentation {
  readonly title: string
  readonly next: string
}

export interface RuntimeActivityEvent {
  readonly id: string
  readonly time: string
  readonly agent: string
  readonly action: string
  readonly skill: string
  readonly output: string
}

export interface OutcomePreviewPresentation {
  readonly label: 'Likely Outcome'
  readonly items: readonly string[]
}

export interface ApprovalGatePresentation {
  readonly recommendedAction: string
  readonly why: readonly string[]
  readonly estimatedImpact: string
  readonly impactQualifier: string
  readonly riskIfRejected: string
  readonly outcomePreview: OutcomePreviewPresentation
}

export interface FinalOutcomeSection {
  readonly heading: string
  readonly items: readonly string[]
}

export interface FinalOutcomePresentation {
  readonly type: 'approved' | 'escalated'
  readonly heading: string
  readonly summary: readonly string[]
  readonly sections: readonly FinalOutcomeSection[]
}

export interface RuntimeViewModel {
  readonly mode: DemoMode
  readonly playbackStatus: RuntimeState['playbackStatus']
  readonly currentMoment: RuntimeMoment | null
  readonly currentSceneId: SceneId | null
  readonly currentStage: RuntimeStage | null
  readonly stages: readonly StagePresentation[]
  readonly visibleEvents: readonly RuntimeActivityEvent[]
  readonly toolActivity: number
  readonly artifacts: readonly ArtifactPresentation[]
  readonly artifactsProduced: number
  readonly activeAgentCount: number
  readonly specialistsCompleted: number
  readonly activeSpecialistAgentId: AgentId | null
  readonly officerMode: OfficerMode
  readonly workflowStep: WorkflowStep
  readonly approversCompleted: 0 | 1 | 2 | 3 | 4
  readonly customerResponseSent: boolean
  readonly approvalStatus: ApprovalStatus
  readonly context: RuntimeContext
  readonly earlyStory: EarlyStoryPresentation
  readonly agentLifecycle: readonly AgentLifecyclePresentation[]
  readonly nowNext: NowNextPresentation
  readonly focusTarget: RuntimeFocusTarget
  readonly decisionRationale: DecisionRationalePresentation | null
  readonly transition: RuntimeTransitionPresentation | null
  readonly approvalGate: ApprovalGatePresentation | null
  readonly outcomePreview: OutcomePreviewPresentation | null
  readonly finalOutcome: FinalOutcomePresentation | null
  readonly timer: RuntimeTimerPresentation
  readonly controls: RuntimeControlAvailability
}
