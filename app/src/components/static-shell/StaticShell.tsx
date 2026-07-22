import complaint from '@fixtures/complaints/complaint-leakage-001.json'
import customer from '@fixtures/customers/customer-rina-putri.json'
import { storyAssets } from '../../assets/story'
import type { StoryAttachmentId } from '../../assets/story'
import { Icon } from '../icon/Icon'
import type { IconName } from '../icon/Icon'
import type {
  AgentId,
  SystemId,
} from '../../domain/runtime-fixtures/types'
import type {
  AgentLifecycleStatus,
  ArtifactPresentation,
  RuntimeState,
  RuntimeViewModel,
} from '../../domain/runtime'
import type { RuntimeControllerActions } from '../../runtime'
import styles from './StaticShell.module.css'

type Tone = 'blue' | 'green' | 'violet' | 'orange' | 'red' | 'amber'

export interface StaticShellProps {
  readonly state: RuntimeState
  readonly viewModel: RuntimeViewModel
  readonly actions: RuntimeControllerActions
  readonly canvasScale?: number
  readonly embedded?: boolean
}

export const DESIGN_SURFACE_WIDTH = 1672
export const DESIGN_SURFACE_HEIGHT = 941

const agents: ReadonlyArray<{
  id: AgentId
  name: string
  icon: IconName
  skill: string
  tone: Tone
}> = [
  {
    id: 'agent-customer-complaint',
    name: 'Customer Complaint Agent',
    icon: 'message',
    skill: 'Image understanding',
    tone: 'green',
  },
  {
    id: 'agent-policy',
    name: 'Policy Agent',
    icon: 'policy',
    skill: 'Policy retrieval',
    tone: 'violet',
  },
  {
    id: 'agent-workflow',
    name: 'Workflow Agent',
    icon: 'search',
    skill: 'SAP CX investigation',
    tone: 'blue',
  },
  {
    id: 'agent-finance',
    name: 'Finance Agent',
    icon: 'calculator',
    skill: 'Financial calculation',
    tone: 'orange',
  },
]

const systems: ReadonlyArray<{
  id: SystemId
  name: string
  icon: IconName
  tone: Tone
}> = [
  { id: 'system-crm', name: 'CRM', icon: 'database', tone: 'green' },
  {
    id: 'system-policy-repository',
    name: 'Policy Repository',
    icon: 'policy',
    tone: 'violet',
  },
  { id: 'system-sap-cx', name: 'SAP CX', icon: 'system', tone: 'blue' },
  {
    id: 'system-sap-s4hana',
    name: 'SAP S/4HANA',
    icon: 'database',
    tone: 'orange',
  },
]

const artifactTones: readonly Tone[] = ['blue', 'red', 'green', 'violet']
const artifactIcons: readonly IconName[] = [
  'artifact',
  'alert',
  'approval',
  'shield',
]

function IconBadge({ icon, tone }: { icon: IconName; tone: Tone }) {
  return (
    <span className={styles.glyph} data-tone={tone} aria-hidden="true">
      <Icon name={icon} size={21} />
    </span>
  )
}

function PanelHeading({
  id,
  icon,
  children,
}: {
  id: string
  icon: IconName
  children: string
}) {
  return (
    <h2 className={styles.panelHeading} id={id}>
      <span className={styles.panelGlyph} aria-hidden="true">
        <Icon name={icon} size={18} />
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
          <Icon name="flow" size={31} strokeWidth={1.7} />
        </span>
        <h1>AI Agentic Flow</h1>
        <span className={styles.headerDivider} aria-hidden="true" />
        <p>AI-Powered Complaint Resolution Demo</p>
      </div>
      <div
        className={styles.timerVisual}
        aria-label={`Demo time ${timer.elapsedText} of ${timer.totalText}`}
      >
        <Icon name="clock" size={19} aria-hidden="true" />
        <span>Demo Time</span>
        <time dateTime={`PT${timer.elapsedSeconds}S`}>{timer.elapsedText}</time>
        <span aria-hidden="true">/</span>
        <span>{timer.totalText}</span>
      </div>
    </header>
  )
}

