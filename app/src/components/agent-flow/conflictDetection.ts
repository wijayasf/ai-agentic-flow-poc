import type { AgentId, SystemId } from '../../domain/runtime-fixtures/types'
import type { RuntimeState, RuntimeViewModel } from '../../domain/runtime'

/**
 * US-11B presentation helper — Conflict Detection.
 *
 * Communicates that the AI is identifying *inconsistencies* between the three
 * retrieved evidence sources. It does not generate a recommendation, does not
 * approve/reject anything, does not surface refund or compensation amounts,
 * and does not expose severity / risk / confidence scores. Those belong to
 * US-12 and later stories.
 *
 * State is derived from:
 *   • state.currentMomentId       (existing runtime state)
 *   • viewModel.currentStage      (approved lifecycle)
 * No new runtime fields, no timers, no independent clocks.
 */

export type ConflictAnalysisPhase = 'analyzing' | 'complete'

export interface ConflictFinding {
  readonly id: string
  readonly agentId: AgentId
  readonly agentName: string
  readonly systemId: SystemId
  readonly systemName: string
  /** Short business-facing source label used by the correlation pipeline. */
  readonly sourceLabel: string
  /** Neutral finding category — no recommendation, no verdict. */
  readonly categoryLabel: string
  /** One-line description of the observed inconsistency, still neutral. */
  readonly description: string
}

export interface ConflictDetectionViewModel {
  readonly phase: ConflictAnalysisPhase
  readonly subtitle: string
  readonly findings: readonly ConflictFinding[]
  readonly findingCount: number
  readonly summaryLines: readonly string[] | null
}

const SUBTITLE_ANALYZING = 'Analyzing evidence consistency…'
const SUBTITLE_COMPLETE = 'Conflict analysis complete'

const FINDINGS: readonly ConflictFinding[] = [
  {
    id: 'conflict-policy',
    agentId: 'agent-policy',
    agentName: 'Policy Agent',
    systemId: 'system-policy-repository',
    sourceLabel: 'Policy Repository',
    systemName: 'Policy Repository',
    categoryLabel: 'Policy inconsistency',
    description:
      'Retrieved policy criteria do not align with the current case handling record',
  },
  {
    id: 'conflict-workflow',
    agentId: 'agent-workflow',
    agentName: 'Workflow Agent',
    systemId: 'system-sap-cx',
    sourceLabel: 'Customer Timeline',
    systemName: 'SAP CX',
    categoryLabel: 'Timeline inconsistency',
    description:
      'SAP CX case timeline differs from the customer statement of unresolved issue',
  },
  {
    id: 'conflict-finance',
    agentId: 'agent-finance',
    agentName: 'Finance Agent',
    systemId: 'system-sap-s4hana',
    sourceLabel: 'Financial Context',
    systemName: 'SAP S/4HANA',
    categoryLabel: 'Financial clarification required',
    description:
      'Financial context requires additional clarification before further processing',
  },
]

const SUMMARY_LINES_COMPLETE: readonly string[] = [
  '3 evidence inconsistencies identified',
  'Further review required',
  'No recommendation generated',
]

/**
 * Returns the conflict-detection view model when the card should be visible,
 * or `null` otherwise.
 *
 * Visibility contract:
 *   • M07 and earlier      → null (card absent)
 *   • M08 (analyzing beat) → phase 'analyzing', no findings, no summary
 *   • M09–M11 (Conflict)   → phase 'complete', 3 findings, summary
 *   • M12 and later        → null (card unmounts)
 */
export function selectConflictDetection(
  state: RuntimeState,
  viewModel: RuntimeViewModel,
): ConflictDetectionViewModel | null {
  const inConflictStage = viewModel.currentStage === 'Conflict'
  const analyzingBeat = state.currentMomentId === 'M08'
  if (!analyzingBeat && !inConflictStage) return null

  const phase: ConflictAnalysisPhase = inConflictStage ? 'complete' : 'analyzing'
  const findings = phase === 'complete' ? FINDINGS : []
  return {
    phase,
    subtitle: phase === 'complete' ? SUBTITLE_COMPLETE : SUBTITLE_ANALYZING,
    findings,
    findingCount: findings.length,
    summaryLines: phase === 'complete' ? SUMMARY_LINES_COMPLETE : null,
  }
}

/**
 * Compact semantic label used by the overall status badge.
 */
export const CONFLICT_PHASE_LABEL: Readonly<
  Record<ConflictAnalysisPhase, string>
> = {
  analyzing: 'Analyzing',
  complete: 'Complete',
}
