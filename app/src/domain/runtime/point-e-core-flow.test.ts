import { describe, expect, it } from 'vitest'
import {
  createInitialRuntimeState,
  selectRuntimeViewModel,
  transitionRuntimeState,
  isRuntimeActionLegal,
} from '.'
import { selectHumanApproval } from '../../components/agent-flow/humanApproval'
import { selectNotificationStrip } from '../../components/agent-flow/notificationStrip'
import { runtimeFixtures } from '../runtime-fixtures/loadRuntimeFixtures'
import { selectCustomerClosure } from '../../components/customer/customerClosureModel'
import type { RuntimeState } from './types'

function start(): RuntimeState {
  return transitionRuntimeState(createInitialRuntimeState('presenter'), {
    type: 'START',
  })
}

function advance(state: RuntimeState, seconds: number): RuntimeState {
  return transitionRuntimeState(state, { type: 'ADVANCE_TIME', seconds })
}

function findMomentStart(id: string): number {
  const m = runtimeFixtures.timeline.moments.find((mm) => mm.id === id)
  if (!m) throw new Error(`moment ${id} missing`)
  return m.startSecond
}

function findMomentEnd(id: string): number {
  const m = runtimeFixtures.timeline.moments.find((mm) => mm.id === id)
  if (!m) throw new Error(`moment ${id} missing`)
  return m.startSecond + m.durationSeconds
}

const M24_END = findMomentEnd('M24')
const M30_START = findMomentStart('M30')

describe('Point E — Finance recommendation → Human Approval checkpoint', () => {
  it('pauses at M24 boundary so Next Moment (not Resume) advances to Human Approval', () => {
    // Advance the timer just past M24 end. In presenter mode, M24 now has
    // completion.presenter = 'pause', so the reducer must land in 'paused'
    // (not 'waiting_approval') with the timer stopped.
    let state = start()
    state = advance(state, M24_END + 1)

    // Reach M24 as the currently-active moment, paused.
    expect(state.playbackStatus).toBe('paused')
    expect(state.currentMomentId).toBe('M24')
    expect(state.timerActive).toBe(false)

    // Resume must not be needed — Next Moment must be legal.
    expect(isRuntimeActionLegal(state, { type: 'NEXT_MOMENT' })).toBe(true)

    // Applying Next Moment must enter M25 (approval gate) in waiting_approval.
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    expect(state.currentMomentId).toBe('M25')
    expect(state.playbackStatus).toBe('waiting_approval')
    expect(state.approvalStatus).toBe('pending')

    // Human Approval package must now be renderable.
    const viewModel = selectRuntimeViewModel(state)
    const approval = selectHumanApproval(state, viewModel)
    expect(approval).not.toBeNull()
    expect(approval?.awaitingHumanDecision).toBe(true)
    expect(approval?.package.compensation.display).toBe('Rp31.000.000')
    expect(approval?.approvers).toHaveLength(4)
  })
})

