import { describe, expect, it } from 'vitest'
import {
  createInitialRuntimeState,
  selectPresenterAssist,
  selectRuntimeViewModel,
  simulateAutoRun,
  transitionRuntimeState,
} from '.'
import type { RuntimeState } from '.'

function autoAt(seconds: number): RuntimeState {
  const started = transitionRuntimeState(createInitialRuntimeState('auto'), { type: 'START' })
  return transitionRuntimeState(started, { type: 'ADVANCE_TIME', seconds })
}

function approvedAt(secondsAfterDecision: number): RuntimeState {
  const approved = transitionRuntimeState(autoAt(390), { type: 'APPROVE' })
  return secondsAfterDecision === 0
    ? approved
    : transitionRuntimeState(approved, { type: 'ADVANCE_TIME', seconds: secondsAfterDecision })
}

function presenterAtApprovalGate(): RuntimeState {
  let state = transitionRuntimeState(createInitialRuntimeState(), { type: 'START' })
  state = transitionRuntimeState(state, { type: 'ADVANCE_TIME', seconds: 90 })
  state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
  state = transitionRuntimeState(state, { type: 'RESUME' })
  state = transitionRuntimeState(state, { type: 'ADVANCE_TIME', seconds: 240 })
  state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
  state = transitionRuntimeState(state, { type: 'RESUME' })
  return transitionRuntimeState(state, { type: 'ADVANCE_TIME', seconds: 60 })
}

function guidance(state: RuntimeState) {
  return selectPresenterAssist(state, selectRuntimeViewModel(state))
}

describe('selectPresenterAssist', () => {
  it('provides idle guidance and a simulated remaining-time label', () => {
    const model = guidance(createInitialRuntimeState())
    expect(model.phase).toBe('idle')
    expect(model.stage).toBe('Idle')
    expect(model.nextAction).toBe('Press Start')
    expect(model.remainingTime).toBe('10:00 simulated remaining')
    expect(model.audienceFocus).toBe('Customer Story panel')
  })

  it.each([
    [0, 'customer_typing'],
    [3, 'complaint_received'],
    [5, 'evidence_revealed'],
    [9, 'ai_acknowledgement'],
    [12, 'intake'],
    [90, 'policy_validation'],
    [150, 'investigation'],
    [240, 'conflict_detection'],
    [330, 'recommendation_preparation'],
  ] as const)('maps %i elapsed seconds to %s guidance', (seconds, phase) => {
    expect(guidance(autoAt(seconds)).phase).toBe(phase)
  })

  it('uses existing runtime focus for active-agent audience guidance', () => {
    expect(guidance(autoAt(90)).audienceFocus).toBe('Policy Agent and policy evidence')
    expect(guidance(autoAt(240)).audienceFocus).toBe('Workflow Agent and system status')
  })

  it('pauses its wording at approval and only recommends enabled decisions', () => {
    const model = guidance(autoAt(390))
    expect(model.phase).toBe('human_approval')
    expect(model.nextAction).toBe('Choose Approve or Reject')
    expect(model.remainingTime).toBe('Paused for human decision')
    expect(model.audienceFocus).toBe('Approval Card')
  })

  it('maps approved processing, failure, and recovery without another timer', () => {
    expect(guidance(approvedAt(0)).phase).toBe('approved_processing')
    expect(guidance(approvedAt(45)).phase).toBe('failure')
    expect(guidance(approvedAt(65)).phase).toBe('recovery')
    expect(guidance(approvedAt(65)).remainingTime).toMatch(/simulated remaining$/)
  })

  it('distinguishes approved and rejected terminal guidance', () => {
    const approved = guidance(simulateAutoRun())
    expect(approved.phase).toBe('approved_final')
    expect(approved.remainingTime).toBe('Complete')
    expect(approved.nextAction).toBe('Review the final outcome or Restart')

    const rejectedState = transitionRuntimeState(autoAt(390), { type: 'REJECT' })
    const rejected = guidance(rejectedState)
    expect(rejected.phase).toBe('rejected_outcome')
    expect(rejected.remainingTime).toBe('Escalated')
    expect(rejected.nextAction).toBe('Explain escalation consequences or Restart')
  })

  it('adapts to presenter controls rather than naming a disabled action', () => {
    let state = transitionRuntimeState(createInitialRuntimeState(), { type: 'START' })
    state = transitionRuntimeState(state, { type: 'ADVANCE_TIME', seconds: 90 })
    const model = guidance(state)
    expect(model.nextAction).toBe('Continue to the next moment')
    expect(model.remainingTime).toBe('Paused by presenter')

    let failureGate = transitionRuntimeState(presenterAtApprovalGate(), { type: 'APPROVE' })
    failureGate = transitionRuntimeState(failureGate, { type: 'ADVANCE_TIME', seconds: 45 })
    const failureCue = guidance(failureGate)
    expect(failureCue.nextAction).toBe('Inject the contractor rejection')
    expect(failureCue.remainingTime).toBe('Paused for presenter action')
  })

  it('keeps token and production answers appropriately qualified', () => {
    const answers = guidance(createInitialRuntimeState()).qaPrompts.map((prompt) => prompt.answer)
    expect(answers).toContain('Token reduction is not yet proven without a measured baseline.')
    expect(answers.join(' ')).not.toMatch(/proven token savings/i)
  })
})
