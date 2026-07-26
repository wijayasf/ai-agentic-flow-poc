import {
  AGENT_IDS,
  APPROVED_EFFECT_TYPES,
  ARTIFACT_IDS,
  EVENT_IDS,
  EVENT_REVEAL_ORDER,
  MOMENT_IDS,
  RUNTIME_STAGES,
  SCENE_IDS,
  SYSTEM_IDS,
  type ApprovalStatus,
  type ArtifactId,
  type ConflictStatus,
  type EventId,
  type FailureStatus,
  type RecoveryStatus,
  type RuntimeCompletionAction,
  type RuntimeEntryEffect,
  type RuntimeEvent,
  type RuntimeFixtureBundle,
  type RuntimeMoment,
  type RuntimeMomentExpectedState,
  type RuntimePlaybackStatus,
  type RuntimeStateFixture,
  type RuntimeTimelineFixture,
  type SceneId,
} from './types'

type JsonRecord = Record<string, unknown>

const PLAYBACK_STATUSES = [
  'idle',
  'running',
  'paused',
  'waiting_approval',
  'failed',
  'recovering',
  'completed',
] as const
const COMPLETION_ACTIONS = [
  'advance',
  'pause',
  'wait_for_approval',
  'wait_for_failure_injection',
  'inject_failure_and_advance',
  'complete',
] as const
const CONFLICT_STATUSES = ['neutral', 'active', 'resolved'] as const
const APPROVAL_STATUSES = [
  'not_required',
  'pending',
  'approved',
  'rejected',
] as const
const FAILURE_STATUSES = ['not_injected', 'active', 'recovered'] as const
const RECOVERY_STATUSES = ['not_started', 'recovering', 'completed'] as const
const STATE_KEYS = [
  'mode',
  'playbackStatus',
  'currentMomentId',
  'completedMomentIds',
  'elapsedSeconds',
  'remainingSeconds',
  'visibleEventIds',
  'availableArtifactIds',
  'activeAgentIds',
  'activeSystemIds',
  'conflictStatus',
  'approvalStatus',
  'failureStatus',
  'recoveryStatus',
  'recommendationVisible',
  'timerActive',
] as const
const PROHIBITED_DATA_KEYS = new Set([
  'url',
  'callback',
  'function',
  'expression',
  'timeout',
  'interval',
  'executablecode',
])
const URL_PATTERN = /(?:https?:\/\/|data:|javascript:)/i

function fail(path: string, message: string): never {
  throw new Error(`${path}: ${message}`)
}

function readRecord(value: unknown, path: string): JsonRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail(path, 'expected an object')
  }
  return value as JsonRecord
}

function assertExactKeys(record: JsonRecord, expectedKeys: readonly string[], path: string) {
  const actual = Object.keys(record).sort()
  const expected = [...expectedKeys].sort()
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(path, `expected fields ${expected.join(', ')}, received ${actual.join(', ')}`)
  }
}

function readString(value: unknown, path: string): string {
  if (typeof value !== 'string') fail(path, 'expected a string')
  return value
}

function readNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(path, 'expected a finite number')
  return value
}

function readBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') fail(path, 'expected a boolean')
  return value
}

function readLiteral<T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: string,
): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    fail(path, `expected one of ${allowed.join(', ')}`)
  }
  return value as T
}

function readIdArray<T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: string,
): T[] {
  if (!Array.isArray(value)) fail(path, 'expected an array')
  const result = value.map((entry, index) => readLiteral(entry, allowed, `${path}[${index}]`))
  if (new Set(result).size !== result.length) fail(path, 'contains duplicate IDs')
  return result
}

function assertArrayEqual(
  actual: readonly string[],
  expected: readonly string[],
  path: string,
) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(path, `expected ${expected.join(', ')}, received ${actual.join(', ')}`)
  }
}

