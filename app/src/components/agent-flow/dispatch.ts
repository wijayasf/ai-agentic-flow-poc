import type { RuntimeState, RuntimeViewModel } from '../../domain/runtime'
import type { AgentId } from '../../domain/runtime-fixtures/types'

const EMPTY_SET: ReadonlySet<AgentId> = new Set()

const CUSTOMER_COMPLAINT_DISPATCH: ReadonlySet<AgentId> = new Set<AgentId>([
  'agent-customer-complaint',
])

const INVESTIGATION_WAVE: ReadonlySet<AgentId> = new Set<AgentId>([
  'agent-policy',
  'agent-workflow',
  'agent-finance',
])

export function selectDispatchingAgentIds(
  viewModel: RuntimeViewModel,
): ReadonlySet<AgentId> {
  if (viewModel.earlyStory.showAiTyping) {
    return CUSTOMER_COMPLAINT_DISPATCH
  }
  return EMPTY_SET
}

export function selectInvestigationWaveAgentIds(
  state: RuntimeState,
): ReadonlySet<AgentId> {
  if (state.currentMomentId === 'M04') {
    return INVESTIGATION_WAVE
  }
  return EMPTY_SET
}
