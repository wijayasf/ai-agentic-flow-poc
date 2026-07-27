import type { RuntimeState, RuntimeViewModel } from '../../domain/runtime'

/**
 * US-13 UX helper — Human Approval presentation wrapper.
 *
 * Decides when the transitional "End of AI Analysis / Human Approval"
 * presentation should render. This is purely a visual divider that groups the
 * reviewer's decision area — approval logic remains inside the existing
 * ApprovalDecisionCard.
 */

export interface HumanApprovalViewModel {
  readonly heading: string
  readonly subtitle: string
}

export const HUMAN_APPROVAL_HEADING = 'Human Approval'
export const HUMAN_APPROVAL_SUBTITLE =
  'AI analysis completed. Please review the information above before continuing.'

/**
 * Returns the Human Approval view model when the presentation wrapper should
 * render, or `null` otherwise.
 *
 * Visibility contract:
 *   • Approval stage active (M12 — M13) while runtime awaits decision → visible
 *   • Runtime approvalStatus already decided (approved / rejected)     → null
 *   • Terminal outcome reached                                         → null
 *   • Any other moment / stage                                         → null
 */
export function selectHumanApproval(
  state: RuntimeState,
  viewModel: RuntimeViewModel,
): HumanApprovalViewModel | null {
  if (state.terminalOutcome !== 'unresolved') return null
  if (state.approvalStatus !== 'pending' && state.approvalStatus !== 'not_required') return null
  if (viewModel.currentStage !== 'Approval') return null
  return {
    heading: HUMAN_APPROVAL_HEADING,
    subtitle: HUMAN_APPROVAL_SUBTITLE,
  }
}