function validateNoExecutableData(value: unknown, path: string): void {
  if (typeof value === 'function') fail(path, 'functions are prohibited in runtime fixtures')
  if (typeof value === 'string' && URL_PATTERN.test(value)) {
    fail(path, 'URLs and executable URI schemes are prohibited')
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => validateNoExecutableData(entry, `${path}[${index}]`))
    return
  }
  if (typeof value !== 'object' || value === null) return

  for (const [key, entry] of Object.entries(value)) {
    const normalizedKey = key.replace(/[-_]/g, '').toLowerCase()
    if (PROHIBITED_DATA_KEYS.has(normalizedKey)) {
      fail(`${path}.${key}`, 'executable-code field is prohibited')
    }
    validateNoExecutableData(entry, `${path}.${key}`)
  }
}

function validateEntryEffect(
  value: unknown,
  path: string,
): RuntimeEntryEffect {
  const record = readRecord(value, path)
  const type = readLiteral(record.type, APPROVED_EFFECT_TYPES, `${path}.type`)

  switch (type) {
    case 'show_customer_context':
    case 'synchronize_investigation':
    case 'hold_state':
    case 'show_resolution_plan':
    case 'show_failure_injection_cue':
    case 'finalize_metrics':
    case 'hold_final_state':
      assertExactKeys(record, ['type'], path)
      return { type }
    case 'set_active_agents':
      assertExactKeys(record, ['type', 'agentIds'], path)
      return {
        type,
        agentIds: readIdArray(record.agentIds, AGENT_IDS, `${path}.agentIds`),
      }
    case 'set_active_systems':
      assertExactKeys(record, ['type', 'systemIds'], path)
      return {
        type,
        systemIds: readIdArray(record.systemIds, SYSTEM_IDS, `${path}.systemIds`),
      }
    case 'reveal_event':
      assertExactKeys(record, ['type', 'eventId'], path)
      return { type, eventId: readLiteral(record.eventId, EVENT_IDS, `${path}.eventId`) }
    case 'make_artifact_available':
      assertExactKeys(record, ['type', 'artifactId'], path)
      return {
        type,
        artifactId: readLiteral(record.artifactId, ARTIFACT_IDS, `${path}.artifactId`),
      }
    case 'set_conflict_status':
      assertExactKeys(record, ['type', 'value'], path)
      return {
        type,
        value: readLiteral(record.value, ['active', 'resolved'] as const, `${path}.value`),
      }
    case 'set_approval_status':
      assertExactKeys(record, ['type', 'value'], path)
      return {
        type,
        value: readLiteral(record.value, ['pending', 'approved'] as const, `${path}.value`),
      }
    case 'set_artifact_status':
      assertExactKeys(record, ['type', 'artifactId', 'value'], path)
      return {
        type,
        artifactId: readLiteral(record.artifactId, ARTIFACT_IDS, `${path}.artifactId`),
        value: readLiteral(record.value, ['approved'] as const, `${path}.value`),
      }
    case 'set_failure_status':
      assertExactKeys(record, ['type', 'value'], path)
      return {
        type,
        value: readLiteral(record.value, ['active', 'recovered'] as const, `${path}.value`),
      }
    case 'set_recovery_status':
      assertExactKeys(record, ['type', 'value'], path)
      return {
        type,
        value: readLiteral(record.value, ['recovering', 'completed'] as const, `${path}.value`),
      }
    case 'set_recommendation_visible': {
      assertExactKeys(record, ['type', 'value'], path)
      const visible = readBoolean(record.value, `${path}.value`)
      if (!visible) fail(`${path}.value`, 'must be true')
      return { type, value: true }
    }
    default:
      return fail(path, `unsupported effect type ${type satisfies never}`)
  }
}

