import { Icon } from '../icon/Icon'
import { IconBadge } from '../primitives/IconBadge'
import type { RuntimeViewModel } from '../../domain/runtime'
import { agents, lifecycleLabels } from './config'
import { lifecycleIcon } from './lifecycleIcon'
import {
  selectAgentActivitySubtitle,
  selectAgentProgressState,
} from './agentActivity'
import styles from './AgentGrid.module.css'

export function AgentGrid({
  viewModel,
}: {
  readonly viewModel: RuntimeViewModel
}) {
  return (
    <ul className={styles.grid} aria-label="Specialist agents">
      {agents.map((agent) => {
        const presentationState =
          viewModel.agentLifecycle.find((item) => item.agentId === agent.id)
            ?.status ?? 'waiting'
        const isFocused = viewModel.focusTarget === agent.id
        const activitySubtitle = selectAgentActivitySubtitle(
          agent.id,
          presentationState,
        )
        const progressState = selectAgentProgressState(presentationState)
        return (
          <li
            className={styles.card}
            data-state={presentationState}
            data-focus={isFocused ? 'primary' : undefined}
            data-agent-id={agent.id}
            data-progress={progressState}
            key={agent.id}
            aria-label={`${agent.name}, ${lifecycleLabels[presentationState]}`}
          >
            <div
              className={styles.progressTrack}
              aria-hidden="true"
              data-testid={`agent-progress-${agent.id}`}
            >
              <div className={styles.progressFill} />
            </div>
            <IconBadge icon={agent.icon} tone={agent.tone} />
            <strong>{agent.name}</strong>
            <span className={styles.lifecycleBadge}>
              <Icon
                name={lifecycleIcon(presentationState)}
                size={12}
                aria-hidden="true"
              />
              {lifecycleLabels[presentationState]}
            </span>
            {activitySubtitle ? (
              <small
                className={styles.activitySubtitle}
                data-tone={agent.tone}
                data-activity-state={presentationState}
                aria-live="polite"
              >
                {activitySubtitle}
              </small>
            ) : (
              <small data-tone={agent.tone}>
                {agent.skill} <Icon name="sparkles" size={11} aria-hidden="true" />
              </small>
            )}
          </li>
        )
      })}
    </ul>
  )
}
