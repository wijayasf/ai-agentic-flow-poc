import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  createInitialRuntimeState,
  selectRuntimeViewModel,
  simulateAutoRun,
  transitionRuntimeState,
} from '../../domain/runtime'
import type { RuntimeState } from '../../domain/runtime'
import type { RuntimeControllerActions } from '../../runtime'
import { StaticShell } from './StaticShell'

const complaintMessage =
  'Hi, after handover on 10 May, there is still leakage in the bathroom ceiling. I have reported it multiple times but the repair is still not done.'

function createActions(): RuntimeControllerActions {
  return {
    selectMode: vi.fn(),
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    nextMoment: vi.fn(),
    restart: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
    injectFailure: vi.fn(),
  }
}

function renderShell(
  state: RuntimeState = createInitialRuntimeState(),
  actions: RuntimeControllerActions = createActions(),
) {
  return {
    actions,
    ...render(
      <StaticShell
        state={state}
        viewModel={selectRuntimeViewModel(state)}
        actions={actions}
      />,
    ),
  }
}

function autoAt(seconds: number): RuntimeState {
  const started = transitionRuntimeState(createInitialRuntimeState('auto'), {
    type: 'START',
  })
  if (seconds < 390) {
    return transitionRuntimeState(started, {
      type: 'ADVANCE_TIME',
      seconds,
    })
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

function autoAtApprovalGate(): RuntimeState {
  const started = transitionRuntimeState(createInitialRuntimeState('auto'), {
    type: 'START',
  })
  return transitionRuntimeState(started, {
    type: 'ADVANCE_TIME',
    seconds: 390,
  })
}

function rejectedAutoState(): RuntimeState {
  return transitionRuntimeState(autoAtApprovalGate(), { type: 'REJECT' })
}

describe('StaticShell runtime presentation', () => {
  it('preserves the fixed canonical regions and design surface', () => {
    renderShell()

    expect(screen.getByTestId('canonical-design-surface')).toHaveAttribute(
      'data-composition',
      'runtime-progressive',
    )
    expect(
      screen.getByRole('region', { name: 'Customer Experience' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Agentic Flow' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Trust & Observability' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('contentinfo', { name: 'Demo Playback Controls' }),
    ).toBeInTheDocument()
  })

  it('renders the idle stage, agent, system, trace, artifact, and metric state', () => {
    renderShell()

    const stageNavigation = screen.getByRole('navigation', {
      name: 'Complaint resolution stages',
    })
    expect(within(stageNavigation).getAllByRole('listitem')).toHaveLength(5)
    expect(within(stageNavigation).queryByRole('listitem', { current: 'step' })).toBeNull()

    const agentItems = within(
      screen.getByRole('list', { name: 'Specialist agents' }),
    ).getAllByRole('listitem')
    expect(agentItems).toHaveLength(4)
    agentItems.forEach((item) => expect(item).toHaveAttribute('data-state', 'waiting'))

    const systemItems = within(
      screen.getByRole('list', { name: 'Enterprise systems' }),
    ).getAllByRole('listitem')
    expect(systemItems).toHaveLength(4)
    systemItems.forEach((item) => expect(item).toHaveAttribute('data-state', 'inactive'))

    expect(
      screen.queryByRole('region', { name: 'Key Artifacts' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Trust signals are ready' }),
    ).toBeInTheDocument()

    const trace = screen.getByRole('table', {
      name: 'Visible deterministic activity trace events',
    })
    expect(within(trace).getAllByRole('columnheader')).toHaveLength(5)
    expect(within(trace).getAllByRole('row')).toHaveLength(1)

    const metrics = within(
      screen.getByRole('list', { name: 'Trust and observability metrics' }),
    ).getAllByRole('listitem')
    expect(within(metrics[1]).getByText('0')).toBeInTheDocument()
    expect(within(metrics[2]).getByText('0')).toBeInTheDocument()
    expect(within(metrics[3]).getByText('0')).toBeInTheDocument()
    expect(screen.getByText('00:00')).toBeInTheDocument()
  })

  it('renders true idle framing without early story or generated content', () => {
    renderShell()

    expect(
      screen.getByText(
        'This guided demo shows how multiple AI agents collaborate to investigate a customer complaint, validate evidence, detect conflicts, and prepare a recommendation for human approval.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Demo is ready. Press Start to begin.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start' })).toHaveTextContent('Start')
    expect(screen.queryByText(complaintMessage)).not.toBeInTheDocument()
    expect(screen.queryByText(/Thank you, Rina/)).not.toBeInTheDocument()
    expect(screen.queryByAltText('Rina Putri, simulated customer')).not.toBeInTheDocument()
    expect(screen.queryByAltText('Preview of ceiling leakage evidence')).not.toBeInTheDocument()
    expect(
      screen.queryByAltText('Preview of the fictional handover agreement'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByAltText('Preview of the fictional payment receipt'),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Recommendation' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
  })

  it('renders the completed trace, metrics, and strong approved outcome', () => {
    renderShell(simulateAutoRun())

    const trace = screen.getByRole('table', {
      name: 'Visible deterministic activity trace events',
    })
    expect(within(trace).getAllByRole('row')).toHaveLength(13)
    const traceCells = within(trace).getAllByRole('cell')
    expect(traceCells).toHaveLength(60)
    traceCells.forEach((cell) => {
      expect(cell).toHaveAttribute('aria-label')
      expect(cell).toHaveAttribute('title')
    })

    expect(screen.getByRole('heading', { name: 'Case Resolved' })).toBeInTheDocument()
    expect(screen.getByText('4 agents collaborated')).toBeInTheDocument()
    expect(screen.getByText('4 enterprise systems engaged')).toBeInTheDocument()
    expect(screen.getByText('Rp31,000,000 compensation approved')).toBeInTheDocument()
    expect(screen.getByText('SAP CX ticket reopened')).toBeInTheDocument()
    expect(
      screen.getByText('11 similar cases — recurring SAP CX control gap'),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Demo time 10:00 of 10:00'),
    ).toBeInTheDocument()
  })

  it('renders the required customer and complaint content', () => {
    renderShell(autoAt(9))

    expect(screen.getByText('Rina Putri')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Hi, after handover on 10 May, there is still leakage in the bathroom ceiling. I have reported it multiple times but the repair is still not done.',
      ),
    ).toBeInTheDocument()
  })

  it('reveals the early conversation in deterministic order', () => {
    const actions = createActions()
    const rendered = renderShell(autoAt(0), actions)
    const showState = (state: RuntimeState) => {
      rendered.rerender(
        <StaticShell
          state={state}
          viewModel={selectRuntimeViewModel(state)}
          actions={actions}
        />,
      )
    }

    expect(screen.getByRole('status', { name: 'Customer is typing' })).toBeInTheDocument()
    expect(screen.queryByText('Rina Putri')).not.toBeInTheDocument()

    showState(autoAt(2))
    expect(screen.getByText('Rina Putri')).toBeInTheDocument()
    expect(screen.queryByText(complaintMessage)).not.toBeInTheDocument()

    showState(autoAt(3))
    expect(screen.getByText(complaintMessage)).toBeInTheDocument()
    expect(screen.queryByAltText('Preview of ceiling leakage evidence')).not.toBeInTheDocument()

    showState(autoAt(4))
    expect(screen.getByAltText('Preview of ceiling leakage evidence')).toBeInTheDocument()
    expect(
      screen.queryByAltText('Preview of the fictional handover agreement'),
    ).not.toBeInTheDocument()

    showState(autoAt(5))
    expect(
      screen.getByAltText('Preview of the fictional handover agreement'),
    ).toBeInTheDocument()
    expect(
      screen.queryByAltText('Preview of the fictional payment receipt'),
    ).not.toBeInTheDocument()

    showState(autoAt(6))
    expect(
      screen.getByAltText('Preview of the fictional payment receipt'),
    ).toBeInTheDocument()

    showState(autoAt(7))
    expect(
      screen.getByRole('status', { name: 'AI Resolution Officer is typing' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Thank you, Rina/)).not.toBeInTheDocument()

    showState(autoAt(9))
    // Officer acknowledgement mounts at t=9s with header/message/cursor only.
    expect(
      screen.queryByRole('status', { name: 'AI Resolution Officer is typing' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText(/Thank you, Rina/)).toBeInTheDocument()
    // Intake outcomes (HP / Daily Update Promise / verified) do NOT appear until the
    // Customer Complaint Agent completes intake at M03 (t=60s).
    expect(screen.queryByText('High Priority')).not.toBeInTheDocument()
    expect(screen.queryByText('Daily Update Promise')).not.toBeInTheDocument()
    expect(screen.getAllByText('Rina Putri')).toHaveLength(1)

    showState(autoAt(60))
    // At t=60s the customer-complaint agent's lifecycle flips to 'completed' → footer with
    // HP, Daily Update Promise, and Verified badge appears.
    expect(screen.getByText('High Priority')).toBeInTheDocument()
    expect(screen.getByText('Daily Update Promise')).toBeInTheDocument()
    expect(screen.getByLabelText('Verified response')).toBeInTheDocument()

    showState(autoAt(90))
    const stageNavigation = screen.getByRole('navigation', {
      name: 'Complaint resolution stages',
    })
    expect(
      within(stageNavigation).getByRole('listitem', { current: 'step' }),
    ).toHaveTextContent('Investigation')
  })

  it('uses selector availability and forwards playback and mode callbacks', () => {
    const actions = createActions()
    renderShell(createInitialRuntimeState(), actions)

    expect(screen.getAllByRole('button')).toHaveLength(8)
    expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Restart' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Pause' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Resume' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next Moment' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Inject Failure' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Presenter Mode' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    fireEvent.click(screen.getByRole('button', { name: 'Auto Mode' }))
    expect(actions.start).toHaveBeenCalledOnce()
    expect(actions.selectMode).toHaveBeenCalledWith('auto')
  })

  it('renders the evidence-based approval card and forwards both decisions', () => {
    const actions = createActions()
    renderShell(presenterAtApprovalGate(), actions)

    // REV-13: ApprovalDecisionCard is preserved verbatim; HumanApproval wrapper
    // sits above it as a presentation divider only.
    expect(screen.getByRole('heading', { name: 'Approval required' })).toBeInTheDocument()
    expect(screen.getByText('Reopen SAP CX case and schedule urgent inspection')).toBeInTheDocument()
    expect(screen.getByText('Handover Clause 8.2 and Defect Policy 4.1 require resolution')).toBeInTheDocument()
    expect(screen.getByText('SAP CX status conflicts with customer-confirmed evidence')).toBeInTheDocument()
    expect(screen.getByText('Customer Care Director approval required for Rp31 million compensation')).toBeInTheDocument()
    expect(screen.getByText('Rp31,000,000')).toBeInTheDocument()
    expect(screen.getByText('Approved per financial calculation (Finance Agent)')).toBeInTheDocument()
    expect(screen.getByText('High customer and reputational risk')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Likely Outcome' })).toBeInTheDocument()
    // REV-13D — Human Approval wrapper renders above the ApprovalDecisionCard.
    expect(screen.getByTestId('human-approval-divider')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Human Approval' })).toBeInTheDocument()
    // Buttons are owned by the existing ApprovalDecisionCard.
    const approveButton = screen.getByRole('button', { name: 'Approve' })
    const rejectButton = screen.getByRole('button', { name: 'Reject' })
    expect(approveButton).toBeEnabled()
    expect(rejectButton).toBeEnabled()
    fireEvent.click(approveButton)
    fireEvent.click(rejectButton)
    expect(actions.approve).toHaveBeenCalledOnce()
    expect(actions.reject).toHaveBeenCalledOnce()
  })

  it('uses bundled story assets without remote image or network requests', () => {
    const { container } = renderShell(autoAt(9))

    expect(screen.getByAltText('Rina Putri, simulated customer')).toBeInTheDocument()
    expect(
      screen.getByAltText('Preview of ceiling leakage evidence'),
    ).toBeInTheDocument()
    expect(
      screen.getByAltText('Preview of the fictional handover agreement'),
    ).toBeInTheDocument()
    expect(
      screen.getByAltText('Preview of the fictional payment receipt'),
    ).toBeInTheDocument()
    // 4 story assets + 3 bundled brand asset images
    // + 1 Case Commander glyph (user-star) + 1 Policy Repository icon (file-text-blue).
    expect(container.querySelectorAll('img')).toHaveLength(9)
    expect(
      container.querySelectorAll('img[src^="/assets/brands/"]'),
    ).toHaveLength(3)
    expect(
      container.querySelectorAll('img[src^="/assets/icons/"]'),
    ).toHaveLength(2)
    expect(container.innerHTML).not.toMatch(/https?:\/\//i)
    expect(container.querySelectorAll('[src^="http"], [href^="http"]')).toHaveLength(0)
    expect(container.querySelectorAll('[style*="url("]')).toHaveLength(0)
  })

  it('renders sequential lifecycle text, icons, and runtime focus', () => {
    const rendered = renderShell(autoAt(9))
    const specialistList = screen.getByRole('list', { name: 'Specialist agents' })
    let agents = within(specialistList).getAllByRole('listitem')
    expect(agents[0]).toHaveAttribute('data-state', 'working')
    expect(agents[0]).toHaveAttribute('data-focus', 'primary')
    expect(within(agents[0]).getByText('Working')).toBeInTheDocument()
    expect(agents.slice(1).every((agent) => agent.dataset.state === 'waiting')).toBe(true)

    rendered.rerender(
      <StaticShell
        state={autoAt(90)}
        viewModel={selectRuntimeViewModel(autoAt(90))}
        actions={createActions()}
      />,
    )
    agents = within(specialistList).getAllByRole('listitem')
    expect(agents[0]).toHaveAttribute('data-state', 'completed')
    expect(within(agents[0]).getByText('Completed')).toBeInTheDocument()
    // M04 entry — parallel Investigation dispatch: Policy, Workflow, and Finance
    // all working concurrently. Policy retains primary focus per FOCUS_BY_MOMENT.
    expect(agents[1]).toHaveAttribute('data-state', 'working')
    expect(agents[1]).toHaveAttribute('data-focus', 'primary')
    expect(agents[2]).toHaveAttribute('data-state', 'working')
    expect(agents[3]).toHaveAttribute('data-state', 'working')

    const workingAgents = agents.filter((agent) => agent.dataset.state === 'working')
    expect(workingAgents).toHaveLength(3)
  })

  it('renders Needs Review, Blocked, and terminal lifecycle states', () => {
    const actions = createActions()
    const rendered = renderShell(autoAt(360), actions)
    const getAgents = () =>
      within(screen.getByRole('list', { name: 'Specialist agents' })).getAllByRole(
        'listitem',
      )

    expect(getAgents()[3]).toHaveAttribute('data-state', 'needs_review')
    expect(within(getAgents()[3]).getByText('Needs Review')).toBeInTheDocument()

    rendered.rerender(
      <StaticShell
        state={autoAt(435)}
        viewModel={selectRuntimeViewModel(autoAt(435))}
        actions={actions}
      />,
    )
    expect(getAgents()[2]).toHaveAttribute('data-state', 'blocked')
    expect(within(getAgents()[2]).getByText('Blocked')).toBeInTheDocument()

    const completed = simulateAutoRun()
    rendered.rerender(
      <StaticShell
        state={completed}
        viewModel={selectRuntimeViewModel(completed)}
        actions={actions}
      />,
    )
    expect(getAgents().every((agent) => agent.dataset.state === 'completed')).toBe(true)
    expect(getAgents().some((agent) => agent.dataset.state === 'working')).toBe(false)
  })

  it('renders concise Now and Next content without a misleading terminal action', () => {
    const actions = createActions()
    const rendered = renderShell(createInitialRuntimeState(), actions)
    const nowNext = screen.getByLabelText('Current and next workflow actions')
    expect(within(nowNext).getByText('Demo ready')).toBeInTheDocument()
    expect(within(nowNext).getByText('Start customer intake')).toBeInTheDocument()

    rendered.rerender(
      <StaticShell
        state={autoAt(240)}
        viewModel={selectRuntimeViewModel(autoAt(240))}
        actions={actions}
      />,
    )
    expect(within(nowNext).getByText('Resolving system inconsistency')).toBeInTheDocument()
    expect(within(nowNext).getByText('Prepare recommendation')).toBeInTheDocument()

    const completed = simulateAutoRun()
    rendered.rerender(
      <StaticShell
        state={completed}
        viewModel={selectRuntimeViewModel(completed)}
        actions={actions}
      />,
    )
    expect(within(nowNext).getByText('Case resolved')).toBeInTheDocument()
    expect(within(nowNext).getByText('No further action')).toBeInTheDocument()
    expect(within(nowNext).queryByText('Complete case')).not.toBeInTheDocument()
  })

  it('progressively discloses rationale, artifacts, transitions, and approval context', () => {
    const actions = createActions()
    const rendered = renderShell(autoAt(30), actions)

    expect(screen.queryByRole('heading', { name: 'Evidence found' })).not.toBeInTheDocument()
    expect(screen.queryByText('1. Customer Situation Summary')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Recommendation' })).not.toBeInTheDocument()

    rendered.rerender(
      <StaticShell
        state={autoAt(60)}
        viewModel={selectRuntimeViewModel(autoAt(60))}
        actions={actions}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Evidence found' })).toBeInTheDocument()
    expect(screen.getByText('Simulated confidence: 94%')).toBeInTheDocument()
    expect(screen.getByText('1. Customer Situation Summary')).toBeInTheDocument()
    expect(screen.queryByText('2. Conflict & Root-Cause Report')).not.toBeInTheDocument()
    expect(screen.getByText('Customer evidence verified')).toBeInTheDocument()
    expect(screen.getByText('Moving to Investigation')).toBeInTheDocument()

    rendered.rerender(
      <StaticShell
        state={autoAt(90)}
        viewModel={selectRuntimeViewModel(autoAt(90))}
        actions={actions}
      />,
    )
    expect(screen.queryByText('Customer evidence verified')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Checking warranty policy' })).toBeInTheDocument()

    rendered.rerender(
      <StaticShell
        state={presenterAtApprovalGate()}
        viewModel={selectRuntimeViewModel(presenterAtApprovalGate())}
        actions={actions}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Approval required' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument()
  })

  it('derives connector state from the same lifecycle projection', () => {
    const { container } = renderShell(autoAt(150))
    const agentConnectors = container.querySelectorAll(
      '[data-testid="agent-connector-rail"] > span',
    )

    // M06 entry (t=150) — Policy + Workflow completed, Finance still working.
    expect(agentConnectors).toHaveLength(4)
    expect(Array.from(agentConnectors).map((connector) => connector.getAttribute('data-state')))
      .toEqual(['completed', 'completed', 'completed', 'working'])
  })

  it('shows a draft preview only after Finance prepares the recommendation', () => {
    const actions = createActions()
    const rendered = renderShell(autoAt(300), actions)

    expect(screen.queryByRole('heading', { name: 'Likely Outcome' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Case Resolved' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Decision Rejected' })).not.toBeInTheDocument()

    rendered.rerender(
      <StaticShell
        state={autoAt(330)}
        viewModel={selectRuntimeViewModel(autoAt(330))}
        actions={actions}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Likely Outcome' })).toBeInTheDocument()
    expect(screen.getByText('Draft recommendation · Not final')).toBeInTheDocument()
    expect(screen.getByText('Reopen SAP CX ticket and schedule inspection within 24 hours')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Case Resolved' })).not.toBeInTheDocument()
  })

  it('reveals approved artifacts after decision but keeps final outcome until completion', () => {
    const approved = autoAt(390)
    renderShell(approved)

    expect(screen.getByText('Human decision received')).toBeInTheDocument()
    expect(
      screen.getByRole('listitem', {
        name: '3. Resolution & Approval Package, approved',
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Draft recommendation · Not final')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Case Resolved' })).not.toBeInTheDocument()
  })

  it('renders a distinct rejected escalation with no approved content leakage', () => {
    const rejected = rejectedAutoState()
    renderShell(rejected)

    expect(screen.getByRole('heading', { name: 'Decision Rejected' })).toBeInTheDocument()
    expect(screen.getByText('Compensation not approved')).toBeInTheDocument()
    expect(
      screen.getByText('Repair request escalated for management review'),
    ).toBeInTheDocument()
    expect(screen.getByText('Resolution SLA at risk')).toBeInTheDocument()
    expect(screen.getByText('Assign senior reviewer')).toBeInTheDocument()
    expect(screen.getByText('Decision escalated')).toBeInTheDocument()
    expect(screen.getByText('Management review required')).toBeInTheDocument()
    expect(screen.getByText('Recommendation rejected')).toBeInTheDocument()

    const agents = within(
      screen.getByRole('list', { name: 'Specialist agents' }),
    ).getAllByRole('listitem')
    expect(agents.slice(0, 3).every((agent) => agent.dataset.state === 'completed')).toBe(true)
    expect(agents[3]).toHaveAttribute('data-state', 'blocked')
    expect(agents.some((agent) => agent.dataset.state === 'working')).toBe(false)

    expect(screen.queryByRole('heading', { name: 'Case Resolved' })).not.toBeInTheDocument()
    expect(screen.queryByText('Partial compensation approved')).not.toBeInTheDocument()
    expect(screen.queryByText('Resolution & Approval Package')).not.toBeInTheDocument()
    expect(screen.queryByText('Draft recommendation · Not final')).not.toBeInTheDocument()
  })
})
