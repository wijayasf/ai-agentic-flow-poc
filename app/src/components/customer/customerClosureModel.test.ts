import { describe, expect, it } from 'vitest'
import {
  createInitialRuntimeState,
  selectRuntimeViewModel,
  simulateAutoRun,
  transitionRuntimeState,
} from '../../domain/runtime'
import type { RuntimeState } from '../../domain/runtime'
import { selectCustomerClosure } from './customerClosureModel'

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

describe('selectCustomerClosure', () => {
  it('returns null while the runtime is idle', () => {
    const idle = createInitialRuntimeState()
    expect(selectCustomerClosure(selectRuntimeViewModel(idle))).toBeNull()
  })

  it('returns null throughout the internal work (Intake, Investigation, Conflict, Approval)', () => {
    for (const t of [30, 92, 152, 212, 240, 270, 300, 330, 390]) {
      expect(closureAt(t)).toBeNull()
    }
  })

  it('returns null when the reviewer rejects (terminal outcome escalated)', () => {
    const gate = stateAt(390)
    const rejected = transitionRuntimeState(gate, { type: 'REJECT' })
    expect(rejected.terminalOutcome).toBe('escalated')
    expect(selectCustomerClosure(selectRuntimeViewModel(rejected))).toBeNull()
  })

  it('returns null when the runtime is approved but final outcome is not yet reached', () => {
    // Right after APPROVE, terminalOutcome may still be 'unresolved' while
    // the runtime advances through post-approval moments.
    const gate = stateAt(390)
    const approved = transitionRuntimeState(gate, { type: 'APPROVE' })
    // Depending on how the runtime is modeled, finalOutcome may already be
    // populated or still null. Guard: closure only shows when finalOutcome
    // exists with type 'approved'.
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

  it('publishes exactly five customer-facing lines', () => {
    const finalState = simulateAutoRun()
    const closure = selectCustomerClosure(selectRuntimeViewModel(finalState))
    expect(closure?.messageLines).toHaveLength(5)
    expect(closure?.messageLines[0]).toBe('Thank you for your patience, Rina.')
    expect(closure?.messageLines[1]).toMatch(/your case has been resolved/i)
    expect(closure?.messageLines[2]).toMatch(/inspection has been scheduled/i)
    expect(closure?.messageLines[3]).toMatch(
      /Compensation of Rp31,000,000 has been approved and processed/i,
    )
    expect(closure?.messageLines[4]).toMatch(/keep you informed/i)
  })

  it('exposes the approved compensation amount only in the final approved closure', () => {
    const finalState = simulateAutoRun()
    const closure = selectCustomerClosure(selectRuntimeViewModel(finalState))
    const body = (closure?.messageLines ?? []).join(' ')
    expect(body).toMatch(/Rp31,000,000/)
    // No amount at any pre-terminal stage.
    for (const t of [30, 92, 152, 212, 240, 270, 300, 330, 390]) {
      expect(closureAt(t)).toBeNull()
    }
    // Rejected outcome must not expose approved compensation wording.
    const gate = stateAt(390)
    const rejected = transitionRuntimeState(gate, { type: 'REJECT' })
    const rejectedClosure = selectCustomerClosure(selectRuntimeViewModel(rejected))
    expect(rejectedClosure).toBeNull()
  })

  it('never leaks AI / Recommendation / Investigation / Conflict / Policy / Enterprise-system wording in the message body', () => {
    const finalState = simulateAutoRun()
    const closure = selectCustomerClosure(selectRuntimeViewModel(finalState))
    const body = (closure?.messageLines ?? []).join(' ')
    // Whole-word / phrase matches. Sender persona name is exempt (separate field).
    const forbidden =
      /\bAI\b|recommendation|investigation|conflict|policy|internal approval|enterprise system|SAP\b|CRM\b|reasoning|correlat|specialist agent/i
    expect(body).not.toMatch(forbidden)
  })
})
