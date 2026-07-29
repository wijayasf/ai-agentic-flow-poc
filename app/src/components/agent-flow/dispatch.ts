import type { RuntimeState, RuntimeViewModel } from '../../domain/runtime'
import type { AgentId, MomentId } from '../../domain/runtime-fixtures/types'

const EMPTY_SET: ReadonlySet<AgentId> = new Set()

const DISPATCH_MOMENT_AGENT: Partial<Record<MomentId, AgentId>> = {
  M04: 'agent-customer-complaint',
  M09: 'agent-policy',
  M14: 'agent-workflow',
  M20: 'agent-finance',
}

export function selectDispatchingAgentIds(
  viewModel: RuntimeViewModel,
): ReadonlySet<AgentId> {
  const momentId = viewModel.currentMoment?.id
  if (momentId === undefined) return EMPTY_SET
  const agentId = DISPATCH_MOMENT_AGENT[momentId]
  return agentId === undefined ? EMPTY_SET : new Set<AgentId>([agentId])
}

/**
 * The sequential model no longer performs a parallel investigation "wave" —
 * every dispatch is a single specialist. This helper is kept as a stub for
 * the layout code which historically decorated the wave; it always returns
 * an empty set now.
 */
export function selectInvestigationWaveAgentIds(
  _state: RuntimeState,
): ReadonlySet<AgentId> {
  void _state
  return EMPTY_SET
}