function AttachmentPreview({ attachmentId }: { attachmentId: StoryAttachmentId }) {
  const asset = storyAssets.attachments[attachmentId]
  return (
    <span className={styles.attachmentVisual}>
      <img alt={asset.alt} height="640" src={asset.src} width="640" />
      <span className={styles.fileTypeIcon} aria-hidden="true">
        <Icon name={asset.icon} size={14} />
      </span>
    </span>
  )
}

function TypingIndicator({
  label,
  tone,
}: {
  readonly label: string
  readonly tone: 'customer' | 'ai'
}) {
  return (
    <div
      className={styles.typingIndicator}
      data-tone={tone}
      role="status"
      aria-label={label}
    >
      <Icon name={tone === 'customer' ? 'message' : 'bot'} size={18} />
      <span className={styles.typingDots} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>{label}</span>
    </div>
  )
}

function IdleDemoFraming() {
  return (
    <article className={styles.idleDemoCard} aria-labelledby="demo-ready-heading">
      <span className={styles.idleDemoIcon} aria-hidden="true">
        <Icon name="flow" size={30} />
      </span>
      <p className={styles.idleEyebrow}>Guided enterprise simulation</p>
      <h3 id="demo-ready-heading">See AI collaboration unfold step by step</h3>
      <p className={styles.idleDescription}>
        This guided demo shows how multiple AI agents collaborate to investigate a
        customer complaint, validate evidence, detect conflicts, and prepare a
        recommendation for human approval.
      </p>
      <div className={styles.readyStatus} role="status">
        <span aria-hidden="true"><Icon name="check" size={15} /></span>
        <strong>Demo is ready. Press Start to begin.</strong>
      </div>
    </article>
  )
}

function CustomerExperiencePanel({
  viewModel,
}: {
  readonly viewModel: RuntimeViewModel
}) {
  const { earlyStory } = viewModel
  const visibleAttachments = complaint.attachments.slice(
    0,
    earlyStory.visibleAttachmentCount,
  )

  return (
    <section
      className={`${styles.panel} ${styles.customerPanel}`}
      data-focus={
        viewModel.focusTarget === null
          ? undefined
          : viewModel.focusTarget === 'customer-panel'
            ? 'primary'
            : 'secondary'
      }
      aria-labelledby="customer-experience-heading"
    >
      <PanelHeading id="customer-experience-heading" icon="user">
        Customer Experience
      </PanelHeading>

      {earlyStory.isIdle ? <IdleDemoFraming /> : null}

      {earlyStory.showCustomerTyping ? (
        <div className={styles.customerTypingPosition}>
          <TypingIndicator label="Customer is typing" tone="customer" />
        </div>
      ) : null}

      {earlyStory.showCustomerIdentity ? (
        <article
          className={`${styles.customerCard} ${styles.storyReveal}`}
          aria-label="Customer complaint"
        >
          <div className={styles.customerIdentity}>
            <img
              alt={storyAssets.customerAvatar.alt}
              className={styles.customerAvatar}
              height="640"
              src={storyAssets.customerAvatar.src}
              width="640"
            />
            <strong>{customer.name}</strong>
            <time dateTime={complaint.createdAt}>09:15 AM</time>
          </div>
          {earlyStory.showCustomerMessage ? (
            <p className={`${styles.customerMessage} ${styles.storyReveal}`}>
              {complaint.message}
            </p>
          ) : null}
          {visibleAttachments.length > 0 ? (
            <fieldset className={`${styles.attachments} ${styles.storyReveal}`}>
              <legend>
                Attachments ({visibleAttachments.length} of {complaint.attachments.length})
              </legend>
              <div className={styles.attachmentGrid}>
                {visibleAttachments.map((attachment) => (
                  <article
                    className={`${styles.attachmentCard} ${styles.storyReveal}`}
                    key={attachment.id}
                  >
                    <AttachmentPreview
                      attachmentId={attachment.id as StoryAttachmentId}
                    />
                    <strong>{attachment.name}</strong>
                    <span>.{attachment.extension}</span>
                  </article>
                ))}
              </div>
            </fieldset>
          ) : null}
        </article>
      ) : null}

      {earlyStory.showAiTyping ? (
        <div className={styles.officerTypingPosition}>
          <TypingIndicator label="AI Resolution Officer is typing" tone="ai" />
        </div>
      ) : null}

      {earlyStory.showAiAcknowledgement ? (
        <article
          className={`${styles.officerCard} ${styles.storyReveal}`}
          aria-labelledby="officer-heading"
        >
          <div className={styles.officerHeader}>
            <IconBadge icon="bot" tone="blue" />
            <strong id="officer-heading">AI Resolution Officer</strong>
            <time dateTime="09:16:00">09:16 AM</time>
          </div>
          <p>
            Thank you, Rina. I’ve received your complaint and attachments. I’m
            reviewing with the right systems and experts. I’ll keep you updated
            daily until this is resolved.
          </p>
          <span className={styles.verifiedMark} aria-label="Verified response">
            <Icon name="check" size={12} aria-hidden="true" />
          </span>
        </article>
      ) : null}

      {earlyStory.showCustomerMessage ? (
        <div
          className={`${styles.statusChips} ${styles.storyReveal}`}
          aria-label="Customer service commitments"
        >
          <span className={styles.dangerChip}>
            <span aria-hidden="true"><Icon name="alert" size={14} /></span> High Priority
          </span>
          <span className={styles.warningChip}>
            <span aria-hidden="true"><Icon name="clock" size={14} /></span> Daily Update Promise
          </span>
        </div>
      ) : null}
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
            <span>
              {state === 'completed' ? (
                <Icon name="check" size={13} aria-hidden="true" />
              ) : (
                index + 1
              )}
            </span>
            <strong>{stage}</strong>
          </li>
        ))}
      </ol>
    </nav>
  )
}