describe('Point E — Approval chain runs on Next Moment without Resume', () => {
  it('advances one approver per Next Moment; auto-cascades after approver 4', () => {
    let state = start()
    state = advance(state, M24_END + 1)
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    // Approve starts the enterprise approval chain (approver 1 recorded).
    state = transitionRuntimeState(state, { type: 'APPROVE' })
    expect(state.approversCompleted).toBe(1)
    expect(state.playbackStatus).toBe('paused')

    // Approver 2
    expect(isRuntimeActionLegal(state, { type: 'NEXT_MOMENT' })).toBe(true)
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    expect(state.approversCompleted).toBe(2)
    expect(state.playbackStatus).toBe('paused')

    // Approver 3
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    expect(state.approversCompleted).toBe(3)
    expect(state.playbackStatus).toBe('paused')

    // Approver 4 — after entering M29 with approversCompleted === 4,
    // the reducer must let the timer run for automatic cascade.
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    expect(state.approversCompleted).toBe(4)
    expect(state.currentMomentId).toBe('M29')
    expect(state.playbackStatus).toBe('running')
    expect(state.timerActive).toBe(true)
  })

  it('never requires Resume anywhere in the target demo flow', () => {
    // Trace the full presenter path and assert Resume is never the only
    // legal action to advance the flow.
    let state = start()
    // No Resume needed while auto-cascading through M01–M23.
    state = advance(state, M24_END + 1)
    expect(state.currentMomentId).toBe('M24')
    // At M24 pause, Next Moment must be legal (Resume optional).
    expect(isRuntimeActionLegal(state, { type: 'NEXT_MOMENT' })).toBe(true)
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    // At M25 approval gate, Approve/Reject only (no Resume path).
    expect(state.playbackStatus).toBe('waiting_approval')
    state = transitionRuntimeState(state, { type: 'APPROVE' })
    // Through M26–M28, Next Moment advances each approver.
    for (let i = 0; i < 3; i += 1) {
      expect(isRuntimeActionLegal(state, { type: 'NEXT_MOMENT' })).toBe(true)
      state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    }
    // At M29 after approver 4, timer runs — auto-cascade M29→M33.
    expect(state.playbackStatus).toBe('running')
    // Advance the timer to consume the remaining scheduled seconds.
    state = advance(state, 600)
    expect(state.playbackStatus).toBe('completed')
    expect(state.terminalOutcome).toBe('approved')
  })
})

describe('Point E — Compressed early timing', () => {
  it('reveals complaint + all 3 attachments within 4 virtual seconds', () => {
    let state = start()
    state = advance(state, 4)
    const vm = selectRuntimeViewModel(state)
    expect(vm.earlyStory.showCustomerIdentity).toBe(true)
    expect(vm.earlyStory.showCustomerMessage).toBe(true)
    expect(vm.earlyStory.visibleAttachmentCount).toBe(3)
  })

  it('Complaint Agent becomes active by M04 start ≈ 6s', () => {
    let state = start()
    state = advance(state, findMomentStart('M04') + 1)
    expect(state.currentMomentId).toBe('M04')
    const vm = selectRuntimeViewModel(state)
    const complaint = vm.agentLifecycle.find(
      (a) => a.agentId === 'agent-customer-complaint',
    )
    expect(complaint?.status).toBe('working')
  })

  it('fires AI Resolution Officer acknowledgement after Milestone A (M05 complete)', () => {
    let state = start()
    // Advance past M05 boundary so completedMomentIds includes 'M05'.
    state = advance(state, findMomentStart('M06') + 1)
    expect(state.completedMomentIds).toContain('M05')
    const vm = selectRuntimeViewModel(state)
    expect(vm.earlyStory.showAiAcknowledgement).toBe(true)
  })

  it('does not fire chips until Complaint Agent reaches needs_review at M07', () => {
    let state = start()
    // Pre-M07: chips must not be eligible.
    state = advance(state, findMomentStart('M06') + 1)
    let vm = selectRuntimeViewModel(state)
    let complaint = vm.agentLifecycle.find(
      (a) => a.agentId === 'agent-customer-complaint',
    )
    expect(complaint?.status).toBe('working')

    // At/after M07 boundary: needs_review — chips are eligible.
    state = advance(state, 3)
    vm = selectRuntimeViewModel(state)
    complaint = vm.agentLifecycle.find(
      (a) => a.agentId === 'agent-customer-complaint',
    )
    expect(['needs_review', 'completed']).toContain(complaint?.status)
  })
})

