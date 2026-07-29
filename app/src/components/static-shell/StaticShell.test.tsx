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
  return transitionRuntimeState(started, { type: 'ADVANCE_TIME', seconds })
}

function autoAtApprovalGate(): RuntimeState {
  // M25 (t=495, dur=20). waiting_approval fires after M25 completes at elapsed=515.
  return autoAt(520)
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
    expect(screen.queryByText(/Terima kasih, Bu Rina/)).not.toBeInTheDocument()
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

  it('renders the completed run outcome and clock at demo end', () => {
    renderShell(simulateAutoRun())

    expect(screen.getByRole('heading', { name: 'Case Resolved' })).toBeInTheDocument()
    expect(screen.getByText('Rp31,000,000 compensation approved')).toBeInTheDocument()
    expect(
      screen.getByLabelText('Demo time 10:00 of 10:00'),
    ).toBeInTheDocument()

    const trace = screen.getByRole('table', {
      name: 'Visible deterministic activity trace events',
    })
    const rows = within(trace).getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
    const cells = within(trace).getAllByRole('cell')
    cells.forEach((cell) => {
      expect(cell).toHaveAttribute('aria-label')
      expect(cell).toHaveAttribute('title')
    })
  })

  it('renders customer identity and complaint message once early story reveals it', () => {
    renderShell(autoAt(9))

    expect(screen.getByText('Rina Putri')).toBeInTheDocument()
    // Complaint message body is present (either the fixture text or the
    // rendered translation) — assert on the customer article region rather
    // than the exact wording.
    expect(
      screen.getByRole('article', { name: 'Customer complaint' }),
    ).toBeInTheDocument()
  })

  it('reveals the customer typing state before identity appears', () => {
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

    showState(autoAt(4))
    expect(screen.getByAltText('Preview of ceiling leakage evidence')).toBeInTheDocument()

    showState(autoAt(14))
    expect(screen.getByText(/Terima kasih, Bu Rina/)).toBeInTheDocument()
  })

  it('exposes the 5 core playback controls with correct availability at idle', () => {
    const actions = createActions()
    renderShell(createInitialRuntimeState(), actions)

    expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Restart' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Pause' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Resume' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next Moment' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(actions.start).toHaveBeenCalledOnce()
  })

  it('renders the human approval gate and forwards approve/reject decisions', () => {
    const actions = createActions()
    renderShell(autoAtApprovalGate(), actions)

    expect(screen.getByRole('heading', { name: 'Approval required' })).toBeInTheDocument()
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
    expect(container.innerHTML).not.toMatch(/https?:\/\//i)
    expect(container.querySelectorAll('[src^="http"], [href^="http"]')).toHaveLength(0)
    expect(container.querySelectorAll('[style*="url("]')).toHaveLength(0)
  })

  it('activates only one specialist agent at a time during sequential investigation', () => {
    // Sequential Agentic Case Officer product: never more than one specialist
    // agent is 'working' concurrently in the Investigation flow.
    const rendered = renderShell(autoAt(9))
    for (const t of [9, 60, 90, 150, 200, 300, 400]) {
      rendered.rerender(
        <StaticShell
          state={autoAt(t)}
          viewModel={selectRuntimeViewModel(autoAt(t))}
          actions={createActions()}
        />,
      )
      const agents = within(
        screen.getByRole('list', { name: 'Specialist agents' }),
      ).getAllByRole('listitem')
      const working = agents.filter((agent) => agent.dataset.state === 'working')
      expect(working.length).toBeLessThanOrEqual(1)
    }
  })

  it('completes every specialist by the end of the run', () => {
    renderShell(simulateAutoRun())
    const agents = within(
      screen.getByRole('list', { name: 'Specialist agents' }),
    ).getAllByRole('listitem')
    expect(agents.every((agent) => agent.dataset.state === 'completed')).toBe(true)
    expect(agents.some((agent) => agent.dataset.state === 'working')).toBe(false)
  })

  it('renders a distinct rejected escalation without approved content leakage', () => {
    renderShell(rejectedAutoState())

    expect(screen.getByRole('heading', { name: 'Decision Rejected' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Case Resolved' })).not.toBeInTheDocument()
    expect(screen.queryByText('Rp31,000,000 compensation approved')).not.toBeInTheDocument()
  })
})