function validateExpectedState(value: unknown, path: string): RuntimeMomentExpectedState {
  const record = readRecord(value, path)
  assertExactKeys(
    record,
    [
      'playbackStatus',
      'activeAgentIds',
      'activeSystemIds',
      'conflictStatus',
      'approvalStatus',
      'failureStatus',
      'recoveryStatus',
      'recommendationVisible',
      'toolActivity',
      'artifactsProduced',
    ],
    path,
  )
  return {
    playbackStatus: readLiteral(
      record.playbackStatus,
      PLAYBACK_STATUSES,
      `${path}.playbackStatus`,
    ) as RuntimePlaybackStatus,
    activeAgentIds: readIdArray(record.activeAgentIds, AGENT_IDS, `${path}.activeAgentIds`),
    activeSystemIds: readIdArray(record.activeSystemIds, SYSTEM_IDS, `${path}.activeSystemIds`),
    conflictStatus: readLiteral(
      record.conflictStatus,
      CONFLICT_STATUSES,
      `${path}.conflictStatus`,
    ) as ConflictStatus,
    approvalStatus: readLiteral(
      record.approvalStatus,
      APPROVAL_STATUSES,
      `${path}.approvalStatus`,
    ) as ApprovalStatus,
    failureStatus: readLiteral(
      record.failureStatus,
      FAILURE_STATUSES,
      `${path}.failureStatus`,
    ) as FailureStatus,
    recoveryStatus: readLiteral(
      record.recoveryStatus,
      RECOVERY_STATUSES,
      `${path}.recoveryStatus`,
    ) as RecoveryStatus,
    recommendationVisible: readBoolean(
      record.recommendationVisible,
      `${path}.recommendationVisible`,
    ),
    toolActivity: readNumber(record.toolActivity, `${path}.toolActivity`),
    artifactsProduced: readNumber(record.artifactsProduced, `${path}.artifactsProduced`),
  }
}

function validateApprovalGate(value: unknown, path: string): RuntimeMoment['approvalGate'] {
  if (value === null) return null
  const record = readRecord(value, path)
  assertExactKeys(record, ['actions', 'continuationMomentId', 'copy'], path)
  const actions = readIdArray(
    record.actions,
    ['approve', 'reject'] as const,
    `${path}.actions`,
  )
  assertArrayEqual(actions, ['approve', 'reject'], `${path}.actions`)
  return {
    actions: ['approve', 'reject'],
    continuationMomentId: readLiteral(
      record.continuationMomentId,
      MOMENT_IDS,
      `${path}.continuationMomentId`,
    ),
    copy: readString(record.copy, `${path}.copy`),
  }
}

function validateFailureGate(value: unknown, path: string): RuntimeMoment['failureGate'] {
  if (value === null) return null
  const record = readRecord(value, path)
  assertExactKeys(record, ['action', 'continuationMomentId', 'failureCode'], path)
  return {
    action: readLiteral(record.action, ['inject_failure'] as const, `${path}.action`),
    continuationMomentId: readLiteral(
      record.continuationMomentId,
      MOMENT_IDS,
      `${path}.continuationMomentId`,
    ),
    failureCode: readLiteral(
      record.failureCode,
      ['CONTRACTOR_REJECTED'] as const,
      `${path}.failureCode`,
    ),
  }
}

function validateMoment(value: unknown, path: string): RuntimeMoment {
  const record = readRecord(value, path)
  assertExactKeys(
    record,
    [
      'id',
      'order',
      'startSecond',
      'durationSeconds',
      'sceneId',
      'stage',
      'title',
      'description',
      'entryEffects',
      'visibleEventIds',
      'availableArtifactIds',
      'approvalGate',
      'failureGate',
      'completion',
      'expected',
    ],
    path,
  )
  if (!Array.isArray(record.entryEffects)) fail(`${path}.entryEffects`, 'expected an array')
  const completion = readRecord(record.completion, `${path}.completion`)
  assertExactKeys(completion, ['presenter', 'auto'], `${path}.completion`)

  const moment: RuntimeMoment = {
    id: readLiteral(record.id, MOMENT_IDS, `${path}.id`),
    order: readNumber(record.order, `${path}.order`),
    startSecond: readNumber(record.startSecond, `${path}.startSecond`),
    durationSeconds: readNumber(record.durationSeconds, `${path}.durationSeconds`),
    sceneId: readLiteral(record.sceneId, SCENE_IDS, `${path}.sceneId`),
    stage: readLiteral(record.stage, RUNTIME_STAGES, `${path}.stage`),
    title: readString(record.title, `${path}.title`),
    description: readString(record.description, `${path}.description`),
    entryEffects: record.entryEffects.map((effect, index) =>
      validateEntryEffect(effect, `${path}.entryEffects[${index}]`),
    ),
    visibleEventIds: readIdArray(record.visibleEventIds, EVENT_IDS, `${path}.visibleEventIds`),
    availableArtifactIds: readIdArray(
      record.availableArtifactIds,
      ARTIFACT_IDS,
      `${path}.availableArtifactIds`,
    ),
    approvalGate: validateApprovalGate(record.approvalGate, `${path}.approvalGate`),
    failureGate: validateFailureGate(record.failureGate, `${path}.failureGate`),
    completion: {
      presenter: readLiteral(
        completion.presenter,
        COMPLETION_ACTIONS,
        `${path}.completion.presenter`,
      ) as RuntimeCompletionAction,
      auto: readLiteral(
        completion.auto,
        COMPLETION_ACTIONS,
        `${path}.completion.auto`,
      ) as RuntimeCompletionAction,
    },
    expected: validateExpectedState(record.expected, `${path}.expected`),
  }

  if (moment.expected.toolActivity !== moment.visibleEventIds.length) {
    fail(`${path}.expected.toolActivity`, 'must equal visibleEventIds length')
  }
  if (moment.expected.artifactsProduced !== moment.availableArtifactIds.length) {
    fail(`${path}.expected.artifactsProduced`, 'must equal availableArtifactIds length')
  }
  return moment
}

