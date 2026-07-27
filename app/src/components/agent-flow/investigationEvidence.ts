import type { AgentId, SystemId } from '../../domain/runtime-fixtures/types'
import type { RuntimeViewModel } from '../../domain/runtime'
import type { AgentLifecycleStatus } from '../../domain/runtime'

/**
 * US-10B presentation helper — Investigation Evidence & Tool Activity.
 *
 * Communicates provenance-of-work during M04–M08:
 *   • which specialist queried which enterprise system,
 *   • what general type of evidence was retrieved,
 *   • when each retrieval completed.
 *
 * The retrieval semantics are derived from `viewModel.agentLifecycle` + the
 * existing lifecycle mapping (US-09 approved). No new runtime state, no new
 * events, no timers.
 *
 * Evidence text describes *retrieved source material*, never a conclusion.
 * Conflict severity / recommendation / approval belong to US-11+.
 */

export type EvidenceActivityState = 'queued' | 'querying' | 'retrieved'

export interface InvestigationEvidenceItem {
  readonly agentId: AgentId
  readonly agentName: string
  readonly systemId: SystemId
  readonly systemName: string
  readonly activityLabel: string
  readonly activityState: EvidenceActivityState
  /** Populated only once `activityState === 'retrieved'`. */
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

/**
 * Deterministic Investigation mapping. Presentation only — mirrors the
 * approved agent-to-system pairings from `config.ts` but adds the
 * process-oriented activity label + safe evidence-preview wording. Order
 * matches the on-canvas column order (Policy → Workflow → Finance).
 */
const SPECIALISTS: readonly SpecialistMapping[] = [
  {
    agentId: 'agent-policy',
    agentName: 'Policy Agent',
    systemId: 'system-policy-repository',
    systemName: 'Policy Repository',
    activityLabel: 'Policy repository query',
    evidencePreview: 'Refund policy and exception criteria retrieved',
  },
  {
    agentId: 'agent-workflow',
    agentName: 'Workflow Agent',
    systemId: 'system-sap-cx',
    systemName: 'SAP CX',
    activityLabel: 'Customer case-history query',
    evidencePreview: 'Customer case timeline and escalation history retrieved',
  },
  {
    agentId: 'agent-finance',
    agentName: 'Finance Agent',
    systemId: 'system-sap-s4hana',
    systemName: 'SAP S/4HANA',
    activityLabel: 'Financial context query',
    evidencePreview: 'Compensation context and cost-impact data retrieved',
  },
]

/**
 * Maps an agent lifecycle status onto the semantic evidence-activity state.
 * Only three lifecycle values matter for US-10B's Investigation window;
 * anything unexpected (blocked / needs_review) falls back to 'queued' so
 * the UI never lies about retrieval.
 */
export function lifecycleToActivityState(
  status: AgentLifecycleStatus,
): EvidenceActivityState {
  if (status === 'working') return 'querying'
  if (status === 'completed') return 'retrieved'
  return 'queued'
}

/**
 * Returns the three Investigation evidence rows for M04–M08 or `null`
 * elsewhere. Reads exclusively from `viewModel.agentLifecycle` and
 * `viewModel.currentStage`.
 */
export function selectInvestigationEvidenceItems(
  viewModel: RuntimeViewModel,
): readonly InvestigationEvidenceItem[] | null {
  if (viewModel.currentStage !== 'Investigation') return null
  const lifecycleById = new Map(
    viewModel.agentLifecycle.map((agent) => [agent.agentId, agent.status]),
  )
  return SPECIALISTS.map((spec) => {
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
}

/**
 * A neutral evidence-collection-complete cue for M08. Returns null unless
 * all three Investigation specialists have completed. Wording avoids any
 * conflict or recommendation semantics (that's US-11+).
 */
export function selectEvidenceCollectionSummary(
  viewModel: RuntimeViewModel,
): string | null {
  if (viewModel.currentStage !== 'Investigation') return null
  const items = selectInvestigationEvidenceItems(viewModel)
  if (items === null) return null
  const allRetrieved = items.every((item) => item.activityState === 'retrieved')
  return allRetrieved ? 'Evidence collection complete' : null
}

/**
 * Semantic activity-state labels for the small status badge. Kept in the
 * helper so tests and UI stay in sync.
 */
export const ACTIVITY_STATE_LABEL: Readonly<Record<EvidenceActivityState, string>> = {
  queued: 'Queued',
  querying: 'Querying',
  retrieved: 'Retrieved',
}
