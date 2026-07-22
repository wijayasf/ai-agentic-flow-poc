import rootEventsFixture from '@fixtures/system-events/events.json'

export const REFERENCE_COMPOSITION_NOTICE = 'QA/reference-composition data only.'

export type ReferenceCompositionEvent = (typeof rootEventsFixture.events)[number]

const [evt1, evt2, evt3, evt4, evt5] = rootEventsFixture.events

const referenceOnlyEvents: ReferenceCompositionEvent[] = [
  {
    id: 'evt-6',
    time: '09:17:05',
    agent: 'Policy Agent',
    action: 'Policy applied',
    skill: 'Policy retrieval',
    output: 'Defect resolution policy applied',
  },
  {
    id: 'evt-7',
    time: '09:17:38',
    agent: 'Finance Agent',
    action: 'Finance context prepared',
    skill: 'Financial calculation',
    output: 'Service recovery requires approval',
  },
  {
    id: 'evt-8',
    time: '09:18:15',
    agent: 'Case Commander',
    action: 'Case escalated',
    skill: 'Case orchestration',
    output: 'Incorrectly closed case escalated',
  },
  {
    id: 'evt-9',
    time: '09:19:05',
    agent: 'Finance Agent',
    action: 'Approval requested',
    skill: 'Financial calculation',
    output: 'Resolution package requires approval',
  },
  {
    id: 'evt-10',
    time: '09:19:45',
    agent: 'Case Commander',
    action: 'Approval recorded',
    skill: 'Human approval',
    output: 'Human approval recorded',
  },
  {
    id: 'evt-11',
    time: '09:20:10',
    agent: 'Finance Agent',
    action: 'Finance posting failed',
    skill: 'Finance posting',
    output: 'FINANCE_POST_TIMEOUT',
  },
  {
    id: 'evt-12',
    time: '09:20:30',
    agent: 'Finance Agent',
    action: 'Fallback retry succeeded',
    skill: 'Finance posting',
    output: 'Finance posting completed',
  },
]

export const referenceCompositionEvents: readonly ReferenceCompositionEvent[] = [
  evt1,
  evt2,
  referenceOnlyEvents[0],
  evt3,
  referenceOnlyEvents[1],
  evt4,
  referenceOnlyEvents[2],
  evt5,
  referenceOnlyEvents[3],
  referenceOnlyEvents[4],
  referenceOnlyEvents[5],
  referenceOnlyEvents[6],
]

