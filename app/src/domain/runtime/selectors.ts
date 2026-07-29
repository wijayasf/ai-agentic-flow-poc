import { runtimeFixtures } from '../runtime-fixtures/loadRuntimeFixtures'
import type {
  ArtifactId,
  RuntimeFixtureBundle,
  RuntimeMoment,
  RuntimeStage,
} from '../runtime-fixtures/types'
import {
  AGENT_ORDER,
  APPROVAL_GATE_PRESENTATION,
  APPROVED_FINAL_OUTCOME,
  ESCALATED_FINAL_OUTCOME,
  FOCUS_BY_MOMENT,
  NOW_NEXT_BY_STAGE,
  OUTCOME_PREVIEW,
  RATIONALE_BY_MOMENT,
  REJECTION_ACTIVITY_EVENT,
  TRANSITION_BY_MOMENT,
  lifecycleForMoment,
} from './presentation'
import { isRuntimeActionLegal } from './transitions'
import type {
  AgentLifecyclePresentation,
  ApprovalGatePresentation,
  ArtifactPresentation,
  DecisionRationalePresentation,
  EarlyStoryPhase,
  EarlyStoryPresentation,
  FinalOutcomePresentation,
  NowNextPresentation,
  OutcomePreviewPresentation,
  RuntimeContext,
  RuntimeControlAvailability,
  RuntimeFocusTarget,
  RuntimeState,
  RuntimeTimerPresentation,
  RuntimeTransitionPresentation,
  RuntimeViewModel,
  StagePresentation,
} from './types'

const EARLY_STORY_SECONDS = {
  customerIdentity: 1,
  customerMessage: 1,
  leakagePhoto: 2,
  handoverAgreement: 3,
  paymentReceipt: 4,
  aiTyping: 5,
  aiAcknowledgement: 12,
  intakeContextEnd: 6,
} as const

export function selectCurrentMoment(
  state: RuntimeState,
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): RuntimeMoment | null {
  return (
    fixtures.timeline.moments.find(
      (moment) => moment.id === state.currentMomentId,
    ) ?? null
  )
}

export function selectCurrentStage(
  state: RuntimeState,
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): RuntimeStage | null {
  return selectCurrentMoment(state, fixtures)?.stage ?? null
}

export function selectStages(
  state: RuntimeState,
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): readonly StagePresentation[] {
  const currentStage = selectCurrentStage(state, fixtures)
  const currentIndex = currentStage === null
    ? -1
    : fixtures.scenario.stages.indexOf(currentStage)

  return fixtures.scenario.stages.map((stage, index) => ({
    stage,
    state:
      index < currentIndex
        ? 'completed'
        : index === currentIndex
          ? 'current'
          : 'upcoming',
  }))
}

export function selectVisibleEvents(
  state: RuntimeState,
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
) {
  const visibleIds = new Set(state.visibleEventIds)
  const eventById = new Map(
    fixtures.events.events.map((event) => [event.id, event] as const),
  )
  const fixtureEvents = fixtures.timeline.eventRevealOrder
    .filter((eventId) => visibleIds.has(eventId))
    .map((eventId) => eventById.get(eventId))
    .filter((event) => event !== undefined)
  return state.approvalStatus === 'rejected'
    ? [...fixtureEvents, REJECTION_ACTIVITY_EVENT]
    : fixtureEvents
}

function artifactStatus(
  state: RuntimeState,
  artifactId: ArtifactId,
  fixtures: RuntimeFixtureBundle,
): ArtifactPresentation['status'] {
  if (!state.availableArtifactIds.includes(artifactId)) return 'locked'
  const rule = fixtures.timeline.artifactAvailabilityRules.find(
    (candidate) => candidate.artifactId === artifactId,
  )
  const approvalRequired = rule?.approvedAtMomentId !== null && rule !== undefined
  if (!approvalRequired) return 'available'
  if (state.approvalStatus === 'rejected') return 'locked'
  if (state.approvalStatus === 'approved') return 'approved'
  if (state.approvalStatus === 'pending') return 'pending'
  return 'available'
}

