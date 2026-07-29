import { Icon } from '../icon/Icon'
import type { RuntimeState, RuntimeViewModel } from '../../domain/runtime'
import { systems } from './config'
import { systemPresentationState } from './systemPresentationState'
import { isSystemSettled, selectPairedAgentStatus } from './agentActivity'
import styles from './SystemGrid.module.css'

export function SystemGrid({
  state,
  viewModel,
  workflowIntroduced,
}: {
  readonly state: RuntimeState
  readonly viewModel: RuntimeViewModel
  readonly workflowIntroduced: boolean
}) {
  return (
    <ul className={styles.grid} aria-label="Enterprise systems">
      {systems.map((system) => {
        const presentationState = workflowIntroduced
          ? systemPresentationState(state, system.id)
          : 'inactive'
        const pairedStatus = selectPairedAgentStatus(system.id, viewModel)
        const settled = isSystemSettled(presentationState, pairedStatus)
        return (
          <li
            className={styles.card}
            data-state={presentationState}
            data-system-id={system.id}
            data-paired-agent-status={pairedStatus ?? undefined}
            data-settled={settled ? 'true' : undefined}
            key={system.id}
            aria-label={`${system.name}, ${presentationState}`}
          >
            <span
              className={styles.placeholder}
              data-tone={system.tone}
              data-brand={system.brandAsset ? 'true' : undefined}
              aria-hidden="true"
            >
              {system.brandAsset ? (
                <img
                  className={styles.brandImage}
                  src={system.brandAsset.src}
                  alt={system.brandAsset.alt}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <Icon name={system.icon} size={18} />
              )}
            </span>
            <strong>{system.name}</strong>
          </li>
        )
      })}
    </ul>
  )
}
