import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  createInitialRuntimeState,
  selectRuntimeViewModel,
  transitionRuntimeState,
} from '../../domain/runtime'
import type { RuntimeState } from '../../domain/runtime'
import { EvidenceCorrelation } from './EvidenceCorrelation'

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
    <EvidenceCorrelation state={state as RuntimeState} viewModel={viewModel} />,
  )
}

describe('EvidenceCorrelation — presentation contract by moment', () => {
  it('renders nothing while the runtime is idle', () => {
    const { container } = renderAt(null)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing during the Intake stage (M03 hold)', () => {
    const { container } = renderAt(75)
    expect(container.firstChild).toBeNull()
  })

  it('at M04 shows the pipeline with three unmapped sources and Waiting overall state', () => {
    renderAt(92)
    const card = screen.getByTestId('evidence-correlation')
    expect(
      within(card).getByRole('heading', { name: 'Evidence Correlation' }),
    ).toBeInTheDocument()
    expect(card.getAttribute('data-overall-state')).toBe('waiting')
    const sources = card.querySelectorAll('[data-agent-id]')
    expect(sources).toHaveLength(3)
    expect(sources[0].getAttribute('data-agent-id')).toBe('agent-policy')
    expect(sources[1].getAttribute('data-agent-id')).toBe('agent-workflow')
    expect(sources[2].getAttribute('data-agent-id')).toBe('agent-finance')
    sources.forEach((s) => {
      expect(s.getAttribute('data-source-state')).toBe('waiting')
    })
    // Canonical source labels visible.
    expect(within(card).getByText('Policy Repository')).toBeInTheDocument()
    expect(within(card).getByText('Customer Timeline')).toBeInTheDocument()
    expect(within(card).getByText('Financial Context')).toBeInTheDocument()
    // Correlation Engine appears at the tail of the pipeline.
    expect(within(card).getByTestId('correlation-engine')).toBeInTheDocument()
    expect(within(card).getByText(/0 of 3 sources joined/)).toBeInTheDocument()
    // Subtitle communicates the waiting state.
    expect(within(card).getByText(/Awaiting evidence to correlate/)).toBeInTheDocument()
    // No completion summary yet.
    expect(within(card).queryByTestId('correlation-summary')).toBeNull()
  })

  it('at M05 marks Policy as Mapped and flips overall state to Correlating', () => {
    renderAt(122)
    const card = screen.getByTestId('evidence-correlation')
    expect(card.getAttribute('data-overall-state')).toBe('correlating')
    const policy = card.querySelector('[data-agent-id="agent-policy"]')
    const workflow = card.querySelector('[data-agent-id="agent-workflow"]')
    const finance = card.querySelector('[data-agent-id="agent-finance"]')
    expect(policy?.getAttribute('data-source-state')).toBe('mapped')
    expect(workflow?.getAttribute('data-source-state')).toBe('waiting')
    expect(finance?.getAttribute('data-source-state')).toBe('waiting')
    expect(within(card).getByText(/1 of 3 sources joined/)).toBeInTheDocument()
    expect(within(card).getByText(/Cross-referencing enterprise evidence/)).toBeInTheDocument()
    expect(within(card).queryByTestId('correlation-summary')).toBeNull()
  })

  it('at M06 marks Workflow as Mapped, holds Correlating', () => {
    renderAt(152)
    const card = screen.getByTestId('evidence-correlation')
    expect(card.getAttribute('data-overall-state')).toBe('correlating')
    const workflow = card.querySelector('[data-agent-id="agent-workflow"]')
    const finance = card.querySelector('[data-agent-id="agent-finance"]')
    expect(workflow?.getAttribute('data-source-state')).toBe('mapped')
    expect(finance?.getAttribute('data-source-state')).toBe('waiting')
    expect(within(card).getByText(/2 of 3 sources joined/)).toBeInTheDocument()
  })

  it('at M07 all three mapped but still Correlating (not yet Complete)', () => {
    renderAt(182)
    const card = screen.getByTestId('evidence-correlation')
    expect(card.getAttribute('data-overall-state')).toBe('correlating')
    const sources = card.querySelectorAll('[data-agent-id]')
    sources.forEach((s) =>
      expect(s.getAttribute('data-source-state')).toBe('mapped'),
    )
    expect(within(card).getByText(/3 of 3 sources joined/)).toBeInTheDocument()
    expect(within(card).queryByTestId('correlation-summary')).toBeNull()
  })

  it('at M08 flips overall state to Complete and renders the neutral summary', () => {
    renderAt(212)
    const card = screen.getByTestId('evidence-correlation')
    expect(card.getAttribute('data-overall-state')).toBe('complete')
    expect(
      within(card).getByTestId('correlation-summary'),
    ).toHaveTextContent('Evidence correlation complete')
    expect(within(card).getByText(/Cross-reference complete/)).toBeInTheDocument()
  })

  it('renders nothing at M09 (Conflict stage boundary)', () => {
    const { container } = renderAt(240)
    expect(container.firstChild).toBeNull()
  })

  it('never leaks Conflict / Recommendation / Approval wording across M04–M08', () => {
    const forbidden =
      /conflict|recommend|approv|reject|violat|mismatch|exception|root cause|refund amount|compensation amount|confidence|probability|severity|risk/i
    for (const t of [92, 122, 152, 182, 212]) {
      const { unmount } = renderAt(t)
      const card = screen.getByTestId('evidence-correlation')
      expect(card.textContent ?? '').not.toMatch(forbidden)
      unmount()
    }
  })

  it('accessible labels are attached to each state badge', () => {
    renderAt(122)
    const card = screen.getByTestId('evidence-correlation')
    // Overall badge.
    const overall = card.querySelector('[aria-label^="Correlation status:"]')
    expect(overall).not.toBeNull()
    // Per-source badges.
    const perSource = card.querySelectorAll(
      '[aria-label*=" status: "]',
    )
    // 1 overall + 3 source badges = 4.
    expect(perSource.length).toBeGreaterThanOrEqual(4)
  })
})