export function selectArtifacts(
  state: RuntimeState,
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): readonly ArtifactPresentation[] {
  return [...fixtures.artifacts.artifacts]
    .sort((left, right) => left.order - right.order)
    .map((artifact) => ({
      ...artifact,
      status: artifactStatus(state, artifact.id, fixtures),
    }))
}

export function selectContext(
  state: RuntimeState,
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): RuntimeContext {
  if (state.playbackStatus === 'waiting_approval') {
    return { type: 'approval', copy: fixtures.timeline.approval.copy }
  }
  if (state.approvalStatus === 'approved' && state.approversCompleted > 0 && state.approversCompleted < 4) {
    return {
      type: 'approving',
      copy: `Enterprise approval workflow in progress (${state.approversCompleted} of 4)`,
    }
  }
  if (state.customerResponseSent) {
    return { type: 'resolution', copy: 'Customer response delivered' }
  }
  if (state.terminalOutcome === 'approved') {
    return { type: 'recommendation', copy: fixtures.timeline.recommendation.copy }
  }
  return { type: 'neutral', copy: null }
}

function formatSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

export function selectTimer(
  state: RuntimeState,
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): RuntimeTimerPresentation {
  return {
    elapsedSeconds: state.elapsedSeconds,
    totalSeconds: fixtures.timeline.totalScheduledSeconds,
    remainingSeconds: state.remainingSeconds,
    elapsedText: formatSeconds(state.elapsedSeconds),
    totalText: formatSeconds(fixtures.timeline.totalScheduledSeconds),
    active: state.timerActive,
  }
}

function earlyStoryPhase(
  state: RuntimeState,
  currentStage: RuntimeStage | null,
): EarlyStoryPhase {
  if (state.playbackStatus === 'idle') return 'idle'
  if (currentStage !== null && currentStage !== 'Intake') return 'investigation'
  if (state.elapsedSeconds >= EARLY_STORY_SECONDS.aiAcknowledgement) {
    return 'acknowledged'
  }
  if (state.elapsedSeconds >= EARLY_STORY_SECONDS.aiTyping) return 'ai_typing'
  if (state.elapsedSeconds >= EARLY_STORY_SECONDS.paymentReceipt) {
    return 'payment_receipt'
  }
  if (state.elapsedSeconds >= EARLY_STORY_SECONDS.handoverAgreement) {
    return 'handover_agreement'
  }
  if (state.elapsedSeconds >= EARLY_STORY_SECONDS.leakagePhoto) {
    return 'leakage_photo'
  }
  if (state.elapsedSeconds >= EARLY_STORY_SECONDS.customerMessage) {
    return 'customer_message'
  }
  if (state.elapsedSeconds >= EARLY_STORY_SECONDS.customerIdentity) {
    return 'customer_identity'
  }
  return 'customer_typing'
}

export function selectEarlyStory(
  state: RuntimeState,
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): EarlyStoryPresentation {
  const currentStage = selectCurrentStage(state, fixtures)
  const phase = earlyStoryPhase(state, currentStage)
  const isIdle = phase === 'idle'
  const elapsed = state.elapsedSeconds
  const visibleAttachmentCount: 0 | 1 | 2 | 3 =
    elapsed >= EARLY_STORY_SECONDS.paymentReceipt
      ? 3
      : elapsed >= EARLY_STORY_SECONDS.handoverAgreement
        ? 2
        : elapsed >= EARLY_STORY_SECONDS.leakagePhoto
          ? 1
          : 0
  // Milestone gating: the acknowledgement bubble may not appear until the
  // Complaint Agent has delivered at least Milestone A (initial complaint
  // understanding). Milestone A corresponds to M05 boundary — the moment
  // "Complaint Agent analyses text" completes. The AI typing indicator
  // shows during the working window between dispatch (M03 boundary) and
  // Milestone A completion, representing the AI Resolution Officer
  // composing the acknowledgement while the specialist is still analysing.
  const dispatchStarted = state.completedMomentIds.includes('M03')
  const initialAnalysisComplete = state.completedMomentIds.includes('M05')
  const showAiAcknowledgement = !isIdle && initialAnalysisComplete
  const showAiTyping =
    !isIdle && dispatchStarted && !initialAnalysisComplete

  return {
    phase,
    isIdle,
    showCustomerTyping: phase === 'customer_typing',
    showCustomerIdentity:
      !isIdle && elapsed >= EARLY_STORY_SECONDS.customerIdentity,
    showCustomerMessage:
      !isIdle && elapsed >= EARLY_STORY_SECONDS.customerMessage,
    visibleAttachmentCount: isIdle ? 0 : visibleAttachmentCount,
    showAiTyping,
    showAiAcknowledgement,
    showIntakeContext:
      currentStage === 'Intake' &&
      elapsed < EARLY_STORY_SECONDS.intakeContextEnd,
    // Specialist activity appears once the Complaint Agent has been
    // dispatched (past M03), not after acknowledgement. This lets the
    // agent card show a live "working" state before the acknowledgement.
    workflowIntroduced: dispatchStarted,
  }
}

