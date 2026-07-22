import complaint from '@fixtures/complaints/complaint-leakage-001.json'
import customer from '@fixtures/customers/customer-rina-putri.json'
import { storyAssets } from '../../assets/story'
import type { StoryAttachmentId } from '../../assets/story'
import type { SystemId } from '../../domain/runtime-fixtures/types'
import type { AgentLifecycleStatus } from '../../domain/runtime'
import { Icon } from '../icon/Icon'
import type { IconName } from '../icon/Icon'
import type { StaticShellProps } from '../static-shell/StaticShell'
import styles from './ResponsiveDemoShell.module.css'
import { STORY_SECTIONS } from './responsiveModel'
import type { StorySectionId } from './responsiveModel'

interface MobileStoryViewProps extends StaticShellProps {
  readonly activeSection: StorySectionId
  readonly onActiveSectionChange: (section: StorySectionId) => void
  readonly onShowChoices: () => void
  readonly onShowDesktop: () => void
}

const agentNames = {
  'agent-customer-complaint': 'Customer Complaint Agent',
  'agent-policy': 'Policy Agent',
  'agent-workflow': 'Workflow Agent',
  'agent-finance': 'Finance Agent',
} as const

const enterpriseSystems = [
  { id: 'system-crm', name: 'CRM', icon: 'database' },
  { id: 'system-policy-repository', name: 'Policy Repository', icon: 'policy' },
  { id: 'system-sap-cx', name: 'SAP CX', icon: 'system' },
  { id: 'system-sap-s4hana', name: 'SAP S/4HANA', icon: 'database' },
] as const satisfies ReadonlyArray<{
  readonly id: SystemId
  readonly name: string
  readonly icon: IconName
}>

const lifecycleLabels: Readonly<Record<AgentLifecycleStatus, string>> = {
  waiting: 'Waiting',
  working: 'Working',
  needs_review: 'Needs Review',
  completed: 'Completed',
  blocked: 'Blocked',
}

function lifecycleIcon(status: AgentLifecycleStatus): IconName {
  if (status === 'working') return 'activity'
  if (status === 'completed') return 'check'
  if (status === 'needs_review') return 'approval'
  if (status === 'blocked') return 'alert'
  return 'clock'
}

function MobileRuntimeControls({ state, viewModel, actions }: StaticShellProps) {
  return (
    <div className={styles.mobileControls} aria-label="Mobile demo controls">
      <div className={styles.mobileModeSelector} aria-label="Playback mode selection">
        <button
          type="button"
          aria-pressed={state.mode === 'presenter'}
          disabled={!viewModel.controls.canSelectPresenter}
          onClick={() => actions.selectMode('presenter')}
        >
          <Icon name="user" size={17} aria-hidden="true" />
          Presenter
        </button>
        <button
          type="button"
          aria-pressed={state.mode === 'auto'}
          disabled={!viewModel.controls.canSelectAuto}
          onClick={() => actions.selectMode('auto')}
        >
          <Icon name="bot" size={17} aria-hidden="true" />
          Auto
        </button>
      </div>
      <div className={styles.mobileTransport} aria-label="Playback controls">
        <button type="button" disabled={!viewModel.controls.canStart} onClick={actions.start}>
          <Icon name="play" size={17} aria-hidden="true" /> Start
        </button>
        <button type="button" disabled={!viewModel.controls.canPause} onClick={actions.pause}>
          <Icon name="pause" size={17} aria-hidden="true" /> Pause
        </button>
        <button type="button" disabled={!viewModel.controls.canResume} onClick={actions.resume}>
          <Icon name="play" size={17} aria-hidden="true" /> Resume
        </button>
        <button
          type="button"
          disabled={!viewModel.controls.canNextMoment}
          onClick={actions.nextMoment}
        >
          <Icon name="skip" size={17} aria-hidden="true" /> Next
        </button>
        <button type="button" disabled={!viewModel.controls.canRestart} onClick={actions.restart}>
          <Icon name="refresh" size={17} aria-hidden="true" /> Restart
        </button>
        <button
          type="button"
          disabled={!viewModel.controls.canInjectFailure}
          onClick={actions.injectFailure}
        >
          <Icon name="alert" size={17} aria-hidden="true" /> Inject Failure
        </button>
      </div>
    </div>
  )
}