function validateStateFixture(value: unknown, path: string): RuntimeStateFixture {
  const record = readRecord(value, path)
  assertExactKeys(record, STATE_KEYS, path)
  const currentMomentId =
    record.currentMomentId === null
      ? null
      : readLiteral(record.currentMomentId, MOMENT_IDS, `${path}.currentMomentId`)
  const remainingSeconds =
    record.remainingSeconds === null
      ? null
      : readNumber(record.remainingSeconds, `${path}.remainingSeconds`)

  return {
    mode: readLiteral(record.mode, ['presenter', 'auto'] as const, `${path}.mode`),
    playbackStatus: readLiteral(
      record.playbackStatus,
      PLAYBACK_STATUSES,
      `${path}.playbackStatus`,
    ),
    currentMomentId,
    completedMomentIds: readIdArray(
      record.completedMomentIds,
      MOMENT_IDS,
      `${path}.completedMomentIds`,
    ),
    elapsedSeconds: readNumber(record.elapsedSeconds, `${path}.elapsedSeconds`),
    remainingSeconds,
    visibleEventIds: readIdArray(record.visibleEventIds, EVENT_IDS, `${path}.visibleEventIds`),
    availableArtifactIds: readIdArray(
      record.availableArtifactIds,
      ARTIFACT_IDS,
      `${path}.availableArtifactIds`,
    ),
    activeAgentIds: readIdArray(record.activeAgentIds, AGENT_IDS, `${path}.activeAgentIds`),
    activeSystemIds: readIdArray(record.activeSystemIds, SYSTEM_IDS, `${path}.activeSystemIds`),
    conflictStatus: readLiteral(
      record.conflictStatus,
      CONFLICT_STATUSES,
      `${path}.conflictStatus`,
    ),
    approvalStatus: readLiteral(
      record.approvalStatus,
      APPROVAL_STATUSES,
      `${path}.approvalStatus`,
    ),
    failureStatus: readLiteral(
      record.failureStatus,
      FAILURE_STATUSES,
      `${path}.failureStatus`,
    ),
    recoveryStatus: readLiteral(
      record.recoveryStatus,
      RECOVERY_STATUSES,
      `${path}.recoveryStatus`,
    ),
    recommendationVisible: readBoolean(
      record.recommendationVisible,
      `${path}.recommendationVisible`,
    ),
    timerActive: readBoolean(record.timerActive, `${path}.timerActive`),
  }
}

