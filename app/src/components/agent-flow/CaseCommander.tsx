import styles from './CaseCommander.module.css'

const DEFAULT_SUBTITLE = 'Coordinating specialist agents'
const ORCHESTRATION_SUBTITLE = 'Dispatching…'
const RECEIVING_SUBTITLE = 'Receiving specialist result'
const FINALISING_SUBTITLE = 'Preparing final customer response'
const OFFICER_GLYPH_SRC = '/assets/icons/user-star.png'

export type AgenticCaseOfficerPhase =
  | 'idle'
  | 'acknowledging'
  | 'dispatching'
  | 'monitoring'
  | 'receiving'
  | 'finalising'

function deriveSubtitle(
  phase: AgenticCaseOfficerPhase,
  orchestrationLabel: string | null,
): string {
  if (phase === 'dispatching' || phase === 'acknowledging') {
    return orchestrationLabel ?? ORCHESTRATION_SUBTITLE
  }
  if (phase === 'receiving') {
    return orchestrationLabel ?? RECEIVING_SUBTITLE
  }
  if (phase === 'finalising') {
    return orchestrationLabel ?? FINALISING_SUBTITLE
  }
  return DEFAULT_SUBTITLE
}

export function AgenticCaseOfficer({
  commandActive = false,
  phase = 'idle',
  orchestrationLabel = null,
}: {
  readonly commandActive?: boolean
  readonly phase?: AgenticCaseOfficerPhase
  readonly orchestrationLabel?: string | null
} = {}) {
  const subtitle = deriveSubtitle(phase, orchestrationLabel)
  return (
    <article
      className={styles.card}
      aria-label="AI Agentic Case Officer"
      data-command-mode={commandActive ? 'active' : 'standby'}
      data-phase={commandActive ? phase : undefined}
    >
      <span className={styles.glyph} aria-hidden="true">
        <img
          className={styles.glyphImage}
          src={OFFICER_GLYPH_SRC}
          alt=""
          loading="eager"
          decoding="async"
          data-testid="agentic-case-officer-glyph"
        />
      </span>
      <div>
        <strong>AI Agentic Case Officer</strong>
        <span aria-live="polite">{subtitle}</span>
      </div>
    </article>
  )
}

export const CaseCommander = AgenticCaseOfficer
