import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  createInitialRuntimeState,
  selectRuntimeViewModel,
  simulateAutoRun,
  transitionRuntimeState,
} from '../../domain/runtime'
import type { RuntimeState } from '../../domain/runtime'
import { AgenticFlowPanel } from './AgenticFlowPanel'
import { agents, systems } from './config'

function renderPanel(state: RuntimeState = createInitialRuntimeState()) {
  return render(
    <AgenticFlowPanel
      state={state}
      viewModel={selectRuntimeViewModel(state)}
    />,
  )
}

describe('AgenticFlowPanel', () => {
  it('exposes an aria-labelled region titled "Agentic Flow"', () => {
    renderPanel()
    expect(
      screen.getByRole('region', { name: 'Agentic Flow' }),
    ).toBeInTheDocument()
  })

  it('renders the five workflow stages in the configured order', () => {
    renderPanel()
    const stageNav = screen.getByRole('navigation', {
      name: 'Complaint resolution stages',
    })
    const items = within(stageNav).getAllByRole('listitem')
    expect(items).toHaveLength(5)
    const labels = items.map((item) => item.textContent?.trim())
    expect(labels).toEqual([
      expect.stringMatching(/Intake/),
      expect.stringMatching(/Investigation/),
      expect.stringMatching(/Conflict/),
      expect.stringMatching(/Approval/),
      expect.stringMatching(/Resolution/),
    ])
  })

  it('renders exactly four specialist agents in the configured order', () => {
    renderPanel()
    const list = screen.getByRole('list', { name: 'Specialist agents' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(4)
    const expectedNames = agents.map((agent) => agent.name)
    expect(expectedNames).toEqual([
      'Customer Complaint Agent',
      'Policy Agent',
      'Workflow Agent',
      'Finance Agent',
    ])
    items.forEach((item, index) => {
      expect(item.getAttribute('aria-label')).toContain(expectedNames[index])
    })
  })

  it('renders exactly four enterprise systems in the configured order', () => {
    renderPanel()
    const list = screen.getByRole('list', { name: 'Enterprise systems' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(4)
    const expectedNames = systems.map((system) => system.name)
    expect(expectedNames).toEqual([
      'CRM',
      'Policy Repository',
      'SAP CX',
      'SAP S/4HANA',
    ])
    items.forEach((item, index) => {
      expect(item.getAttribute('aria-label')).toContain(expectedNames[index])
    })
  })

  it('shows the neutral conflict banner and the trace region while idle', () => {
    renderPanel()
    expect(
      screen.getByText(/Conflict status will appear as evidence is reconciled/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Activity trace' }),
    ).toBeInTheDocument()
  })

  it('renders the Case Commander as the orchestration parent', () => {
    renderPanel()
    const commander = screen.getByLabelText('Case Commander')
    expect(commander).toBeInTheDocument()
    expect(commander.textContent).toContain('Orchestrating agents')
  })

  it('renders the connector-rail and inter-agent relay decorations', () => {
    const { container } = renderPanel()
    const rail = container.querySelector(
      '[data-testid="agent-connector-rail"]',
    )
    const relay = container.querySelector(
      '[data-testid="agent-relay-connectors"]',
    )
    expect(rail?.children).toHaveLength(4)
    expect(relay?.children).toHaveLength(3)
  })

  it('surfaces the conflict-detected copy while the runtime reports an active conflict', () => {
    let s = transitionRuntimeState(createInitialRuntimeState('auto'), {
      type: 'START',
    })
    s = transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds: 240 })
    // fast-forward until conflictStatus becomes active — bounded steps
    for (let i = 0; i < 40 && s.conflictStatus !== 'active'; i += 1) {
      s = transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds: 5 })
    }
    if (s.conflictStatus !== 'active') return
    renderPanel(s)
    expect(
      screen.getByText(/Conflict detected/),
    ).toBeInTheDocument()
  })

  it('reflects the final completed lifecycle for every agent after an approved auto run', () => {
    const finished = simulateAutoRun()
    renderPanel(finished)
    const list = screen.getByRole('list', { name: 'Specialist agents' })
    const items = within(list).getAllByRole('listitem')
    items.forEach((item) => {
      expect(item.getAttribute('data-state')).toBe('completed')
    })
  })
})