function validateEvents(value: unknown): { readonly events: readonly RuntimeEvent[] } {
  const root = readRecord(value, 'events')
  assertExactKeys(root, ['events'], 'events')
  if (!Array.isArray(root.events)) fail('events.events', 'expected an array')
  const events = root.events.map((entry, index): RuntimeEvent => {
    const record = readRecord(entry, `events.events[${index}]`)
    assertExactKeys(record, ['id', 'time', 'agent', 'action', 'skill', 'output'], `events.events[${index}]`)
    return {
      id: readLiteral(record.id, EVENT_IDS, `events.events[${index}].id`),
      time: readString(record.time, `events.events[${index}].time`),
      agent: readString(record.agent, `events.events[${index}].agent`),
      action: readString(record.action, `events.events[${index}].action`),
      skill: readString(record.skill, `events.events[${index}].skill`),
      output: readString(record.output, `events.events[${index}].output`),
    }
  })
  assertArrayEqual(events.map((event) => event.id), EVENT_IDS, 'events.events IDs')
  return { events }
}

function validateArtifacts(value: unknown): RuntimeFixtureBundle['artifacts'] {
  const root = readRecord(value, 'artifacts')
  assertExactKeys(root, ['artifacts'], 'artifacts')
  if (!Array.isArray(root.artifacts)) fail('artifacts.artifacts', 'expected an array')
  const artifacts = root.artifacts.map((entry, index) => {
    const record = readRecord(entry, `artifacts.artifacts[${index}]`)
    assertExactKeys(record, ['id', 'order', 'name'], `artifacts.artifacts[${index}]`)
    return {
      id: readLiteral(record.id, ARTIFACT_IDS, `artifacts.artifacts[${index}].id`),
      order: readNumber(record.order, `artifacts.artifacts[${index}].order`),
      name: readString(record.name, `artifacts.artifacts[${index}].name`),
    }
  })
  assertArrayEqual(artifacts.map((artifact) => artifact.id), ARTIFACT_IDS, 'artifact IDs')
  return { artifacts }
}

function validateScenario(value: unknown): RuntimeFixtureBundle['scenario'] {
  const root = readRecord(value, 'scenario')
  assertExactKeys(root, ['id', 'totalDurationSeconds', 'stages', 'scenes'], 'scenario')
  if (!Array.isArray(root.scenes)) fail('scenario.scenes', 'expected an array')
  const stages = readIdArray(root.stages, RUNTIME_STAGES, 'scenario.stages')
  assertArrayEqual(stages, RUNTIME_STAGES, 'scenario.stages')
  const scenes = root.scenes.map((entry, index) => {
    const record = readRecord(entry, `scenario.scenes[${index}]`)
    const hasFailureCode = Object.hasOwn(record, 'failureCode')
    assertExactKeys(
      record,
      hasFailureCode
        ? ['id', 'stage', 'presenterPause', 'failureCode']
        : ['id', 'stage', 'presenterPause'],
      `scenario.scenes[${index}]`,
    )
    const scene = {
      id: readLiteral(record.id, SCENE_IDS, `scenario.scenes[${index}].id`),
      stage: readNumber(record.stage, `scenario.scenes[${index}].stage`),
      presenterPause: readBoolean(
        record.presenterPause,
        `scenario.scenes[${index}].presenterPause`,
      ),
    }
    return hasFailureCode
      ? {
          ...scene,
          failureCode: readLiteral(
            record.failureCode,
            ['CONTRACTOR_REJECTED'] as const,
            `scenario.scenes[${index}].failureCode`,
          ),
        }
      : scene
  })
  assertArrayEqual(scenes.map((scene) => scene.id), SCENE_IDS, 'scenario scene IDs')
  return {
    id: readString(root.id, 'scenario.id'),
    totalDurationSeconds: readNumber(root.totalDurationSeconds, 'scenario.totalDurationSeconds'),
    stages,
    scenes,
  }
}