export function selectAgentLifecycle(
  state: RuntimeState,
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): readonly AgentLifecyclePresentation[] {
  const earlyStory = selectEarlyStory(state, fixtures)
  const lifecycle = earlyStory.workflowIntroduced
    ? lifecycleForMoment(state.currentMomentId)
    : lifecycleForMoment(null)

  if (state.terminalOutcome === 'approved') {
    return AGENT_ORDER.map((agentId) => ({ agentId, status: 'completed' }))
  }
  if (state.terminalOutcome === 'escalated') {
    return AGENT_ORDER.map((agentId) => ({
      agentId,
      status: agentId === 'agent-finance' ? 'blocked' : 'completed',
    }))
  }

  return AGENT_ORDER.map((agentId) => ({
    agentId,
    status: lifecycle[agentId],
  }))
}

export function selectNowNext(
  state: RuntimeState,
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): NowNextPresentation {
  if (state.playbackStatus === 'idle') {
    return { now: 'Demo ready', next: 'Start customer intake' }
  }
  if (state.terminalOutcome === 'approved') {
    return { now: 'Case resolved', next: null }
  }
  if (state.terminalOutcome === 'escalated') {
    return {
      now: 'Decision escalated',
      next: 'Management review required',
    }
  }
  if (state.playbackStatus === 'waiting_approval') {
    return {
      now: 'Awaiting human approval',
      next: 'Enterprise approval workflow',
    }
  }
  if (state.approvalStatus === 'approved' && state.approversCompleted > 0) {
    return {
      now: state.approversCompleted < 4
        ? `Enterprise approval ${state.approversCompleted} of 4`
        : 'Preparing customer response',
      next: state.customerResponseSent
        ? 'Close case'
        : 'Send customer response',
    }
  }

  const currentStage = selectCurrentStage(state, fixtures)
  return currentStage === null
    ? { now: 'Demo ready', next: 'Start customer intake' }
    : NOW_NEXT_BY_STAGE[currentStage]
}

export function selectFocusTarget(
  state: RuntimeState,
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): RuntimeFocusTarget {
  const earlyStory = selectEarlyStory(state, fixtures)
  if (earlyStory.isIdle) return null
  if (state.terminalOutcome !== 'unresolved') return 'resolution'
  if (!earlyStory.workflowIntroduced) return 'customer-panel'
  return state.currentMomentId === null ? null : FOCUS_BY_MOMENT[state.currentMomentId]
}

export function selectDecisionRationale(
  state: RuntimeState,
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): DecisionRationalePresentation | null {
  if (!selectEarlyStory(state, fixtures).workflowIntroduced) return null
  return state.currentMomentId === null
    ? null
    : RATIONALE_BY_MOMENT[state.currentMomentId]
}

export function selectRuntimeTransition(
  state: RuntimeState,
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): RuntimeTransitionPresentation | null {
  if (!selectEarlyStory(state, fixtures).workflowIntroduced) return null
  if (state.terminalOutcome === 'escalated') {
    return {
      title: 'Decision rejected',
      next: 'Escalating to management review',
    }
  }
  return state.currentMomentId === null
    ? null
    : TRANSITION_BY_MOMENT[state.currentMomentId] ?? null
}

