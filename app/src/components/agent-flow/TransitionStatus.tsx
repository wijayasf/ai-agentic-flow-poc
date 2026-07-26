import { Icon } from '../icon/Icon'
import type { RuntimeViewModel } from '../../domain/runtime'
import styles from './TransitionStatus.module.css'

export function TransitionStatus({
  viewModel,
}: {
  readonly viewModel: RuntimeViewModel
}) {
  const transition = viewModel.transition
  if (transition === null) return null
  return (
    <div className={styles.banner} role="status">
      <span aria-hidden="true">
        <Icon name="check" size={18} />
      </span>
      <p>
        <strong>{transition.title}</strong>
        <small>{transition.next}</small>
      </p>
    </div>
  )
}
