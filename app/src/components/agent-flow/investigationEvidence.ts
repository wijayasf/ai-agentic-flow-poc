import type { AgentId, SystemId } from '../../domain/runtime-fixtures/types'
import type { RuntimeViewModel } from '../../domain/runtime'
import type { AgentLifecycleStatus } from '../../domain/runtime'

/**
 * Sequential-flow evidence rows — one specialist at a time.
 * Only the currently-active or completed specialists are surfaced, so the
 * card matches the sequential orchestration story.
 */

export type EvidenceActivityState = 'queued' | 'querying' | 'retrieved'

export interface InvestigationEvidenceItem {
  readonly agentId: AgentId
  readonly agentName: string
  readonly systemId: SystemId
  readonly systemName: string
  readonly activityLabel: string
  readonly activityState: EvidenceActivityState
  readonly evidencePreview: string | null
}

interface SpecialistMapping {
  readonly agentId: AgentId
  readonly agentName: string
  readonly systemId: SystemId
  readonly systemName: string
  readonly activityLabel: string
  readonly evidencePreview: string
}

const SPECIALISTS: readonly SpecialistMapping[] = [
  {
    agentId: 'agent-customer-complaint',
    agentName: 'Customer Complaint Agent',
    systemId: 'system-crm',
    systemName: 'CRM',
    activityLabel: 'Complaint analysis',
    evidencePreview: 'Complaint text and three attachments analysed',
  },
  {
    agentId: 'agent-policy',
    agentName: 'Policy Agent',
    systemId: 'system-policy-repository',
    systemName: 'Policy Repository',
    activityLabel: 'Policy validation',
    evidencePreview: 'Post-Handover Defect Resolution Policy applied',
  },
  {
    agentId: 'agent-workflow',
    agentName: 'Workflow Agent',
    systemId: 'system-sap-cx',
    systemName: 'SAP CX',
    activityLabel: 'Enterprise workflow',
    evidencePreview: 'Four workflow steps submitted',
  },
  {
    agentId: 'agent-finance',
    agentName: 'Finance Agent',
    systemId: 'system-sap-s4hana',
    systemName: 'SAP S/4HANA',
    activityLabel: 'Financial recommendation',
    evidencePreview: 'Compensation validated against budget',
  },
]

export function lifecycleToActivityState(
  status: AgentLifecycleStatus,
): EvidenceActivityState {
  if (
    status === 'working' ||
    status === 'needs_review' ||
    status === 'awaiting_approval'
  ) {
    return 'querying'
  }
  if (status === 'completed') return 'retrieved'
  return 'queued'
}

export function selectInvestigationEvidenceItems(
  viewModel: RuntimeViewModel,
): readonly InvestigationEvidenceItem[] | null {
  const stage = viewModel.currentStage
  if (stage === null || stage === 'Intake') return null
  const lifecycleById = new Map(
    viewModel.agentLifecycle.map((agent) => [agent.agentId, agent.status]),
  )
  const items = SPECIALISTS.map((spec) => {
    const status = lifecycleById.get(spec.agentId) ?? 'waiting'
    const activityState = lifecycleToActivityState(status)
    return {
      agentId: spec.agentId,
      agentName: spec.agentName,
      systemId: spec.systemId,
      systemName: spec.systemName,
      activityLabel: spec.activityLabel,
      activityState,
      evidencePreview:
        activityState === 'retrieved' ? spec.evidencePreview : null,
    }
  })
  const anyStarted = items.some((item) => item.activityState !== 'queued')
  return anyStarted ? items : null
}

export function selectEvidenceCollectionSummary(
  viewModel: RuntimeViewModel,
): string | null {
  const items = selectInvestigationEvidenceItems(viewModel)
  if (items === null) return null
  const allRetrieved = items.every((item) => item.activityState === 'retrieved')
  return allRetrieved ? 'All specialist evidence complete' : null
}

export const ACTIVITY_STATE_LABEL: Readonly<Record<EvidenceActivityState, string>> = {
  queued: 'Queued',
  querying: 'Querying',
  retrieved: 'Retrieved',
}