export function selectApprovalGate(
  state: RuntimeState,
): ApprovalGatePresentation | null {
  return state.playbackStatus === 'waiting_approval' &&
    state.approvalStatus === 'pending'
    ? APPROVAL_GATE_PRESENTATION
    : null
}

export function selectOutcomePreview(
  state: RuntimeState,
): OutcomePreviewPresentation | null {
  if (
    state.terminalOutcome !== 'unresolved' ||
    state.approvalStatus === 'rejected'
  ) {
    return null
  }
  return state.currentMomentId === 'M24' || state.currentMomentId === 'M25'
    ? OUTCOME_PREVIEW
    : null
}

export function selectFinalOutcome(
  state: RuntimeState,
): FinalOutcomePresentation | null {
  if (state.terminalOutcome === 'approved') return APPROVED_FINAL_OUTCOME
  if (state.terminalOutcome === 'escalated') return ESCALATED_FINAL_OUTCOME
  return null
}

export function selectControlAvailability(
  state: RuntimeState,
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): RuntimeControlAvailability {
  return {
    canStart: isRuntimeActionLegal(state, { type: 'START' }, fixtures),
    canPause: isRuntimeActionLegal(state, { type: 'PAUSE' }, fixtures),
    canResume: isRuntimeActionLegal(state, { type: 'RESUME' }, fixtures),
    canNextMoment: isRuntimeActionLegal(
      state,
      { type: 'NEXT_MOMENT' },
      fixtures,
    ),
    canRestart: isRuntimeActionLegal(state, { type: 'RESTART' }, fixtures),
    canApprove: isRuntimeActionLegal(state, { type: 'APPROVE' }, fixtures),
    canReject: isRuntimeActionLegal(state, { type: 'REJECT' }, fixtures),
    canSelectPresenter: isRuntimeActionLegal(
      state,
      { type: 'SELECT_MODE', mode: 'presenter' },
      fixtures,
    ),
    canSelectAuto: isRuntimeActionLegal(
      state,
      { type: 'SELECT_MODE', mode: 'auto' },
      fixtures,
    ),
  }
}

export const selectControls = selectControlAvailability

export function selectRuntimeViewModel(
  state: RuntimeState,
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): RuntimeViewModel {
  const currentMoment = selectCurrentMoment(state, fixtures)
  const visibleEvents = selectVisibleEvents(state, fixtures)
  const artifacts = selectArtifacts(state, fixtures)
  const earlyStory = selectEarlyStory(state, fixtures)
  const agentLifecycle = selectAgentLifecycle(state, fixtures)

  return {
    mode: state.mode,
    playbackStatus: state.playbackStatus,
    currentMoment,
    currentSceneId: currentMoment?.sceneId ?? null,
    currentStage: currentMoment?.stage ?? null,
    stages: selectStages(state, fixtures),
    visibleEvents,
    toolActivity: visibleEvents.length,
    artifacts,
    artifactsProduced: artifacts.filter(
      (artifact) => artifact.status !== 'locked',
    ).length,
    activeAgentCount: agentLifecycle.filter(
      (agent) => agent.status === 'working',
    ).length,
    specialistsCompleted: agentLifecycle.filter(
      (agent) => agent.status === 'completed',
    ).length,
    activeSpecialistAgentId: state.activeSpecialistAgentId,
    officerMode: state.officerMode,
    workflowStep: state.workflowStep,
    approversCompleted: state.approversCompleted,
    customerResponseSent: state.customerResponseSent,
    approvalStatus: state.approvalStatus,
    context: selectContext(state, fixtures),
    earlyStory,
    agentLifecycle,
    nowNext: selectNowNext(state, fixtures),
    focusTarget: selectFocusTarget(state, fixtures),
    decisionRationale: selectDecisionRationale(state, fixtures),
    transition: selectRuntimeTransition(state, fixtures),
    approvalGate: selectApprovalGate(state),
    outcomePreview: selectOutcomePreview(state),
    finalOutcome: selectFinalOutcome(state),
    timer: selectTimer(state, fixtures),
    controls: selectControlAvailability(state, fixtures),
  }
}
