import type { AgentLifecycleStatus } from '../../domain/runtime'

export function relayState(
  from: AgentLifecycleStatus,
  to: AgentLifecycleStatus,
): AgentLifecycleStatus {
  if (to === 'blocked') return 'blocked'
  if (to === 'needs_review') return 'needs_review'
  if (from === 'working' || to === 'working') return 'working'
  if (from === 'completed' && to === 'completed') return 'completed'
  return 'waiting'
}
