import type { AgentId, SystemId } from '../../domain/runtime-fixtures/types'
import type { RuntimeState, RuntimeViewModel } from '../../domain/runtime'
import { selectInvestigationEvidenceItems } from './investigationEvidence'

/**
 * US-11A presentation helper — Evidence Correlation.
 *
 * Communicates that the AI is *cross-referencing* the three retrieved evidence
 * sources during M04–M08. It does not perform correlation logic itself and it
 * does not conclude anything — no conflict, no recommendation, no scoring.
 *
 * All state is derived from:
 *   • viewModel.currentStage       (approved by US-09 lifecycle)
 *   • viewModel.agentLifecycle     (approved by US-09 lifecycle)
 *   • state.currentMomentId        (existing runtime state)
 * plus the US-10B `selectInvestigationEvidenceItems` selector — no new runtime
 * state, no timers, no independent clocks.
 */

export type CorrelationSourceState = 'waiting' | 'mapped'

export type CorrelationOverallState =
  | 'waiting'
  | 'correlating'
  | 'complete'

export interface CorrelationSource {
  readonly agentId: AgentId
  readonly agentName: string
  readonly systemId: SystemId
  readonly systemName: string
  readonly sourceLabel: string
  readonly state: CorrelationSourceState
}

export interface CorrelationViewModel {
  readonly overallState: CorrelationOverallState
  readonly mappedCount: number
  readonly totalSources: number
  readonly sources: readonly CorrelationSource[]
  readonly subtitle: string
  readonly summary: string | null
}

/**
 * Short, source-oriented labels used in the correlation pipeline. Kept
 * separate from the US-10B canonical evidence-preview wording so the
 * correlation card can read compactly ("Policy Repository") without
 * competing with the fuller previews already shown by InvestigationEvidence.
 */
const CORRELATION_SOURCE_LABEL: Readonly<Record<AgentId, string>> = {
  'agent-customer-complaint': 'Customer Statement',
  'agent-policy': 'Policy Repository',
  'agent-workflow': 'Customer Timeline',
  'agent-finance': 'Financial Context',
}

const SUBTITLE_WAITING = 'Awaiting evidence to correlate…'
const SUBTITLE_CORRELATING = 'Cross-referencing enterprise evidence…'
const SUBTITLE_COMPLETE = 'Cross-reference complete'

const SUMMARY_COMPLETE = 'Evidence correlation complete'

/**
 * Returns the correlation view model during Investigation (M04–M08), or
 * `null` outside that window. `state` is required so we can key the
 * `complete` state to `currentMomentId === 'M08'` — M07 has the same
 * lifecycle statuses as M08 but represents *actively correlating* per US-11A
 * section 6.
 */
export function selectEvidenceCorrelation(
  state: RuntimeState,
  viewModel: RuntimeViewModel,
): CorrelationViewModel | null {
  if (viewModel.currentStage !== 'Investigation') return null
  const items = selectInvestigationEvidenceItems(viewModel)
  if (items === null) return null

  const sources: CorrelationSource[] = items.map((item) => ({
    agentId: item.agentId,
    agentName: item.agentName,
    systemId: item.systemId,
    systemName: item.systemName,
    sourceLabel: CORRELATION_SOURCE_LABEL[item.agentId] ?? item.systemName,
    state: item.activityState === 'retrieved' ? 'mapped' : 'waiting',
  }))

  const mappedCount = sources.filter((s) => s.state === 'mapped').length
  const totalSources = sources.length

  const overallState: CorrelationOverallState =
    state.currentMomentId === 'M08'
      ? 'complete'
      : mappedCount === 0
        ? 'waiting'
        : 'correlating'

  const subtitle =
    overallState === 'complete'
      ? SUBTITLE_COMPLETE
      : overallState === 'waiting'
        ? SUBTITLE_WAITING
        : SUBTITLE_CORRELATING

  const summary = overallState === 'complete' ? SUMMARY_COMPLETE : null

  return {
    overallState,
    mappedCount,
    totalSources,
    sources,
    subtitle,
    summary,
  }
}

/**
 * Compact semantic label used by the state badge on each source row.
 */
export const CORRELATION_SOURCE_STATE_LABEL: Readonly<
  Record<CorrelationSourceState, string>
> = {
  waiting: 'Waiting',
  mapped: 'Mapped',
}

/**
 * Compact semantic label used by the overall correlation state badge.
 */
export const CORRELATION_OVERALL_STATE_LABEL: Readonly<
  Record<CorrelationOverallState, string>
> = {
  waiting: 'Waiting',
  correlating: 'Correlating',
  complete: 'Complete',
}