describe('Point E — Human Approval collapse on Finance disbursement', () => {
  it('collapses when Finance enters Preparing Disbursement at M30', () => {
    let state = start()
    state = advance(state, M24_END + 1)
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    state = transitionRuntimeState(state, { type: 'APPROVE' })
    for (let i = 0; i < 3; i += 1) {
      state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    }
    // Auto-cascade M29 → M30. Advance enough seconds to reach M30.
    state = advance(state, findMomentStart('M30') - state.elapsedSeconds + 1)
    expect(state.currentMomentId).toBe('M30')

    const vm = selectRuntimeViewModel(state)
    const approval = selectHumanApproval(state, vm)
    expect(approval).not.toBeNull()
    expect(approval?.isCollapsed).toBe(true)
    expect(approval?.collapsedSummary.heading).toBe('Enterprise Approval Completed')
    expect(approval?.collapsedSummary.progressLabel).toBe('4 of 4 approvals')
  })

  it('keeps Rp31.000.000 available in the expanded package after collapse', () => {
    let state = start()
    state = advance(state, M24_END + 1)
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    state = transitionRuntimeState(state, { type: 'APPROVE' })
    for (let i = 0; i < 3; i += 1) {
      state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    }
    state = advance(state, M30_START - state.elapsedSeconds + 1)

    const vm = selectRuntimeViewModel(state)
    const approval = selectHumanApproval(state, vm)
    // Compensation amount is still present in the package view model even
    // when the header is collapsed; the component re-expands to show it.
    expect(approval?.package.compensation.display).toBe('Rp31.000.000')
  })
})

describe('Point E — Notification-strip audit trail', () => {
  it('records the compensation disbursement at M30 and disbursement initiated at M31', () => {
    let state = start()
    state = advance(state, M24_END + 1)
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    state = transitionRuntimeState(state, { type: 'APPROVE' })
    for (let i = 0; i < 3; i += 1) {
      state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    }
    state = advance(state, findMomentStart('M30') - state.elapsedSeconds + 1)

    // At M30, notification strip announces Finance reactivation.
    const stripM30 = selectNotificationStrip(state)
    expect(stripM30?.key).toBe('M30')
    expect(stripM30?.message.toLowerCase()).toContain('finance')

    state = advance(state, findMomentStart('M31') - state.elapsedSeconds + 1)
    const stripM31 = selectNotificationStrip(state)
    expect(stripM31?.key).toBe('M31')
    expect(stripM31?.message.toLowerCase()).toContain('disbursement')
  })
})

describe('Point E — Final customer response after Disbursement Initiated', () => {
  it('does not surface the customer closure before Disbursement Initiated', () => {
    let state = start()
    state = advance(state, M24_END + 1)
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    state = transitionRuntimeState(state, { type: 'APPROVE' })
    for (let i = 0; i < 3; i += 1) {
      state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    }
    // Between M29 auto-cascade and M31 boundary: no closure yet.
    state = advance(state, findMomentStart('M30') - state.elapsedSeconds + 1)
    const vm = selectRuntimeViewModel(state)
    expect(selectCustomerClosure(vm)).toBeNull()
  })

  it('surfaces the AI Resolution Officer closure only at terminal approved state', () => {
    let state = start()
    state = advance(state, M24_END + 1)
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    state = transitionRuntimeState(state, { type: 'APPROVE' })
    for (let i = 0; i < 3; i += 1) {
      state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    }
    // Full auto-cascade to completion.
    state = advance(state, 600)
    expect(state.playbackStatus).toBe('completed')
    expect(state.terminalOutcome).toBe('approved')

    const vm = selectRuntimeViewModel(state)
    const closure = selectCustomerClosure(vm)
    expect(closure).not.toBeNull()
    expect(closure?.senderName).toBe('AI Resolution Officer')
  })
})

describe('Point E — Case Resolved payment status distinction', () => {
  it('presents Payment Completed as not reached in the approved final outcome', () => {
    let state = start()
    state = advance(state, M24_END + 1)
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    state = transitionRuntimeState(state, { type: 'APPROVE' })
    for (let i = 0; i < 3; i += 1) {
      state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    }
    state = advance(state, 600)
    const vm = selectRuntimeViewModel(state)
    expect(vm.finalOutcome?.heading).toBe('Case Resolved')
    const items = vm.finalOutcome?.sections.flatMap((s) => s.items) ?? []
    expect(items).toContain('Case Resolved — completed')
    expect(items).toContain('Compensation Approved — completed')
    expect(items).toContain('Disbursement Initiated — completed')
    expect(items).toContain('Payment Completed — not reached')
  })
})

