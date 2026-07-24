import type { RuntimeState, RuntimeViewModel } from '../../domain/runtime'

export function shouldShowContextCard(
  state: RuntimeState,
  viewModel: RuntimeViewModel,
): boolean {
  return (
    viewModel.earlyStory.showIntakeContext ||
    state.playbackStatus === 'waiting_failure_injection' ||
    viewModel.context.type !== 'neutral' ||
    state.approvalStatus === 'approved'
  )
}
