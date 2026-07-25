import { Icon } from '../icon/Icon'
import type { RuntimeViewModel } from '../../domain/runtime'
import styles from './StageStepper.module.css'

export function StageStepper({
  viewModel,
}: {
  readonly viewModel: RuntimeViewModel
}) {
  return (
    <nav className={styles.stepper} aria-label="Complaint resolution stages">
      <ol>
        {viewModel.stages.map(({ stage, state }, index) => (
          <li
            className={
              state === 'current'
                ? styles.activeStage
                : state === 'completed'
                  ? styles.completedStage
                  : undefined
            }
            data-state={state}
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
          </li>
        ))}
      </ol>
    </nav>
  )
}
