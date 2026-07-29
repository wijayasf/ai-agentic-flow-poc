import { useLayoutEffect, useRef } from 'react'
import { PanelHeading } from '../primitives/PanelHeading'
import type { MomentId } from '../../domain/runtime-fixtures/types'
import type { RuntimeState, RuntimeViewModel } from '../../domain/runtime'
import shellStyles from '../static-shell/StaticShell.module.css'
import { ActivityTraceTable } from './ActivityTraceTable'
import { AgentGrid } from './AgentGrid'
import { AgenticCaseOfficer, type AgenticCaseOfficerPhase } from './CaseCommander'
import { NowNext } from './NowNext'
import { StageStepper } from './StageStepper'
import { SystemGrid } from './SystemGrid'
import { TransitionStatus } from './TransitionStatus'
import { selectDispatchingAgentIds } from './dispatch'
import { readSurfaceScaleX, visualDeltaToLayoutDelta } from './surfaceScale'
import styles from './AgenticFlowPanel.module.css'

const DISPATCH_MOMENTS: readonly MomentId[] = ['M04', 'M09', 'M14', 'M20']
const RECEIVE_MOMENTS: readonly MomentId[] = ['M08', 'M13', 'M19', 'M24', 'M30']
const FINALISE_MOMENTS: readonly MomentId[] = ['M31', 'M32']

const OFFICER_ORCHESTRATION_LABEL: Partial<Record<MomentId, string>> = {
  M03: 'Reviewing intake',
  M04: 'Preparing complaint analysis',
  M08: 'Reviewing complaint analysis',
  M09: 'Preparing policy validation',
  M13: 'Reviewing policy outcome',
  M14: 'Preparing operational workflow',
  M19: 'Reviewing workflow package',
  M20: 'Preparing financial recommendation',
  M24: 'Reviewing compensation recommendation',
  M25: 'Preparing enterprise approval',
  M29: 'Reviewing enterprise approval',
  M30: 'Preparing compensation disbursement',
  M31: 'Reviewing disbursement result',
  M32: 'Preparing final customer response',
}

function derivePhase(
  viewModel: RuntimeViewModel,
): AgenticCaseOfficerPhase {
  const momentId = viewModel.currentMoment?.id
  if (momentId === undefined) return 'idle'
  if (momentId === 'M03') return 'acknowledging'
  if (DISPATCH_MOMENTS.includes(momentId)) return 'dispatching'
  if (RECEIVE_MOMENTS.includes(momentId)) return 'receiving'
  if (FINALISE_MOMENTS.includes(momentId)) return 'finalising'
  if (viewModel.activeSpecialistAgentId !== null) return 'monitoring'
  return 'idle'
}

function deriveOrchestrationLabel(
  viewModel: RuntimeViewModel,
): string | null {
  const momentId = viewModel.currentMoment?.id
  if (momentId === undefined) return null
  return OFFICER_ORCHESTRATION_LABEL[momentId] ?? null
}

export function AgenticFlowPanel({
  state,
  viewModel,
}: {
  readonly state: RuntimeState
  readonly viewModel: RuntimeViewModel
}) {
  const isFlowFocus =
    viewModel.focusTarget !== null &&
    (viewModel.focusTarget === 'officer' ||
      viewModel.focusTarget.startsWith('agent-'))
  const dispatchingAgentIds = selectDispatchingAgentIds(viewModel)
  const intakeCompletionHold =
    viewModel.currentStage === 'Intake' &&
    (viewModel.currentMoment?.id === 'M03')
  const officerPhase = derivePhase(viewModel)
  const officerOrchestrationLabel = deriveOrchestrationLabel(viewModel)
  const officerActive = viewModel.officerMode === 'active'
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
        <AgenticCaseOfficer
          commandActive={officerActive}
          phase={officerPhase}
          orchestrationLabel={officerOrchestrationLabel}
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
              return (
                <span
                  data-state={agent.status}
                  data-dispatching={isDispatching ? 'true' : undefined}
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
            viewModel={viewModel}
            workflowIntroduced={viewModel.earlyStory.workflowIntroduced}
          />
        </div>
        {viewModel.transition === null ? null : (
          <TransitionStatus viewModel={viewModel} />
        )}
        <ActivityTraceTable viewModel={viewModel} />
      </div>
    </section>
  )
}
