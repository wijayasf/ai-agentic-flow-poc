import artifactsFixture from '@fixtures/artifacts/artifacts.json'
import eventsFixture from '@fixtures/system-events/events.json'
import fixtureIndex from '@fixtures/index.json'
import scenarioFixture from '@fixtures/scenarios/main-scenario.json'
import finalStateFixture from '@fixtures/timeline/final-state.json'
import initialStateFixture from '@fixtures/timeline/initial-state.json'
import timelineFixture from '@fixtures/timeline/moments.json'
import type { RuntimeFixtureBundle } from './types'
import { validateRuntimeFixtures } from './validateRuntimeFixtures'

const rawRuntimeFixtures: unknown = {
  index: fixtureIndex,
  events: eventsFixture,
  artifacts: artifactsFixture,
  scenario: scenarioFixture,
  timeline: timelineFixture,
  initialState: initialStateFixture,
  finalState: finalStateFixture,
}

export function loadRuntimeFixtures(): RuntimeFixtureBundle {
  return validateRuntimeFixtures(rawRuntimeFixtures)
}

export const runtimeFixtures = loadRuntimeFixtures()
