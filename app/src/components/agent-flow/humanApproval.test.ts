import { describe, expect, it } from 'vitest'
import {
  createInitialRuntimeState,
  selectRuntimeViewModel,
  transitionRuntimeState,
} from '../../domain/runtime'
import type { RuntimeState } from '../../domain/runtime'
import { selectHumanApproval } from './humanApproval'

function stateAt(seconds: number): RuntimeState {
  const started = transitionRuntimeState(createInitialRuntimeState('auto'), {
    type: 'START',
  })
  return transitionRuntimeState(started, { type: 'ADVANCE_TIME', seconds })
}

function wrapperAt(seconds: number) {
  const s = stateAt(seconds)
  return selectHumanApproval(s, selectRuntimeViewModel(s))
}

describe('selectHumanApproval (presentation wrapper)', () => {
  it('returns null while the runtime is idle', () => {
    const idle = createInitialRuntimeState()
    expect(selectHumanApproval(idle, selectRuntimeViewModel(idle))).toBeNull()
  })

  it('returns null during Intake, Investigation, and Conflict stages', () => {
    for (const t of [30, 92, 152, 212, 240, 270, 300]) {
      expect(wrapperAt(t)).toBeNull()
    }
  })

  it('renders the wrapper at M12 (Approval stage begins)', () => {
    const vm = wrapperAt(330)
    expect(vm).not.toBeNull()
    expect(vm?.heading).toBe('Human Approval')
    expect(vm?.subtitle).toMatch(/AI analysis completed/)
  })

  it('remains visible at M13 waiting_approval', () => {
    const s = stateAt(390)
    expect(s.currentMomentId).toBe('M13')
    expect(s.playbackStatus).toBe('waiting_approval')
    const vm = selectHumanApproval(s, selectRuntimeViewModel(s))
    expect(vm).not.toBeNull()
    expect(vm?.heading).toBe('Human Approval')
  })

  it('unmounts once the runtime records approval', () => {
    const gate = stateAt(390)
    const approved = transitionRuntimeState(gate, { type: 'APPROVE' })
    expect(selectHumanApproval(approved, selectRuntimeViewModel(approved))).toBeNull()
  })

  it('unmounts once the runtime records rejection', () => {
    const gate = stateAt(390)
    const rejected = transitionRuntimeState(gate, { type: 'REJECT' })
    expect(selectHumanApproval(rejected, selectRuntimeViewModel(rejected))).toBeNull()
  })

  it('exposes only presentation copy — no approval logic, no actions', () => {
    const vm = wrapperAt(390)
    // Shape check — only heading + subtitle. No button labels, no actions.
    expect(Object.keys(vm ?? {})).toEqual(['heading', 'subtitle'])
    const forbidden =
      /execution|customer notified|sap updated|refund granted|refund denied|compensation|resolution package|final resolution|Rp31|inspection scheduled/i
    expect(vm?.heading).not.toMatch(forbidden)
    expect(vm?.subtitle).not.toMatch(forbidden)
  })
})
