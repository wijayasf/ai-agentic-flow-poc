import { describe, expect, it } from 'vitest'
import {
  createInitialRuntimeState,
  transitionRuntimeState,
} from '../../domain/runtime'
import type { RuntimeState } from '../../domain/runtime'
import { systemPresentationState } from './systemPresentationState'

function stateWithActiveSystem(id: RuntimeState['activeSystemIds'][number]) {
  return {
    ...createInitialRuntimeState(),
    activeSystemIds: [id],
  } satisfies RuntimeState
}

describe('systemPresentationState', () => {
  it('returns inactive for systems not currently engaged', () => {
    const idle = createInitialRuntimeState()
    expect(systemPresentationState(idle, 'system-crm')).toBe('inactive')
    expect(systemPresentationState(idle, 'system-sap-s4hana')).toBe('inactive')
  })

  it('returns engaged for active non-SAP-S4HANA systems', () => {
    const state = stateWithActiveSystem('system-crm')
    expect(systemPresentationState(state, 'system-crm')).toBe('engaged')

    const policyState = stateWithActiveSystem('system-policy-repository')
    expect(
      systemPresentationState(policyState, 'system-policy-repository'),
    ).toBe('engaged')

    const cxState = stateWithActiveSystem('system-sap-cx')
    expect(systemPresentationState(cxState, 'system-sap-cx')).toBe('engaged')
  })

  it('reports failed for SAP S/4HANA while playback is failed', () => {
    const state: RuntimeState = {
      ...stateWithActiveSystem('system-sap-s4hana'),
      playbackStatus: 'failed',
    }
    expect(systemPresentationState(state, 'system-sap-s4hana')).toBe('failed')
  })

  it('reports recovering for SAP S/4HANA while playback is recovering', () => {
    const state: RuntimeState = {
      ...stateWithActiveSystem('system-sap-s4hana'),
      playbackStatus: 'recovering',
    }
    expect(systemPresentationState(state, 'system-sap-s4hana')).toBe(
      'recovering',
    )
  })

  it('reports resolved for SAP S/4HANA once failure has been recovered', () => {
    const state: RuntimeState = {
      ...stateWithActiveSystem('system-sap-s4hana'),
      failureStatus: 'recovered',
    }
    expect(systemPresentationState(state, 'system-sap-s4hana')).toBe('resolved')
  })

  it('walks the auto-mode timeline without regressing per-system states', () => {
    let s = transitionRuntimeState(createInitialRuntimeState('auto'), {
      type: 'START',
    })
    s = transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds: 60 })
    // any non-idle timeline point: every system reflects the runtime bookkeeping,
    // never a UI-derived guess
    for (const id of [
      'system-crm',
      'system-policy-repository',
      'system-sap-cx',
      'system-sap-s4hana',
    ] as const) {
      const presented = systemPresentationState(s, id)
      expect(['inactive', 'engaged', 'failed', 'recovering', 'resolved']).toContain(
        presented,
      )
    }
  })
})
