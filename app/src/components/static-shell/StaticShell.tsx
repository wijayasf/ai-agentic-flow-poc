import complaint from '@fixtures/complaints/complaint-leakage-001.json'
import customer from '@fixtures/customers/customer-rina-putri.json'
import type {
  AgentId,
  SystemId,
} from '../../domain/runtime-fixtures/types'
import type {
  ArtifactPresentation,
  RuntimeState,
  RuntimeViewModel,
} from '../../domain/runtime'
import type { RuntimeControllerActions } from '../../runtime'
import styles from './StaticShell.module.css'

type Tone = 'blue' | 'green' | 'violet' | 'orange' | 'red' | 'amber'

interface StaticShellProps {
  readonly state: RuntimeState
  readonly viewModel: RuntimeViewModel
  readonly actions: RuntimeControllerActions
}

const agents: ReadonlyArray<{
  id: AgentId
  name: string
  glyph: string
  skill: string
  tone: Tone
}> = [
  {
    id: 'agent-customer-complaint',
    name: 'Customer Complaint Agent',
    glyph: 'C',
    skill: 'Image understanding',
    tone: 'green',
  },
  {
    id: 'agent-policy',
    name: 'Policy Agent',
    glyph: 'P',
    skill: 'Policy retrieval',
    tone: 'violet',
  },
  {
    id: 'agent-workflow',
    name: 'Workflow Agent',
    glyph: 'W',
    skill: 'SAP CX investigation',
    tone: 'blue',
  },
  {
    id: 'agent-finance',
    name: 'Finance Agent',
    glyph: 'F',
    skill: 'Financial calculation',
    tone: 'orange',
  },
]

const systems: ReadonlyArray<{
  id: SystemId
  name: string
  glyph: string
  tone: Tone
}> = [
  { id: 'system-crm', name: 'CRM', glyph: 'CRM', tone: 'green' },
  {
    id: 'system-policy-repository',
    name: 'Policy Repository',
    glyph: 'PR',
    tone: 'violet',
  },
  { id: 'system-sap-cx', name: 'SAP CX', glyph: 'CX', tone: 'blue' },
  {
    id: 'system-sap-s4hana',
    name: 'SAP S/4HANA',
    glyph: 'S4',
    tone: 'orange',
  },
]

const artifactTones: readonly Tone[] = ['blue', 'red', 'green', 'violet']

function Glyph({ glyph, tone }: { glyph: string; tone: Tone }) {
  return (
    <span className={styles.glyph} data-tone={tone} aria-hidden="true">
      {glyph}
    </span>
  )
}

function PanelHeading({
  id,
  glyph,
  children,
}: {
  id: string
  glyph: string
  children: string
}) {
  return (
    <h2 className={styles.panelHeading} id={id}>
      <span className={styles.panelGlyph} aria-hidden="true">
        {glyph}
      </span>
      {children}
    </h2>
  )
}

function DemoHeader({ viewModel }: { viewModel: RuntimeViewModel }) {
  const { timer } = viewModel
  return (
    <header className={styles.header}>
      <div className={styles.brandGroup}>
        <span className={styles.brandMark} aria-hidden="true">
          {Array.from({ length: 9 }, (_, index) => (
            <span key={index} />
          ))}
        </span>
        <h1>AI Agentic Flow</h1>
        <span className={styles.headerDivider} aria-hidden="true" />
        <p>AI-Powered Complaint Resolution Demo</p>
      </div>
      <div
        className={styles.timerVisual}
        aria-label={`Demo time ${timer.elapsedText} of ${timer.totalText}`}
      >
        <span className={styles.timerClock} aria-hidden="true" />
        <span>Demo Time</span>
        <time dateTime={`PT${timer.elapsedSeconds}S`}>{timer.elapsedText}</time>
        <span aria-hidden="true">/</span>
        <span>{timer.totalText}</span>
      </div>
    </header>
  )
}

function AttachmentPlaceholder({ type }: { type: 'image' | 'document' }) {
  return (
    <span className={styles.attachmentVisual} data-type={type} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  )
}