describe('Point F — Presenter flow never requires Resume (tick-by-tick)', () => {
  it('drives M28→M33 auto-cascade with 1-second ADVANCE_TIME ticks, no Resume', () => {
    let state = start()
    state = advance(state, M24_END + 1)
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    state = transitionRuntimeState(state, { type: 'APPROVE' })
    for (let i = 0; i < 3; i += 1) {
      state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    }
    // Now at M29 with approversCompleted=4, running.
    expect(state.currentMomentId).toBe('M29')
    expect(state.playbackStatus).toBe('running')

    // Simulate the actual browser tick loop: dispatch ADVANCE_TIME(1) each
    // second until the runtime reaches terminal 'completed'. RESUME must
    // never become legal during this window; Next Moment is disabled by
    // design while playing, but the timer never stalls in 'paused'.
    let ticks = 0
    while (state.playbackStatus !== 'completed' && ticks < 200) {
      expect(isRuntimeActionLegal(state, { type: 'RESUME' })).toBe(false)
      state = transitionRuntimeState(state, {
        type: 'ADVANCE_TIME',
        seconds: 1,
      })
      ticks += 1
    }
    expect(state.playbackStatus).toBe('completed')
    expect(state.terminalOutcome).toBe('approved')
    expect(state.completedMomentIds).toContain('M33')
  })

  it('exposes specialistsCompleted=4 at terminal Case Resolved', () => {
    let state = start()
    state = advance(state, M24_END + 1)
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    state = transitionRuntimeState(state, { type: 'APPROVE' })
    for (let i = 0; i < 3; i += 1) {
      state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    }
    state = advance(state, 600)
    const vm = selectRuntimeViewModel(state)
    expect(vm.specialistsCompleted).toBe(4)
    expect(vm.finalOutcome?.summary).toContain(
      '4 of 4 specialist agents completed',
    )
  })

  it('never surfaces Payment Completed / Funds Transferred / Funds Received as reached', () => {
    let state = start()
    state = advance(state, M24_END + 1)
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    state = transitionRuntimeState(state, { type: 'APPROVE' })
    for (let i = 0; i < 3; i += 1) {
      state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    }
    state = advance(state, 600)
    const vm = selectRuntimeViewModel(state)
    const items = vm.finalOutcome?.sections.flatMap((s) => s.items) ?? []
    const joined = items.join(' | ').toLowerCase()
    expect(joined).not.toContain('funds transferred — completed')
    expect(joined).not.toContain('funds received — completed')
    expect(joined).not.toContain('payment completed — completed')
    expect(items).toContain('Payment Completed — not reached')
  })
})

describe('Point E — Deterministic restart', () => {
  it('reproduces the same terminal state after RESTART + full Auto run', () => {
    // Auto mode: no APPROVE click — the hidden auto-approver runs, so we
    // verify determinism by advancing time twice and comparing outcomes.
    const auto1 = transitionRuntimeState(
      transitionRuntimeState(createInitialRuntimeState('auto'), { type: 'START' }),
      { type: 'ADVANCE_TIME', seconds: 600 },
    )
    const restarted = transitionRuntimeState(auto1, { type: 'RESTART' })
    const auto2 = transitionRuntimeState(
      transitionRuntimeState(restarted, { type: 'START' }),
      { type: 'ADVANCE_TIME', seconds: 600 },
    )
    expect(auto1.currentMomentId).toBe(auto2.currentMomentId)
    expect(auto1.elapsedSeconds).toBe(auto2.elapsedSeconds)
    expect(auto1.terminalOutcome).toBe(auto2.terminalOutcome)
    expect(auto1.completedMomentIds).toEqual(auto2.completedMomentIds)
  })
})

