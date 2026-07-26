import type { SystemId } from '../../domain/runtime-fixtures/types'
import type { RuntimeState } from '../../domain/runtime'

export type SystemPresentationState =
  | 'inactive'
  | 'engaged'
  | 'failed'
  | 'recovering'
  | 'resolved'

export function systemPresentationState(
  state: RuntimeState,
  systemId: SystemId,
): SystemPresentationState {
  if (!state.activeSystemIds.includes(systemId)) return 'inactive'
  if (systemId !== 'system-sap-s4hana') return 'engaged'
  if (state.playbackStatus === 'failed') return 'failed'
  if (state.playbackStatus === 'recovering') return 'recovering'
  if (state.failureStatus === 'recovered') return 'resolved'
  return 'engaged'
}
