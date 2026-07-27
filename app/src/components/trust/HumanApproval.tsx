import { Icon } from '../icon/Icon'
import type { RuntimeState, RuntimeViewModel } from '../../domain/runtime'
import { selectHumanApproval } from '../agent-flow/humanApproval'
import styles from './HumanApproval.module.css'

/**
 * US-13 UX — Human Approval presentation wrapper.
 *
 * Renders only the visual transition marker between AI-generated content and
 * the reviewer's decision:
 *   • "END OF AI ANALYSIS" divider
 *   • "Human Approval" heading
 *   • Short reviewer guidance subtitle
 *
 * Approval logic, buttons, and runtime dispatch remain the responsibility of
 * the existing ApprovalDecisionCard rendered by StaticShell.
 */
export function HumanApproval({
  state,
  viewModel,
}: {
  readonly state: RuntimeState
  readonly viewModel: RuntimeViewModel
}) {
  const model = selectHumanApproval(state, viewModel)
  if (model === null) return null
  return (
    <>
      <div
        className={styles.divider}
        role="separator"
        aria-label="End of AI analysis"
        data-testid="human-approval-divider"
      >
        <span className={styles.dividerLabel}>End of AI Analysis</span>
      </div>
      <section
        className={styles.card}
        aria-labelledby="human-approval-heading"
        data-testid="human-approval"
      >
        <span className={styles.icon} aria-hidden="true">
          <Icon name="user" size={14} />
        </span>
        <div className={styles.headingBlock}>
          <h3 className={styles.heading} id="human-approval-heading">
            {model.heading}
          </h3>
          <p className={styles.subtitle}>{model.subtitle}</p>
        </div>
      </section>
    </>
  )
}
