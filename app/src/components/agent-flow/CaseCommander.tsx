import { IconBadge } from '../primitives/IconBadge'
import styles from './CaseCommander.module.css'

const DEFAULT_SUBTITLE = 'Orchestrating agents and resolving conflicts'
const ORCHESTRATION_SUBTITLE = 'Dispatching task…'

export function CaseCommander({
  orchestrationActive = false,
  handoffReady = false,
  dispatchingWave = false,
}: {
  readonly orchestrationActive?: boolean
  readonly handoffReady?: boolean
  readonly dispatchingWave?: boolean
} = {}) {
  const phase = orchestrationActive
    ? 'dispatching'
    : dispatchingWave
      ? 'dispatching-wave'
      : handoffReady
        ? 'ready'
        : undefined
  return (
    <article
      className={styles.card}
      aria-label="Case Commander"
      data-orchestrating={orchestrationActive ? 'true' : undefined}
      data-phase={phase}
    >
      <IconBadge icon="sparkles" tone="blue" />
      <div>
        <strong>Case Commander</strong>
        <span aria-live="polite">
          {orchestrationActive ? ORCHESTRATION_SUBTITLE : DEFAULT_SUBTITLE}
        </span>
      </div>
    </article>
  )
}
