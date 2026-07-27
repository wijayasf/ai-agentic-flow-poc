import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  createInitialRuntimeState,
  selectRuntimeViewModel,
  transitionRuntimeState,
} from '../../domain/runtime'
import type { RuntimeState } from '../../domain/runtime'
import { ConflictDetection } from './ConflictDetection'

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
    <ConflictDetection state={state as RuntimeState} viewModel={viewModel} />,
  )
}

describe('ConflictDetection — presentation contract by moment', () => {
  it('renders nothing while the runtime is idle', () => {
    const { container } = renderAt(null)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing before M08 (through Intake and early Investigation)', () => {
    for (const t of [30, 92, 122, 152, 182]) {
      const { container, unmount } = renderAt(t)
      expect(container.firstChild).toBeNull()
      unmount()
    }
  })

  it('at M08 shows the analyzing phase with engine and no findings yet', () => {
    renderAt(212)
    const card = screen.getByTestId('conflict-detection')
    expect(card.getAttribute('data-phase')).toBe('analyzing')
    expect(
      within(card).getByRole('heading', { name: 'Conflict Detection' }),
    ).toBeInTheDocument()
    expect(within(card).getByText(/Analyzing evidence consistency/)).toBeInTheDocument()
    // Engine present, no findings, no summary.
    expect(within(card).getByTestId('conflict-engine')).toBeInTheDocument()
    expect(within(card).getByText(/Analyzing inconsistencies/)).toBeInTheDocument()
    expect(within(card).queryByRole('list', { name: 'Conflict findings' })).toBeNull()
    expect(within(card).queryByTestId('conflict-summary')).toBeNull()
  })

  it('at M09 flips to complete phase with three findings and the summary', () => {
    renderAt(240)
    const card = screen.getByTestId('conflict-detection')
    expect(card.getAttribute('data-phase')).toBe('complete')
    expect(within(card).getByText(/Conflict analysis complete/)).toBeInTheDocument()
    // Three findings rendered in canonical order.
    const findings = within(card).getAllByRole('listitem')
    expect(findings.length).toBeGreaterThanOrEqual(3)
    expect(
      within(card).getByTestId('conflict-finding-agent-policy'),
    ).toBeInTheDocument()
    expect(
      within(card).getByTestId('conflict-finding-agent-workflow'),
    ).toBeInTheDocument()
    expect(
      within(card).getByTestId('conflict-finding-agent-finance'),
    ).toBeInTheDocument()
    // Neutral category labels visible.
    expect(within(card).getByText('Policy inconsistency')).toBeInTheDocument()
    expect(within(card).getByText('Timeline inconsistency')).toBeInTheDocument()
    expect(
      within(card).getByText('Financial clarification required'),
    ).toBeInTheDocument()
    // Provenance visible per finding.
    // (Policy Repository appears twice for the Policy row: source label + system name.)
    expect(within(card).getAllByText('Policy Repository').length).toBeGreaterThanOrEqual(1)
    // "SAP CX" and "SAP S/4HANA" appear next to their business labels.
    expect(within(card).getAllByText('SAP CX').length).toBeGreaterThanOrEqual(1)
    expect(within(card).getAllByText('SAP S/4HANA').length).toBeGreaterThanOrEqual(1)
    // Summary present with the three canonical lines.
    const summary = within(card).getByTestId('conflict-summary')
    expect(summary).toHaveTextContent('Conflict Summary')
    expect(summary).toHaveTextContent('3 evidence inconsistencies identified')
    expect(summary).toHaveTextContent('Further review required')
    expect(summary).toHaveTextContent('No recommendation generated')
  })

  it('holds the complete state through M10 and M11', () => {
    for (const t of [270, 300]) {
      const { unmount } = renderAt(t)
      const card = screen.getByTestId('conflict-detection')
      expect(card.getAttribute('data-phase')).toBe('complete')
      expect(within(card).getByTestId('conflict-summary')).toBeInTheDocument()
      unmount()
    }
  })

  it('unmounts once the runtime enters the Approval stage at M12', () => {
    const { container } = renderAt(330)
    expect(container.firstChild).toBeNull()
  })

  it('never leaks affirmative Recommendation / Approval / Refund / Compensation wording', () => {
    // "No recommendation generated" is the documented negation — allowed.
    const allowedNegations = /no recommendation generated/gi
    const forbidden =
      /recommend|approv|reject|refund granted|refund denied|compensation|resolution package|execution|customer notification|email|severity|risk|confidence|probability|root cause/i
    for (const t of [212, 240, 270, 300]) {
      const { unmount } = renderAt(t)
      const card = screen.getByTestId('conflict-detection')
      const raw = card.textContent ?? ''
      const stripped = raw.replace(allowedNegations, '')
      expect(stripped).not.toMatch(forbidden)
      unmount()
    }
  })

  it('accessible phase-badge and finding structure carry ARIA labels', () => {
    renderAt(240)
    const card = screen.getByTestId('conflict-detection')
    // Overall analysis phase badge has an ARIA label.
    expect(
      card.querySelector('[aria-label^="Analysis status:"]'),
    ).not.toBeNull()
    // Findings list is aria-labelled.
    expect(
      within(card).getByRole('list', { name: 'Conflict findings' }),
    ).toBeInTheDocument()
  })
})