function validateTimeline(
  value: unknown,
  scenario: RuntimeFixtureBundle['scenario'],
): RuntimeTimelineFixture {
  const root = readRecord(value, 'timeline')
  assertExactKeys(
    root,
    [
      'version',
      'scenarioId',
      'totalScheduledSeconds',
      'eventRevealOrder',
      'catalog',
      'approval',
      'failureRecovery',
      'recommendation',
      'artifactAvailabilityRules',
      'moments',
    ],
    'timeline',
  )

  const catalog = readRecord(root.catalog, 'timeline.catalog')
  assertExactKeys(catalog, ['agentIds', 'systemIds'], 'timeline.catalog')
  const agentIds = readIdArray(catalog.agentIds, AGENT_IDS, 'timeline.catalog.agentIds')
  const systemIds = readIdArray(catalog.systemIds, SYSTEM_IDS, 'timeline.catalog.systemIds')
  assertArrayEqual(agentIds, AGENT_IDS, 'timeline.catalog.agentIds')
  assertArrayEqual(systemIds, SYSTEM_IDS, 'timeline.catalog.systemIds')

  const approval = readRecord(root.approval, 'timeline.approval')
  assertExactKeys(
    approval,
    ['gateMomentId', 'approvedMomentId', 'continuationMomentId', 'copy', 'numericAmountAllowed'],
    'timeline.approval',
  )
  const numericAmountAllowed = readBoolean(
    approval.numericAmountAllowed,
    'timeline.approval.numericAmountAllowed',
  )
  if (numericAmountAllowed) fail('timeline.approval.numericAmountAllowed', 'must be false')

  const failureRecovery = readRecord(root.failureRecovery, 'timeline.failureRecovery')
  assertExactKeys(
    failureRecovery,
    [
      'cueMomentId',
      'failureMomentId',
      'recoveringMomentId',
      'recoveredMomentId',
      'failureCode',
      'failureCopy',
      'recoveryCopy',
    ],
    'timeline.failureRecovery',
  )
  const recommendation = readRecord(root.recommendation, 'timeline.recommendation')
  assertExactKeys(recommendation, ['availableAtMomentId', 'copy'], 'timeline.recommendation')

  if (!Array.isArray(root.artifactAvailabilityRules)) {
    fail('timeline.artifactAvailabilityRules', 'expected an array')
  }
  const artifactAvailabilityRules = root.artifactAvailabilityRules.map((entry, index) => {
    const path = `timeline.artifactAvailabilityRules[${index}]`
    const record = readRecord(entry, path)
    assertExactKeys(
      record,
      [
        'artifactId',
        'availableAtMomentId',
        'approvedAtMomentId',
        'contentVisibleAtMomentId',
        'prerequisiteEventIds',
        'prerequisiteStage',
      ],
      path,
    )
    return {
      artifactId: readLiteral(record.artifactId, ARTIFACT_IDS, `${path}.artifactId`),
      availableAtMomentId: readLiteral(
        record.availableAtMomentId,
        MOMENT_IDS,
        `${path}.availableAtMomentId`,
      ),
      approvedAtMomentId:
        record.approvedAtMomentId === null
          ? null
          : readLiteral(record.approvedAtMomentId, MOMENT_IDS, `${path}.approvedAtMomentId`),
      contentVisibleAtMomentId: readLiteral(
        record.contentVisibleAtMomentId,
        MOMENT_IDS,
        `${path}.contentVisibleAtMomentId`,
      ),
      prerequisiteEventIds: readIdArray(
        record.prerequisiteEventIds,
        EVENT_IDS,
        `${path}.prerequisiteEventIds`,
      ),
      prerequisiteStage: readLiteral(
        record.prerequisiteStage,
        RUNTIME_STAGES,
        `${path}.prerequisiteStage`,
      ),
    }
  })
  assertArrayEqual(
    artifactAvailabilityRules.map((rule) => rule.artifactId),
    ARTIFACT_IDS,
    'timeline artifact rule IDs',
  )

  if (!Array.isArray(root.moments)) fail('timeline.moments', 'expected an array')
  const moments = root.moments.map((moment, index) =>
    validateMoment(moment, `timeline.moments[${index}]`),
  )
  assertArrayEqual(moments.map((moment) => moment.id), MOMENT_IDS, 'timeline moment IDs')

  let elapsed = 0
  const sceneTotals = new Map<SceneId, number>()
  const stageByScene = new Map(
    scenario.scenes.map((scene) => [scene.id, scenario.stages[scene.stage]] as const),
  )
  let previousEvents: readonly EventId[] = []
  let previousArtifacts: readonly ArtifactId[] = []
  moments.forEach((moment, index) => {
    if (moment.order !== index + 1) fail(`timeline.moments[${index}].order`, 'is not contiguous')
    if (moment.startSecond !== elapsed) fail(`timeline.moments[${index}].startSecond`, 'is not contiguous')
    elapsed += moment.durationSeconds
    sceneTotals.set(moment.sceneId, (sceneTotals.get(moment.sceneId) ?? 0) + moment.durationSeconds)
    if (moment.stage !== stageByScene.get(moment.sceneId)) {
      fail(`timeline.moments[${index}].stage`, 'does not match scenario scene ownership')
    }
    assertArrayEqual(
      moment.visibleEventIds.slice(0, previousEvents.length),
      previousEvents,
      `timeline.moments[${index}].visibleEventIds prefix`,
    )
    if (!previousArtifacts.every((id) => moment.availableArtifactIds.includes(id))) {
      fail(`timeline.moments[${index}].availableArtifactIds`, 'must be monotonic')
    }
    previousEvents = moment.visibleEventIds
    previousArtifacts = moment.availableArtifactIds
  })
  if (elapsed !== 600 || readNumber(root.totalScheduledSeconds, 'timeline.totalScheduledSeconds') !== 600) {
    fail('timeline.totalScheduledSeconds', 'must equal 600')
  }
  if (scenario.totalDurationSeconds !== 600) fail('scenario.totalDurationSeconds', 'must equal 600')
  const expectedSceneTotals = [90, 150, 90, 90, 90, 90]
  SCENE_IDS.forEach((sceneId, index) => {
    if (sceneTotals.get(sceneId) !== expectedSceneTotals[index]) {
      fail(`timeline scene total ${sceneId}`, `must equal ${expectedSceneTotals[index]}`)
    }
  })

  const eventRevealOrder = readIdArray(
    root.eventRevealOrder,
    EVENT_IDS,
    'timeline.eventRevealOrder',
  )
  assertArrayEqual(eventRevealOrder, EVENT_REVEAL_ORDER, 'timeline.eventRevealOrder')
  moments.forEach((moment, index) => {
    assertArrayEqual(
      moment.visibleEventIds,
      eventRevealOrder.slice(0, moment.visibleEventIds.length),
      `timeline.moments[${index}].visibleEventIds`,
    )
  })

  return {
    version: readString(root.version, 'timeline.version'),
    scenarioId: readString(root.scenarioId, 'timeline.scenarioId'),
    totalScheduledSeconds: 600,
    eventRevealOrder,
    catalog: { agentIds, systemIds },
    approval: {
      gateMomentId: readLiteral(approval.gateMomentId, MOMENT_IDS, 'timeline.approval.gateMomentId'),
      approvedMomentId: readLiteral(
        approval.approvedMomentId,
        MOMENT_IDS,
        'timeline.approval.approvedMomentId',
      ),
      continuationMomentId: readLiteral(
        approval.continuationMomentId,
        MOMENT_IDS,
        'timeline.approval.continuationMomentId',
      ),
      copy: readString(approval.copy, 'timeline.approval.copy'),
      numericAmountAllowed: false,
    },
    failureRecovery: {
      cueMomentId: readLiteral(
        failureRecovery.cueMomentId,
        MOMENT_IDS,
        'timeline.failureRecovery.cueMomentId',
      ),
      failureMomentId: readLiteral(
        failureRecovery.failureMomentId,
        MOMENT_IDS,
        'timeline.failureRecovery.failureMomentId',
      ),
      recoveringMomentId: readLiteral(
        failureRecovery.recoveringMomentId,
        MOMENT_IDS,
        'timeline.failureRecovery.recoveringMomentId',
      ),
      recoveredMomentId: readLiteral(
        failureRecovery.recoveredMomentId,
        MOMENT_IDS,
        'timeline.failureRecovery.recoveredMomentId',
      ),
      failureCode: readLiteral(
        failureRecovery.failureCode,
        ['CONTRACTOR_REJECTED'] as const,
        'timeline.failureRecovery.failureCode',
      ),
      failureCopy: readString(failureRecovery.failureCopy, 'timeline.failureRecovery.failureCopy'),
      recoveryCopy: readString(failureRecovery.recoveryCopy, 'timeline.failureRecovery.recoveryCopy'),
    },
    recommendation: {
      availableAtMomentId: readLiteral(
        recommendation.availableAtMomentId,
        MOMENT_IDS,
        'timeline.recommendation.availableAtMomentId',
      ),
      copy: readString(recommendation.copy, 'timeline.recommendation.copy'),
    },
    artifactAvailabilityRules,
    moments,
  }
}

