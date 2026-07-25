import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  createInitialRuntimeState,
  selectRuntimeViewModel,
  transitionRuntimeState,
} from '../../domain/runtime'
import type { RuntimeState } from '../../domain/runtime'
import { CustomerPanel } from './CustomerPanel'

function renderCustomer(state: RuntimeState) {
  return render(<CustomerPanel viewModel={selectRuntimeViewModel(state)} />)
}

function autoAt(seconds: number): RuntimeState {
  const started = transitionRuntimeState(createInitialRuntimeState('auto'), {
    type: 'START',
  })
  return transitionRuntimeState(started, {
    type: 'ADVANCE_TIME',
    seconds,
  })
}

describe('CustomerPanel — chip placement semantics', () => {
  it('renders neither chip before the AI Resolution Officer acknowledgement', () => {
    // Attachments visible, customer message visible, officer not yet acknowledged.
    const state = autoAt(6)
    renderCustomer(state)

    const complaint = screen.getByRole('article', { name: 'Customer complaint' })
    // ComplaintCard no longer carries either chip — both live in the officer footer.
    expect(within(complaint).queryByText('High Priority')).not.toBeInTheDocument()
    expect(within(complaint).queryByText('Daily Update Promise')).not.toBeInTheDocument()

    // Officer reply not rendered yet — showAiAcknowledgement flips true at ~t=9s.
    expect(
      screen.queryByRole('article', { name: 'AI Resolution Officer' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('High Priority')).not.toBeInTheDocument()
    expect(screen.queryByText('Daily Update Promise')).not.toBeInTheDocument()
  })

  it('renders both commitment chips inside the AI Resolution Officer reply once acknowledged', () => {
    const state = autoAt(9)
    renderCustomer(state)

    const officerCard = screen.getByRole('article', {
      name: 'AI Resolution Officer',
    })

    // Officer message copy still present.
    expect(within(officerCard).getByText(/Thank you, Rina/)).toBeInTheDocument()

    // Both chips live in the officer footer.
    expect(within(officerCard).getByText('High Priority')).toBeInTheDocument()
    expect(within(officerCard).getByText('Daily Update Promise')).toBeInTheDocument()

    // Verified indicator remains visible.
    expect(within(officerCard).getByLabelText('Verified response')).toBeInTheDocument()

    // ComplaintCard carries neither chip.
    const complaint = screen.getByRole('article', { name: 'Customer complaint' })
    expect(within(complaint).queryByText('High Priority')).not.toBeInTheDocument()
    expect(within(complaint).queryByText('Daily Update Promise')).not.toBeInTheDocument()
  })

  it('renders each chip exactly once and orders High Priority before Daily Update Promise', () => {
    const state = autoAt(9)
    renderCustomer(state)

    // Uniqueness across the whole panel.
    expect(screen.getAllByText('High Priority')).toHaveLength(1)
    expect(screen.getAllByText('Daily Update Promise')).toHaveLength(1)

    // Deterministic order: High Priority first, then Daily Update Promise.
    const officerCard = screen.getByRole('article', {
      name: 'AI Resolution Officer',
    })
    const chipRow = within(officerCard).getByLabelText(
      'AI Resolution Officer commitments',
    )
    const chipLabels = within(chipRow)
      .getAllByText(/High Priority|Daily Update Promise/)
      .map((node) => node.textContent?.trim())
    expect(chipLabels).toEqual(['High Priority', 'Daily Update Promise'])

    // Complaint message text still present.
    const complaint = screen.getByRole('article', { name: 'Customer complaint' })
    expect(within(complaint).getByText(/leak/i)).toBeInTheDocument()
  })
})
