import type { AgentId } from '../../domain/runtime-fixtures/types'
import type { AgentLifecycleStatus, RuntimeViewModel } from '../../domain/runtime'
import type { SystemPresentationState } from './systemPresentationState'

// F1.1 locked short copy — max ~32 chars, no ellipsis, no "Package" wording.
// Longer explanations live in the notification strip / rationale panel.
const WORKING_ACTIVITY: Partial<Record<AgentId, string>> = {
  'agent-customer-complaint': 'Analysing complaint',
  'agent-policy': 'Checking policy',
  'agent-workflow': 'Preparing workflow',
  'agent-finance': 'Calculating compensation',
}

const COMPLETION_CUE: Partial<Record<AgentId, string>> = {
  'agent-customer-complaint': 'Complaint analysis ready',
  'agent-policy': 'Policy evidence ready',
  'agent-workflow': 'Workflow package ready',
  'agent-finance': 'Financial recommendation ready',
}

const NEEDS_REVIEW_CUE: Partial<Record<AgentId, string>> = {
  'agent-customer-complaint': 'Analysis ready',
  'agent-policy': 'Policy ready',
  'agent-workflow': 'Workflow ready',
  'agent-finance': 'Recommendation ready',
}

const AWAITING_APPROVAL_CUE: Partial<Record<AgentId, string>> = {
  'agent-workflow': 'Approval in progress',
  'agent-finance': 'Awaiting approval',
}

export function selectAgentActivitySubtitle(
  agentId: AgentId,
  status: AgentLifecycleStatus,
): string | null {
  if (status === 'working') return WORKING_ACTIVITY[agentId] ?? null
  if (status === 'needs_review') return NEEDS_REVIEW_CUE[agentId] ?? null
  if (status === 'awaiting_approval') {
    return AWAITING_APPROVAL_CUE[agentId] ?? null
  }
  if (status === 'completed') return COMPLETION_CUE[agentId] ?? null
  return null
}

/**
 * Returns whether the Officer should present its "monitoring" steady state.
 * True while any specialist is actively working.
 */
export function selectCommanderInvestigationMonitoring(
  viewModel: RuntimeViewModel,
): boolean {
  return viewModel.activeSpecialistAgentId !== null
}

export type AgentProgressState = 'inactive' | 'active' | 'complete'

export function selectAgentProgressState(
  status: AgentLifecycleStatus,
): AgentProgressState {
  if (
    status === 'working' ||
    status === 'needs_review' ||
    status === 'awaiting_approval'
  ) {
    return 'active'
  }
  if (status === 'completed') return 'complete'
  return 'inactive'
}

export const SYSTEM_PAIRED_AGENT: Record<string, AgentId> = {
  'system-crm': 'agent-customer-complaint',
  'system-policy-repository': 'agent-policy',
  'system-sap-cx': 'agent-workflow',
  'system-sap-s4hana': 'agent-finance',
}

export function selectPairedAgentStatus(
  systemId: string,
  viewModel: RuntimeViewModel,
): AgentLifecycleStatus | null {
  const agentId = SYSTEM_PAIRED_AGENT[systemId]
  if (!agentId) return null
  return (
    viewModel.agentLifecycle.find((agent) => agent.agentId === agentId)
      ?.status ?? null
  )
}

export function isSystemSettled(
  baseState: SystemPresentationState,
  pairedAgentStatus: AgentLifecycleStatus | null,
): boolean {
  if (baseState !== 'engaged') return false
  return pairedAgentStatus === 'completed'
}
