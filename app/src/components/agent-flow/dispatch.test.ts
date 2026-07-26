import { describe, expect, it } from 'vitest'
import {
  createInitialRuntimeState,
  selectRuntimeViewModel,
  transitionRuntimeState,
} from '../../domain/runtime'
import {
  selectDispatchingAgentIds,
  selectInvestigationWaveAgentIds,
} from './dispatch'

function stateAt(seconds: number) {
  let s = transitionRuntimeState(createInitialRuntimeState('auto'), {
    type: 'START',
  })
  s = transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds })
  return s
}

function viewModelAt(seconds: number) {
  return selectRuntimeViewModel(stateAt(seconds))
}

describe('selectDispatchingAgentIds', () => {
  it('is empty while the runtime is idle', () => {
    const vm = selectRuntimeViewModel(createInitialRuntimeState())
    expect(Array.from(selectDispatchingAgentIds(vm))).toEqual([])
  })

  it('is empty before the ai-typing window opens', () => {
    expect(Array.from(selectDispatchingAgentIds(viewModelAt(6)))).toEqual([])
  })

  it('includes the Customer Complaint Agent during ai-typing', () => {
    expect(Array.from(selectDispatchingAgentIds(viewModelAt(7)))).toEqual([
      'agent-customer-complaint',
    ])
    expect(Array.from(selectDispatchingAgentIds(viewModelAt(8)))).toEqual([
      'agent-customer-complaint',
    ])
  })

  it('is empty once the AI acknowledgement lands', () => {
    expect(Array.from(selectDispatchingAgentIds(viewModelAt(9)))).toEqual([])
    expect(Array.from(selectDispatchingAgentIds(viewModelAt(15)))).toEqual([])
  })
})

describe('selectInvestigationWaveAgentIds', () => {
  it('is empty while the runtime is idle', () => {
    expect(
      Array.from(selectInvestigationWaveAgentIds(createInitialRuntimeState())),
    ).toEqual([])
  })

  it('is empty before Investigation begins (M03 hold)', () => {
    expect(
      Array.from(selectInvestigationWaveAgentIds(stateAt(60))),
    ).toEqual([])
    expect(
      Array.from(selectInvestigationWaveAgentIds(stateAt(85))),
    ).toEqual([])
  })

  it('includes Policy, Workflow, and Finance during M04 entry', () => {
    expect(
      Array.from(selectInvestigationWaveAgentIds(stateAt(90))),
    ).toEqual(['agent-policy', 'agent-workflow', 'agent-finance'])
    expect(
      Array.from(selectInvestigationWaveAgentIds(stateAt(110))),
    ).toEqual(['agent-policy', 'agent-workflow', 'agent-finance'])
  })

  it('clears once the runtime advances beyond M04', () => {
    // t=120 → M05, wave is complete
    expect(
      Array.from(selectInvestigationWaveAgentIds(stateAt(120))),
    ).toEqual([])
    expect(
      Array.from(selectInvestigationWaveAgentIds(stateAt(150))),
    ).toEqual([])
  })
})
