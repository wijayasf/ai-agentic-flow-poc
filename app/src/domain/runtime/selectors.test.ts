import { describe, expect, it } from 'vitest'
import { createInitialRuntimeState } from './state'
import {
  selectAgentLifecycle,
  selectApprovalGate,
  selectArtifacts,
  selectControlAvailability,
  selectContext,
  selectEarlyStory,
  selectDecisionRationale,
  selectFocusTarget,
  selectFinalOutcome,
  selectNowNext,
  selectOutcomePreview,
  selectRuntimeTransition,
  selectRuntimeViewModel,
  selectTimer,
  selectVisibleEvents,
} from './selectors'
import { simulateAutoRun } from './simulation'
import { transitionRuntimeState } from './transitions'
import type { RuntimeState } from './types'
import { runtimeFixtures } from '../runtime-fixtures/loadRuntimeFixtures'

function autoAt(seconds: number): RuntimeState {
  const started = transitionRuntimeState(createInitialRuntimeState('auto'), {
    type: 'START',
  })
  if (seconds < 390) {
    return transitionRuntimeState(started, { type: 'ADVANCE_TIME', seconds })
  }
  const gate = transitionRuntimeState(started, {
    type: 'ADVANCE_TIME',
    seconds: 390,
  })
  const approved = transitionRuntimeState(gate, { type: 'APPROVE' })
  return seconds === 390
    ? approved
    : transitionRuntimeState(approved, {
        type: 'ADVANCE_TIME',
        seconds: seconds - 390,
      })
}

function autoApprovalGate(): RuntimeState {
  const started = transitionRuntimeState(createInitialRuntimeState('auto'), {
    type: 'START',
  })
  return transitionRuntimeState(started, {
    type: 'ADVANCE_TIME',
    seconds: 390,
  })
}

function rejectedAutoState(): RuntimeState {
  return transitionRuntimeState(autoApprovalGate(), { type: 'REJECT' })
}

function presenterAtFailureGate(): RuntimeState {
  let state = transitionRuntimeState(createInitialRuntimeState(), { type: 'START' })
  state = transitionRuntimeState(state, { type: 'ADVANCE_TIME', seconds: 90 })
  state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
  state = transitionRuntimeState(state, { type: 'RESUME' })
  state = transitionRuntimeState(state, { type: 'ADVANCE_TIME', seconds: 240 })
  state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
  state = transitionRuntimeState(state, { type: 'RESUME' })
  state = transitionRuntimeState(state, { type: 'ADVANCE_TIME', seconds: 60 })
  state = transitionRuntimeState(state, { type: 'APPROVE' })
  return transitionRuntimeState(state, { type: 'ADVANCE_TIME', seconds: 45 })
}

