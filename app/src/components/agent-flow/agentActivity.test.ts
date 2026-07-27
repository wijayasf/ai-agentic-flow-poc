import { describe, expect, it } from 'vitest'
import {
  createInitialRuntimeState,
  selectRuntimeViewModel,
  transitionRuntimeState,
} from '../../domain/runtime'
import {
  isSystemSettled,
  selectAgentActivitySubtitle,
  selectAgentProgressState,
  selectCommanderInvestigationMonitoring,
  selectPairedAgentStatus,
  SYSTEM_PAIRED_AGENT,
} from './agentActivity'

function viewModelAt(seconds: number) {
  let s = transitionRuntimeState(createInitialRuntimeState('auto'), {
    type: 'START',
  })
  s = transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds })
  return selectRuntimeViewModel(s)
}

describe('selectAgentActivitySubtitle', () => {
  it('returns null for the Customer Complaint Agent in every lifecycle state', () => {
    expect(selectAgentActivitySubtitle('agent-customer-complaint', 'waiting')).toBeNull()
    expect(selectAgentActivitySubtitle('agent-customer-complaint', 'working')).toBeNull()
    expect(selectAgentActivitySubtitle('agent-customer-complaint', 'completed')).toBeNull()
  })

  it('returns null for specialist agents in the waiting state', () => {
    expect(selectAgentActivitySubtitle('agent-policy', 'waiting')).toBeNull()
    expect(selectAgentActivitySubtitle('agent-workflow', 'waiting')).toBeNull()
    expect(selectAgentActivitySubtitle('agent-finance', 'waiting')).toBeNull()
  })

  it('returns the canonical working subtitle for each specialist', () => {
    expect(selectAgentActivitySubtitle('agent-policy', 'working')).toBe(
      'Reading Policy Repository…',
    )
    expect(selectAgentActivitySubtitle('agent-workflow', 'working')).toBe(
      'Checking SAP CX case history…',
    )
    expect(selectAgentActivitySubtitle('agent-finance', 'working')).toBe(
      'Preparing compensation context…',
    )
  })

  it('returns the completion cue for each specialist without leaking a finding', () => {
    expect(selectAgentActivitySubtitle('agent-policy', 'completed')).toBe(
      'Policy review complete',
    )
    expect(selectAgentActivitySubtitle('agent-workflow', 'completed')).toBe(
      'Workflow review complete',
    )
    expect(selectAgentActivitySubtitle('agent-finance', 'completed')).toBe(
      'Finance review complete',
    )
  })
})

describe('selectCommanderInvestigationMonitoring', () => {
  it('is false while the runtime is idle', () => {
    expect(
      selectCommanderInvestigationMonitoring(
        selectRuntimeViewModel(createInitialRuntimeState()),
      ),
    ).toBe(false)
  })

  it('is false during the Intake stage (M01–M03)', () => {
    expect(selectCommanderInvestigationMonitoring(viewModelAt(30))).toBe(false)
    expect(selectCommanderInvestigationMonitoring(viewModelAt(85))).toBe(false)
  })

  it('is true throughout the Investigation stage (M04–M08)', () => {
    expect(selectCommanderInvestigationMonitoring(viewModelAt(90))).toBe(true) // M04
    expect(selectCommanderInvestigationMonitoring(viewModelAt(120))).toBe(true) // M05
    expect(selectCommanderInvestigationMonitoring(viewModelAt(150))).toBe(true) // M06
    expect(selectCommanderInvestigationMonitoring(viewModelAt(180))).toBe(true) // M07
    expect(selectCommanderInvestigationMonitoring(viewModelAt(210))).toBe(true) // M08
  })

  it('is false once the runtime leaves the Investigation stage', () => {
    // M09 = Conflict stage
    expect(selectCommanderInvestigationMonitoring(viewModelAt(240))).toBe(false)
  })
})

describe('selectAgentProgressState', () => {
  it('maps lifecycle statuses to the three deterministic progress buckets', () => {
    expect(selectAgentProgressState('waiting')).toBe('inactive')
    expect(selectAgentProgressState('working')).toBe('active')
    expect(selectAgentProgressState('needs_review')).toBe('active')
    expect(selectAgentProgressState('completed')).toBe('complete')
    expect(selectAgentProgressState('blocked')).toBe('inactive')
  })
})

describe('system pairing helpers', () => {
  it('maps every enterprise system to its canonical paired specialist', () => {
    expect(SYSTEM_PAIRED_AGENT).toEqual({
      'system-crm': 'agent-customer-complaint',
      'system-policy-repository': 'agent-policy',
      'system-sap-cx': 'agent-workflow',
      'system-sap-s4hana': 'agent-finance',
    })
  })

  it('reads the paired agent status from the current viewModel', () => {
    const vm = viewModelAt(90) // M04 — all three specialists working
    expect(selectPairedAgentStatus('system-policy-repository', vm)).toBe('working')
    expect(selectPairedAgentStatus('system-sap-cx', vm)).toBe('working')
    expect(selectPairedAgentStatus('system-sap-s4hana', vm)).toBe('working')
  })

  it('reflects staged completion across M05 / M06 / M07', () => {
    expect(selectPairedAgentStatus('system-policy-repository', viewModelAt(120))).toBe(
      'completed',
    )
    expect(selectPairedAgentStatus('system-sap-cx', viewModelAt(150))).toBe('completed')
    expect(selectPairedAgentStatus('system-sap-s4hana', viewModelAt(180))).toBe(
      'completed',
    )
  })

  it('returns null for an unknown system id', () => {
    expect(selectPairedAgentStatus('system-does-not-exist', viewModelAt(90))).toBeNull()
  })

  it('reports a system as settled only when engaged AND the paired agent has completed', () => {
    expect(isSystemSettled('engaged', 'completed')).toBe(true)
    expect(isSystemSettled('engaged', 'working')).toBe(false)
    expect(isSystemSettled('engaged', 'waiting')).toBe(false)
    expect(isSystemSettled('inactive', 'completed')).toBe(false)
  })
})
