import type { ReactNode } from 'react'
import { Icon } from '../icon/Icon'
import type { IconName } from '../icon/Icon'
import { IconBadge } from '../primitives/IconBadge'
import { PanelHeading } from '../primitives/PanelHeading'
import { CustomerPanel } from '../customer/CustomerPanel'
import { agents } from '../agent-flow/config'
import type { AgentTone } from '../agent-flow/config'
import { AgenticFlowPanel } from '../agent-flow/AgenticFlowPanel'
import { artifactTrailingGlyph } from '../trust/artifactTrailingGlyph'
import { ConflictDetection } from '../trust/ConflictDetection'
import { EvidenceCorrelation } from '../trust/EvidenceCorrelation'
import { HumanApproval } from '../trust/HumanApproval'
import { InvestigationEvidence } from '../trust/InvestigationEvidence'
import { NotificationStrip } from '../trust/NotificationStrip'
import { ResolutionBrief } from '../trust/ResolutionBrief'
import { shouldShowContextCard } from '../trust/shouldShowContextCard'
import type { SceneId } from '../../domain/runtime-fixtures/types'
import type {
  RuntimeState,
  RuntimeViewModel,
} from '../../domain/runtime'
import type { RuntimeControllerActions } from '../../runtime'
import styles from './StaticShell.module.css'

export interface StaticShellProps {
  readonly state: RuntimeState
  readonly viewModel: RuntimeViewModel
  readonly actions: RuntimeControllerActions
  readonly canvasScale?: number
  readonly embedded?: boolean
  readonly headerActions?: ReactNode
}

export const DESIGN_SURFACE_WIDTH = 1920
export const DESIGN_SURFACE_HEIGHT = 1080

const artifactTones: readonly AgentTone[] = ['blue', 'red', 'green', 'violet']
const artifactIcons: readonly IconName[] = [
  'artifact',
  'alert',
  'approval',
  'shield',
]

const SCENE_META: Record<SceneId, { index: number; label: string }> = {
  'scene-intake': { index: 1, label: 'Intake' },
  'scene-investigation': { index: 2, label: 'Investigation' },
  'scene-conflict': { index: 3, label: 'Conflict' },
  'scene-approval': { index: 4, label: 'Approval' },
  'scene-failure-recovery': { index: 5, label: 'Recovery' },
  'scene-resolution': { index: 6, label: 'Resolution' },
}

const DEMO_TAGLINE = 'AI-Powered Complaint Resolution Demo'

function DemoHeader({
  viewModel,
  headerActions,
}: {
  viewModel: RuntimeViewModel
  headerActions?: ReactNode
}) {
  const { timer, currentSceneId } = viewModel
  const sceneMeta = currentSceneId ? SCENE_META[currentSceneId] : null
  const subtitleText = sceneMeta
    ? `Scene ${sceneMeta.index} · ${sceneMeta.label}`
    : DEMO_TAGLINE
  return (
    <header className={styles.header}>
      <div className={styles.brandGroup}>
        <span className={styles.brandMark} aria-hidden="true">
          <Icon name="flow" size={31} strokeWidth={1.7} />
        </span>
        <div className={styles.brandTitleStack}>
          <h1>AI Agentic Flow</h1>
          <p className={styles.brandSubtitle}>{subtitleText}</p>
        </div>
      </div>
      <div className={styles.headerActions}>
        {headerActions}
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
      </div>
    </header>
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
    heading = 'Contractor rejected'
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
    copy = 'The approved package is ready. Initiating repair contractor assignment.'
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
      <div className={styles.trustBody}>
        <MetricGrid viewModel={props.viewModel} />
        <NotificationStrip state={props.state} />
        <div className={styles.trustContent}>
          {isIdle ? (
            <ObservabilityIdleState />
          ) : props.viewModel.finalOutcome !== null ? (
            <FinalOutcome viewModel={props.viewModel} />
          ) : (
            <>
              <ResolutionBrief
                state={props.state}
                viewModel={props.viewModel}
              />
              <ArtifactList viewModel={props.viewModel} />
              <InvestigationEvidence viewModel={props.viewModel} />
              <EvidenceCorrelation
                state={props.state}
                viewModel={props.viewModel}
              />
              <ConflictDetection
                state={props.state}
                viewModel={props.viewModel}
              />
              {props.viewModel.approvalGate === null ? (
                props.viewModel.outcomePreview !== null ? (
                  <OutcomePreview viewModel={props.viewModel} />
                ) : shouldShowContextCard(props.state, props.viewModel) ? (
                  <ContextStatusCard {...props} />
                ) : (
                  <DecisionRationale viewModel={props.viewModel} />
                )
              ) : null}
            </>
          )}
        </div>
        <HumanApproval state={props.state} viewModel={props.viewModel} />
        {props.viewModel.approvalGate !== null ? (
          <ApprovalDecisionCard
            viewModel={props.viewModel}
            actions={props.actions}
          />
        ) : null}
      </div>
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
          <DemoHeader
            viewModel={props.viewModel}
            headerActions={props.headerActions}
          />
          <div className={styles.workspace}>
            <CustomerPanel viewModel={props.viewModel} />
            <AgenticFlowPanel state={props.state} viewModel={props.viewModel} />
            <TrustObservabilityPanel {...props} />
          </div>
          <PlaybackControls {...props} />
        </div>
      </div>
    </main>
  )
}
