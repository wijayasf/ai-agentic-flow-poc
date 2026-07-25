import { Icon } from '../icon/Icon'
import type { RuntimeState } from '../../domain/runtime'
import { systems } from './config'
import { systemPresentationState } from './systemPresentationState'
import styles from './SystemGrid.module.css'

export function SystemGrid({
  state,
  workflowIntroduced,
}: {
  readonly state: RuntimeState
  readonly workflowIntroduced: boolean
}) {
  return (
    <ul className={styles.grid} aria-label="Enterprise systems">
      {systems.map((system) => {
        const presentationState = workflowIntroduced
          ? systemPresentationState(state, system.id)
          : 'inactive'
        return (
          <li
            className={styles.card}
            data-state={presentationState}
            key={system.id}
            aria-label={`${system.name}, ${presentationState}`}
          >
            <span
              className={styles.placeholder}
              data-tone={system.tone}
              aria-hidden="true"
            >
              <Icon name={system.icon} size={18} />
            </span>
            <strong>{system.name}</strong>
          </li>
        )
      })}
    </ul>
  )
}
