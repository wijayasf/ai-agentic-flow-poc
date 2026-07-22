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
    agentItems.forEach((item) => expect(item).toHaveAttribute('data-state', 'inactive'))

    const systemItems = within(
      screen.getByRole('list', { name: 'Enterprise systems' }),
    ).getAllByRole('listitem')
    expect(systemItems).toHaveLength(4)
    systemItems.forEach((item) => expect(item).toHaveAttribute('data-state', 'inactive'))

    const artifacts = within(
      screen.getByRole('region', { name: 'Key Artifacts' }),
    ).getAllByRole('listitem')
    expect(artifacts).toHaveLength(4)
    artifacts.forEach((artifact) =>
      expect(artifact).toHaveAttribute('data-state', 'locked'),
    )

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

  it('renders the completed trace, metrics, artifacts, and recommendation from selectors', () => {
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

    const artifacts = within(
      screen.getByRole('region', { name: 'Key Artifacts' }),
    ).getAllByRole('listitem')
    expect(artifacts).toHaveLength(4)
    expect(artifacts[2]).toHaveAttribute('data-state', 'approved')
    expect(screen.getByRole('heading', { name: 'Recommendation' })).toBeInTheDocument()
    expect(
      screen.getByText(
        '11 similar cases detected. Recommend mandatory customer confirmation before SAP CX ticket closure.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Demo time 10:00 of 10:00'),
    ).toBeInTheDocument()
  })

  it('renders the required customer and complaint content', () => {
    renderShell()

    expect(screen.getByText('Rina Putri')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Hi, after handover on 10 May, there is still leakage in the bathroom ceiling. I have reported it multiple times but the repair is still not done.',
      ),
    ).toBeInTheDocument()
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

  it('renders the exact approval action inside the fixed context card', () => {
    const actions = createActions()
    renderShell(presenterAtApprovalGate(), actions)

    expect(screen.getByRole('heading', { name: 'Approval required' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'Approve priority ceiling repair and an IDR service recovery credit?',
      ),
    ).toBeInTheDocument()
    const approveButton = screen.getByRole('button', { name: 'Approve' })
    expect(approveButton).toBeEnabled()
    fireEvent.click(approveButton)
    expect(actions.approve).toHaveBeenCalledOnce()
  })

  it('uses local placeholders without runtime image or network requests', () => {
    const { container } = renderShell()

    expect(container.querySelectorAll('img')).toHaveLength(0)
    expect(container.innerHTML).not.toMatch(/https?:\/\//i)
    expect(container.querySelectorAll('[src^="http"], [href^="http"]')).toHaveLength(0)
    expect(container.querySelectorAll('[style*="url("]')).toHaveLength(0)
  })
})
