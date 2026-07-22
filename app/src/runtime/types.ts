import type { DemoMode } from '../domain/runtime-fixtures/types'
import type { RuntimeState, RuntimeViewModel } from '../domain/runtime'

export interface RuntimeControllerActions {
  readonly selectMode: (mode: DemoMode) => void
  readonly start: () => void
  readonly pause: () => void
  readonly resume: () => void
  readonly nextMoment: () => void
  readonly restart: () => void
  readonly approve: () => void
  readonly injectFailure: () => void
}

export interface RuntimeController {
  readonly state: RuntimeState
  readonly viewModel: RuntimeViewModel
  readonly actions: RuntimeControllerActions
}
