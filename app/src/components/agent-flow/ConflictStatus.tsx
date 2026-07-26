import { Icon } from '../icon/Icon'
import type { RuntimeState } from '../../domain/runtime'
import styles from './ConflictStatus.module.css'

export function ConflictStatus({
  state,
}: {
  readonly state: RuntimeState
}) {
  const isNeutral = state.conflictStatus === 'neutral'
  const isResolved = state.conflictStatus === 'resolved'
  return (
    <div
      className={styles.banner}
      data-state={state.conflictStatus}
      role="status"
    >
      <span aria-hidden="true">
        <Icon
          name={isNeutral ? 'activity' : isResolved ? 'check' : 'alert'}
          size={19}
        />
      </span>
      <p>
        {isNeutral ? (
          <>Conflict status will appear as evidence is reconciled.</>
        ) : isResolved ? (
          <>
            <strong>Conflict resolved:</strong> Customer evidence and SAP CX
            resolution status are reconciled.
          </>
        ) : (
          <>
            <strong>Conflict detected:</strong> SAP CX shows Completed, but
            customer evidence shows unresolved leakage.
          </>
        )}
      </p>
    </div>
  )
}