describe('pure runtime selectors', () => {
  it('derives the complete idle view model without mutating state', () => {
    const idle = createInitialRuntimeState()
    const view = selectRuntimeViewModel(idle)

    expect(view).toMatchObject({
      mode: 'presenter',
      playbackStatus: 'idle',
      currentMoment: null,
      currentSceneId: null,
      currentStage: null,
      toolActivity: 0,
      artifactsProduced: 0,
      activeAgentCount: 0,
      conflictStatus: 'neutral',
      earlyStory: {
        phase: 'idle',
        isIdle: true,
        visibleAttachmentCount: 0,
        workflowIntroduced: false,
      },
    })
    expect(view.stages.every((stage) => stage.state === 'upcoming')).toBe(true)
    expect(view.artifacts.every((artifact) => artifact.status === 'locked')).toBe(true)
    expect(view.controls).toEqual({
      canStart: true,
      canPause: false,
      canResume: false,
      canNextMoment: false,
      canRestart: true,
      canInjectFailure: false,
      canApprove: false,
      canReject: false,
      canSelectPresenter: true,
      canSelectAuto: true,
    })
    expect(idle).toEqual(createInitialRuntimeState())
  })

  it('derives the early story sequence from the central elapsed clock', () => {
    expect(selectEarlyStory(autoAt(0))).toMatchObject({
      phase: 'customer_typing',
      showCustomerTyping: true,
      showCustomerIdentity: false,
    })
    expect(selectEarlyStory(autoAt(2))).toMatchObject({
      phase: 'customer_identity',
      showCustomerIdentity: true,
      showCustomerMessage: false,
    })
    expect(selectEarlyStory(autoAt(3))).toMatchObject({
      phase: 'customer_message',
      showCustomerMessage: true,
      visibleAttachmentCount: 0,
    })
    expect(selectEarlyStory(autoAt(4))).toMatchObject({
      phase: 'leakage_photo',
      visibleAttachmentCount: 1,
    })
    expect(selectEarlyStory(autoAt(5))).toMatchObject({
      phase: 'handover_agreement',
      visibleAttachmentCount: 2,
    })
    expect(selectEarlyStory(autoAt(6))).toMatchObject({
      phase: 'payment_receipt',
      visibleAttachmentCount: 3,
    })
    expect(selectEarlyStory(autoAt(7))).toMatchObject({
      phase: 'ai_typing',
      showAiTyping: true,
      showAiAcknowledgement: false,
    })
    expect(selectEarlyStory(autoAt(9))).toMatchObject({
      phase: 'acknowledged',
      showAiTyping: false,
      showAiAcknowledgement: true,
      workflowIntroduced: true,
    })
    expect(selectEarlyStory(autoAt(90)).phase).toBe('investigation')
  })

  it('uses the same early story projection in Presenter and Auto modes', () => {
    const presenterStarted = transitionRuntimeState(createInitialRuntimeState(), {
      type: 'START',
    })
    const presenter = transitionRuntimeState(presenterStarted, {
      type: 'ADVANCE_TIME',
      seconds: 6,
    })

    expect(selectEarlyStory(presenter)).toEqual(selectEarlyStory(autoAt(6)))
  })

  it('derives the same actionable human gate for Auto and Presenter modes', () => {
    const auto = autoApprovalGate()
    const approval = selectApprovalGate(auto)

    expect(auto.playbackStatus).toBe('waiting_approval')
    expect(approval).toEqual({
      recommendedAction: 'Reopen SAP CX case and schedule urgent inspection',
      why: [
        'Handover Clause 8.2 and Defect Policy 4.1 require resolution',
        'SAP CX status conflicts with customer-confirmed evidence',
        'Customer Care Director approval required for Rp31 million compensation',
      ],
      estimatedImpact: 'Rp31,000,000',
      impactQualifier: 'Approved per financial calculation (Finance Agent)',
      riskIfRejected: 'High customer and reputational risk',
      outcomePreview: {
        label: 'Likely Outcome',
        items: [
          'Reopen SAP CX ticket and schedule inspection within 24 hours',
          'Assign alternative contractor',
          'Create Rp31 million compensation credit memo',
          'Send daily customer updates',
        ],
      },
    })
    expect(selectControlAvailability(auto)).toMatchObject({
      canApprove: true,
      canReject: true,
      canSelectPresenter: false,
      canSelectAuto: false,
    })
  })

  it('discloses a draft preview only after Finance prepares it', () => {
    expect(selectOutcomePreview(autoAt(300))).toBeNull()
    expect(selectOutcomePreview(autoAt(330))).toEqual({
      label: 'Likely Outcome',
      items: [
        'Reopen SAP CX ticket and schedule inspection within 24 hours',
        'Assign alternative contractor',
        'Create Rp31 million compensation credit memo',
        'Send daily customer updates',
      ],
    })
    expect(selectOutcomePreview(autoApprovalGate())).not.toBeNull()
    expect(selectOutcomePreview(autoAt(390))).toBeNull()
    expect(selectOutcomePreview(rejectedAutoState())).toBeNull()
  })

  it('derives distinct approved and escalated final outcomes', () => {
    const approved = selectFinalOutcome(simulateAutoRun())
    const rejectedState = rejectedAutoState()
    const rejected = selectFinalOutcome(rejectedState)

    expect(approved).toMatchObject({
      type: 'approved',
      heading: 'Case Resolved',
    })
    expect(approved?.summary).toContain('4 artifacts produced')
    expect(rejected).toMatchObject({
      type: 'escalated',
      heading: 'Decision Rejected',
    })
    expect(rejected?.sections.flatMap((section) => section.items)).toContain(
      'Assign senior reviewer',
    )
    expect(rejectedState.availableArtifactIds).not.toContain('artifact-approval')
    expect(
      selectArtifacts(rejectedState).find(
        (artifact) => artifact.id === 'artifact-approval',
      )?.status,
    ).toBe('locked')
  })

  it('derives rejection activity, lifecycle, focus, transition, and Now/Next', () => {
    const rejected = rejectedAutoState()
    const view = selectRuntimeViewModel(rejected)

    expect(selectVisibleEvents(rejected).at(-1)).toMatchObject({
      id: 'evt-human-rejection',
      action: 'Recommendation rejected',
    })
    expect(selectAgentLifecycle(rejected)).toEqual([
      { agentId: 'agent-customer-complaint', status: 'completed' },
      { agentId: 'agent-policy', status: 'completed' },
      { agentId: 'agent-workflow', status: 'completed' },
      { agentId: 'agent-finance', status: 'blocked' },
    ])
    expect(selectAgentLifecycle(rejected).some((agent) => agent.status === 'working'))
      .toBe(false)
    expect(selectFocusTarget(rejected)).toBe('resolution')
    expect(selectNowNext(rejected)).toEqual({
      now: 'Decision escalated',
      next: 'Management review required',
    })
    expect(selectRuntimeTransition(rejected)).toEqual({
      title: 'Decision rejected',
      next: 'Escalating to management review',
    })
    expect(view).toMatchObject({
      toolActivity: 10,
      artifactsProduced: 2,
      activeAgentCount: 0,
    })
  })

  it('derives a lifecycle that is serial during Intake/Approval and parallel across Investigation', () => {
    const statusesAt = (seconds: number) =>
      Object.fromEntries(
        selectAgentLifecycle(autoAt(seconds)).map((agent) => [
          agent.agentId,
          agent.status,
        ]),
      )

    expect(statusesAt(9)).toEqual({
      'agent-customer-complaint': 'working',
      'agent-policy': 'waiting',
      'agent-workflow': 'waiting',
      'agent-finance': 'waiting',
    })
    // M04 entry — parallel Investigation dispatch: Policy, Workflow, and Finance
    // all begin working concurrently. Customer Complaint Agent remains completed.
    expect(statusesAt(90)).toEqual({
      'agent-customer-complaint': 'completed',
      'agent-policy': 'working',
      'agent-workflow': 'working',
      'agent-finance': 'working',
    })
    // M05 entry (t=120) — Policy completes first; Workflow and Finance continue.
    expect(statusesAt(120)).toEqual({
      'agent-customer-complaint': 'completed',
      'agent-policy': 'completed',
      'agent-workflow': 'working',
      'agent-finance': 'working',
    })
    // M06 entry (t=150) — Workflow completes; only Finance continues.
    expect(statusesAt(150)).toEqual({
      'agent-customer-complaint': 'completed',
      'agent-policy': 'completed',
      'agent-workflow': 'completed',
      'agent-finance': 'working',
    })
    // M07 entry (t=180) — Finance completes; investigation synchronized at M08.
    expect(statusesAt(180)).toEqual({
      'agent-customer-complaint': 'completed',
      'agent-policy': 'completed',
      'agent-workflow': 'completed',
      'agent-finance': 'completed',
    })
    // M12 entry — Finance resumes as the compensation actor during Approval.
    expect(statusesAt(330)).toEqual({
      'agent-customer-complaint': 'completed',
      'agent-policy': 'completed',
      'agent-workflow': 'completed',
      'agent-finance': 'working',
    })

    // Expected concurrent-worker counts across the timeline, reflecting the
    // corrected serial-Intake / parallel-Investigation / serial-Approval shape.
    const expectedWorkingCount: Record<number, number> = {
      9: 1, // M01 — Customer Complaint Agent
      30: 1, // M01 — Customer Complaint Agent
      90: 3, // M04 — Policy + Workflow + Finance parallel wave
      120: 2, // M05 — Workflow + Finance still concurrent, Policy completed
      150: 1, // M06 — Finance still working, Workflow completed
      180: 0, // M07 — all Investigation specialists completed
      240: 1, // M09 — Workflow reactivated for conflict handling
      330: 1, // M12 — Finance compensation
      390: 1, // M14 — Finance compensation
      420: 1, // M15 — Workflow contractor assignment
      455: 1, // M17 — Workflow rerouting
    }
    for (const [seconds, expected] of Object.entries(expectedWorkingCount)) {
      expect(
        selectAgentLifecycle(autoAt(Number(seconds))).filter(
          (agent) => agent.status === 'working',
        ),
      ).toHaveLength(expected)
    }
  })

  it('derives Needs Review, Blocked, completed, and restart lifecycle states', () => {
    expect(
      selectAgentLifecycle(autoAt(360)).find(
        (agent) => agent.agentId === 'agent-finance',
      )?.status,
    ).toBe('needs_review')
    expect(
      selectAgentLifecycle(autoAt(435)).find(
        (agent) => agent.agentId === 'agent-workflow',
      )?.status,
    ).toBe('blocked')

    const completed = selectAgentLifecycle(simulateAutoRun())
    expect(completed.every((agent) => agent.status === 'completed')).toBe(true)
    expect(completed.some((agent) => agent.status === 'working')).toBe(false)

    const restarted = transitionRuntimeState(autoAt(240), { type: 'RESTART' })
    expect(
      selectAgentLifecycle(restarted).every((agent) => agent.status === 'waiting'),
    ).toBe(true)
  })

  it('maps Now and Next across idle, stages, failure recovery, and completion', () => {
    expect(selectNowNext(createInitialRuntimeState())).toEqual({
      now: 'Demo ready',
      next: 'Start customer intake',
    })
    expect(selectNowNext(autoAt(9))).toEqual({
      now: 'Reading complaint and attachments',
      next: 'Validate customer evidence',
    })
    expect(selectNowNext(autoAt(90)).now).toBe('Checking evidence and policy')
    expect(selectNowNext(autoAt(240)).now).toBe('Resolving system inconsistency')
    expect(selectNowNext(autoAt(360)).now).toBe('Waiting for human decision')
    expect(selectNowNext(autoAt(510)).now).toBe('Finalizing customer resolution')
    expect(selectNowNext(autoAt(435))).toEqual({
      now: 'Contractor rejected task',
      next: 'Rerouting to alternative contractor',
    })
    expect(selectNowNext(autoAt(455))).toEqual({
      now: 'Rerouting repair task',
      next: 'Complete rerouting',
    })
    expect(selectNowNext(simulateAutoRun())).toEqual({
      now: 'Case resolved',
      next: null,
    })
  })

  it('projects stage focus and resets it on restart', () => {
    expect(selectFocusTarget(createInitialRuntimeState())).toBeNull()
    expect(selectFocusTarget(autoAt(3))).toBe('customer-panel')
    expect(selectFocusTarget(autoAt(9))).toBe('agent-customer-complaint')
    expect(selectFocusTarget(autoAt(90))).toBe('agent-policy')
    expect(selectFocusTarget(autoAt(240))).toBe('agent-workflow')
    expect(selectFocusTarget(autoAt(330))).toBe('agent-finance')
    expect(selectFocusTarget(autoAt(360))).toBe('approval')
    expect(selectFocusTarget(autoAt(510))).toBe('resolution')
    expect(
      selectFocusTarget(transitionRuntimeState(autoAt(240), { type: 'RESTART' })),
    ).toBeNull()
  })

  it('reveals concise rationale only for the relevant agent and moment', () => {
    expect(selectDecisionRationale(createInitialRuntimeState())).toBeNull()
    expect(selectDecisionRationale(autoAt(9))).toMatchObject({
      agentId: 'agent-customer-complaint',
      state: 'working',
    })
    expect(selectDecisionRationale(autoAt(60))).toMatchObject({
      agentId: 'agent-customer-complaint',
      title: 'Evidence found',
    })
    expect(selectDecisionRationale(autoAt(120))?.title).toBe('Relevant policy found')
    expect(selectDecisionRationale(autoAt(240))?.title).toBe('System conflict detected')
    expect(selectDecisionRationale(autoAt(360))?.title).toBe('Recommendation prepared')
    expect(selectDecisionRationale(autoAt(435))).toMatchObject({
      agentId: 'agent-workflow',
      state: 'blocked',
    })

    const disclosedCopy = [9, 60, 120, 240, 360, 435]
      .flatMap((seconds) => selectDecisionRationale(autoAt(seconds))?.bullets ?? [])
      .join(' ')
    expect(disclosedCopy).not.toMatch(/chain[- ]of[- ]thought|internal prompt/i)
    expect(selectDecisionRationale(autoAt(60))?.bullets).toContain(
      'Simulated confidence: 94%',
    )
  })

  it('shows data-driven transitions only at configured moment boundaries', () => {
    expect(selectRuntimeTransition(autoAt(60))).toEqual({
      title: 'Customer evidence verified',
      next: 'Moving to Investigation',
    })
    expect(selectRuntimeTransition(autoAt(90))).toBeNull()
    expect(selectRuntimeTransition(autoAt(120))?.title).toBe('Relevant policy matched')
    expect(selectRuntimeTransition(autoAt(150))).toBeNull()
    expect(selectRuntimeTransition(autoAt(240))?.title).toBe(
      'System inconsistency detected',
    )
    expect(selectRuntimeTransition(autoAt(330))?.title).toBe('Recommendation ready')
    expect(selectRuntimeTransition(autoAt(390))?.title).toBe(
      'Human decision received',
    )
    expect(selectRuntimeTransition(autoAt(480))?.title).toBe('Rerouting completed')

    const restarted = transitionRuntimeState(autoAt(330), { type: 'RESTART' })
    expect(selectRuntimeTransition(restarted)).toBeNull()
  })

  it('projects visible events in authoritative reveal order', () => {
    const state = autoAt(300)
    expect(selectVisibleEvents(state).map((event) => event.id)).toEqual([
      'evt-1',
      'evt-2',
      'evt-6',
      'evt-3',
      'evt-7',
      'evt-4',
      'evt-8',
    ])
  })

  it('keeps activity empty during the conversation and reveals intake work at M02', () => {
    expect(selectVisibleEvents(autoAt(9))).toEqual([])
    expect(selectVisibleEvents(autoAt(30)).map((event) => event.id)).toEqual([
      'evt-1',
    ])
  })

  it('derives artifact pending and approved presentation', () => {
    const autoM13 = autoAt(360)
    expect(
      selectArtifacts(autoM13).find((artifact) => artifact.id === 'artifact-approval')
        ?.status,
    ).toBe('pending')

    const autoM14 = autoAt(390)
    expect(
      selectArtifacts(autoM14).find((artifact) => artifact.id === 'artifact-approval')
        ?.status,
    ).toBe('approved')
  })

  it('derives approval, failure, recovery, recovered, and recommendation context', () => {
    let presenter = transitionRuntimeState(createInitialRuntimeState(), { type: 'START' })
    presenter = transitionRuntimeState(presenter, { type: 'ADVANCE_TIME', seconds: 90 })
    presenter = transitionRuntimeState(presenter, { type: 'RESUME' })
    presenter = transitionRuntimeState(presenter, { type: 'ADVANCE_TIME', seconds: 240 })
    presenter = transitionRuntimeState(presenter, { type: 'RESUME' })
    presenter = transitionRuntimeState(presenter, { type: 'ADVANCE_TIME', seconds: 60 })
    expect(selectContext(presenter).type).toBe('approval')

    expect(selectContext(autoAt(435)).type).toBe('failure')
    expect(selectContext(autoAt(455)).type).toBe('recovery')
    expect(selectContext(autoAt(480)).type).toBe('recovered')
    expect(selectContext(autoAt(540)).type).toBe('recommendation')
  })

  it('derives exact timer text and control availability at gates', () => {
    const failed = autoAt(435)
    expect(selectTimer(failed)).toMatchObject({
      elapsedSeconds: 435,
      totalSeconds: 600,
      remainingSeconds: 20,
      elapsedText: '07:15',
      totalText: '10:00',
      active: true,
    })
    expect(selectControlAvailability(failed)).toEqual({
      canStart: false,
      canPause: false,
      canResume: false,
      canNextMoment: false,
      canRestart: true,
      canInjectFailure: false,
      canApprove: false,
      canReject: false,
      canSelectPresenter: false,
      canSelectAuto: false,
    })
  })

  it('allows only failure injection and restart at the M15 Presenter gate', () => {
    const waiting = presenterAtFailureGate()
    expect(waiting.playbackStatus).toBe('waiting_failure_injection')
    expect(selectControlAvailability(waiting)).toEqual({
      canStart: false,
      canPause: false,
      canResume: false,
      canNextMoment: false,
      canRestart: true,
      canApprove: false,
      canReject: false,
      canInjectFailure: true,
      canSelectPresenter: false,
      canSelectAuto: false,
    })
  })

  it('derives stable completed metrics and controls', () => {
    const view = selectRuntimeViewModel(simulateAutoRun())
    expect(view).toMatchObject({
      playbackStatus: 'completed',
      currentSceneId: 'scene-resolution',
      currentStage: 'Resolution',
      toolActivity: 12,
      artifactsProduced: 4,
      activeAgentCount: 0,
      conflictStatus: 'resolved',
    })
    expect(view.context.type).toBe('recommendation')
    expect(view.finalOutcome?.heading).toBe('Case Resolved')
    expect(view.controls.canRestart).toBe(true)
    expect(view.controls.canSelectPresenter).toBe(true)
    expect(view.controls.canSelectAuto).toBe(true)
    expect(view.controls.canStart).toBe(false)
  })
})

