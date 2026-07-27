import styles from './CaseCommander.module.css'

const DEFAULT_SUBTITLE = 'Orchestrating agents and resolving conflicts'
const ORCHESTRATION_SUBTITLE = 'Dispatching task…'
const MONITORING_SUBTITLE = 'Monitoring Investigation'
const COMMANDER_GLYPH_SRC = '/assets/icons/user-star.png'

export function CaseCommander({
  orchestrationActive = false,
  handoffReady = false,
  dispatchingWave = false,
  investigationMonitoring = false,
  conflictActive = false,
  commandActive = false,
}: {
  readonly orchestrationActive?: boolean
  readonly handoffReady?: boolean
  readonly dispatchingWave?: boolean
  readonly investigationMonitoring?: boolean
  readonly conflictActive?: boolean
  readonly commandActive?: boolean
} = {}) {
  const phase = orchestrationActive
    ? 'dispatching'
    : dispatchingWave
      ? 'dispatching-wave'
      : investigationMonitoring
        ? 'monitoring'
        : handoffReady
          ? 'ready'
          : undefined
  const subtitle = orchestrationActive
    ? ORCHESTRATION_SUBTITLE
    : investigationMonitoring
      ? MONITORING_SUBTITLE
      : DEFAULT_SUBTITLE
  return (
    <article
      className={styles.card}
      aria-label="Case Commander"
      data-command-mode={commandActive ? 'active' : 'standby'}
      data-orchestrating={
        commandActive && orchestrationActive ? 'true' : undefined
      }
      data-phase={commandActive ? phase : undefined}
      data-attention={
        commandActive && conflictActive ? 'conflict' : undefined
      }
    >
      <span className={styles.glyph} aria-hidden="true">
        <img
          className={styles.glyphImage}
          src={COMMANDER_GLYPH_SRC}
          alt=""
          loading="eager"
          decoding="async"
          data-testid="case-commander-glyph"
        />
      </span>
      <div>
        <strong>Case Commander</strong>
        <span aria-live="polite">{subtitle}</span>
      </div>
    </article>
  )
}
