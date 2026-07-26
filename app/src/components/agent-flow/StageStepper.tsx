import { Icon } from '../icon/Icon'
import type { RuntimeViewModel } from '../../domain/runtime'
import styles from './StageStepper.module.css'

export function StageStepper({
  viewModel,
  intakeCompleted = false,
}: {
  readonly viewModel: RuntimeViewModel
  readonly intakeCompleted?: boolean
}) {
  return (
    <nav className={styles.stepper} aria-label="Complaint resolution stages">
      <ol>
        {viewModel.stages.map(({ stage, state }, index) => {
          const isIntakeCompletionHold =
            stage === 'Intake' && state === 'current' && intakeCompleted
          return (
            <li
              className={
                state === 'current'
                  ? styles.activeStage
                  : state === 'completed'
                    ? styles.completedStage
                    : undefined
              }
              data-state={state}
              data-substate={
                isIntakeCompletionHold ? 'initial-intake-completed' : undefined
              }
              key={stage}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <span>
                {state === 'completed' ? (
                  <Icon name="check" size={13} aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </span>
              <strong>{stage}</strong>
              {isIntakeCompletionHold ? (
                <span
                  className={styles.completionBadge}
                  aria-hidden="true"
                  data-testid="stage-completion-badge"
                >
                  <Icon name="check" size={10} aria-hidden="true" />
                </span>
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
