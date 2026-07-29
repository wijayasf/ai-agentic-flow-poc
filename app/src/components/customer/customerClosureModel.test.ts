import { describe, expect, it } from 'vitest'
import {
  createInitialRuntimeState,
  selectRuntimeViewModel,
  simulateAutoRun,
  transitionRuntimeState,
} from '../../domain/runtime'
import type { RuntimeState } from '../../domain/runtime'
import { runtimeFixtures } from '../../domain/runtime-fixtures/loadRuntimeFixtures'
import {
  CUSTOMER_CLOSURE_PROHIBITED_PHRASES,
  selectCustomerClosure,
} from './customerClosureModel'

function findMomentEnd(id: string): number {
  const m = runtimeFixtures.timeline.moments.find((moment) => moment.id === id)
  if (!m) throw new Error(`moment ${id} not found`)
  return m.startSecond + m.durationSeconds
}

function stateAt(seconds: number): RuntimeState {
  const started = transitionRuntimeState(createInitialRuntimeState('auto'), {
    type: 'START',
  })
  return transitionRuntimeState(started, { type: 'ADVANCE_TIME', seconds })
}

function closureAt(seconds: number) {
  const s = stateAt(seconds)
  return selectCustomerClosure(selectRuntimeViewModel(s))
}

// Auto mode reaches waiting_approval only after M25 timer expires.
const APPROVAL_GATE_SECOND = findMomentEnd('M25') + 1

describe('selectCustomerClosure', () => {
  it('returns null while the runtime is idle', () => {
    const idle = createInitialRuntimeState()
    expect(selectCustomerClosure(selectRuntimeViewModel(idle))).toBeNull()
  })

  it('returns null throughout the internal work (intake, investigation, workflow)', () => {
    // Sample points across the compressed timeline before approval.
    for (const t of [1, 5, 15, 30, 60, 100, 200, 300, 400]) {
      expect(closureAt(t)).toBeNull()
    }
  })

  it('returns null when the reviewer rejects (terminal outcome escalated)', () => {
    const gate = stateAt(APPROVAL_GATE_SECOND)
    const rejected = transitionRuntimeState(gate, { type: 'REJECT' })
    expect(rejected.terminalOutcome).toBe('escalated')
    expect(selectCustomerClosure(selectRuntimeViewModel(rejected))).toBeNull()
  })

  it('returns null when the runtime is approved but final outcome is not yet reached', () => {
    const gate = stateAt(APPROVAL_GATE_SECOND)
    const approved = transitionRuntimeState(gate, { type: 'APPROVE' })
    const vm = selectRuntimeViewModel(approved)
    const closure = selectCustomerClosure(vm)
    if (vm.finalOutcome?.type === 'approved') {
      expect(closure).not.toBeNull()
    } else {
      expect(closure).toBeNull()
    }
  })

  it('returns the closure once the full Auto run completes with approved outcome', () => {
    const finalState = simulateAutoRun()
    const vm = selectRuntimeViewModel(finalState)
    expect(vm.finalOutcome?.type).toBe('approved')
    const closure = selectCustomerClosure(vm)
    expect(closure).not.toBeNull()
    expect(closure?.senderName).toBe('AI Resolution Officer')
    expect(closure?.status).toBe('delivered')
    expect(closure?.statusLabel).toBe('Delivered')
    expect(closure?.chipLabel).toBe('Resolution Delivered')
    expect(closure?.timestampDisplay).toBe('10:00 AM')
  })

  it('publishes exactly five customer-facing lines (Bahasa Indonesia)', () => {
    const finalState = simulateAutoRun()
    const closure = selectCustomerClosure(selectRuntimeViewModel(finalState))
    expect(closure?.messageLines).toHaveLength(5)
    expect(closure?.messageLines[0]).toBe('Terima kasih, Bu Rina.')
    expect(closure?.messageLines[1]).toMatch(/keluhan.*bukti/i)
    expect(closure?.messageLines[2]).toMatch(
      /kompensasi sebesar Rp31\.000\.000 telah memperoleh persetujuan/i,
    )
    expect(closure?.messageLines[3]).toMatch(/pencairan kompensasi telah dimulai/i)
    expect(closure?.messageLines[4]).toMatch(/pembaruan berikutnya/i)
  })

  it('exposes the approved compensation amount only in the final approved closure', () => {
    const finalState = simulateAutoRun()
    const closure = selectCustomerClosure(selectRuntimeViewModel(finalState))
    const body = (closure?.messageLines ?? []).join(' ')
    expect(body).toMatch(/Rp31\.000\.000/)
    // No closure at any pre-terminal stage.
    for (const t of [1, 5, 15, 30, 60, 100, 200, 300, 400]) {
      expect(closureAt(t)).toBeNull()
    }
    // Rejected outcome must not expose approved compensation wording.
    const gate = stateAt(APPROVAL_GATE_SECOND)
    const rejected = transitionRuntimeState(gate, { type: 'REJECT' })
    const rejectedClosure = selectCustomerClosure(selectRuntimeViewModel(rejected))
    expect(rejectedClosure).toBeNull()
  })

  it('never uses any prohibited phrase (Payment Completed / Funds Transferred / Funds Received)', () => {
    const finalState = simulateAutoRun()
    const closure = selectCustomerClosure(selectRuntimeViewModel(finalState))
    const body = (closure?.messageLines ?? []).join(' ')
    for (const phrase of CUSTOMER_CLOSURE_PROHIBITED_PHRASES) {
      expect(body.toLowerCase()).not.toContain(phrase.toLowerCase())
    }
  })

  it('never leaks internal specialist / recommendation / investigation wording in the message body', () => {
    const finalState = simulateAutoRun()
    const closure = selectCustomerClosure(selectRuntimeViewModel(finalState))
    const body = (closure?.messageLines ?? []).join(' ')
    // Whole-word / phrase matches. Sender persona name is exempt (separate field).
    const forbidden =
      /\bAI\b|recommendation|investigation|conflict|specialist agent|SAP\b|CRM\b|correlat/i
    expect(body).not.toMatch(forbidden)
  })
})
