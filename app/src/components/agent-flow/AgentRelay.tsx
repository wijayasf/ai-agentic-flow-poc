import type { RuntimeViewModel } from '../../domain/runtime'
import { relayState } from './relayState'
import styles from './AgentRelay.module.css'

export function AgentRelay({
  viewModel,
}: {
  readonly viewModel: RuntimeViewModel
}) {
  return (
    <div
      className={styles.relay}
      data-testid="agent-relay-connectors"
      aria-hidden="true"
    >
      {viewModel.agentLifecycle.slice(0, -1).map((agent, index) => (
        <span
          data-state={relayState(
            agent.status,
            viewModel.agentLifecycle[index + 1].status,
          )}
          key={agent.agentId}
        />
      ))}
    </div>
  )
}
