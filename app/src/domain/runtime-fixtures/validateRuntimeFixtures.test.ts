import { describe, expect, it } from 'vitest'
import { runtimeFixtures } from './loadRuntimeFixtures'
import {
  AGENT_IDS,
  APPROVED_EFFECT_TYPES,
  ARTIFACT_IDS,
  EVENT_IDS,
  EVENT_REVEAL_ORDER,
  MOMENT_IDS,
  SYSTEM_IDS,
} from './types'
import { validateRuntimeFixtures } from './validateRuntimeFixtures'

interface MutableFixtureBundle {
  timeline: {
    moments: Array<{
      entryEffects: Array<Record<string, unknown>>
    }>
    [key: string]: unknown
  }
  initialState: Record<string, unknown>
  finalState: Record<string, unknown>
  [key: string]: unknown
}

function mutableFixtureBundle(): MutableFixtureBundle {
  return JSON.parse(JSON.stringify(runtimeFixtures)) as MutableFixtureBundle
}

describe('authoritative runtime state fixtures', () => {
  it('matches the exact initial-state contract', () => {
    expect(runtimeFixtures.initialState).toEqual({
      mode: 'presenter',
      playbackStatus: 'idle',
      currentMomentId: null,
      completedMomentIds: [],
      elapsedSeconds: 0,
      remainingSeconds: null,
      visibleEventIds: [],
      availableArtifactIds: [],
      activeAgentIds: [],
      activeSystemIds: [],
      conflictStatus: 'neutral',
      approvalStatus: 'not_required',
      failureStatus: 'not_injected',
      recoveryStatus: 'not_started',
      recommendationVisible: false,
      timerActive: false,
    })
  })

  it('matches the exact final-state contract', () => {
    expect(runtimeFixtures.finalState).toEqual({
      mode: 'presenter',
      playbackStatus: 'completed',
      currentMomentId: 'M21',
      completedMomentIds: MOMENT_IDS,
      elapsedSeconds: 600,
      remainingSeconds: 0,
      visibleEventIds: EVENT_REVEAL_ORDER,
      availableArtifactIds: ARTIFACT_IDS,
      activeAgentIds: AGENT_IDS,
      activeSystemIds: SYSTEM_IDS,
      conflictStatus: 'resolved',
      approvalStatus: 'approved',
      failureStatus: 'recovered',
      recoveryStatus: 'completed',
      recommendationVisible: true,
      timerActive: false,
    })
    expect(runtimeFixtures.finalState.completedMomentIds).toHaveLength(21)
    expect(runtimeFixtures.finalState.visibleEventIds).toHaveLength(12)
    expect(runtimeFixtures.finalState.availableArtifactIds).toHaveLength(4)
  })

  it('keeps timers inactive in both authoritative endpoint states', () => {
    expect(runtimeFixtures.initialState.timerActive).toBe(false)
    expect(runtimeFixtures.finalState.timerActive).toBe(false)
  })
})

describe('strict declarative fixture validation', () => {
  it('loads 12 official events and the unchanged 21-moment, 600-second timeline', () => {
    expect(runtimeFixtures.events.events.map((event) => event.id)).toEqual(EVENT_IDS)
    expect(runtimeFixtures.timeline.moments.map((moment) => moment.id)).toEqual(MOMENT_IDS)
    expect(runtimeFixtures.timeline.totalScheduledSeconds).toBe(600)
    expect(
      runtimeFixtures.timeline.moments.reduce(
        (total, moment) => total + moment.durationSeconds,
        0,
      ),
    ).toBe(600)
    expect(runtimeFixtures.index.timeline).toBe('mock-data/timeline/moments.json')
  })

  it('uses every approved effect type and no unsupported effect type', () => {
    const effectTypes = new Set(
      runtimeFixtures.timeline.moments.flatMap((moment) =>
        moment.entryEffects.map((effect) => effect.type),
      ),
    )
    expect([...effectTypes].sort()).toEqual([...APPROVED_EFFECT_TYPES].sort())
  })

  it('rejects an unsupported effect type', () => {
    const fixtures = mutableFixtureBundle()
    fixtures.timeline.moments[0].entryEffects[0] = { type: 'execute_callback' }
    expect(() => validateRuntimeFixtures(fixtures)).toThrow(/expected one of/)
  })

  it('rejects extra fields on an otherwise approved effect', () => {
    const fixtures = mutableFixtureBundle()
    fixtures.timeline.moments[1].entryEffects[0] = {
      type: 'reveal_event',
      eventId: 'evt-1',
      unexpected: true,
    }
    expect(() => validateRuntimeFixtures(fixtures)).toThrow(/expected fields/)
  })

  it('rejects missing required effect fields and invalid references', () => {
    const missingFieldFixtures = mutableFixtureBundle()
    missingFieldFixtures.timeline.moments[1].entryEffects[0] = { type: 'reveal_event' }
    expect(() => validateRuntimeFixtures(missingFieldFixtures)).toThrow(/expected fields/)

    const invalidReferenceFixtures = mutableFixtureBundle()
    invalidReferenceFixtures.timeline.moments[1].entryEffects[0] = {
      type: 'reveal_event',
      eventId: 'evt-99',
    }
    expect(() => validateRuntimeFixtures(invalidReferenceFixtures)).toThrow(/expected one of/)
  })

  it('rejects URL, callback, function, expression, timeout, interval, and executable-code fields', () => {
    const prohibitedFields = [
      'url',
      'callback',
      'function',
      'expression',
      'timeout',
      'interval',
      'executableCode',
    ]

    for (const field of prohibitedFields) {
      const fixtures = mutableFixtureBundle()
      fixtures.timeline[field] = field === 'url' ? 'https://example.invalid' : 'prohibited'
      expect(() => validateRuntimeFixtures(fixtures), field).toThrow(/prohibited/)
    }
  })

  it('rejects endpoint states that diverge from the exact contracts', () => {
    const initialFixtures = mutableFixtureBundle()
    initialFixtures.initialState.timerActive = true
    expect(() => validateRuntimeFixtures(initialFixtures)).toThrow(/initialState/)

    const finalFixtures = mutableFixtureBundle()
    finalFixtures.finalState.elapsedSeconds = 599
    expect(() => validateRuntimeFixtures(finalFixtures)).toThrow(/finalState/)
  })
})
