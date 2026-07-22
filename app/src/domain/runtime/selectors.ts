import { runtimeFixtures } from '../runtime-fixtures/loadRuntimeFixtures'
import type {
  ArtifactId,
  RuntimeFixtureBundle,
  RuntimeMoment,
  RuntimeStage,
} from '../runtime-fixtures/types'
import { isRuntimeActionLegal } from './transitions'
import type {
  ArtifactPresentation,
  RuntimeContext,
  RuntimeControlAvailability,
  RuntimeState,
  RuntimeTimerPresentation,
  RuntimeViewModel,
  StagePresentation,
} from './types'

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
  return fixtures.timeline.eventRevealOrder
    .filter((eventId) => visibleIds.has(eventId))
    .map((eventId) => eventById.get(eventId))
    .filter((event) => event !== undefined)
}

function artifactStatus(
  state: RuntimeState,
  artifactId: ArtifactId,
): ArtifactPresentation['status'] {
  if (!state.availableArtifactIds.includes(artifactId)) return 'locked'
  if (artifactId !== 'artifact-approval') return 'available'
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
      status: artifactStatus(state, artifact.id),
    }))
}

export function selectContext(
  state: RuntimeState,
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): RuntimeContext {
  if (state.playbackStatus === 'waiting_approval') {
    return { type: 'approval', copy: fixtures.timeline.approval.copy }
  }
  if (state.playbackStatus === 'failed') {
    return { type: 'failure', copy: fixtures.timeline.failureRecovery.failureCopy }
  }
  if (state.playbackStatus === 'recovering') {
    return { type: 'recovery', copy: fixtures.timeline.failureRecovery.recoveryCopy }
  }
  if (
    state.failureStatus === 'recovered' &&
    state.recoveryStatus === 'completed' &&
    !state.recommendationVisible
  ) {
    return { type: 'recovered', copy: fixtures.timeline.failureRecovery.recoveryCopy }
  }
  if (state.recommendationVisible) {
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
    canInjectFailure: isRuntimeActionLegal(
      state,
      { type: 'INJECT_FAILURE' },
      fixtures,
    ),
    canApprove: isRuntimeActionLegal(state, { type: 'APPROVE' }, fixtures),
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
    activeAgentCount: state.activeAgentIds.length,
    conflictStatus: state.conflictStatus,
    context: selectContext(state, fixtures),
    timer: selectTimer(state, fixtures),
    controls: selectControlAvailability(state, fixtures),
  }
}
