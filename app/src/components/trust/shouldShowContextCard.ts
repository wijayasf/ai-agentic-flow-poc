import type { RuntimeState, RuntimeViewModel } from '../../domain/runtime'

export function shouldShowContextCard(
  _state: RuntimeState,
  viewModel: RuntimeViewModel,
): boolean {
  return (
    viewModel.earlyStory.showIntakeContext ||
    viewModel.context.type !== 'neutral' ||
    viewModel.approvalStatus === 'approved'
  )
}
