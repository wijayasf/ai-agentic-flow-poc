import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { RuntimeViewModel } from '../../domain/runtime'
import type { AgentId } from '../../domain/runtime-fixtures/types'
import { AgentGrid } from './AgentGrid'
import { selectAgentActivitySubtitle } from './agentActivity'

const AGENT_IDS: readonly AgentId[] = [
  'agent-customer-complaint',
  'agent-policy',
  'agent-workflow',
  'agent-finance',
]

function makeViewModel(
  statusByAgent: Record<AgentId, 'waiting' | 'working' | 'needs_review' | 'awaiting_approval' | 'completed'>,
): RuntimeViewModel {
  return {
    agentLifecycle: AGENT_IDS.map((agentId) => ({
      agentId,
      status: statusByAgent[agentId],
    })),
    focusTarget: null,
  } as unknown as RuntimeViewModel
}

describe('Point F1.1 — Agent card has no working animation', () => {
  it('renders no workingDots element while any agent is working', () => {
    const vm = makeViewModel({
      'agent-customer-complaint': 'working',
      'agent-policy': 'working',
      'agent-workflow': 'working',
      'agent-finance': 'working',
    })
    const { container } = render(<AgentGrid viewModel={vm} />)
    // Historical animated indicator must not appear anywhere.
    expect(container.querySelectorAll('[data-testid^="agent-working-dots-"]'))
      .toHaveLength(0)
    // No class named workingDots present.
    const workingDots = container.querySelectorAll(
      '[class*="workingDots"]',
    )
    expect(workingDots).toHaveLength(0)
  })
})

describe('Point F1.1 — Locked short activity copy', () => {
  it.each([
    ['agent-customer-complaint', 'working', 'Analysing complaint'],
    ['agent-policy', 'working', 'Checking policy'],
    ['agent-workflow', 'working', 'Preparing workflow'],
    ['agent-finance', 'working', 'Calculating compensation'],
    ['agent-customer-complaint', 'completed', 'Complaint analysis ready'],
    ['agent-policy', 'completed', 'Policy evidence ready'],
    ['agent-workflow', 'completed', 'Workflow package ready'],
    ['agent-finance', 'completed', 'Financial recommendation ready'],
    ['agent-customer-complaint', 'needs_review', 'Analysis ready'],
    ['agent-policy', 'needs_review', 'Policy ready'],
    ['agent-workflow', 'needs_review', 'Workflow ready'],
    ['agent-finance', 'needs_review', 'Recommendation ready'],
    ['agent-workflow', 'awaiting_approval', 'Approval in progress'],
    ['agent-finance', 'awaiting_approval', 'Awaiting approval'],
  ] as const)('%s @ %s → %s', (agentId, status, expected) => {
    expect(selectAgentActivitySubtitle(agentId, status)).toBe(expected)
  })

  it('never uses animated ellipsis or rejected long Policy wording', () => {
    for (const agentId of AGENT_IDS) {
      for (const status of ['working', 'needs_review', 'awaiting_approval', 'completed'] as const) {
        const label = selectAgentActivitySubtitle(agentId, status) ?? ''
        expect(label).not.toMatch(/\.\.\.|…/)
        expect(label).not.toMatch(/Retrieving policy and validating/i)
        // Enforce the max-32-character guideline where practical.
        expect(label.length).toBeLessThanOrEqual(32)
      }
    }
  })
})

describe('Point F1.1 — Agent card renders the locked copy in the DOM', () => {
  it('renders Analysing complaint / Checking policy / Preparing workflow / Calculating compensation while working', () => {
    const vm = makeViewModel({
      'agent-customer-complaint': 'working',
      'agent-policy': 'working',
      'agent-workflow': 'working',
      'agent-finance': 'working',
    })
    const { container } = render(<AgentGrid viewModel={vm} />)
    const text = container.textContent ?? ''
    expect(text).toContain('Analysing complaint')
    expect(text).toContain('Checking policy')
    expect(text).toContain('Preparing workflow')
    expect(text).toContain('Calculating compensation')
    // Old long Policy wording must not appear.
    expect(text).not.toMatch(/Retrieving policy and validating/i)
  })

  it('renders the short completed labels when the specialists complete', () => {
    const vm = makeViewModel({
      'agent-customer-complaint': 'completed',
      'agent-policy': 'completed',
      'agent-workflow': 'completed',
      'agent-finance': 'completed',
    })
    const { container } = render(<AgentGrid viewModel={vm} />)
    const text = container.textContent ?? ''
    expect(text).toContain('Complaint analysis ready')
    expect(text).toContain('Policy evidence ready')
    expect(text).toContain('Workflow package ready')
    expect(text).toContain('Financial recommendation ready')
  })
})
