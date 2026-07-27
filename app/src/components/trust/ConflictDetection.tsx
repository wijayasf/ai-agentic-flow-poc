import { Icon } from '../icon/Icon'
import type { RuntimeState, RuntimeViewModel } from '../../domain/runtime'
import {
  CONFLICT_PHASE_LABEL,
  selectConflictDetection,
} from '../agent-flow/conflictDetection'
import styles from './ConflictDetection.module.css'

export function ConflictDetection({
  state,
  viewModel,
}: {
  readonly state: RuntimeState
  readonly viewModel: RuntimeViewModel
}) {
  const detection = selectConflictDetection(state, viewModel)
  if (detection === null) return null
  // Evidence sources derived from the finding provenance — no new data.
  const evidenceSources =
    detection.findings.length > 0
      ? detection.findings.map((f) => ({
          id: f.id,
          label: f.sourceLabel,
          system: f.systemName,
        }))
      : []
  return (
    <article
      className={styles.card}
      aria-labelledby="conflict-detection-heading"
      data-testid="conflict-detection"
      data-phase={detection.phase}
    >
      <header className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          <Icon name="alert" size={14} />
        </span>
        <div className={styles.headingBlock}>
          <h3 className={styles.heading} id="conflict-detection-heading">
            Conflict Detection
          </h3>
          <span className={styles.subtitle} aria-live="polite">
            {detection.subtitle}
          </span>
        </div>
        <span
          className={styles.phaseBadge}
          data-phase={detection.phase}
          aria-label={`Analysis status: ${CONFLICT_PHASE_LABEL[detection.phase]}`}
        >
          {CONFLICT_PHASE_LABEL[detection.phase]}
        </span>
      </header>
      <div
        className={styles.engine}
        data-testid="conflict-engine"
        data-phase={detection.phase}
      >
        <span className={styles.engineGlyph} aria-hidden="true">
          <Icon name="search" size={12} />
        </span>
        <span className={styles.engineLabel}>
          <strong>Conflict Engine</strong>
          <span className={styles.engineSub}>
            {detection.phase === 'complete'
              ? `${detection.findingCount} inconsistencies identified across evidence sources`
              : 'Analyzing inconsistencies…'}
          </span>
        </span>
      </div>
      {evidenceSources.length > 0 ? (
        <section
          className={styles.sources}
          aria-labelledby="conflict-sources-heading"
          data-testid="conflict-sources"
        >
          <div className={styles.sourcesHeader}>
            <Icon name="database" size={11} aria-hidden="true" />
            <h4
              className={styles.sourcesTitle}
              id="conflict-sources-heading"
            >
              Evidence Sources
            </h4>
          </div>
          <ul
            className={styles.sourceList}
            aria-label="Evidence sources reviewed"
          >
            {evidenceSources.map((source) => (
              <li
                key={source.id}
                className={styles.sourceItem}
                data-testid={`conflict-source-${source.id}`}
              >
                <span className={styles.sourceGlyph} aria-hidden="true">
                  <Icon name="check" size={10} />
                </span>
                <span className={styles.sourceLabel}>{source.label}</span>
                <span className={styles.sourceSystem}>{source.system}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {detection.findings.length > 0 ? (
        <details
          className={styles.findingsWrap}
          data-testid="conflict-findings-collapsible"
        >
          <summary className={styles.findingsSummary}>
            <span className={styles.collapsibleGlyph} aria-hidden="true">
              <Icon name="alert" size={11} />
            </span>
            <span className={styles.findingsSummaryTitle}>
              Detailed Findings
            </span>
            <span className={styles.findingsCount}>
              {detection.findings.length}
            </span>
            <span className={styles.collapsibleChevron} aria-hidden="true">▾</span>
          </summary>
          <ul
            className={styles.findings}
            aria-label="Conflict findings"
          >
            {detection.findings.map((finding) => (
              <li
                key={finding.id}
                className={styles.finding}
                data-agent-id={finding.agentId}
                data-system-id={finding.systemId}
                data-testid={`conflict-finding-${finding.agentId}`}
              >
                <span className={styles.findingBullet} aria-hidden="true">
                  <Icon name="alert" size={10} />
                </span>
                <div className={styles.findingBody}>
                  <div className={styles.findingHeader}>
                    <strong className={styles.category}>
                      {finding.categoryLabel}
                    </strong>
                    <span className={styles.provenance}>
                      {finding.sourceLabel}
                      <span aria-hidden="true"> · </span>
                      <span className={styles.system}>{finding.systemName}</span>
                    </span>
                  </div>
                  <p className={styles.description}>{finding.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {detection.summaryLines ? (
        <footer
          className={styles.summary}
          data-testid="conflict-summary"
        >
          <div className={styles.summaryHeader}>
            <Icon name="check" size={11} aria-hidden="true" />
            <span className={styles.summaryTitle}>Conflict Summary</span>
          </div>
          <ul className={styles.summaryList}>
            {detection.summaryLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </footer>
      ) : null}
    </article>
  )
}
