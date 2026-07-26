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

describe('CustomerPanel — canonical intake sequence (product decision)', () => {
  it('shows the complaint card without any classification chips before the officer acknowledges', () => {
    renderCustomer(autoAt(6))
    const complaint = screen.getByRole('article', { name: 'Customer complaint' })
    // Complaint card must not carry High Priority in this canonical flow — HP is the
    // OUTCOME of the Customer Complaint Agent's initial assessment, not an automatic label.
    expect(within(complaint).queryByText('High Priority')).not.toBeInTheDocument()
    expect(within(complaint).queryByText('Daily Update Promise')).not.toBeInTheDocument()
    // Officer article is absent — acknowledgement lands at t=9s.
    expect(
      screen.queryByRole('article', { name: 'AI Resolution Officer' }),
    ).not.toBeInTheDocument()
  })

  it('surfaces the AI Resolution Officer typing indicator during the ai-typing window', () => {
    renderCustomer(autoAt(7))
    expect(
      screen.getByRole('status', { name: 'AI Resolution Officer is typing' }),
    ).toBeInTheDocument()
    // Officer article is not mounted yet during the typing window.
    expect(
      screen.queryByRole('article', { name: 'AI Resolution Officer' }),
    ).not.toBeInTheDocument()
  })

  it('mounts the officer acknowledgement immediately at t=9s WITHOUT High Priority, Daily Update Promise, or Verified badge', () => {
    renderCustomer(autoAt(9))
    const officerCard = screen.getByRole('article', {
      name: 'AI Resolution Officer',
    })
    // Acknowledgement message body must be present.
    expect(within(officerCard).getByText(/Thank you, Rina/)).toBeInTheDocument()
    // But nothing that would imply intake has finished:
    expect(within(officerCard).queryByText('High Priority')).not.toBeInTheDocument()
    expect(within(officerCard).queryByText('Daily Update Promise')).not.toBeInTheDocument()
    expect(within(officerCard).queryByLabelText('Verified response')).not.toBeInTheDocument()
    // Nor a rendered commitments footer.
    expect(
      officerCard.querySelector('[data-reveal-block="footer"]'),
    ).toBeNull()
    // The `data-intake-completed` marker is absent while the agent is still working.
    expect(officerCard.getAttribute('data-intake-completed')).toBeNull()
    // These outcome chips must also be absent everywhere in the panel.
    expect(screen.queryByText('High Priority')).not.toBeInTheDocument()
    expect(screen.queryByText('Daily Update Promise')).not.toBeInTheDocument()
  })

  it('preserves the header → message → cursor progressive reveal on the early acknowledgement', () => {
    renderCustomer(autoAt(9))
    const officerCard = screen.getByRole('article', {
      name: 'AI Resolution Officer',
    })
    const blocks = Array.from(
      officerCard.querySelectorAll('[data-reveal-block]'),
    ).map((el) => el.getAttribute('data-reveal-block'))
    expect(blocks).toEqual(['header', 'message', 'cursor'])
  })

  it('reveals High Priority, Daily Update Promise, and Verified badge INSIDE the officer footer only after the Customer Complaint Agent completes intake', () => {
    renderCustomer(autoAt(60))
    const officerCard = screen.getByRole('article', {
      name: 'AI Resolution Officer',
    })
    // Intake-completion marker set.
    expect(officerCard.getAttribute('data-intake-completed')).toBe('true')
    // Footer is now present.
    const footer = officerCard.querySelector('[data-reveal-block="footer"]')
    expect(footer).not.toBeNull()
    // The three intake outcomes now live inside the footer.
    expect(within(officerCard).getByText('High Priority')).toBeInTheDocument()
    expect(within(officerCard).getByText('Daily Update Promise')).toBeInTheDocument()
    expect(within(officerCard).getByLabelText('Verified response')).toBeInTheDocument()
    // Deterministic sibling order inside the chip row: HP first, DU second.
    const chipRow = within(officerCard).getByLabelText(
      'AI Resolution Officer commitments',
    )
    const chipIds = Array.from(
      chipRow.querySelectorAll('[data-chip]'),
    ).map((el) => el.getAttribute('data-chip'))
    expect(chipIds).toEqual(['high-priority', 'daily-update'])
    // Full block reveal order across the whole card.
    const blocks = Array.from(
      officerCard.querySelectorAll('[data-reveal-block]'),
    ).map((el) => el.getAttribute('data-reveal-block'))
    expect(blocks).toEqual(['header', 'message', 'cursor', 'footer', 'verified'])
  })

  it('keeps intake outcomes exclusively inside the officer footer (never in the complaint card)', () => {
    renderCustomer(autoAt(60))
    expect(screen.getAllByText('High Priority')).toHaveLength(1)
    expect(screen.getAllByText('Daily Update Promise')).toHaveLength(1)
    const complaint = screen.getByRole('article', { name: 'Customer complaint' })
    expect(within(complaint).queryByText('High Priority')).not.toBeInTheDocument()
    expect(within(complaint).queryByText('Daily Update Promise')).not.toBeInTheDocument()
    const officer = screen.getByRole('article', {
      name: 'AI Resolution Officer',
    })
    expect(within(officer).getByText('High Priority')).toBeInTheDocument()
    expect(within(officer).getByText('Daily Update Promise')).toBeInTheDocument()
  })

  it('preserves the exact acknowledgement message wording verbatim', () => {
    renderCustomer(autoAt(60))
    const officerCard = screen.getByRole('article', {
      name: 'AI Resolution Officer',
    })
    expect(within(officerCard).getByText(/Thank you, Rina/)).toBeInTheDocument()
    expect(
      within(officerCard).getByText(
        /reviewing with the right systems and experts/,
      ),
    ).toBeInTheDocument()
  })

  it('parallel investigation has not begun at the instant the intake footer appears', () => {
    const state = autoAt(60)
    const vm = selectRuntimeViewModel(state)
    expect(vm.currentStage).toBe('Intake')
    const customer = vm.agentLifecycle.find(
      (a) => a.agentId === 'agent-customer-complaint',
    )
    expect(customer?.status).toBe('completed')
    const investigationAgents = ['agent-policy', 'agent-workflow', 'agent-finance']
    investigationAgents.forEach((id) => {
      const status = vm.agentLifecycle.find((a) => a.agentId === id)?.status
      expect(status).toBe('waiting')
    })
  })
})