function NowNext({ viewModel }: { readonly viewModel: RuntimeViewModel }) {
  return (
    <dl className={styles.nowNext} aria-label="Current and next workflow actions">
      <div>
        <dt>Now</dt>
        <dd>{viewModel.nowNext.now}</dd>
      </div>
      <div>
        <dt>Next</dt>
        <dd>{viewModel.nowNext.next ?? 'No further action'}</dd>
      </div>
    </dl>
  )
}

const lifecycleLabels: Readonly<Record<AgentLifecycleStatus, string>> = {
  waiting: 'Waiting',
  working: 'Working',
  needs_review: 'Needs Review',
  completed: 'Completed',
  blocked: 'Blocked',
}

function lifecycleIcon(status: AgentLifecycleStatus): IconName {
  switch (status) {
    case 'waiting':
      return 'clock'
    case 'working':
      return 'activity'
    case 'needs_review':
      return 'approval'
    case 'completed':
      return 'check'
    case 'blocked':
      return 'alert'
    default:
      return status satisfies never
  }
}

function AgentGrid({
  viewModel,
}: {
  readonly viewModel: RuntimeViewModel
}) {
  return (
    <ul className={styles.agentGrid} aria-label="Specialist agents">
      {agents.map((agent) => {
        const presentationState = viewModel.agentLifecycle.find(
          (item) => item.agentId === agent.id,
        )?.status ?? 'waiting'
        const isFocused = viewModel.focusTarget === agent.id
        return (
          <li
            className={styles.agentCard}
            data-state={presentationState}
            data-focus={isFocused ? 'primary' : undefined}
            key={agent.id}
            aria-label={`${agent.name}, ${lifecycleLabels[presentationState]}`}
          >
            <IconBadge icon={agent.icon} tone={agent.tone} />
            <strong>{agent.name}</strong>
            <span className={styles.lifecycleBadge}>
              <Icon
                name={lifecycleIcon(presentationState)}
                size={12}
                aria-hidden="true"
              />
              {lifecycleLabels[presentationState]}
            </span>
            <small data-tone={agent.tone}>
              {agent.skill} <Icon name="sparkles" size={11} aria-hidden="true" />
            </small>
          </li>
        )
      })}
    </ul>
  )
}

function relayState(
  from: AgentLifecycleStatus,
  to: AgentLifecycleStatus,
): AgentLifecycleStatus {
  if (to === 'blocked') return 'blocked'
  if (to === 'needs_review') return 'needs_review'
  if (from === 'working' || to === 'working') return 'working'
  if (from === 'completed' && to === 'completed') return 'completed'
  return 'waiting'
}

