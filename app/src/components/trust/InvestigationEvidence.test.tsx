import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  createInitialRuntimeState,
  selectRuntimeViewModel,
  transitionRuntimeState,
} from '../../domain/runtime'
import type { RuntimeState } from '../../domain/runtime'
import { InvestigationEvidence } from './InvestigationEvidence'

function renderAt(seconds: number | null) {
  const state =
    seconds === null
      ? createInitialRuntimeState()
      : (() => {
          const s = transitionRuntimeState(createInitialRuntimeState('auto'), {
            type: 'START',
          })
          return transitionRuntimeState(s, {
            type: 'ADVANCE_TIME',
            seconds,
          })
        })()
  const viewModel = selectRuntimeViewModel(state as RuntimeState)
  return render(<InvestigationEvidence viewModel={viewModel} />)
}

describe('InvestigationEvidence — presentation contract by moment', () => {
  it('renders nothing while the runtime is idle', () => {
    const { container } = renderAt(null)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing during the Intake stage (M03 hold, t=75s)', () => {
    const { container } = renderAt(75)
    expect(container.firstChild).toBeNull()
  })

  it('at M04 shows all three specialists as Querying with no evidence preview', () => {
    renderAt(92)
    const card = screen.getByTestId('investigation-evidence')
    expect(
      within(card).getByRole('heading', { name: 'Investigation Evidence' }),
    ).toBeInTheDocument()
    // The three specialist items are present, in canonical order.
    const items = card.querySelectorAll('[data-agent-id]')
    expect(items).toHaveLength(3)
    expect(items[0].getAttribute('data-agent-id')).toBe('agent-policy')
    expect(items[1].getAttribute('data-agent-id')).toBe('agent-workflow')
    expect(items[2].getAttribute('data-agent-id')).toBe('agent-finance')
    items.forEach((item) => {
      expect(item.getAttribute('data-activity-state')).toBe('querying')
    })
    // Provenance visible.
    expect(within(card).getByText('Policy Agent')).toBeInTheDocument()
    expect(within(card).getByText('Policy Repository')).toBeInTheDocument()
    expect(within(card).getByText('Workflow Agent')).toBeInTheDocument()
    expect(within(card).getByText('SAP CX')).toBeInTheDocument()
    expect(within(card).getByText('Finance Agent')).toBeInTheDocument()
    expect(within(card).getByText('SAP S/4HANA')).toBeInTheDocument()
    // Tool activity labels visible.
    expect(within(card).getByText('Policy repository query')).toBeInTheDocument()
    expect(within(card).getByText('Customer case-history query')).toBeInTheDocument()
    expect(within(card).getByText('Financial context query')).toBeInTheDocument()
    // Every state badge reads 'Querying' (three of them).
    expect(within(card).getAllByText('Querying')).toHaveLength(3)
    // No evidence previews yet.
    expect(
      card.querySelector('[data-testid="evidence-preview-agent-policy"]'),
    ).toBeNull()
    // Summary badge absent.
    expect(within(card).queryByTestId('evidence-collection-summary')).toBeNull()
  })

  it('at M05 Policy shows Retrieved + evidence preview; Workflow + Finance still Querying', () => {
    renderAt(120)
    const card = screen.getByTestId('investigation-evidence')
    const policyItem = card.querySelector('[data-agent-id="agent-policy"]')
    const workflowItem = card.querySelector('[data-agent-id="agent-workflow"]')
    const financeItem = card.querySelector('[data-agent-id="agent-finance"]')
    expect(policyItem?.getAttribute('data-activity-state')).toBe('retrieved')
    expect(workflowItem?.getAttribute('data-activity-state')).toBe('querying')
    expect(financeItem?.getAttribute('data-activity-state')).toBe('querying')
    expect(
      within(card).getByTestId('evidence-preview-agent-policy'),
    ).toHaveTextContent('Refund policy and exception criteria retrieved')
    expect(
      card.querySelector('[data-testid="evidence-preview-agent-workflow"]'),
    ).toBeNull()
    expect(within(card).queryByTestId('evidence-collection-summary')).toBeNull()
  })

  it('at M06 Workflow evidence appears; Finance still Querying', () => {
    renderAt(150)
    const card = screen.getByTestId('investigation-evidence')
    expect(
      within(card).getByTestId('evidence-preview-agent-policy'),
    ).toHaveTextContent('Refund policy and exception criteria retrieved')
    expect(
      within(card).getByTestId('evidence-preview-agent-workflow'),
    ).toHaveTextContent('Customer case timeline and escalation history retrieved')
    expect(
      card.querySelector('[data-testid="evidence-preview-agent-finance"]'),
    ).toBeNull()
    expect(within(card).queryByTestId('evidence-collection-summary')).toBeNull()
  })

  it('at M07 all three evidence previews are visible and the collection summary appears', () => {
    renderAt(180)
    const card = screen.getByTestId('investigation-evidence')
    expect(
      within(card).getByTestId('evidence-preview-agent-finance'),
    ).toHaveTextContent('Compensation context and cost-impact data retrieved')
    // Summary badge reads the neutral cue.
    expect(
      within(card).getByTestId('evidence-collection-summary'),
    ).toHaveTextContent('Evidence collection complete')
    // Card carries the collection-complete marker.
    expect(card.getAttribute('data-collection-complete')).toBe('true')
    // All three state badges read 'Retrieved'.
    expect(within(card).getAllByText('Retrieved')).toHaveLength(3)
    expect(within(card).queryAllByText('Querying')).toHaveLength(0)
  })

  it('at M08 the fully-retrieved state and summary remain stable', () => {
    renderAt(210)
    const card = screen.getByTestId('investigation-evidence')
    expect(
      within(card).getByTestId('evidence-collection-summary'),
    ).toHaveTextContent('Evidence collection complete')
    expect(within(card).getAllByText('Retrieved')).toHaveLength(3)
  })

  it('renders nothing once the runtime enters the Conflict stage at M09', () => {
    const { container } = renderAt(240)
    expect(container.firstChild).toBeNull()
  })

  it('never leaks Conflict / Recommendation / Approval wording anywhere during M04–M08', () => {
    for (const t of [92, 120, 150, 180, 210]) {
      const { unmount } = renderAt(t)
      const card = screen.getByTestId('investigation-evidence')
      const text = card.textContent ?? ''
      expect(text).not.toMatch(/conflict/i)
      expect(text).not.toMatch(/recommendation/i)
      expect(text).not.toMatch(/recommend/i)
      expect(text).not.toMatch(/approv/i)
      expect(text).not.toMatch(/reject/i)
      expect(text).not.toMatch(/refund eligibility/i)
      expect(text).not.toMatch(/compensation approved/i)
      expect(text).not.toMatch(/contradicts/i)
      unmount()
    }
  })

  it('accessible activity-state labels are attached to every state badge', () => {
    renderAt(120)
    const card = screen.getByTestId('investigation-evidence')
    const badges = card.querySelectorAll('[data-activity-state]')
    badges.forEach((badge) => {
      const state = badge.getAttribute('data-activity-state')
      // The li carries a state; the inner span is the badge with aria-label.
      if (badge.tagName === 'SPAN') {
        expect(badge.getAttribute('aria-label')).toMatch(/^Activity: /)
        expect(badge.getAttribute('aria-label')).toContain(
          state === 'querying'
            ? 'Querying'
            : state === 'retrieved'
              ? 'Retrieved'
              : 'Queued',
        )
      }
    })
  })
})