function assertInitialState(state: RuntimeStateFixture) {
  if (
    state.mode !== 'presenter' ||
    state.playbackStatus !== 'idle' ||
    state.currentMomentId !== null ||
    state.elapsedSeconds !== 0 ||
    state.remainingSeconds !== null ||
    state.conflictStatus !== 'neutral' ||
    state.approvalStatus !== 'not_required' ||
    state.failureStatus !== 'not_injected' ||
    state.recoveryStatus !== 'not_started' ||
    state.recommendationVisible ||
    state.timerActive
  ) {
    fail('initialState', 'does not match the authoritative initial scalar contract')
  }
  for (const [name, values] of Object.entries({
    completedMomentIds: state.completedMomentIds,
    visibleEventIds: state.visibleEventIds,
    availableArtifactIds: state.availableArtifactIds,
    activeAgentIds: state.activeAgentIds,
    activeSystemIds: state.activeSystemIds,
  })) {
    if (values.length !== 0) fail(`initialState.${name}`, 'must be empty')
  }
}

function assertFinalState(state: RuntimeStateFixture) {
  if (
    state.mode !== 'presenter' ||
    state.playbackStatus !== 'completed' ||
    state.currentMomentId !== 'M21' ||
    state.elapsedSeconds !== 600 ||
    state.remainingSeconds !== 0 ||
    state.conflictStatus !== 'resolved' ||
    state.approvalStatus !== 'approved' ||
    state.failureStatus !== 'recovered' ||
    state.recoveryStatus !== 'completed' ||
    !state.recommendationVisible ||
    state.timerActive
  ) {
    fail('finalState', 'does not match the authoritative final scalar contract')
  }
  assertArrayEqual(state.completedMomentIds, MOMENT_IDS, 'finalState.completedMomentIds')
  assertArrayEqual(state.visibleEventIds, EVENT_REVEAL_ORDER, 'finalState.visibleEventIds')
  assertArrayEqual(state.availableArtifactIds, ARTIFACT_IDS, 'finalState.availableArtifactIds')
  assertArrayEqual(state.activeAgentIds, AGENT_IDS, 'finalState.activeAgentIds')
  assertArrayEqual(state.activeSystemIds, SYSTEM_IDS, 'finalState.activeSystemIds')
}

