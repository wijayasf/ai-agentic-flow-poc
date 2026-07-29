import type { SystemId } from '../../domain/runtime-fixtures/types'
import type { RuntimeState } from '../../domain/runtime'

export type SystemPresentationState = 'inactive' | 'engaged'

export function systemPresentationState(
  state: RuntimeState,
  systemId: SystemId,
): SystemPresentationState {
  return state.activeSystemIds.includes(systemId) ? 'engaged' : 'inactive'
}
