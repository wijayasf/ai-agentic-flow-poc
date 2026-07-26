import type { IconName } from '../icon/Icon'
import type { AgentLifecycleStatus } from '../../domain/runtime'

export function lifecycleIcon(status: AgentLifecycleStatus): IconName {
  switch (status) {
    case 'waiting':
      return 'clock'
    case 'working':
      return 'activity'
    case 'needs_review':
      return 'approval'
    case 'completed':
      return 'check'
    case 'blocked':
      return 'alert'
    default:
      return status satisfies never
  }
}