describe('Point F1 — Full presenter walk-through: RESUME never required', () => {
  it('walks M01→M33 using only START / NEXT_MOMENT / APPROVE / ADVANCE_TIME', () => {
    let state = start()
    const pauseReasons: Array<{ moment: string; reason: string }> = []
    let ticks = 0
    // Cap iterations to avoid infinite loops; the full walk needs well under 800 ticks.
    while (state.playbackStatus !== 'completed' && ticks < 800) {
      // RESUME must never become the ONLY way to advance.
      const resumeLegal = isRuntimeActionLegal(state, { type: 'RESUME' })
      const nextLegal = isRuntimeActionLegal(state, { type: 'NEXT_MOMENT' })
      const approveLegal = isRuntimeActionLegal(state, { type: 'APPROVE' })
      const advanceLegal = isRuntimeActionLegal(state, {
        type: 'ADVANCE_TIME',
        seconds: 1,
      })

      // Assertion: RESUME must never be the sole option. If RESUME is legal
      // then NEXT_MOMENT must also be legal so the presenter can use it.
      if (resumeLegal) {
        expect(nextLegal).toBe(true)
      }

      // Priority: APPROVE when waiting_approval; ADVANCE_TIME while running;
      // NEXT_MOMENT while paused. RESUME is never invoked.
      if (approveLegal) {
        state = transitionRuntimeState(state, { type: 'APPROVE' })
      } else if (advanceLegal) {
        state = transitionRuntimeState(state, {
          type: 'ADVANCE_TIME',
          seconds: 1,
        })
      } else if (nextLegal) {
        pauseReasons.push({
          moment: state.currentMomentId ?? 'null',
          reason: state.playbackStatus,
        })
        state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
      } else {
        // Unreachable in a healthy walk.
        throw new Error(
          `dead state at ${state.currentMomentId} status=${state.playbackStatus} — RESUME would be required`,
        )
      }
      ticks += 1
    }
    expect(state.playbackStatus).toBe('completed')
    expect(state.terminalOutcome).toBe('approved')
    expect(state.completedMomentIds).toContain('M33')
    // Every recorded pause is one the presenter deliberately advanced past
    // with Next Moment (never Resume). Ensure we saw at least the M24
    // Finance→Approval checkpoint.
    expect(pauseReasons.map((p) => p.moment)).toContain('M24')
  })
})

describe('Point F1 — Late-stage disbursement continuation without Resume', () => {
  it('cascades approver 4 → Preparing Disbursement → Disbursement Initiated → Final Response → Case Resolved with zero RESUME actions', () => {
    let state = start()
    state = advance(state, M24_END + 1)
    expect(state.currentMomentId).toBe('M24')
    // Enter approval gate.
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    expect(state.currentMomentId).toBe('M25')
    expect(state.playbackStatus).toBe('waiting_approval')
    // Approve — approver 1 recorded.
    state = transitionRuntimeState(state, { type: 'APPROVE' })
    expect(state.approversCompleted).toBe(1)
    // Approvers 2, 3, 4 via Next Moment.
    for (let i = 0; i < 3; i += 1) {
      expect(isRuntimeActionLegal(state, { type: 'NEXT_MOMENT' })).toBe(true)
      state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    }
    expect(state.approversCompleted).toBe(4)
    expect(state.currentMomentId).toBe('M29')
    expect(state.playbackStatus).toBe('running')

    // Tick the timer 1 second at a time through M29→M33. RESUME must never
    // become the only legal advancing action.
    let ticks = 0
    while (state.playbackStatus !== 'completed' && ticks < 200) {
      expect(isRuntimeActionLegal(state, { type: 'RESUME' })).toBe(false)
      state = transitionRuntimeState(state, {
        type: 'ADVANCE_TIME',
        seconds: 1,
      })
      ticks += 1
    }
    expect(state.playbackStatus).toBe('completed')
    expect(state.terminalOutcome).toBe('approved')
    expect(state.completedMomentIds).toEqual(
      expect.arrayContaining(['M29', 'M30', 'M31', 'M32', 'M33']),
    )
  })
})

describe('Point F1 — Next Moment legal during running (fast-forward)', () => {
  it('lets presenter skip a running specialist moment without dispatching Resume', () => {
    let state = start()
    // Advance into the middle of M11 (Policy working, running).
    state = advance(state, findMomentStart('M11') + 5)
    expect(state.currentMomentId).toBe('M11')
    expect(state.playbackStatus).toBe('running')

    // Next Moment must be legal even while the timer is running — this is
    // what makes Resume unnecessary anywhere in the target flow.
    expect(isRuntimeActionLegal(state, { type: 'NEXT_MOMENT' })).toBe(true)
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    expect(state.currentMomentId).toBe('M12')
  })
})

