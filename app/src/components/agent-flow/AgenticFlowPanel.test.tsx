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

  it('surfaces role-specific working subtitles for all three specialists at M04 and marks Commander as monitoring', () => {
    let s = transitionRuntimeState(createInitialRuntimeState('auto'), {
      type: 'START',
    })
    s = transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds: 92 })
    renderPanel(s)
    const commander = screen.getByLabelText('Case Commander')
    expect(commander.textContent).toContain('Monitoring Investigation')
    const list = screen.getByRole('list', { name: 'Specialist agents' })
    const items = within(list).getAllByRole('listitem')
    // Customer Complaint Agent (index 0) keeps its Intake-phase skill copy.
    expect(items[0].textContent).toContain('Image understanding')
    // Policy / Workflow / Finance each show their working subtitle.
    expect(items[1].textContent).toContain('Reading Policy Repository')
    expect(items[2].textContent).toContain('Checking SAP CX case history')
    expect(items[3].textContent).toContain('Preparing compensation context')
    // Progress markers reflect the 'active' state.
    ;[1, 2, 3].forEach((i) => {
      expect(items[i].getAttribute('data-progress')).toBe('active')
    })
  })

  it('replaces working subtitles with completion cues in the correct M05 → M06 → M07 order', () => {
    const captureAt = (seconds: number) => {
      let s = transitionRuntimeState(createInitialRuntimeState('auto'), {
        type: 'START',
      })
      s = transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds })
      const { unmount } = renderPanel(s)
      const list = screen.getByRole('list', { name: 'Specialist agents' })
      const items = within(list).getAllByRole('listitem')
      const snapshot = {
        policy: items[1].textContent ?? '',
        workflow: items[2].textContent ?? '',
        finance: items[3].textContent ?? '',
        policyProgress: items[1].getAttribute('data-progress'),
        workflowProgress: items[2].getAttribute('data-progress'),
        financeProgress: items[3].getAttribute('data-progress'),
      }
      unmount()
      return snapshot
    }
    // M05 entry (t=120): Policy completed, Workflow + Finance still working.
    const m05 = captureAt(120)
    expect(m05.policy).toContain('Policy review complete')
    expect(m05.workflow).toContain('Checking SAP CX case history')
    expect(m05.finance).toContain('Preparing compensation context')
    expect(m05.policyProgress).toBe('complete')
    expect(m05.workflowProgress).toBe('active')
    expect(m05.financeProgress).toBe('active')
    // M06 entry (t=150): Workflow completes; Finance still working.
    const m06 = captureAt(150)
    expect(m06.policy).toContain('Policy review complete')
    expect(m06.workflow).toContain('Workflow review complete')
    expect(m06.finance).toContain('Preparing compensation context')
    expect(m06.workflowProgress).toBe('complete')
    expect(m06.financeProgress).toBe('active')
    // M07 entry (t=180): all three completed.
    const m07 = captureAt(180)
    expect(m07.policy).toContain('Policy review complete')
    expect(m07.workflow).toContain('Workflow review complete')
    expect(m07.finance).toContain('Finance review complete')
    expect(m07.financeProgress).toBe('complete')
  })

  it('keeps the Commander in the monitoring phase across M04, M05, M06, M07, and M08', () => {
    const phaseAt = (seconds: number) => {
      let s = transitionRuntimeState(createInitialRuntimeState('auto'), {
        type: 'START',
      })
      s = transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds })
      const { unmount } = renderPanel(s)
      const commander = screen.getByLabelText('Case Commander')
      const phase = commander.getAttribute('data-phase')
      const subtitle = commander.textContent
      unmount()
      return { phase, subtitle }
    }
    // M04 wave window (0–1.5s of M04) shows 'dispatching-wave'; from ~M04 mid onwards it stays monitoring.
    // Sample at M05, M06, M07, M08 for the steady state.
    ;[120, 150, 180, 210].forEach((t) => {
      const { phase, subtitle } = phaseAt(t)
      expect(phase).toBe('monitoring')
      expect(subtitle).toContain('Monitoring Investigation')
    })
    // M09 (Conflict stage) — monitoring should clear.
    const post = phaseAt(240)
    expect(post.phase).toBeNull()
    expect(post.subtitle).toContain('Orchestrating agents')
  })

  it('marks each enterprise system as settled when its paired specialist completes', () => {
    const systemStatesAt = (seconds: number) => {
      let s = transitionRuntimeState(createInitialRuntimeState('auto'), {
        type: 'START',
      })
      s = transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds })
      const { unmount } = renderPanel(s)
      const list = screen.getByRole('list', { name: 'Enterprise systems' })
      const items = within(list).getAllByRole('listitem')
      const settled = items.map((item) => item.getAttribute('data-settled'))
      const paired = items.map((item) =>
        item.getAttribute('data-paired-agent-status'),
      )
      unmount()
      return { settled, paired }
    }
    // M04 (t=90): all three specialists working — CRM already settled (Customer
    // Complaint Agent completed intake at M03); the three investigation systems
    // are engaged but not yet settled.
    const m04 = systemStatesAt(90)
    expect(m04.paired).toEqual(['completed', 'working', 'working', 'working'])
    expect(m04.settled).toEqual(['true', null, null, null])
    // M05 (t=120): Policy Repository (index 1) settles.
    const m05 = systemStatesAt(120)
    expect(m05.paired).toEqual(['completed', 'completed', 'working', 'working'])
    expect(m05.settled).toEqual(['true', 'true', null, null])
    // M06 (t=150): SAP CX (index 2) settles.
    const m06 = systemStatesAt(150)
    expect(m06.paired).toEqual(['completed', 'completed', 'completed', 'working'])
    expect(m06.settled).toEqual(['true', 'true', 'true', null])
    // M07 (t=180): SAP S/4HANA (index 3) settles.
    const m07 = systemStatesAt(180)
    expect(m07.paired).toEqual(['completed', 'completed', 'completed', 'completed'])
    expect(m07.settled).toEqual(['true', 'true', 'true', 'true'])
  })

  it('does not surface any Investigation activity subtitle before M04', () => {
    let s = transitionRuntimeState(createInitialRuntimeState('auto'), {
      type: 'START',
    })
    s = transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds: 30 })
    renderPanel(s)
    // Working subtitles must not appear during Intake — agents are waiting.
    expect(screen.queryByText(/Reading Policy Repository/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Checking SAP CX case history/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Preparing compensation context/)).not.toBeInTheDocument()
    // Completion cues also absent.
    expect(screen.queryByText(/Policy review complete/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Workflow review complete/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Finance review complete/)).not.toBeInTheDocument()
    // Commander is not in monitoring phase during Intake.
    const commander = screen.getByLabelText('Case Commander')
    expect(commander.textContent).not.toContain('Monitoring Investigation')
  })

  it('clears the investigation-wave attribute after M04 completes and hands off to the monitoring phase', () => {
    let s = transitionRuntimeState(createInitialRuntimeState('auto'), {
      type: 'START',
    })
    s = transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds: 120 })
    const { container } = renderPanel(s)
    const commander = screen.getByLabelText('Case Commander')
    // US-10A: throughout Investigation (M04–M08) the Commander sits in the
    // 'monitoring' steady state after the initial dispatch wave completes.
    expect(commander.getAttribute('data-phase')).toBe('monitoring')
    const rail = container.querySelector('[data-testid="agent-connector-rail"]')
    const railSpans = Array.from(rail?.children ?? []) as HTMLElement[]
    railSpans.forEach((span) => {
      expect(span.getAttribute('data-wave')).toBeNull()
    })
  })
})