function AgentRelay({ viewModel }: { readonly viewModel: RuntimeViewModel }) {
  return (
    <div
      className={styles.agentRelay}
      data-testid="agent-relay-connectors"
      aria-hidden="true"
    >
      {viewModel.agentLifecycle.slice(0, -1).map((agent, index) => (
        <span
          data-state={relayState(
            agent.status,
            viewModel.agentLifecycle[index + 1].status,
          )}
          key={agent.agentId}
        />
      ))}
    </div>
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

function SystemGrid({
  state,
  workflowIntroduced,
}: {
  readonly state: RuntimeState
  readonly workflowIntroduced: boolean
}) {
  return (
    <ul className={styles.systemGrid} aria-label="Enterprise systems">
      {systems.map((system) => {
        const presentationState = workflowIntroduced
          ? systemPresentationState(state, system.id)
          : 'inactive'
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
              <Icon name={system.icon} size={18} />
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
      <span aria-hidden="true">
        <Icon
          name={isNeutral ? 'activity' : isResolved ? 'check' : 'alert'}
          size={19}
        />
      </span>
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

function TransitionStatus({ viewModel }: { readonly viewModel: RuntimeViewModel }) {
  const transition = viewModel.transition
  if (transition === null) return null
  return (
    <div className={styles.transitionBanner} role="status">
      <span aria-hidden="true"><Icon name="check" size={18} /></span>
      <p>
        <strong>{transition.title}</strong>
        <small>{transition.next}</small>
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
  const isFlowFocus =
    viewModel.focusTarget?.startsWith('agent-') ?? false
  return (
    <section
      className={`${styles.panel} ${styles.flowPanel}`}
      data-focus={
        viewModel.focusTarget === null
          ? undefined
          : isFlowFocus
            ? 'primary'
            : 'secondary'
      }
      aria-labelledby="agentic-flow-heading"
    >
      <PanelHeading id="agentic-flow-heading" icon="flow">
        Agentic Flow
      </PanelHeading>
      <NowNext viewModel={viewModel} />
      <StageStepper viewModel={viewModel} />
      <article className={styles.commanderCard} aria-label="Case Commander">
        <IconBadge icon="sparkles" tone="blue" />
        <div>
          <strong>Case Commander</strong>
          <span>Orchestrating agents and resolving conflicts</span>
        </div>
      </article>
      <div
        className={styles.connectorRail}
        data-testid="agent-connector-rail"
        aria-hidden="true"
      >
        {viewModel.agentLifecycle.map((agent) => (
          <span data-state={agent.status} key={agent.agentId} />
        ))}
      </div>
      <AgentGrid viewModel={viewModel} />
      <AgentRelay viewModel={viewModel} />
      <div className={styles.systemConnectors} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <SystemGrid
        state={state}
        workflowIntroduced={viewModel.earlyStory.workflowIntroduced}
      />
      {viewModel.transition === null ? (
        <ConflictStatus state={state} />
      ) : (
        <TransitionStatus viewModel={viewModel} />
      )}
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
      icon: 'flag' as const,
      tone: 'blue' as const,
    },
    {
      label: 'Working Agents',
      value: String(viewModel.activeAgentCount),
      suffix: 'of 4',
      status: viewModel.activeAgentCount === 0 ? 'Relay Ready' : 'In Progress',
      icon: 'users' as const,
      tone: 'green' as const,
    },
    {
      label: 'Tool Activity',
      value: String(viewModel.toolActivity),
      suffix: '',
      status: 'Events',
      icon: 'activity' as const,
      tone: 'violet' as const,
    },
    {
      label: 'Artifacts Produced',
      value: String(viewModel.artifactsProduced),
      suffix: '',
      status: 'Artifacts',
      icon: 'artifact' as const,
      tone: 'orange' as const,
    },
  ]

  return (
    <ul className={styles.metricGrid} aria-label="Trust and observability metrics">
      {metrics.map((metric) => (
        <li className={styles.metricCard} key={metric.label}>
          <IconBadge icon={metric.icon} tone={metric.tone} />
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
  const availableArtifacts = viewModel.artifacts.filter(
    (artifact) => artifact.status !== 'locked',
  )
  return (
    <section className={styles.artifactSection} aria-labelledby="artifacts-heading">
      <h3 id="artifacts-heading">Key Artifacts</h3>
      {availableArtifacts.length === 0 ? (
        <p className={styles.artifactEmpty}>Artifacts appear as agents create them.</p>
      ) : (
        <ol>
          {availableArtifacts.map((artifact) => {
            const index = viewModel.artifacts.findIndex(
              (candidate) => candidate.id === artifact.id,
            )
            return (
              <li
                key={artifact.id}
                data-state={artifact.status}
                aria-label={`${artifact.order}. ${artifact.name}, ${artifact.status}`}
              >
                <IconBadge icon={artifactIcons[index]} tone={artifactTones[index]} />
                <span>
                  {artifact.order}. {artifact.name}
                </span>
                <span aria-hidden="true">{artifactTrailingGlyph(artifact.status)}</span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

function DecisionRationale({ viewModel }: { readonly viewModel: RuntimeViewModel }) {
  const rationale = viewModel.decisionRationale
  if (rationale === null) return null
  const agentName = agents.find((agent) => agent.id === rationale.agentId)?.name
  return (
    <article
      className={styles.rationaleCard}
      data-state={rationale.state}
      aria-labelledby="decision-rationale-heading"
    >
      <span className={styles.rationaleIcon} aria-hidden="true">
        <Icon
          name={
            rationale.state === 'blocked'
              ? 'alert'
              : rationale.state === 'working'
                ? 'activity'
                : 'check'
          }
          size={18}
        />
      </span>
      <div>
        <small>
          {agentName} ·{' '}
          {rationale.state === 'working'
            ? 'Working summary'
            : rationale.state === 'blocked'
              ? 'Blocked'
              : 'Result'}
        </small>
        <h3 id="decision-rationale-heading">{rationale.title}</h3>
        <ul>
          {rationale.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
        </ul>
      </div>
    </article>
  )
}

function OutcomePreview({ viewModel }: { readonly viewModel: RuntimeViewModel }) {
  const preview = viewModel.outcomePreview
  if (preview === null) return null
  return (
    <article
      className={styles.outcomePreview}
      aria-labelledby="outcome-preview-heading"
    >
      <span aria-hidden="true"><Icon name="flag" size={18} /></span>
      <div>
        <small>Draft recommendation · Not final</small>
        <h3 id="outcome-preview-heading">{preview.label}</h3>
        <ul>
          {preview.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
    </article>
  )
}

function ApprovalDecisionCard({
  viewModel,
  actions,
}: Pick<StaticShellProps, 'viewModel' | 'actions'>) {
  const approval = viewModel.approvalGate
  if (approval === null) return null
  return (
    <article
      className={styles.approvalDecisionCard}
      aria-labelledby="approval-decision-heading"
    >
      <header>
        <span aria-hidden="true"><Icon name="approval" size={20} /></span>
        <div>
          <small>Explicit human decision</small>
          <h3 id="approval-decision-heading">Approval required</h3>
        </div>
      </header>
      <section aria-labelledby="recommended-action-heading">
        <h4 id="recommended-action-heading">Recommended Action</h4>
        <strong>{approval.recommendedAction}</strong>
      </section>
      <section aria-labelledby="approval-why-heading">
        <h4 id="approval-why-heading">Why</h4>
        <ul>
          {approval.why.map((reason) => <li key={reason}>{reason}</li>)}
        </ul>
      </section>
      <div className={styles.approvalImpactGrid}>
        <section aria-labelledby="impact-heading">
          <h4 id="impact-heading">Estimated Impact</h4>
          <strong>{approval.estimatedImpact}</strong>
          <small>{approval.impactQualifier}</small>
        </section>
        <section aria-labelledby="rejection-risk-heading">
          <h4 id="rejection-risk-heading">Risk if rejected</h4>
          <strong>{approval.riskIfRejected}</strong>
        </section>
      </div>
      <section className={styles.gatePreview} aria-labelledby="gate-preview-heading">
        <small>Draft recommendation · Not final</small>
        <h4 id="gate-preview-heading">{approval.outcomePreview.label}</h4>
        <ul>
          {approval.outcomePreview.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>
      <div className={styles.approvalActions}>
        <button
          className={styles.rejectButton}
          type="button"
          onClick={actions.reject}
          disabled={!viewModel.controls.canReject}
        >
          <Icon name="alert" size={16} aria-hidden="true" />
          Reject
        </button>
        <button
          className={styles.approveDecisionButton}
          type="button"
          onClick={actions.approve}
          disabled={!viewModel.controls.canApprove}
          autoFocus
        >
          <Icon name="check" size={16} aria-hidden="true" />
          Approve
        </button>
      </div>
    </article>
  )
}

function FinalOutcome({ viewModel }: { readonly viewModel: RuntimeViewModel }) {
  const outcome = viewModel.finalOutcome
  if (outcome === null) return null
  return (
    <article
      className={styles.finalOutcomeCard}
      data-outcome={outcome.type}
      role={outcome.type === 'escalated' ? 'alert' : 'status'}
      aria-labelledby="final-outcome-heading"
    >
      <header>
        <span aria-hidden="true">
          <Icon name={outcome.type === 'approved' ? 'check' : 'alert'} size={21} />
        </span>
        <div>
          <small>{outcome.type === 'approved' ? 'Approved resolution' : 'Escalated outcome'}</small>
          <h3 id="final-outcome-heading">{outcome.heading}</h3>
        </div>
      </header>
      <ul className={styles.outcomeSummary} aria-label="Outcome summary">
        {outcome.summary.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <div className={styles.outcomeSections}>
        {outcome.sections.map((section) => (
          <section key={section.heading}>
            <h4>{section.heading}</h4>
            <ul>
              {section.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </article>
  )
}

function shouldShowContextCard(state: RuntimeState, viewModel: RuntimeViewModel) {
  return (
    viewModel.earlyStory.showIntakeContext ||
    state.playbackStatus === 'waiting_failure_injection' ||
    viewModel.context.type !== 'neutral' ||
    state.approvalStatus === 'approved'
  )
}

function ContextStatusCard({
  state,
  viewModel,
  actions,
}: StaticShellProps) {
  const { context } = viewModel
  let tone: 'neutral' | 'info' | 'warning' | 'danger' | 'success' = 'neutral'
  let icon: IconName = 'activity'
  let heading = viewModel.currentMoment?.title ?? 'Workflow update'
  let copy = viewModel.currentMoment?.description ?? ''

  if (viewModel.earlyStory.showIntakeContext) {
    tone = 'info'
    icon = 'message'
    heading = 'Intake'
    copy = 'Receiving the complaint and supporting evidence.'
  } else if (state.playbackStatus === 'waiting_failure_injection') {
    tone = 'success'
    icon = 'check'
    heading = viewModel.currentMoment?.title ?? 'Failure injection ready'
    copy = viewModel.currentMoment?.description ?? ''
  } else if (context.type === 'approval') {
    tone = 'warning'
    icon = 'clock'
    heading = 'Approval required'
    copy = context.copy
  } else if (context.type === 'failure') {
    tone = 'danger'
    icon = 'alert'
    heading = 'Finance posting failed'
    copy = context.copy
  } else if (context.type === 'recovery') {
    tone = 'warning'
    icon = 'refresh'
    heading = 'Recovery in progress'
    copy = context.copy
  } else if (context.type === 'recovered') {
    tone = 'success'
    icon = 'check'
    heading = 'Recovery complete'
    copy = context.copy
  } else if (context.type === 'recommendation') {
    tone = 'success'
    icon = 'check'
    heading = 'Recommendation'
    copy = context.copy
  } else if (state.approvalStatus === 'approved') {
    tone = 'success'
    icon = 'check'
    heading = 'Resolution package approved'
    copy = 'The approved package is ready for deterministic finance posting.'
  }

  return (
    <article
      className={styles.contextCard}
      data-tone={tone}
      data-focus={viewModel.focusTarget === 'approval' ? 'primary' : undefined}
      role={context.type === 'failure' ? 'alert' : 'status'}
      aria-labelledby="context-status-heading"
    >
      <span className={styles.contextIcon} aria-hidden="true">
        <Icon name={icon} size={20} />
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

function ObservabilityIdleState() {
  return (
    <article className={styles.observabilityIdle} aria-labelledby="observability-ready-heading">
      <span aria-hidden="true"><Icon name="shield" size={27} /></span>
      <div>
        <h3 id="observability-ready-heading">Trust signals are ready</h3>
        <p>
          Activity, evidence, and generated artifacts will appear as the guided
          workflow begins.
        </p>
      </div>
    </article>
  )
}

function TrustObservabilityPanel(props: StaticShellProps) {
  const isIdle = props.viewModel.earlyStory.isIdle
  const isTrustFocus =
    props.viewModel.focusTarget === 'approval' ||
    props.viewModel.focusTarget === 'resolution'
  return (
    <section
      className={`${styles.panel} ${styles.trustPanel}`}
      data-focus={
        props.viewModel.focusTarget === null
          ? undefined
          : isTrustFocus
            ? 'primary'
            : 'secondary'
      }
      aria-labelledby="trust-heading"
    >
      <PanelHeading id="trust-heading" icon="shield">
        Trust &amp; Observability
      </PanelHeading>
      <MetricGrid viewModel={props.viewModel} />
      {isIdle ? (
        <ObservabilityIdleState />
      ) : props.viewModel.finalOutcome !== null ? (
        <FinalOutcome viewModel={props.viewModel} />
      ) : props.viewModel.approvalGate !== null ? (
        <ApprovalDecisionCard
          viewModel={props.viewModel}
          actions={props.actions}
        />
      ) : (
        <>
          <ArtifactList viewModel={props.viewModel} />
          {props.viewModel.outcomePreview !== null ? (
            <OutcomePreview viewModel={props.viewModel} />
          ) : shouldShowContextCard(props.state, props.viewModel) ? (
            <ContextStatusCard {...props} />
          ) : (
            <DecisionRationale viewModel={props.viewModel} />
          )}
        </>
      )}
    </section>
  )
}

const playbackControls = [
  { label: 'Start', icon: 'play', variant: 'primary', key: 'start' },
  { label: 'Pause', icon: 'pause', variant: 'neutral', key: 'pause' },
  { label: 'Resume', icon: 'play', variant: 'neutral', key: 'resume' },
  {
    label: 'Next Moment',
    icon: 'skip',
    variant: 'neutral',
    key: 'nextMoment',
  },
  { label: 'Restart', icon: 'refresh', variant: 'neutral', key: 'restart' },
  {
    label: 'Inject Failure',
    icon: 'alert',
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
        <span aria-hidden="true"><Icon name="play" size={17} /></span>
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
            <Icon name={control.icon} size={19} aria-hidden="true" />
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
          <Icon name="user" size={19} aria-hidden="true" />
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
          <Icon name="bot" size={19} aria-hidden="true" />
          Auto Mode
        </button>
      </div>
    </footer>
  )
}

export function StaticShell(props: StaticShellProps) {
  const canvasScale = props.canvasScale ?? 1
  const scaledWidth = DESIGN_SURFACE_WIDTH * canvasScale
  const scaledHeight = DESIGN_SURFACE_HEIGHT * canvasScale
  return (
    <main
      className={`${styles.viewport} ${props.embedded ? styles.embeddedViewport : ''}`}
      data-playback-status={props.state.playbackStatus}
      data-embedded={props.embedded ? 'true' : undefined}
      style={
        props.embedded
          ? { width: scaledWidth, minHeight: scaledHeight, height: scaledHeight }
          : undefined
      }
    >
      <div
        className={styles.scaleFrame}
        style={{ width: scaledWidth, height: scaledHeight }}
      >
        <div
          className={styles.surface}
          data-composition="runtime-progressive"
          data-testid="canonical-design-surface"
          style={{ transform: `scale(${canvasScale})` }}
        >
          <DemoHeader viewModel={props.viewModel} />
          <div className={styles.workspace}>
            <CustomerExperiencePanel viewModel={props.viewModel} />
            <AgenticFlowPanel state={props.state} viewModel={props.viewModel} />
            <TrustObservabilityPanel {...props} />
          </div>
          <PlaybackControls {...props} />
        </div>
      </div>
    </main>
  )
}
