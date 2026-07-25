import { PanelHeading } from '../primitives/PanelHeading'
import type { RuntimeState, RuntimeViewModel } from '../../domain/runtime'
import shellStyles from '../static-shell/StaticShell.module.css'
import { ActivityTraceTable } from './ActivityTraceTable'
import { AgentGrid } from './AgentGrid'
import { AgentRelay } from './AgentRelay'
import { CaseCommander } from './CaseCommander'
import { ConflictStatus } from './ConflictStatus'
import { NowNext } from './NowNext'
import { StageStepper } from './StageStepper'
import { SystemGrid } from './SystemGrid'
import { TransitionStatus } from './TransitionStatus'
import styles from './AgenticFlowPanel.module.css'

export function AgenticFlowPanel({
  state,
  viewModel,
}: {
  readonly state: RuntimeState
  readonly viewModel: RuntimeViewModel
}) {
  const isFlowFocus = viewModel.focusTarget?.startsWith('agent-') ?? false
  return (
    <section
      className={`${shellStyles.panel} ${shellStyles.flowPanel}`}
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
      <div className={styles.body}>
        <NowNext viewModel={viewModel} />
        <StageStepper viewModel={viewModel} />
        <CaseCommander />
        <div className={styles.agentStack}>
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
        </div>
        {viewModel.transition === null ? (
          <ConflictStatus state={state} />
        ) : (
          <TransitionStatus viewModel={viewModel} />
        )}
        <ActivityTraceTable viewModel={viewModel} />
      </div>
    </section>
  )
}