function CustomerExperiencePanel() {
  return (
    <section
      className={`${styles.panel} ${styles.customerPanel}`}
      aria-labelledby="customer-experience-heading"
    >
      <PanelHeading id="customer-experience-heading" glyph="C">
        Customer Experience
      </PanelHeading>

      <article className={styles.customerCard} aria-label="Customer complaint">
        <div className={styles.customerIdentity}>
          <span className={styles.avatarPlaceholder} aria-hidden="true">
            RP
          </span>
          <strong>{customer.name}</strong>
          <time dateTime={complaint.createdAt}>09:15 AM</time>
        </div>
        <p className={styles.customerMessage}>{complaint.message}</p>
        <fieldset className={styles.attachments}>
          <legend>Attachments ({complaint.attachments.length})</legend>
          <div className={styles.attachmentGrid}>
            {complaint.attachments.map((attachment) => (
              <article className={styles.attachmentCard} key={attachment.id}>
                <AttachmentPlaceholder
                  type={attachment.type as 'image' | 'document'}
                />
                <strong>{attachment.name}</strong>
                <span>.{attachment.extension}</span>
              </article>
            ))}
          </div>
        </fieldset>
      </article>

      <article className={styles.officerCard} aria-labelledby="officer-heading">
        <div className={styles.officerHeader}>
          <Glyph glyph="AI" tone="blue" />
          <strong id="officer-heading">AI Resolution Officer</strong>
          <time dateTime="09:16:00">09:16 AM</time>
        </div>
        <p>
          Thank you, Rina. I’ve received your complaint and attachments. I’m
          reviewing with the right systems and experts. I’ll keep you updated
          daily until this is resolved.
        </p>
        <span className={styles.verifiedMark} aria-label="Verified response">
          ✓
        </span>
      </article>

      <div className={styles.statusChips} aria-label="Customer service commitments">
        <span className={styles.dangerChip}>
          <span aria-hidden="true">!</span> High Priority
        </span>
        <span className={styles.warningChip}>
          <span aria-hidden="true">D</span> Daily Update Promise
        </span>
      </div>
    </section>
  )
}

function StageStepper({ viewModel }: { viewModel: RuntimeViewModel }) {
  return (
    <nav className={styles.stageStepper} aria-label="Complaint resolution stages">
      <ol>
        {viewModel.stages.map(({ stage, state }, index) => (
          <li
            className={
              state === 'current'
                ? styles.activeStage
                : state === 'completed'
                  ? styles.completedStage
                  : undefined
            }
            data-state={state}
            key={stage}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span>{state === 'completed' ? '✓' : index + 1}</span>
            <strong>{stage}</strong>
          </li>
        ))}
      </ol>
    </nav>
  )
}

function agentPresentationState(
  state: RuntimeState,
  agentId: AgentId,
): 'inactive' | 'active' | 'failed' | 'recovering' | 'recovered' {
  if (!state.activeAgentIds.includes(agentId)) return 'inactive'
  if (agentId !== 'agent-finance') return 'active'
  if (state.playbackStatus === 'failed') return 'failed'
  if (state.playbackStatus === 'recovering') return 'recovering'
  if (state.failureStatus === 'recovered') return 'recovered'
  return 'active'
}

function AgentGrid({ state }: { state: RuntimeState }) {
  return (
    <ul className={styles.agentGrid} aria-label="Specialist agents">
      {agents.map((agent) => {
        const presentationState = agentPresentationState(state, agent.id)
        return (
          <li
            className={styles.agentCard}
            data-state={presentationState}
            key={agent.id}
            aria-label={`${agent.name}, ${presentationState}`}
          >
            <Glyph glyph={agent.glyph} tone={agent.tone} />
            <strong>{agent.name}</strong>
            <span>Active Skill</span>
            <small data-tone={agent.tone}>
              {agent.skill} <i aria-hidden="true" />
            </small>
          </li>
        )
      })}
    </ul>
  )
}

function systemPresentationState(
  state: RuntimeState,
  systemId: SystemId,
): 'inactive' | 'engaged' | 'failed' | 'recovering' | 'resolved' {
  if (!state.activeSystemIds.includes(systemId)) return 'inactive'
  if (systemId !== 'system-sap-s4hana') return 'engaged'
  if (state.playbackStatus === 'failed') return 'failed'
  if (state.playbackStatus === 'recovering') return 'recovering'
  if (state.failureStatus === 'recovered') return 'resolved'
  return 'engaged'
}

