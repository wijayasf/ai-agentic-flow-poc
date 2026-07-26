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
    expect(commander.getAttribute('data-orchestrating')).toBeNull()
  })

  it('marks the Case Commander as orchestrating during ai-typing', () => {
    let s = transitionRuntimeState(createInitialRuntimeState('auto'), {
      type: 'START',
    })
    s = transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds: 7 })
    renderPanel(s)
    const commander = screen.getByLabelText('Case Commander')
    expect(commander.getAttribute('data-orchestrating')).toBe('true')
    expect(commander.textContent).toContain('Dispatching task')
  })

  it('restores the Case Commander once the AI acknowledgement lands', () => {
    let s = transitionRuntimeState(createInitialRuntimeState('auto'), {
      type: 'START',
    })
    s = transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds: 9 })
    renderPanel(s)
    const commander = screen.getByLabelText('Case Commander')
    expect(commander.getAttribute('data-orchestrating')).toBeNull()
    expect(commander.textContent).toContain('Orchestrating agents')
  })

  it('renders the connector rail and the agent→system connectors', () => {
    const { container } = renderPanel()
    const rail = container.querySelector(
      '[data-testid="agent-connector-rail"]',
    )
    const systemConnectors = container.querySelector(
      '[data-testid="system-connectors"]',
    )
    expect(rail?.children).toHaveLength(4)
    expect(systemConnectors?.children).toHaveLength(4)
  })

  it('does not mark any connector as dispatching while idle', () => {
    const { container } = renderPanel()
    const rail = container.querySelector(
      '[data-testid="agent-connector-rail"]',
    )
    const spans = Array.from(rail?.children ?? []) as HTMLElement[]
    spans.forEach((span) => {
      expect(span.getAttribute('data-dispatching')).toBeNull()
    })
  })

  it('marks the Customer Complaint connector as dispatching during ai-typing while the agent is still waiting', () => {
    let s = transitionRuntimeState(createInitialRuntimeState('auto'), {
      type: 'START',
    })
    s = transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds: 7 })
    const { container } = renderPanel(s)
    const rail = container.querySelector(
      '[data-testid="agent-connector-rail"]',
    )
    const spans = Array.from(rail?.children ?? []) as HTMLElement[]
    expect(spans[0].getAttribute('data-dispatching')).toBe('true')
    expect(spans[0].getAttribute('data-state')).toBe('waiting')
    spans.slice(1).forEach((span) => {
      expect(span.getAttribute('data-dispatching')).toBeNull()
    })
  })

  it('clears dispatching once the Customer Complaint Agent begins working', () => {
    let s = transitionRuntimeState(createInitialRuntimeState('auto'), {
      type: 'START',
    })
    s = transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds: 9 })
    const { container } = renderPanel(s)
    const rail = container.querySelector(
      '[data-testid="agent-connector-rail"]',
    )
    const spans = Array.from(rail?.children ?? []) as HTMLElement[]
    expect(spans[0].getAttribute('data-dispatching')).toBeNull()
    expect(spans[0].getAttribute('data-state')).toBe('working')
  })

  it('orders the three orchestration phases deterministically: pulse+dispatch, then activation', () => {
    const observe = (seconds: number) => {
      let s = transitionRuntimeState(createInitialRuntimeState('auto'), {
        type: 'START',
      })
      s = transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds })
      const { container, unmount } = renderPanel(s)
      const commander = screen.getByLabelText('Case Commander')
      const rail = container.querySelector(
        '[data-testid="agent-connector-rail"]',
      )
      const spans = Array.from(rail?.children ?? []) as HTMLElement[]
      const snapshot = {
        pulsing: commander.getAttribute('data-orchestrating'),
        subtitle: commander.textContent?.includes('Dispatching task') ?? false,
        firstDispatching: spans[0].getAttribute('data-dispatching'),
        firstState: spans[0].getAttribute('data-state'),
      }
      unmount()
      return snapshot
    }
    // Phase 0 (before): no pulse, no dispatch, agent waiting
    expect(observe(6)).toEqual({
      pulsing: null,
      subtitle: false,
      firstDispatching: null,
      firstState: 'waiting',
    })
    // Phase 1/2 (during ai_typing): commander pulses, connector dispatches, agent still waiting
    expect(observe(7)).toEqual({
      pulsing: 'true',
      subtitle: true,
      firstDispatching: 'true',
      firstState: 'waiting',
    })
    // Phase 3 (acknowledged): pulse stops, dispatch clears, agent becomes working
    expect(observe(9)).toEqual({
      pulsing: null,
      subtitle: false,
      firstDispatching: null,
      firstState: 'working',
    })
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

  it('does not surface the intake-completion cue while the Customer Complaint Agent is still working', () => {
    let s = transitionRuntimeState(createInitialRuntimeState('auto'), {
      type: 'START',
    })
    s = transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds: 30 })
    renderPanel(s)
    // Stage-stepper completion badge absent
    expect(
      screen.queryByTestId('stage-completion-badge'),
    ).not.toBeInTheDocument()
    // Case Commander data-phase absent
    const commander = screen.getByLabelText('Case Commander')
    expect(commander.getAttribute('data-phase')).toBeNull()
  })

  it('marks the Intake stage with an intake-completion cue and the Case Commander as ready during the M03 hold window', () => {
    let s = transitionRuntimeState(createInitialRuntimeState('auto'), {
      type: 'START',
    })
    s = transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds: 60 })
    renderPanel(s)
    // Intake stage keeps its 'current' state but carries the completion substate.
    const stageNav = screen.getByRole('navigation', {
      name: 'Complaint resolution stages',
    })
    const stageItems = within(stageNav).getAllByRole('listitem')
    const intakeItem = stageItems[0]
    expect(intakeItem.getAttribute('data-state')).toBe('current')
    expect(intakeItem.getAttribute('data-substate')).toBe(
      'initial-intake-completed',
    )
    expect(
      screen.getByTestId('stage-completion-badge'),
    ).toBeInTheDocument()
    // Case Commander switches to the readiness phase (but not orchestrating/dispatching).
    const commander = screen.getByLabelText('Case Commander')
    expect(commander.getAttribute('data-phase')).toBe('ready')
    expect(commander.getAttribute('data-orchestrating')).toBeNull()
    // Investigation stage is still upcoming; policy/workflow/finance still waiting.
    const [, investigationItem] = stageItems
    expect(investigationItem.getAttribute('data-state')).toBe('upcoming')
    const specialistList = screen.getByRole('list', {
      name: 'Specialist agents',
    })
    const specialists = within(specialistList).getAllByRole('listitem')
    expect(specialists[0].getAttribute('data-state')).toBe('completed')
    ;['waiting', 'waiting', 'waiting'].forEach((expected, i) => {
      expect(specialists[i + 1].getAttribute('data-state')).toBe(expected)
    })
  })

  it('clears the intake-completion cue once the runtime advances into Investigation', () => {
    let s = transitionRuntimeState(createInitialRuntimeState('auto'), {
      type: 'START',
    })
    s = transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds: 92 })
    renderPanel(s)
    // Completion badge no longer present.
    expect(
      screen.queryByTestId('stage-completion-badge'),
    ).not.toBeInTheDocument()
    // Case Commander phase is now 'dispatching-wave' (M04 entry).
    const commander = screen.getByLabelText('Case Commander')
    expect(commander.getAttribute('data-phase')).toBe('dispatching-wave')
    // Stage stepper: Intake is now completed, Investigation is current.
    const stageNav = screen.getByRole('navigation', {
      name: 'Complaint resolution stages',
    })
    const stageItems = within(stageNav).getAllByRole('listitem')
    expect(stageItems[0].getAttribute('data-state')).toBe('completed')
    expect(stageItems[1].getAttribute('data-state')).toBe('current')
  })

  it('activates Policy, Workflow, and Finance in parallel at M04 entry with the investigation wave attribute', () => {
    let s = transitionRuntimeState(createInitialRuntimeState('auto'), {
      type: 'START',
    })
    s = transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds: 92 })
    const { container } = renderPanel(s)
    // Case Commander phase = dispatching-wave (not orchestrating).
    const commander = screen.getByLabelText('Case Commander')
    expect(commander.getAttribute('data-phase')).toBe('dispatching-wave')
    expect(commander.getAttribute('data-orchestrating')).toBeNull()
    // Specialist agent cards: all three in 'working' state, each with data-agent-id.
    const specialistList = screen.getByRole('list', { name: 'Specialist agents' })
    const items = within(specialistList).getAllByRole('listitem')
    expect(items[0].getAttribute('data-state')).toBe('completed')
    expect(items[1].getAttribute('data-state')).toBe('working')
    expect(items[1].getAttribute('data-agent-id')).toBe('agent-policy')
    expect(items[2].getAttribute('data-state')).toBe('working')
    expect(items[2].getAttribute('data-agent-id')).toBe('agent-workflow')
    expect(items[3].getAttribute('data-state')).toBe('working')
    expect(items[3].getAttribute('data-agent-id')).toBe('agent-finance')
    // Connector rail: three wave-tagged spans for the specialists.
    const rail = container.querySelector('[data-testid="agent-connector-rail"]')
    const railSpans = Array.from(rail?.children ?? []) as HTMLElement[]
    expect(railSpans[0].getAttribute('data-wave')).toBeNull()
    expect(railSpans[1].getAttribute('data-wave')).toBe('investigation')
    expect(railSpans[2].getAttribute('data-wave')).toBe('investigation')
    expect(railSpans[3].getAttribute('data-wave')).toBe('investigation')
    // Enterprise systems: engaged via existing runtime effect.
    const systemList = screen.getByRole('list', { name: 'Enterprise systems' })
    const sysItems = within(systemList).getAllByRole('listitem')
    sysItems.forEach((item) => {
      expect(item.getAttribute('data-state')).toBe('engaged')
      expect(item.getAttribute('data-system-id')).toMatch(/^system-/)
    })
  })

  it('preserves the serial-completion order: Policy at M05, Workflow at M06, Finance at M07', () => {
    const observe = (seconds: number) => {
      let s = transitionRuntimeState(createInitialRuntimeState('auto'), {
        type: 'START',
      })
      s = transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds })
      const { unmount } = renderPanel(s)
      const specialistList = screen.getByRole('list', { name: 'Specialist agents' })
      const items = within(specialistList).getAllByRole('listitem')
      const states = items.map((item) => item.getAttribute('data-state'))
      unmount()
      return states
    }
    // M05 entry: Policy completed, Workflow + Finance still working.
    expect(observe(120)).toEqual(['completed', 'completed', 'working', 'working'])
    // M06 entry: Workflow completed, Finance still working.
    expect(observe(150)).toEqual(['completed', 'completed', 'completed', 'working'])
    // M07 entry: Finance completed → investigation output synchronized.
    expect(observe(180)).toEqual(['completed', 'completed', 'completed', 'completed'])
  })

  it('clears the investigation-wave attribute after M04 completes', () => {
    let s = transitionRuntimeState(createInitialRuntimeState('auto'), {
      type: 'START',
    })
    s = transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds: 120 })
    const { container } = renderPanel(s)
    const commander = screen.getByLabelText('Case Commander')
    expect(commander.getAttribute('data-phase')).toBeNull()
    const rail = container.querySelector('[data-testid="agent-connector-rail"]')
    const railSpans = Array.from(rail?.children ?? []) as HTMLElement[]
    railSpans.forEach((span) => {
      expect(span.getAttribute('data-wave')).toBeNull()
    })
  })
})
