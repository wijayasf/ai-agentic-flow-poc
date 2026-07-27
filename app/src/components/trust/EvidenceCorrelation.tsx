import { Icon } from '../icon/Icon'
import type { RuntimeState, RuntimeViewModel } from '../../domain/runtime'
import {
  CORRELATION_OVERALL_STATE_LABEL,
  CORRELATION_SOURCE_STATE_LABEL,
  selectEvidenceCorrelation,
} from '../agent-flow/evidenceCorrelation'
import styles from './EvidenceCorrelation.module.css'

export function EvidenceCorrelation({
  state,
  viewModel,
}: {
  readonly state: RuntimeState
  readonly viewModel: RuntimeViewModel
}) {
  const correlation = selectEvidenceCorrelation(state, viewModel)
  if (correlation === null) return null
  return (
    <article
      className={styles.card}
      aria-labelledby="evidence-correlation-heading"
      data-testid="evidence-correlation"
      data-overall-state={correlation.overallState}
    >
      <header className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          <Icon name="flow" size={14} />
        </span>
        <div className={styles.headingBlock}>
          <h3
            className={styles.heading}
            id="evidence-correlation-heading"
          >
            Evidence Correlation
          </h3>
          <span className={styles.subtitle} aria-live="polite">
            {correlation.subtitle}
          </span>
        </div>
        <span
          className={styles.overallBadge}
          data-overall-state={correlation.overallState}
          aria-label={`Correlation status: ${CORRELATION_OVERALL_STATE_LABEL[correlation.overallState]}`}
        >
          {CORRELATION_OVERALL_STATE_LABEL[correlation.overallState]}
        </span>
      </header>
      <ol
        className={styles.pipeline}
        aria-label="Evidence correlation pipeline"
      >
        {correlation.sources.map((source) => (
          <li
            key={source.agentId}
            className={styles.source}
            data-agent-id={source.agentId}
            data-system-id={source.systemId}
            data-source-state={source.state}
          >
            <span className={styles.sourceGlyph} aria-hidden="true">
              {source.state === 'mapped' ? (
                <Icon name="check" size={11} />
              ) : (
                <span className={styles.sourceGlyphDot} />
              )}
            </span>
            <span className={styles.sourceLabel}>
              <strong>{source.sourceLabel}</strong>
              <span className={styles.sourceOrigin}>{source.agentName}</span>
            </span>
            <span
              className={styles.sourceBadge}
              data-source-state={source.state}
              aria-label={`${source.sourceLabel} status: ${CORRELATION_SOURCE_STATE_LABEL[source.state]}`}
            >
              {CORRELATION_SOURCE_STATE_LABEL[source.state]}
            </span>
          </li>
        ))}
        <li
          className={styles.mergeArrow}
          aria-hidden="true"
          data-testid="correlation-merge-arrow"
        >
          <span />
        </li>
        <li
          className={styles.engine}
          data-testid="correlation-engine"
          data-overall-state={correlation.overallState}
        >
          <span className={styles.engineGlyph} aria-hidden="true">
            <Icon name="sparkles" size={12} />
          </span>
          <span className={styles.engineLabel}>
            <strong>Correlation Engine</strong>
            <span className={styles.engineSub}>
              {correlation.mappedCount} of {correlation.totalSources} sources joined
            </span>
          </span>
        </li>
      </ol>
      {correlation.summary ? (
        <footer
          className={styles.summary}
          data-testid="correlation-summary"
        >
          <Icon name="check" size={11} aria-hidden="true" />
          <span>{correlation.summary}</span>
        </footer>
      ) : null}
    </article>
  )
}
