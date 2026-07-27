import type { AgentId } from '../../domain/runtime-fixtures/types'
import type { AgentLifecycleStatus, RuntimeViewModel } from '../../domain/runtime'
import type { SystemPresentationState } from './systemPresentationState'

/**
 * Presentation-only mapping helpers for US-10A "Live Investigation Activity".
 *
 * All values are derived from existing runtime state (agent lifecycle + current
 * stage). No wall-clock timers, no new runtime fields, no fixture changes.
 */

const INVESTIGATION_WORKING_ACTIVITY: Partial<Record<AgentId, string>> = {
  'agent-policy': 'Reading Policy Repository…',
  'agent-workflow': 'Checking SAP CX case history…',
  'agent-finance': 'Preparing compensation context…',
}

const INVESTIGATION_COMPLETION_CUE: Partial<Record<AgentId, string>> = {
  'agent-policy': 'Policy review complete',
  'agent-workflow': 'Workflow review complete',
  'agent-finance': 'Finance review complete',
}

/**
 * Returns a role-specific working / completion subtitle for a specialist
 * agent, or `null` to indicate the caller should fall back to the static
 * agent skill label. Only Policy / Workflow / Finance agents produce
 * Investigation activity subtitles — the Customer Complaint Agent keeps
 * its existing Intake-stage skill text (US-06/US-08 govern that beat).
 */
export function selectAgentActivitySubtitle(
  agentId: AgentId,
  status: AgentLifecycleStatus,
): string | null {
  if (status === 'working') return INVESTIGATION_WORKING_ACTIVITY[agentId] ?? null
  if (status === 'completed') return INVESTIGATION_COMPLETION_CUE[agentId] ?? null
  return null
}

/**
 * Returns `true` while the Case Commander should present its
 * "Monitoring Investigation" steady state — throughout the Investigation
 * stage (M04–M08). Reuses existing viewModel.currentStage.
 */
export function selectCommanderInvestigationMonitoring(
  viewModel: RuntimeViewModel,
): boolean {
  return viewModel.currentStage === 'Investigation'
}

/**
 * Deterministic three-state progress treatment for an agent card, driven
 * purely by lifecycle status. No timers, no percentages.
 */
export type AgentProgressState = 'inactive' | 'active' | 'complete'

export function selectAgentProgressState(
  status: AgentLifecycleStatus,
): AgentProgressState {
  if (status === 'working' || status === 'needs_review') return 'active'
  if (status === 'completed') return 'complete'
  return 'inactive'
}

/**
 * Positional mapping from a system card to the paired specialist agent —
 * matches the existing config.ts ordering used by AgentGrid and SystemGrid.
 * Presentation-only; the runtime does not model this pairing directly.
 */
export const SYSTEM_PAIRED_AGENT: Record<string, AgentId> = {
  'system-crm': 'agent-customer-complaint',
  'system-policy-repository': 'agent-policy',
  'system-sap-cx': 'agent-workflow',
  'system-sap-s4hana': 'agent-finance',
}

/**
 * Returns the paired agent's current lifecycle status for a given system —
 * used to overlay "working" vs "completed" treatment on the system card
 * without changing runtime semantics.
 */
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

/**
 * Whether a system card should be visually treated as "settled" — the paired
 * agent has completed its work and the base runtime state is `engaged`.
 * Presentation-only combinator; `systemPresentationState` remains the
 * source of truth for the base state.
 */
export function isSystemSettled(
  baseState: SystemPresentationState,
  pairedAgentStatus: AgentLifecycleStatus | null,
): boolean {
  if (baseState !== 'engaged') return false
  return pairedAgentStatus === 'completed'
}
