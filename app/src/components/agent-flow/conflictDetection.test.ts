import { describe, expect, it } from 'vitest'
import {
  createInitialRuntimeState,
  selectRuntimeViewModel,
  transitionRuntimeState,
} from '../../domain/runtime'
import type { RuntimeState } from '../../domain/runtime'
import {
  CONFLICT_PHASE_LABEL,
  selectConflictDetection,
} from './conflictDetection'

function stateAt(seconds: number): RuntimeState {
  const s = transitionRuntimeState(createInitialRuntimeState('auto'), {
    type: 'START',
  })
  return transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds })
}

function detectionAt(seconds: number) {
  const s = stateAt(seconds)
  return selectConflictDetection(s, selectRuntimeViewModel(s))
}

describe('selectConflictDetection', () => {
  it('returns null while the runtime is idle', () => {
    const s = createInitialRuntimeState()
    expect(selectConflictDetection(s, selectRuntimeViewModel(s))).toBeNull()
  })

  it('returns null before M08 (Investigation phase up to and including M07)', () => {
    expect(detectionAt(30)).toBeNull() // M01
    expect(detectionAt(92)).toBeNull() // M04
    expect(detectionAt(122)).toBeNull() // M05
    expect(detectionAt(152)).toBeNull() // M06
    expect(detectionAt(182)).toBeNull() // M07
  })

  it('at M08 is in analyzing phase with no findings and no summary', () => {
    const c = detectionAt(212)
    expect(c).not.toBeNull()
    expect(c?.phase).toBe('analyzing')
    expect(c?.subtitle).toBe('Analyzing evidence consistency…')
    expect(c?.findings).toEqual([])
    expect(c?.findingCount).toBe(0)
    expect(c?.summaryLines).toBeNull()
  })

  it('at M09 flips to complete phase with three findings and the summary', () => {
    const c = detectionAt(240)
    expect(c?.phase).toBe('complete')
    expect(c?.subtitle).toBe('Conflict analysis complete')
    expect(c?.findingCount).toBe(3)
    expect(c?.findings.map((f) => f.id)).toEqual([
      'conflict-policy',
      'conflict-workflow',
      'conflict-finance',
    ])
    expect(c?.summaryLines).toEqual([
      '3 evidence inconsistencies identified',
      'Further review required',
      'No recommendation generated',
    ])
  })

  it('holds the same complete state through M10 and M11 (Conflict stage)', () => {
    for (const t of [270, 300]) {
      const c = detectionAt(t)
      expect(c?.phase).toBe('complete')
      expect(c?.findingCount).toBe(3)
    }
  })

  it('returns null once the runtime enters the Approval stage at M12', () => {
    expect(detectionAt(330)).toBeNull()
  })

  it('exposes canonical neutral category labels for each finding', () => {
    const c = detectionAt(240)
    expect(c?.findings.map((f) => f.categoryLabel)).toEqual([
      'Policy inconsistency',
      'Timeline inconsistency',
      'Financial clarification required',
    ])
  })

  it('exposes provenance for every finding (agent name + system name)', () => {
    const c = detectionAt(240)
    expect(c?.findings.map((f) => `${f.agentName} → ${f.systemName}`)).toEqual([
      'Policy Agent → Policy Repository',
      'Workflow Agent → SAP CX',
      'Finance Agent → SAP S/4HANA',
    ])
  })

  it('never leaks affirmative Recommendation / Approval / Refund / Compensation wording anywhere', () => {
    // "No recommendation generated" is the *documented negation* — allowed
    // because it explicitly communicates the absence of a recommendation.
    // Strip that phrase before running the forbidden regex.
    const allowedNegations = /no recommendation generated/gi
    const forbidden =
      /recommend|approv|reject|refund granted|refund denied|compensation|resolution package|execution|customer notification|email|severity|risk|confidence|probability|root cause/i
    for (const t of [212, 240, 270, 300]) {
      const c = detectionAt(t)
      const raw = `${c?.subtitle ?? ''} ${(c?.summaryLines ?? []).join(' ')} ${(c?.findings ?? [])
        .map((f) => `${f.categoryLabel} ${f.description}`)
        .join(' ')}`
      const stripped = raw.replace(allowedNegations, '')
      expect(stripped).not.toMatch(forbidden)
    }
  })

  it('summary explicitly states no recommendation was generated', () => {
    const c = detectionAt(240)
    // We must communicate the *absence* of a recommendation — this is neutral,
    // not a recommendation itself.
    expect(c?.summaryLines?.join(' ')).toContain('No recommendation generated')
  })
})

describe('CONFLICT_PHASE_LABEL', () => {
  it('publishes the two semantic phase labels', () => {
    expect(CONFLICT_PHASE_LABEL.analyzing).toBe('Analyzing')
    expect(CONFLICT_PHASE_LABEL.complete).toBe('Complete')
  })
})
