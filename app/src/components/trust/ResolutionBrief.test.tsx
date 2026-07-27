import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  createInitialRuntimeState,
  selectRuntimeViewModel,
  transitionRuntimeState,
} from '../../domain/runtime'
import type { RuntimeState } from '../../domain/runtime'
import { ResolutionBrief } from './ResolutionBrief'

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
  return render(
    <ResolutionBrief state={state as RuntimeState} viewModel={viewModel} />,
  )
}

function renderAfterApproval() {
  const started = transitionRuntimeState(
    createInitialRuntimeState('auto'),
    { type: 'START' },
  )
  // Advance to 390s to trigger M13's wait_for_approval completion, then APPROVE.
  const waitingApproval = transitionRuntimeState(started, {
    type: 'ADVANCE_TIME',
    seconds: 390,
  })
  const approved = transitionRuntimeState(waitingApproval, { type: 'APPROVE' })
  return render(
    <ResolutionBrief
      state={approved as RuntimeState}
      viewModel={selectRuntimeViewModel(approved as RuntimeState)}
    />,
  )
}

describe('ResolutionBrief — presentation contract by moment', () => {
  it('renders nothing while the runtime is idle', () => {
    const { container } = renderAt(null)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing before M10 (Intake, Investigation, and M08/M09)', () => {
    for (const t of [30, 92, 152, 182, 212, 240]) {
      const { container, unmount } = renderAt(t)
      expect(container.firstChild).toBeNull()
      unmount()
    }
  })

  it('at M10 renders the "presented" phase with all sections', () => {
    renderAt(270)
    const card = screen.getByTestId('resolution-brief')
    expect(card.getAttribute('data-phase')).toBe('presented')
    expect(
      within(card).getByRole('heading', { name: 'AI Resolution Brief' }),
    ).toBeInTheDocument()
    expect(within(card).getByText('Prepared for Human Review')).toBeInTheDocument()
    // Section headings present.
    expect(within(card).getByRole('heading', { name: 'Executive Summary' })).toBeInTheDocument()
    expect(within(card).getByRole('heading', { name: 'Evidence Summary' })).toBeInTheDocument()
    expect(within(card).getByRole('heading', { name: 'Conflict Summary' })).toBeInTheDocument()
    expect(within(card).getByRole('heading', { name: 'Possible Actions' })).toBeInTheDocument()
    // Executive summary text.
    expect(
      within(card).getByText(/Investigation completed/),
    ).toBeInTheDocument()
    // Evidence summary bullets.
    expect(within(card).getByText('Policy Repository reviewed')).toBeInTheDocument()
    expect(within(card).getByText('Customer Timeline reviewed')).toBeInTheDocument()
    expect(within(card).getByText('Financial Context reviewed')).toBeInTheDocument()
    // Conflict summary bullets.
    expect(within(card).getByText('Policy inconsistency')).toBeInTheDocument()
    expect(within(card).getByText('Timeline inconsistency')).toBeInTheDocument()
    expect(within(card).getByText('Financial clarification required')).toBeInTheDocument()
  })

  it('at M10 renders three resolution options in canonical order with equal weight', () => {
    renderAt(270)
    const card = screen.getByTestId('resolution-brief')
    const optionList = within(card).getByRole('list', {
      name: 'Resolution options for reviewer',
    })
    const options = within(optionList).getAllByRole('listitem')
    expect(options).toHaveLength(3)
    // Canonical order.
    expect(options[0].getAttribute('data-option-id')).toBe('option-policy-review')
    expect(options[1].getAttribute('data-option-id')).toBe('option-financial-verification')
    expect(options[2].getAttribute('data-option-id')).toBe('option-manual-assessment')
    // Titles present.
    expect(within(card).getByText('Request policy review')).toBeInTheDocument()
    expect(within(card).getByText('Request financial verification')).toBeInTheDocument()
    expect(within(card).getByText('Escalate for manual assessment')).toBeInTheDocument()
    // Option tags visible.
    expect(within(card).getByText('Option A')).toBeInTheDocument()
    expect(within(card).getByText('Option B')).toBeInTheDocument()
    expect(within(card).getByText('Option C')).toBeInTheDocument()
    // No option carries a "preferred", "recommended", "selected", or "default" attribute or className.
    for (const option of options) {
      const cls = option.getAttribute('class') ?? ''
      expect(cls).not.toMatch(/preferred|recommend|selected|default|highlight|active/i)
      // No aria-selected / aria-pressed / autofocus signal.
      expect(option.getAttribute('aria-selected')).toBeNull()
      expect(option.getAttribute('aria-pressed')).toBeNull()
      expect(option.getAttribute('autofocus')).toBeNull()
    }
  })

  it('AI Notes section explicitly states no recommendation was generated', () => {
    renderAt(270)
    const card = screen.getByTestId('resolution-brief')
    const notes = within(card).getByTestId('resolution-brief-notes')
    expect(notes).toHaveTextContent('AI Notes')
    expect(notes).toHaveTextContent('No recommendation generated')
    expect(notes).toHaveTextContent(/further human review/i)
  })

  it('holds the "presented" state through M11', () => {
    renderAt(300)
    const card = screen.getByTestId('resolution-brief')
    expect(card.getAttribute('data-phase')).toBe('presented')
    expect(within(card).getByText('Prepared for Human Review')).toBeInTheDocument()
  })

  it('at M12 flips to the "awaiting-review" phase (Approval stage begins)', () => {
    renderAt(330)
    const card = screen.getByTestId('resolution-brief')
    expect(card.getAttribute('data-phase')).toBe('awaiting-review')
    expect(within(card).getByText('Awaiting reviewer decision')).toBeInTheDocument()
    // Content sections still visible.
    expect(within(card).getByRole('heading', { name: 'Possible Actions' })).toBeInTheDocument()
    expect(within(card).getAllByRole('listitem', { hidden: false }).length).toBeGreaterThanOrEqual(3)
  })

  it('holds the "awaiting-review" state through M13 (approval gate active)', () => {
    renderAt(360)
    const card = screen.getByTestId('resolution-brief')
    expect(card.getAttribute('data-phase')).toBe('awaiting-review')
    expect(within(card).getByText('Awaiting reviewer decision')).toBeInTheDocument()
  })

  it('unmounts once the reviewer decides (state advances past M13)', () => {
    const { container } = renderAfterApproval()
    expect(container.firstChild).toBeNull()
  })

  it('never leaks affirmative Recommendation / Approval / Refund / Compensation wording', () => {
    const allowedNegations = /no recommendation generated/gi
    const forbidden =
      /recommend|approv|reject|refund granted|refund denied|compensation|resolution package|execution|customer notification|email|severity|risk|confidence|probability|root cause/i
    for (const t of [270, 300, 330, 360]) {
      const { unmount } = renderAt(t)
      const card = screen.getByTestId('resolution-brief')
      const raw = card.textContent ?? ''
      const stripped = raw.replace(allowedNegations, '')
      expect(stripped).not.toMatch(forbidden)
      unmount()
    }
  })

  it('carries ARIA labels on phase badge, option list, and section testids', () => {
    renderAt(270)
    const card = screen.getByTestId('resolution-brief')
    // Overall phase badge has an ARIA label.
    expect(card.querySelector('[aria-label^="Brief status:"]')).not.toBeNull()
    // Option list is aria-labelled.
    expect(
      within(card).getByRole('list', { name: 'Resolution options for reviewer' }),
    ).toBeInTheDocument()
    // Section testids are present.
    expect(within(card).getByTestId('resolution-brief-executive')).toBeInTheDocument()
    expect(within(card).getByTestId('resolution-brief-evidence')).toBeInTheDocument()
    expect(within(card).getByTestId('resolution-brief-conflict')).toBeInTheDocument()
    expect(within(card).getByTestId('resolution-brief-options')).toBeInTheDocument()
    expect(within(card).getByTestId('resolution-brief-notes')).toBeInTheDocument()
  })
})
