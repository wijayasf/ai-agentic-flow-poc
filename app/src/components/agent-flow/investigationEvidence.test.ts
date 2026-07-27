import { describe, expect, it } from 'vitest'
import {
  createInitialRuntimeState,
  selectRuntimeViewModel,
  transitionRuntimeState,
} from '../../domain/runtime'
import {
  ACTIVITY_STATE_LABEL,
  lifecycleToActivityState,
  selectEvidenceCollectionSummary,
  selectInvestigationEvidenceItems,
} from './investigationEvidence'

function viewModelAt(seconds: number) {
  let s = transitionRuntimeState(createInitialRuntimeState('auto'), {
    type: 'START',
  })
  s = transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds })
  return selectRuntimeViewModel(s)
}

describe('lifecycleToActivityState', () => {
  it('maps lifecycle statuses onto the three semantic evidence-activity states', () => {
    expect(lifecycleToActivityState('waiting')).toBe('queued')
    expect(lifecycleToActivityState('working')).toBe('querying')
    expect(lifecycleToActivityState('completed')).toBe('retrieved')
    // Any unexpected status falls back to 'queued' so evidence UI never lies.
    expect(lifecycleToActivityState('blocked')).toBe('queued')
    expect(lifecycleToActivityState('needs_review')).toBe('queued')
  })
})

describe('selectInvestigationEvidenceItems', () => {
  it('returns null while the runtime is idle', () => {
    expect(
      selectInvestigationEvidenceItems(
        selectRuntimeViewModel(createInitialRuntimeState()),
      ),
    ).toBeNull()
  })

  it('returns null during the Intake stage (M01–M03)', () => {
    expect(selectInvestigationEvidenceItems(viewModelAt(30))).toBeNull() // M01
    expect(selectInvestigationEvidenceItems(viewModelAt(85))).toBeNull() // M03 hold
  })

  it('returns null once the runtime leaves the Investigation stage', () => {
    expect(selectInvestigationEvidenceItems(viewModelAt(240))).toBeNull() // M09
    expect(selectInvestigationEvidenceItems(viewModelAt(330))).toBeNull() // M12
  })

  it('at M04 exposes all three specialists as Querying with no evidence preview yet', () => {
    const items = selectInvestigationEvidenceItems(viewModelAt(90))
    expect(items).not.toBeNull()
    expect(items).toHaveLength(3)
    expect(items?.map((i) => i.activityState)).toEqual([
      'querying',
      'querying',
      'querying',
    ])
    expect(items?.map((i) => i.evidencePreview)).toEqual([null, null, null])
    expect(items?.map((i) => i.agentId)).toEqual([
      'agent-policy',
      'agent-workflow',
      'agent-finance',
    ])
    expect(items?.map((i) => i.systemId)).toEqual([
      'system-policy-repository',
      'system-sap-cx',
      'system-sap-s4hana',
    ])
    expect(items?.map((i) => i.activityLabel)).toEqual([
      'Policy repository query',
      'Customer case-history query',
      'Financial context query',
    ])
  })

  it('at M05 Policy is Retrieved with evidence preview; Workflow + Finance still Querying', () => {
    const items = selectInvestigationEvidenceItems(viewModelAt(120))
    expect(items?.map((i) => i.activityState)).toEqual([
      'retrieved',
      'querying',
      'querying',
    ])
    expect(items?.[0].evidencePreview).toBe(
      'Refund policy and exception criteria retrieved',
    )
    expect(items?.[1].evidencePreview).toBeNull()
    expect(items?.[2].evidencePreview).toBeNull()
  })

  it('at M06 Workflow is Retrieved; Policy stays Retrieved; Finance still Querying', () => {
    const items = selectInvestigationEvidenceItems(viewModelAt(150))
    expect(items?.map((i) => i.activityState)).toEqual([
      'retrieved',
      'retrieved',
      'querying',
    ])
    expect(items?.[1].evidencePreview).toBe(
      'Customer case timeline and escalation history retrieved',
    )
    expect(items?.[2].evidencePreview).toBeNull()
  })

  it('at M07 all three specialists are Retrieved with their evidence previews', () => {
    const items = selectInvestigationEvidenceItems(viewModelAt(180))
    expect(items?.map((i) => i.activityState)).toEqual([
      'retrieved',
      'retrieved',
      'retrieved',
    ])
    expect(items?.[2].evidencePreview).toBe(
      'Compensation context and cost-impact data retrieved',
    )
  })

  it('at M08 keeps the fully-retrieved state stable', () => {
    const items = selectInvestigationEvidenceItems(viewModelAt(210))
    expect(items?.every((i) => i.activityState === 'retrieved')).toBe(true)
    expect(items?.every((i) => i.evidencePreview !== null)).toBe(true)
  })

  it('exposes stable provenance fields (agent name + system name) on every row', () => {
    const items = selectInvestigationEvidenceItems(viewModelAt(90))
    expect(items?.map((i) => `${i.agentName} → ${i.systemName}`)).toEqual([
      'Policy Agent → Policy Repository',
      'Workflow Agent → SAP CX',
      'Finance Agent → SAP S/4HANA',
    ])
  })
})

describe('selectEvidenceCollectionSummary', () => {
  it('returns null while any specialist is still Querying', () => {
    expect(selectEvidenceCollectionSummary(viewModelAt(90))).toBeNull() // M04
    expect(selectEvidenceCollectionSummary(viewModelAt(120))).toBeNull() // M05
    expect(selectEvidenceCollectionSummary(viewModelAt(150))).toBeNull() // M06
  })

  it('returns the neutral cue once all three specialists have Retrieved', () => {
    expect(selectEvidenceCollectionSummary(viewModelAt(180))).toBe(
      'Evidence collection complete',
    )
    expect(selectEvidenceCollectionSummary(viewModelAt(210))).toBe(
      'Evidence collection complete',
    )
  })

  it('never leaks conclusion wording', () => {
    const summary = selectEvidenceCollectionSummary(viewModelAt(210)) ?? ''
    expect(summary).not.toMatch(/conflict|recommend|approve|reject|refund/i)
  })

  it('returns null outside Investigation', () => {
    expect(selectEvidenceCollectionSummary(viewModelAt(30))).toBeNull()
    expect(selectEvidenceCollectionSummary(viewModelAt(240))).toBeNull()
  })
})

describe('ACTIVITY_STATE_LABEL', () => {
  it('exposes the three semantic labels used by the compact status badge', () => {
    expect(ACTIVITY_STATE_LABEL.queued).toBe('Queued')
    expect(ACTIVITY_STATE_LABEL.querying).toBe('Querying')
    expect(ACTIVITY_STATE_LABEL.retrieved).toBe('Retrieved')
  })
})
