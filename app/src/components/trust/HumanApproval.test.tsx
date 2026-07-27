import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  createInitialRuntimeState,
  selectRuntimeViewModel,
  transitionRuntimeState,
} from '../../domain/runtime'
import type { RuntimeState } from '../../domain/runtime'
import { HumanApproval } from './HumanApproval'

function stateAt(seconds: number | null): RuntimeState {
  if (seconds === null) return createInitialRuntimeState() as RuntimeState
  const started = transitionRuntimeState(
    createInitialRuntimeState('auto'),
    { type: 'START' },
  )
  return transitionRuntimeState(started, {
    type: 'ADVANCE_TIME',
    seconds,
  }) as RuntimeState
}

function renderAt(seconds: number | null) {
  const state = stateAt(seconds)
  return render(
    <HumanApproval state={state} viewModel={selectRuntimeViewModel(state)} />,
  )
}

describe('HumanApproval (presentation wrapper)', () => {
  it('renders nothing while the runtime is idle', () => {
    const { container } = renderAt(null)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing during Intake, Investigation, and Conflict stages', () => {
    for (const t of [92, 152, 212, 240, 270, 300]) {
      const { container, unmount } = renderAt(t)
      expect(container.firstChild).toBeNull()
      unmount()
    }
  })

  it('renders the divider + heading + subtitle at M12', () => {
    renderAt(330)
    const divider = screen.getByTestId('human-approval-divider')
    expect(divider).toHaveTextContent(/End of AI Analysis/i)
    const section = screen.getByTestId('human-approval')
    expect(
      within(section).getByRole('heading', { name: 'Human Approval' }),
    ).toBeInTheDocument()
    expect(within(section).getByText(/AI analysis completed/)).toBeInTheDocument()
  })

  it('remains visible at M13 waiting_approval', () => {
    renderAt(390)
    expect(screen.getByTestId('human-approval-divider')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Human Approval' }),
    ).toBeInTheDocument()
  })

  it('does NOT render Approve or Reject buttons (owned by ApprovalDecisionCard)', () => {
    renderAt(390)
    const section = screen.getByTestId('human-approval')
    expect(within(section).queryByRole('button', { name: 'Approve' })).toBeNull()
    expect(within(section).queryByRole('button', { name: 'Reject' })).toBeNull()
  })

  it('unmounts once the runtime records approval', () => {
    const state = stateAt(390)
    const approved = transitionRuntimeState(state, { type: 'APPROVE' })
    const { container } = render(
      <HumanApproval
        state={approved}
        viewModel={selectRuntimeViewModel(approved)}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('unmounts once the runtime records rejection', () => {
    const state = stateAt(390)
    const rejected = transitionRuntimeState(state, { type: 'REJECT' })
    const { container } = render(
      <HumanApproval
        state={rejected}
        viewModel={selectRuntimeViewModel(rejected)}
      />,
    )
    expect(container.firstChild).toBeNull()
  })
})