function SystemGrid({ state }: { state: RuntimeState }) {
  return (
    <ul className={styles.systemGrid} aria-label="Enterprise systems">
      {systems.map((system) => {
        const presentationState = systemPresentationState(state, system.id)
        return (
          <li
            className={styles.systemCard}
            data-state={presentationState}
            key={system.id}
            aria-label={`${system.name}, ${presentationState}`}
          >
            <span
              className={styles.systemPlaceholder}
              data-tone={system.tone}
              aria-hidden="true"
            >
              {system.glyph}
            </span>
            <strong>{system.name}</strong>
          </li>
        )
      })}
    </ul>
  )
}

function ConflictStatus({ state }: { state: RuntimeState }) {
  const isNeutral = state.conflictStatus === 'neutral'
  const isResolved = state.conflictStatus === 'resolved'
  return (
    <div
      className={styles.conflictBanner}
      data-state={state.conflictStatus}
      role="status"
    >
      <span aria-hidden="true">{isNeutral ? '–' : isResolved ? '✓' : '!'}</span>
      <p>
        {isNeutral ? (
          <>Conflict status will appear as evidence is reconciled.</>
        ) : isResolved ? (
          <>
            <strong>Conflict resolved:</strong> Customer evidence and SAP CX
            resolution status are reconciled.
          </>
        ) : (
          <>
            <strong>Conflict detected:</strong> SAP CX shows Completed, but
            customer evidence shows unresolved leakage.
          </>
        )}
      </p>
    </div>
  )
}

