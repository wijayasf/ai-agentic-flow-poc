import { describe, expect, it } from 'vitest'
import {
  createInitialRuntimeState,
  selectRuntimeViewModel,
  transitionRuntimeState,
} from '../../domain/runtime'
import type { RuntimeState } from '../../domain/runtime'
import {
  CORRELATION_OVERALL_STATE_LABEL,
  CORRELATION_SOURCE_STATE_LABEL,
  selectEvidenceCorrelation,
} from './evidenceCorrelation'

function stateAt(seconds: number): RuntimeState {
  const s = transitionRuntimeState(createInitialRuntimeState('auto'), {
    type: 'START',
  })
  return transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds })
}

function correlationAt(seconds: number) {
  const s = stateAt(seconds)
  return selectEvidenceCorrelation(s, selectRuntimeViewModel(s))
}

describe('selectEvidenceCorrelation', () => {
  it('returns null while the runtime is idle', () => {
    const s = createInitialRuntimeState()
    expect(selectEvidenceCorrelation(s, selectRuntimeViewModel(s))).toBeNull()
  })

  it('returns null during the Intake stage', () => {
    expect(correlationAt(30)).toBeNull() // M01
    expect(correlationAt(85)).toBeNull() // M03 hold
  })

  it('returns null once the runtime enters the Conflict stage at M09', () => {
    expect(correlationAt(240)).toBeNull()
  })

  it('at M04 is Waiting with three unmapped sources', () => {
    const c = correlationAt(92)
    expect(c).not.toBeNull()
    expect(c?.overallState).toBe('waiting')
    expect(c?.mappedCount).toBe(0)
    expect(c?.totalSources).toBe(3)
    expect(c?.sources.map((s) => s.state)).toEqual([
      'waiting',
      'waiting',
      'waiting',
    ])
    expect(c?.subtitle).toBe('Awaiting evidence to correlate…')
    expect(c?.summary).toBeNull()
  })

  it('at M05 is Correlating with Policy mapped, Workflow and Finance waiting', () => {
    const c = correlationAt(122)
    expect(c?.overallState).toBe('correlating')
    expect(c?.mappedCount).toBe(1)
    expect(c?.sources.map((s) => s.state)).toEqual([
      'mapped',
      'waiting',
      'waiting',
    ])
    expect(c?.subtitle).toBe('Cross-referencing enterprise evidence…')
    expect(c?.summary).toBeNull()
  })

  it('at M06 is Correlating with Policy + Workflow mapped, Finance waiting', () => {
    const c = correlationAt(152)
    expect(c?.overallState).toBe('correlating')
    expect(c?.mappedCount).toBe(2)
    expect(c?.sources.map((s) => s.state)).toEqual([
      'mapped',
      'mapped',
      'waiting',
    ])
  })

  it('at M07 has all three mapped but remains Correlating (not yet Complete)', () => {
    const c = correlationAt(182)
    expect(c?.overallState).toBe('correlating')
    expect(c?.mappedCount).toBe(3)
    expect(c?.sources.map((s) => s.state)).toEqual([
      'mapped',
      'mapped',
      'mapped',
    ])
    expect(c?.summary).toBeNull()
  })

  it('at M08 transitions to Complete with the neutral summary', () => {
    const c = correlationAt(212)
    expect(c?.overallState).toBe('complete')
    expect(c?.mappedCount).toBe(3)
    expect(c?.subtitle).toBe('Cross-reference complete')
    expect(c?.summary).toBe('Evidence correlation complete')
  })

  it('exposes canonical source labels and provenance in canonical order', () => {
    const c = correlationAt(92)
    expect(c?.sources.map((s) => s.sourceLabel)).toEqual([
      'Policy Repository',
      'Customer Timeline',
      'Financial Context',
    ])
    expect(c?.sources.map((s) => s.agentName)).toEqual([
      'Policy Agent',
      'Workflow Agent',
      'Finance Agent',
    ])
  })

  it('never leaks Conflict / Recommendation / Approval wording in any moment', () => {
    const moments = [92, 122, 152, 182, 212]
    for (const t of moments) {
      const c = correlationAt(t)
      const text = `${c?.subtitle ?? ''} ${c?.summary ?? ''}`
      expect(text).not.toMatch(/conflict/i)
      expect(text).not.toMatch(/recommend/i)
      expect(text).not.toMatch(/approv/i)
      expect(text).not.toMatch(/reject/i)
      expect(text).not.toMatch(/violat/i)
      expect(text).not.toMatch(/mismatch/i)
      expect(text).not.toMatch(/exception/i)
      expect(text).not.toMatch(/root cause/i)
    }
  })
})

describe('correlation label maps', () => {
  it('publishes the three source-state labels', () => {
    expect(CORRELATION_SOURCE_STATE_LABEL.waiting).toBe('Waiting')
    expect(CORRELATION_SOURCE_STATE_LABEL.mapped).toBe('Mapped')
  })

  it('publishes the three overall-state labels', () => {
    expect(CORRELATION_OVERALL_STATE_LABEL.waiting).toBe('Waiting')
    expect(CORRELATION_OVERALL_STATE_LABEL.correlating).toBe('Correlating')
    expect(CORRELATION_OVERALL_STATE_LABEL.complete).toBe('Complete')
  })
})