export function validateRuntimeFixtures(value: unknown): RuntimeFixtureBundle {
  validateNoExecutableData(value, 'runtimeFixtures')
  const root = readRecord(value, 'runtimeFixtures')
  assertExactKeys(
    root,
    ['index', 'events', 'artifacts', 'scenario', 'timeline', 'initialState', 'finalState'],
    'runtimeFixtures',
  )

  const indexRecord = readRecord(root.index, 'index')
  const index = Object.fromEntries(
    Object.entries(indexRecord).map(([key, entry]) => [key, readString(entry, `index.${key}`)]),
  )
  if (index.timeline !== 'mock-data/timeline/moments.json') {
    fail('index.timeline', 'must register mock-data/timeline/moments.json')
  }

  const events = validateEvents(root.events)
  const artifacts = validateArtifacts(root.artifacts)
  const scenario = validateScenario(root.scenario)
  const timeline = validateTimeline(root.timeline, scenario)
  if (timeline.scenarioId !== scenario.id) fail('timeline.scenarioId', 'must resolve to scenario.id')
  const initialState = validateStateFixture(root.initialState, 'initialState')
  const finalState = validateStateFixture(root.finalState, 'finalState')
  assertInitialState(initialState)
  assertFinalState(finalState)

  return {
    index,
    events,
    artifacts,
    scenario,
    timeline,
    initialState,
    finalState,
  }
}
