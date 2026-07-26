import { useLayoutEffect, useRef } from 'react'
import { PanelHeading } from '../primitives/PanelHeading'
import type { RuntimeState, RuntimeViewModel } from '../../domain/runtime'
import shellStyles from '../static-shell/StaticShell.module.css'
import { ActivityTraceTable } from './ActivityTraceTable'
import { AgentGrid } from './AgentGrid'
import { CaseCommander } from './CaseCommander'
import { ConflictStatus } from './ConflictStatus'
import { NowNext } from './NowNext'
import { StageStepper } from './StageStepper'
import { SystemGrid } from './SystemGrid'
import { TransitionStatus } from './TransitionStatus'
import {
  selectDispatchingAgentIds,
  selectInvestigationWaveAgentIds,
} from './dispatch'
import { readSurfaceScaleX, visualDeltaToLayoutDelta } from './surfaceScale'
import styles from './AgenticFlowPanel.module.css'

export function AgenticFlowPanel({
  state,
  viewModel,
}: {
  readonly state: RuntimeState
  readonly viewModel: RuntimeViewModel
}) {
  const isFlowFocus = viewModel.focusTarget?.startsWith('agent-') ?? false
  const dispatchingAgentIds = selectDispatchingAgentIds(viewModel)
  const investigationWaveAgentIds = selectInvestigationWaveAgentIds(state)
  const investigationWaveActive = investigationWaveAgentIds.size > 0
  const customerAgentCompleted = viewModel.agentLifecycle.some(
    (agent) =>
      agent.agentId === 'agent-customer-complaint' &&
      agent.status === 'completed',
  )
  const intakeCompletionHold =
    viewModel.currentStage === 'Intake' && customerAgentCompleted
  const stackRef = useRef<HTMLDivElement | null>(null)
  const railRef = useRef<HTMLDivElement | null>(null)
  const systemConnectorsRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const rail = railRef.current
    const stack = stackRef.current
    const systemConnectors = systemConnectorsRef.current
    if (!rail || !stack) return undefined

    const align = () => {
      const agentGrid = stack.querySelector<HTMLUListElement>(
        'ul[aria-label="Specialist agents"]',
      )
      const systemGrid = stack.querySelector<HTMLUListElement>(
        'ul[aria-label="Enterprise systems"]',
      )
      if (!agentGrid) return
      const agentCards = Array.from(agentGrid.children) as HTMLElement[]
      const railSpans = Array.from(rail.children) as HTMLElement[]
      const surface = rail.closest('[data-testid="canonical-design-surface"]')
      const scaleX = readSurfaceScaleX(surface)

      if (agentCards.length > 0 && agentCards.length === railSpans.length) {
        const railRect = rail.getBoundingClientRect()
        agentCards.forEach((card, index) => {
          const icon = card.firstElementChild as HTMLElement | null
          if (!icon) return
          const iconRect = icon.getBoundingClientRect()
          const iconCenterX = iconRect.left + iconRect.width / 2
          const visualRelativeX = iconCenterX - railRect.left
          const layoutRelativeX = visualDeltaToLayoutDelta(
            visualRelativeX,
            scaleX,
          )
          railSpans[index].style.left = `${layoutRelativeX}px`
        })
      }

      if (systemConnectors && systemGrid) {
        const systemCards = Array.from(systemGrid.children) as HTMLElement[]
        const sysSpans = Array.from(systemConnectors.children) as HTMLElement[]
        if (
          agentCards.length === systemCards.length &&
          systemCards.length === sysSpans.length &&
          systemCards.length > 0
        ) {
          const containerRect = systemConnectors.getBoundingClientRect()
          systemCards.forEach((systemCard, index) => {
            const agentCard = agentCards[index]
            const agentCardRect = agentCard.getBoundingClientRect()
            const systemCardRect = systemCard.getBoundingClientRect()
            const agentCenterX =
              agentCardRect.left + agentCardRect.width / 2
            const systemCenterX =
              systemCardRect.left + systemCardRect.width / 2
            const visualCenterX = (agentCenterX + systemCenterX) / 2
            const visualRelativeX = visualCenterX - containerRect.left
            const layoutRelativeX = visualDeltaToLayoutDelta(
              visualRelativeX,
              scaleX,
            )
            sysSpans[index].style.left = `${layoutRelativeX}px`
          })
        }
      }
    }

    align()

    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(align)
    if (observer) {
      observer.observe(stack)
      observer.observe(rail)
      if (systemConnectors) observer.observe(systemConnectors)
    }
    window.addEventListener('resize', align)

    return () => {
      window.removeEventListener('resize', align)
      observer?.disconnect()
    }
  })

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
        <StageStepper
          viewModel={viewModel}
          intakeCompleted={intakeCompletionHold}
        />
        <CaseCommander
          orchestrationActive={viewModel.earlyStory.showAiTyping}
          handoffReady={intakeCompletionHold}
          dispatchingWave={investigationWaveActive}
        />
        <div className={styles.agentStack} ref={stackRef}>
          <div
            className={styles.connectorRail}
            data-testid="agent-connector-rail"
            aria-hidden="true"
            ref={railRef}
          >
            {viewModel.agentLifecycle.map((agent) => {
              const isDispatching =
                agent.status !== 'working' &&
                dispatchingAgentIds.has(agent.agentId)
              const isInvestigationWave = investigationWaveAgentIds.has(
                agent.agentId,
              )
              return (
                <span
                  data-state={agent.status}
                  data-dispatching={isDispatching ? 'true' : undefined}
                  data-wave={isInvestigationWave ? 'investigation' : undefined}
                  data-agent-id={agent.agentId}
                  key={agent.agentId}
                />
              )
            })}
          </div>
          <AgentGrid viewModel={viewModel} />
          <div
            className={styles.systemConnectors}
            data-testid="system-connectors"
            aria-hidden="true"
            ref={systemConnectorsRef}
          >
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