describe('Point F1 — Human Approval progress 0/4 → 4/4', () => {
  it('exposes approval progress 0/4 with all four approvers waiting at the gate', () => {
    let state = start()
    state = advance(state, M24_END + 1)
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    const vm = selectRuntimeViewModel(state)
    const approval = selectHumanApproval(state, vm)
    expect(approval?.progress.completed).toBe(0)
    expect(approval?.progress.total).toBe(4)
    expect(approval?.progress.percent).toBe(0)
    expect(approval?.progress.label).toBe('0 of 4 approved')
    expect(approval?.approvers).toHaveLength(4)
    approval?.approvers.forEach((a) => {
      expect(a.status).toBe('waiting')
    })
  })

  it('increments approval progress by exactly one per Next Moment (1/4, 2/4, 3/4, 4/4)', () => {
    let state = start()
    state = advance(state, M24_END + 1)
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    // APPROVE records approver 1.
    state = transitionRuntimeState(state, { type: 'APPROVE' })
    let vm = selectRuntimeViewModel(state)
    let approval = selectHumanApproval(state, vm)
    expect(approval?.progress.completed).toBe(1)
    expect(approval?.progress.percent).toBe(25)
    expect(approval?.progress.label).toBe('1 of 4 approved')
    expect(approval?.approvers.find((a) => a.index === 1)?.status).toBe('approved')
    expect(approval?.approvers.find((a) => a.index === 2)?.status).toBe('reviewing')

    // 2/4
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    vm = selectRuntimeViewModel(state)
    approval = selectHumanApproval(state, vm)
    expect(approval?.progress.completed).toBe(2)
    expect(approval?.progress.percent).toBe(50)
    expect(approval?.approvers.find((a) => a.index === 3)?.status).toBe('reviewing')

    // 3/4
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    vm = selectRuntimeViewModel(state)
    approval = selectHumanApproval(state, vm)
    expect(approval?.progress.completed).toBe(3)
    expect(approval?.progress.percent).toBe(75)
    expect(approval?.approvers.find((a) => a.index === 4)?.status).toBe('reviewing')

    // 4/4
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    vm = selectRuntimeViewModel(state)
    approval = selectHumanApproval(state, vm)
    expect(approval?.progress.completed).toBe(4)
    expect(approval?.progress.percent).toBe(100)
    expect(approval?.progress.label).toBe('4 of 4 approved')
    approval?.approvers.forEach((a) => {
      expect(a.status).toBe('approved')
    })
  })

  it('exposes approvers 3 and 4 in the view model at every progress state', () => {
    // Approver 3 and 4 must never be omitted from the model regardless of
    // scroll position — the browser is responsible for scroll, the model
    // must always publish all four rows.
    let state = start()
    state = advance(state, M24_END + 1)
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    state = transitionRuntimeState(state, { type: 'APPROVE' })
    for (let step = 0; step < 3; step += 1) {
      const vm = selectRuntimeViewModel(state)
      const approval = selectHumanApproval(state, vm)
      expect(approval?.approvers.map((a) => a.index)).toEqual([1, 2, 3, 4])
      state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    }
    const finalVm = selectRuntimeViewModel(state)
    const finalApproval = selectHumanApproval(state, finalVm)
    expect(finalApproval?.approvers.map((a) => a.index)).toEqual([1, 2, 3, 4])
    // Collapsed summary states 4 of 4 approvals.
    state = advance(state, 600)
    const terminalVm = selectRuntimeViewModel(state)
    const terminalApproval = selectHumanApproval(state, terminalVm)
    expect(terminalApproval?.isCollapsed).toBe(true)
    expect(terminalApproval?.collapsedSummary.progressLabel).toBe(
      '4 of 4 approvals',
    )
    // Still publishes all four approvers for the expanded (View details) case.
    expect(terminalApproval?.approvers.map((a) => a.index)).toEqual([1, 2, 3, 4])
  })
})