function ActivityTraceTable({ viewModel }: { viewModel: RuntimeViewModel }) {
  return (
    <div
      className={styles.traceViewport}
      tabIndex={0}
      role="region"
      aria-label="Activity trace"
    >
      <table>
        <caption className={styles.visuallyHidden}>
          Visible deterministic activity trace events
        </caption>
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Agent</th>
            <th scope="col">Action</th>
            <th scope="col">Skill</th>
            <th scope="col">Output</th>
          </tr>
        </thead>
        <tbody>
          {viewModel.visibleEvents.map((event) => {
            const eventTone =
              agents.find((agent) => agent.name === event.agent)?.tone ?? 'blue'
            return (
              <tr key={event.id} data-event-id={event.id}>
                <td aria-label={event.time} title={event.time}>
                  {event.time}
                </td>
                <td aria-label={event.agent} title={event.agent}>
                  <span
                    className={styles.traceDot}
                    data-tone={eventTone}
                    aria-hidden="true"
                  />
                  {event.agent}
                </td>
                <td aria-label={event.action} title={event.action}>
                  {event.action}
                </td>
                <td
                  aria-label={event.skill}
                  data-tone={eventTone}
                  title={event.skill}
                >
                  {event.skill}
                </td>
                <td aria-label={event.output} title={event.output}>
                  {event.output}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function AgenticFlowPanel({
  state,
  viewModel,
}: {
  state: RuntimeState
  viewModel: RuntimeViewModel
}) {
  return (
    <section
      className={`${styles.panel} ${styles.flowPanel}`}
      aria-labelledby="agentic-flow-heading"
    >
      <PanelHeading id="agentic-flow-heading" glyph="F">
        Agentic Flow
      </PanelHeading>
      <StageStepper viewModel={viewModel} />
      <article className={styles.commanderCard} aria-label="Case Commander">
        <Glyph glyph="CC" tone="blue" />
        <div>
          <strong>Case Commander</strong>
          <span>Orchestrating agents and resolving conflicts</span>
        </div>
      </article>
      <div className={styles.connectorRail} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <AgentGrid state={state} />
      <div className={styles.systemConnectors} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <SystemGrid state={state} />
      <ConflictStatus state={state} />
      <ActivityTraceTable viewModel={viewModel} />
    </section>
  )
}

function MetricGrid({ viewModel }: { viewModel: RuntimeViewModel }) {
  const currentStageIndex = viewModel.stages.findIndex(
    (stage) => stage.state === 'current',
  )
  const metrics = [
    {
      label: 'Current Stage',
      value: String(currentStageIndex + 1),
      suffix: '/ 5',
      status: viewModel.currentStage ?? 'Idle',
      glyph: 'S',
      tone: 'blue' as const,
    },
    {
      label: 'Active Agents',
      value: String(viewModel.activeAgentCount),
      suffix: 'of 4',
      status: viewModel.activeAgentCount === 4 ? 'All Active' : 'Active',
      glyph: 'A',
      tone: 'green' as const,
    },
    {
      label: 'Tool Activity',
      value: String(viewModel.toolActivity),
      suffix: '',
      status: 'Events',
      glyph: 'T',
      tone: 'violet' as const,
    },
    {
      label: 'Artifacts Produced',
      value: String(viewModel.artifactsProduced),
      suffix: '',
      status: 'Artifacts',
      glyph: 'D',
      tone: 'orange' as const,
    },
  ]

  return (
    <ul className={styles.metricGrid} aria-label="Trust and observability metrics">
      {metrics.map((metric) => (
        <li className={styles.metricCard} key={metric.label}>
          <Glyph glyph={metric.glyph} tone={metric.tone} />
          <div>
            <span>{metric.label}</span>
            <strong>
              {metric.value} <small>{metric.suffix}</small>
            </strong>
            <em data-tone={metric.tone}>{metric.status}</em>
          </div>
        </li>
      ))}
    </ul>
  )
}

function artifactTrailingGlyph(status: ArtifactPresentation['status']) {
  switch (status) {
    case 'locked':
      return '⌑'
    case 'pending':
      return '◷'
    case 'approved':
      return '✓'
    case 'available':
      return '›'
    default:
      return status satisfies never
  }
}

function ArtifactList({ viewModel }: { viewModel: RuntimeViewModel }) {
  return (
    <section className={styles.artifactSection} aria-labelledby="artifacts-heading">
      <h3 id="artifacts-heading">Key Artifacts</h3>
      <ol>
        {viewModel.artifacts.map((artifact, index) => (
          <li
            key={artifact.id}
            data-state={artifact.status}
            aria-label={`${artifact.order}. ${artifact.name}, ${artifact.status}`}
          >
            <Glyph glyph={String(index + 1)} tone={artifactTones[index]} />
            <span>
              {artifact.order}. {artifact.name}
            </span>
            <span aria-hidden="true">{artifactTrailingGlyph(artifact.status)}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function ContextStatusCard({
  state,
  viewModel,
  actions,
}: StaticShellProps) {
  const { context } = viewModel
  let tone: 'neutral' | 'warning' | 'danger' | 'success' = 'neutral'
  let glyph = '⌑'
  let heading = 'Recommendation locked'
  let copy = 'Recommendation becomes available after deterministic resolution.'

  if (state.playbackStatus === 'waiting_failure_injection') {
    tone = 'success'
    glyph = '✓'
    heading = viewModel.currentMoment?.title ?? 'Failure injection ready'
    copy = viewModel.currentMoment?.description ?? ''
  } else if (context.type === 'approval') {
    tone = 'warning'
    glyph = '◷'
    heading = 'Approval required'
    copy = context.copy
  } else if (context.type === 'failure') {
    tone = 'danger'
    glyph = '!'
    heading = 'Finance posting failed'
    copy = context.copy
  } else if (context.type === 'recovery') {
    tone = 'warning'
    glyph = '↻'
    heading = 'Recovery in progress'
    copy = context.copy
  } else if (context.type === 'recovered') {
    tone = 'success'
    glyph = '✓'
    heading = 'Recovery complete'
    copy = context.copy
  } else if (context.type === 'recommendation') {
    tone = 'success'
    glyph = '✓'
    heading = 'Recommendation'
    copy = context.copy
  } else if (state.approvalStatus === 'approved') {
    tone = 'success'
    glyph = '✓'
    heading = 'Resolution package approved'
    copy = 'The approved package is ready for deterministic finance posting.'
  }

  return (
    <article
      className={styles.contextCard}
      data-tone={tone}
      role={context.type === 'failure' ? 'alert' : 'status'}
      aria-labelledby="context-status-heading"
    >
      <span className={styles.contextIcon} aria-hidden="true">
        {glyph}
      </span>
      <div>
        <h3 id="context-status-heading">{heading}</h3>
        <p>{copy}</p>
        {context.type === 'approval' ? (
          <button
            className={styles.approveButton}
            type="button"
            onClick={actions.approve}
            disabled={!viewModel.controls.canApprove}
            autoFocus
          >
            Approve
          </button>
        ) : null}
      </div>
    </article>
  )
}

function TrustObservabilityPanel(props: StaticShellProps) {
  return (
    <section
      className={`${styles.panel} ${styles.trustPanel}`}
      aria-labelledby="trust-heading"
    >
      <PanelHeading id="trust-heading" glyph="T">
        Trust &amp; Observability
      </PanelHeading>
      <MetricGrid viewModel={props.viewModel} />
      <ArtifactList viewModel={props.viewModel} />
      <ContextStatusCard {...props} />
    </section>
  )
}

const playbackControls = [
  { label: 'Start', glyph: '▶', variant: 'primary', key: 'start' },
  { label: 'Pause', glyph: 'Ⅱ', variant: 'neutral', key: 'pause' },
  { label: 'Resume', glyph: '▶', variant: 'neutral', key: 'resume' },
  {
    label: 'Next Moment',
    glyph: '▶|',
    variant: 'neutral',
    key: 'nextMoment',
  },
  { label: 'Restart', glyph: '↻', variant: 'neutral', key: 'restart' },
  {
    label: 'Inject Failure',
    glyph: '!',
    variant: 'danger',
    key: 'injectFailure',
  },
] as const

function PlaybackControls({
  state,
  viewModel,
  actions,
}: StaticShellProps) {
  const availability = {
    start: viewModel.controls.canStart,
    pause: viewModel.controls.canPause,
    resume: viewModel.controls.canResume,
    nextMoment: viewModel.controls.canNextMoment,
    restart: viewModel.controls.canRestart,
    injectFailure: viewModel.controls.canInjectFailure,
  }
  const handlers = {
    start: actions.start,
    pause: actions.pause,
    resume: actions.resume,
    nextMoment: actions.nextMoment,
    restart: actions.restart,
    injectFailure: actions.injectFailure,
  }

  return (
    <footer className={styles.playbackBar} aria-labelledby="playback-heading">
      <div className={styles.playbackLabel}>
        <span aria-hidden="true">▶</span>
        <h2 id="playback-heading">Demo Playback Controls</h2>
      </div>
      <div className={styles.transportGroup} aria-label="Playback controls">
        {playbackControls.map((control) => (
          <button
            className={styles[`${control.variant}Button`]}
            type="button"
            disabled={!availability[control.key]}
            onClick={handlers[control.key]}
            key={control.label}
          >
            <span aria-hidden="true">{control.glyph}</span>
            {control.label}
          </button>
        ))}
      </div>
      <span className={styles.playbackDivider} aria-hidden="true" />
      <div className={styles.modeGroup} aria-label="Playback mode selection">
        <button
          className={`${styles.presenterModeButton} ${
            state.mode === 'presenter' ? styles.selectedMode : ''
          }`}
          type="button"
          aria-pressed={state.mode === 'presenter'}
          disabled={!viewModel.controls.canSelectPresenter}
          onClick={() => actions.selectMode('presenter')}
        >
          <span aria-hidden="true">P</span>
          Presenter Mode
        </button>
        <button
          className={`${styles.autoModeButton} ${
            state.mode === 'auto' ? styles.selectedMode : ''
          }`}
          type="button"
          aria-pressed={state.mode === 'auto'}
          disabled={!viewModel.controls.canSelectAuto}
          onClick={() => actions.selectMode('auto')}
        >
          <span aria-hidden="true">A</span>
          Auto Mode
        </button>
      </div>
    </footer>
  )
}

export function StaticShell(props: StaticShellProps) {
  return (
    <main className={styles.viewport} data-playback-status={props.state.playbackStatus}>
      <div className={styles.scaleFrame}>
        <div
          className={styles.surface}
          data-composition="runtime-progressive"
          data-testid="canonical-design-surface"
        >
          <DemoHeader viewModel={props.viewModel} />
          <div className={styles.workspace}>
            <CustomerExperiencePanel />
            <AgenticFlowPanel state={props.state} viewModel={props.viewModel} />
            <TrustObservabilityPanel {...props} />
          </div>
          <PlaybackControls {...props} />
        </div>
      </div>
    </main>
  )
}