function CustomerStorySection({ viewModel }: Pick<StaticShellProps, 'viewModel'>) {
  const story = viewModel.earlyStory
  const visibleAttachments = complaint.attachments.slice(0, story.visibleAttachmentCount)
  return (
    <div className={styles.storyStack}>
      {story.isIdle ? (
        <article className={styles.mobileFraming}>
          <span aria-hidden="true"><Icon name="flow" size={28} /></span>
          <p className={styles.eyebrow}>Guided enterprise simulation</p>
          <h3>See AI collaboration unfold step by step</h3>
          <p>
            This guided demo shows how multiple AI agents collaborate to investigate a
            customer complaint, validate evidence, detect conflicts, and prepare a
            recommendation for human approval.
          </p>
          <strong>Demo is ready. Press Start to begin.</strong>
        </article>
      ) : null}
      {story.showCustomerTyping ? (
        <div className={styles.mobileTyping} role="status" aria-label="Customer is typing">
          <Icon name="message" size={18} aria-hidden="true" />
          <span aria-hidden="true">•••</span> Customer is typing
        </div>
      ) : null}
      {story.showCustomerIdentity ? (
        <article className={styles.mobileMessage} aria-label="Customer complaint">
          <header>
            <img
              alt={storyAssets.customerAvatar.alt}
              src={storyAssets.customerAvatar.src}
              height="640"
              width="640"
            />
            <div><strong>{customer.name}</strong><small>Customer · High priority</small></div>
          </header>
          {story.showCustomerMessage ? <p>{complaint.message}</p> : null}
        </article>
      ) : null}
      {visibleAttachments.length > 0 ? (
        <section aria-labelledby="mobile-evidence-heading">
          <h3 id="mobile-evidence-heading">Customer evidence</h3>
          <div className={styles.mobileAttachments}>
            {visibleAttachments.map((attachment) => {
              const asset = storyAssets.attachments[attachment.id as StoryAttachmentId]
              return (
                <article key={attachment.id}>
                  <img alt={asset.alt} src={asset.src} height="640" width="640" />
                  <div>
                    <strong>{attachment.name}</strong>
                    <small>{attachment.extension.toUpperCase()} · Customer attachment</small>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}
      {story.showAiTyping ? (
        <div className={styles.mobileTyping} role="status" aria-label="AI Resolution Officer is typing">
          <Icon name="bot" size={18} aria-hidden="true" />
          <span aria-hidden="true">•••</span> AI Resolution Officer is typing
        </div>
      ) : null}
      {story.showAiAcknowledgement ? (
        <article className={`${styles.mobileMessage} ${styles.aiMessage}`}>
          <header><Icon name="bot" size={22} aria-hidden="true" /><strong>AI Resolution Officer</strong></header>
          <p>
            Thank you, Rina. I’ve received your complaint and attachments. I’m
            reviewing with the right systems and experts. I’ll keep you updated daily
            until this is resolved.
          </p>
        </article>
      ) : null}
    </div>
  )
}

function AgentFlowSection({ viewModel }: Pick<StaticShellProps, 'viewModel'>) {
  return (
    <div className={styles.storyStack}>
      <dl className={styles.mobileNowNext}>
        <div><dt>Now</dt><dd>{viewModel.nowNext.now}</dd></div>
        <div><dt>Next</dt><dd>{viewModel.nowNext.next ?? 'No further action'}</dd></div>
      </dl>
      {viewModel.transition ? (
        <div className={styles.mobileTransition} role="status">
          <Icon name="check" size={18} aria-hidden="true" />
          <div><strong>{viewModel.transition.title}</strong><span>{viewModel.transition.next}</span></div>
        </div>
      ) : null}
      <ol className={styles.mobileAgentRelay} aria-label="Specialist agent relay">
        {viewModel.agentLifecycle.map((agent, index) => (
          <li key={agent.agentId} data-state={agent.status}>
            <span aria-hidden="true"><Icon name={lifecycleIcon(agent.status)} size={18} /></span>
            <div><strong>{agentNames[agent.agentId]}</strong><small>{lifecycleLabels[agent.status]}</small></div>
            {index < viewModel.agentLifecycle.length - 1 ? <i aria-hidden="true">↓</i> : null}
          </li>
        ))}
      </ol>
      {viewModel.decisionRationale ? (
        <article className={styles.mobileRationale} data-state={viewModel.decisionRationale.state}>
          <small>{agentNames[viewModel.decisionRationale.agentId]} · Decision rationale</small>
          <h3>{viewModel.decisionRationale.title}</h3>
          <ul>{viewModel.decisionRationale.bullets.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
      ) : (
        <p className={styles.mobileEmpty}>Agent findings will appear as the relay progresses.</p>
      )}
    </div>
  )
}

function TrustSection({ state, viewModel }: Pick<StaticShellProps, 'state' | 'viewModel'>) {
  const stageIndex = viewModel.stages.findIndex((stage) => stage.state === 'current')
  const artifacts = viewModel.artifacts.filter((artifact) => artifact.status !== 'locked')
  return (
    <div className={styles.storyStack}>
      <ul className={styles.mobileMetrics} aria-label="Trust and observability metrics">
        <li><span>Current stage</span><strong>{stageIndex < 0 ? 'Idle' : `${stageIndex + 1} / 5`}</strong></li>
        <li><span>Working agents</span><strong>{viewModel.activeAgentCount} / 4</strong></li>
        <li><span>Tool activity</span><strong>{viewModel.toolActivity}</strong></li>
        <li><span>Artifacts</span><strong>{viewModel.artifactsProduced}</strong></li>
      </ul>
      <section>
        <h3>Enterprise systems</h3>
        <ul className={styles.mobileSystemList}>
          {enterpriseSystems.map((system) => (
            <li key={system.id}>
              <Icon name={system.icon} size={17} aria-hidden="true" />
              <span>{system.name}</span>
              <small>{state.activeSystemIds.includes(system.id) ? 'Engaged' : 'Waiting'}</small>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3>Key artifacts</h3>
        {artifacts.length ? (
          <ol className={styles.mobileArtifactList}>
            {artifacts.map((artifact) => <li key={artifact.id}><Icon name="artifact" size={17} aria-hidden="true" /> {artifact.name}<small>{artifact.status}</small></li>)}
          </ol>
        ) : <p className={styles.mobileEmpty}>Artifacts appear as agents create them.</p>}
      </section>
      <section>
        <h3>Activity trace</h3>
        {viewModel.visibleEvents.length ? (
          <ol className={styles.mobileActivityList}>
            {viewModel.visibleEvents.map((event) => (
              <li key={event.id}><time>{event.time}</time><div><strong>{event.agent}</strong><span>{event.action}</span><small>{event.output}</small></div></li>
            ))}
          </ol>
        ) : <p className={styles.mobileEmpty}>Activity appears when the guided workflow begins.</p>}
      </section>
    </div>
  )
}

function ApprovalSection({ viewModel, actions }: Pick<StaticShellProps, 'viewModel' | 'actions'>) {
  const gate = viewModel.approvalGate
  return (
    <div className={styles.storyStack}>
      {viewModel.outcomePreview ? (
        <article className={styles.mobilePreview}>
          <small>Draft recommendation · Not final</small>
          <h3>{viewModel.outcomePreview.label}</h3>
          <ul>{viewModel.outcomePreview.items.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
      ) : null}
      {gate ? (
        <article className={styles.mobileApproval} aria-labelledby="mobile-approval-heading">
          <header><Icon name="approval" size={22} aria-hidden="true" /><div><small>Explicit human decision</small><h3 id="mobile-approval-heading">Approval required</h3></div></header>
          <h4>Recommended Action</h4><strong>{gate.recommendedAction}</strong>
          <h4>Why</h4><ul>{gate.why.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          <div className={styles.mobileImpact}><div><h4>Estimated Impact</h4><strong>{gate.estimatedImpact}</strong><small>{gate.impactQualifier}</small></div><div><h4>Risk if rejected</h4><strong>{gate.riskIfRejected}</strong></div></div>
          <div className={styles.mobileApprovalActions}>
            <button type="button" onClick={actions.reject} disabled={!viewModel.controls.canReject}><Icon name="alert" size={18} aria-hidden="true" /> Reject</button>
            <button type="button" onClick={actions.approve} disabled={!viewModel.controls.canApprove}><Icon name="check" size={18} aria-hidden="true" /> Approve</button>
          </div>
        </article>
      ) : viewModel.finalOutcome ? (
        <p className={styles.mobileEmpty}>Human decision received. Review the Final Outcome section.</p>
      ) : (
        <p className={styles.mobileEmpty}>Approval evidence will appear after the Finance Agent prepares a recommendation.</p>
      )}
    </div>
  )
}

function OutcomeSection({ viewModel }: Pick<StaticShellProps, 'viewModel'>) {
  const outcome = viewModel.finalOutcome
  if (!outcome) return <p className={styles.mobileEmpty}>The final outcome remains hidden until a human decision and resolution are complete.</p>
  return (
    <article className={styles.mobileOutcome} data-outcome={outcome.type} role={outcome.type === 'escalated' ? 'alert' : 'status'}>
      <header><Icon name={outcome.type === 'approved' ? 'check' : 'alert'} size={24} aria-hidden="true" /><div><small>{outcome.type === 'approved' ? 'Approved resolution' : 'Escalated outcome'}</small><h3>{outcome.heading}</h3></div></header>
      <ul className={styles.mobileOutcomeSummary}>{outcome.summary.map((item) => <li key={item}>{item}</li>)}</ul>
      {outcome.sections.map((section) => <section key={section.heading}><h4>{section.heading}</h4><ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul></section>)}
    </article>
  )
}

export function MobileStoryView(props: MobileStoryViewProps) {
  const currentIndex = STORY_SECTIONS.findIndex((section) => section.id === props.activeSection)
  const active = STORY_SECTIONS[currentIndex]
  return (
    <main className={styles.mobileStoryShell} data-mobile-view="story">
      <header className={styles.mobileStoryHeader}>
        <div><span aria-hidden="true"><Icon name="flow" size={25} /></span><div><strong>AI Agentic Flow</strong><small>Mobile Story View · {props.viewModel.timer.elapsedText}</small></div></div>
        <div><button type="button" onClick={props.onShowDesktop}>Overview</button><button type="button" onClick={props.onShowChoices}>Views</button></div>
      </header>
      <MobileRuntimeControls {...props} />
      <nav className={styles.storyTabs} aria-label="Mobile story sections" role="tablist">
        {STORY_SECTIONS.map((section) => {
          const isSelected = section.id === props.activeSection
          const notice = section.id === 'approval' && props.viewModel.approvalGate
            ? 'Action required'
            : section.id === 'outcome' && props.viewModel.finalOutcome
              ? 'Ready'
              : null
          return (
            <button
              id={`story-tab-${section.id}`}
              key={section.id}
              type="button"
              role="tab"
              aria-controls={`story-panel-${section.id}`}
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => props.onActiveSectionChange(section.id)}
            >
              <Icon name={section.icon} size={18} aria-hidden="true" />
              <span>{section.label}</span>
              {notice ? <em>{notice}</em> : null}
            </button>
          )
        })}
      </nav>
      <section className={styles.mobileStoryPanel} id={`story-panel-${active.id}`} role="tabpanel" aria-labelledby={`story-tab-${active.id}`} tabIndex={0}>
        <header><span>Step {currentIndex + 1} of {STORY_SECTIONS.length}</span><h2>{active.label}</h2></header>
        {active.id === 'customer' ? <CustomerStorySection viewModel={props.viewModel} /> : null}
        {active.id === 'flow' ? <AgentFlowSection viewModel={props.viewModel} /> : null}
        {active.id === 'trust' ? <TrustSection state={props.state} viewModel={props.viewModel} /> : null}
        {active.id === 'approval' ? <ApprovalSection viewModel={props.viewModel} actions={props.actions} /> : null}
        {active.id === 'outcome' ? <OutcomeSection viewModel={props.viewModel} /> : null}
      </section>
      <nav className={styles.storyPager} aria-label="Story section pagination">
        <button type="button" disabled={currentIndex === 0} onClick={() => props.onActiveSectionChange(STORY_SECTIONS[currentIndex - 1].id)}>Previous</button>
        <span aria-live="polite">{active.label}</span>
        <button type="button" disabled={currentIndex === STORY_SECTIONS.length - 1} onClick={() => props.onActiveSectionChange(STORY_SECTIONS[currentIndex + 1].id)}>Next</button>
      </nav>
    </main>
  )
}