describe('RS-04 CONTRACTOR_REJECTED failure scenario', () => {
  function presenterAtFailureGate(): RuntimeState {
    let state = transitionRuntimeState(createInitialRuntimeState(), { type: 'START' })
    state = transitionRuntimeState(state, { type: 'ADVANCE_TIME', seconds: 90 })
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    state = transitionRuntimeState(state, { type: 'RESUME' })
    state = transitionRuntimeState(state, { type: 'ADVANCE_TIME', seconds: 240 })
    state = transitionRuntimeState(state, { type: 'NEXT_MOMENT' })
    state = transitionRuntimeState(state, { type: 'RESUME' })
    state = transitionRuntimeState(state, { type: 'ADVANCE_TIME', seconds: 60 })
    state = transitionRuntimeState(state, { type: 'APPROVE' })
    return transitionRuntimeState(state, { type: 'ADVANCE_TIME', seconds: 45 })
  }

  it('fixture failure code is CONTRACTOR_REJECTED', () => {
    expect(runtimeFixtures.timeline.failureRecovery.failureCode).toBe('CONTRACTOR_REJECTED')
    const cueMoment = runtimeFixtures.timeline.moments.find((m) => m.id === 'M15')
    expect(cueMoment?.failureGate?.failureCode).toBe('CONTRACTOR_REJECTED')
  })

  it('Workflow Agent is blocked at the failure moment; Finance Agent is not blocked', () => {
    const failed = autoAt(435)
    const lifecycle = selectAgentLifecycle(failed)
    expect(lifecycle.find((a) => a.agentId === 'agent-workflow')?.status).toBe('blocked')
    expect(lifecycle.find((a) => a.agentId === 'agent-finance')?.status).not.toBe('blocked')
  })

  it('recovery event output is TASK_REROUTED owned by Workflow Agent', () => {
    const recovered = autoAt(480)
    const events = selectVisibleEvents(recovered)
    const recoveryEvent = events.find((e) => e.id === 'evt-12')
    expect(recoveryEvent?.output).toBe('TASK_REROUTED')
    expect(recoveryEvent?.agent).toBe('Workflow Agent')
  })

  it('alternative contractor is represented in outcome preview', () => {
    const preview = selectOutcomePreview(autoAt(330))
    expect(preview?.items).toContain('Assign alternative contractor')
  })

  it('failure and recovery each complete exactly once in a full run', () => {
    const finalState = simulateAutoRun()
    expect(finalState.failureStatus).toBe('recovered')
    expect(finalState.recoveryStatus).toBe('completed')
    expect(finalState.completedMomentIds.filter((id) => id === 'M16')).toHaveLength(1)
    expect(finalState.completedMomentIds.filter((id) => id === 'M17')).toHaveLength(1)
  })

  it('runtime continues to completion after contractor rerouting', () => {
    const atM18 = autoAt(480)
    expect(atM18.playbackStatus).toBe('running')
    expect(atM18.failureStatus).toBe('recovered')
    expect(atM18.recoveryStatus).toBe('completed')
    const finalState = simulateAutoRun()
    expect(finalState.playbackStatus).toBe('completed')
    expect(finalState.currentMomentId).toBe('M21')
  })

  it('approved final outcome is reachable after contractor rerouting', () => {
    const finalOutcome = selectFinalOutcome(simulateAutoRun())
    expect(finalOutcome?.type).toBe('approved')
    expect(finalOutcome?.heading).toBe('Case Resolved')
  })

  it('restart clears failure and recovery state', () => {
    const failed = autoAt(435)
    const restarted = transitionRuntimeState(failed, { type: 'RESTART' })
    expect(restarted.failureStatus).toBe('not_injected')
    expect(restarted.recoveryStatus).toBe('not_started')
    expect(restarted.playbackStatus).toBe('idle')
  })

  it('Auto Mode traverses the contractor rejection and recovery path deterministically', () => {
    expect(autoAt(420).currentMomentId).toBe('M15')
    expect(autoAt(420).failureStatus).toBe('not_injected')

    const failed = autoAt(435)
    expect(failed.currentMomentId).toBe('M16')
    expect(failed.failureStatus).toBe('active')
    expect(failed.playbackStatus).toBe('failed')

    const recovering = autoAt(455)
    expect(recovering.currentMomentId).toBe('M17')
    expect(recovering.recoveryStatus).toBe('recovering')

    const recovered = autoAt(480)
    expect(recovered.failureStatus).toBe('recovered')
    expect(recovered.recoveryStatus).toBe('completed')
  })

  it('Presenter Mode injection gate is still active and legal at M15', () => {
    const gate = presenterAtFailureGate()
    expect(gate.playbackStatus).toBe('waiting_failure_injection')
    expect(gate.currentMomentId).toBe('M15')
    expect(selectControlAvailability(gate).canInjectFailure).toBe(true)
    const afterInject = transitionRuntimeState(gate, { type: 'INJECT_FAILURE' })
    expect(afterInject.currentMomentId).toBe('M16')
    expect(afterInject.playbackStatus).toBe('failed')
    expect(afterInject.failureStatus).toBe('active')
  })

  it('compensation remains Rp31,000,000', () => {
    // autoAt(390) is post-approval (M14); build the waiting-approval state directly
    const started = transitionRuntimeState(createInitialRuntimeState('auto'), { type: 'START' })
    const waitingApproval = transitionRuntimeState(started, { type: 'ADVANCE_TIME', seconds: 390 })
    const gate = selectApprovalGate(waitingApproval)
    expect(waitingApproval.playbackStatus).toBe('waiting_approval')
    expect(gate?.estimatedImpact).toBe('Rp31,000,000')
    const finalOutcome = selectFinalOutcome(simulateAutoRun())
    expect(finalOutcome?.sections[0].items).toContain('Rp31,000,000 compensation approved')
  })

  it('no FINANCE_POST_TIMEOUT or finance-posting failure language in active runtime output', () => {
    const failureCopy = runtimeFixtures.timeline.failureRecovery.failureCopy
    const recoveryCopy = runtimeFixtures.timeline.failureRecovery.recoveryCopy
    expect(failureCopy).not.toContain('FINANCE_POST_TIMEOUT')
    expect(recoveryCopy).not.toMatch(/finance posting/i)

    const failedEvents = selectVisibleEvents(autoAt(435))
    const eventText = failedEvents.map((e) => `${e.output} ${e.action}`).join(' ')
    expect(eventText).not.toContain('FINANCE_POST_TIMEOUT')
    expect(eventText).not.toMatch(/finance posting failed/i)

    const nowNext = selectNowNext(autoAt(435))
    expect(nowNext.now).not.toMatch(/finance posting/i)
    expect(nowNext.now).not.toContain('FINANCE_POST_TIMEOUT')

    const recoveryNowNext = selectNowNext(autoAt(455))
    expect(recoveryNowNext.now).not.toMatch(/recovering finance/i)
  })
})
