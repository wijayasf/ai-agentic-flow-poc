import { Icon } from '../icon/Icon'
import type { RuntimeViewModel } from '../../domain/runtime'
import {
  ACTIVITY_STATE_LABEL,
  selectEvidenceCollectionSummary,
  selectInvestigationEvidenceItems,
} from '../agent-flow/investigationEvidence'
import styles from './InvestigationEvidence.module.css'

export function InvestigationEvidence({
  viewModel,
}: {
  readonly viewModel: RuntimeViewModel
}) {
  const items = selectInvestigationEvidenceItems(viewModel)
  if (items === null) return null
  const summary = selectEvidenceCollectionSummary(viewModel)
  return (
    <article
      className={styles.card}
      aria-labelledby="investigation-evidence-heading"
      data-testid="investigation-evidence"
      data-collection-complete={summary ? 'true' : undefined}
    >
      <header className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          <Icon name="search" size={14} />
        </span>
        <h3
          className={styles.heading}
          id="investigation-evidence-heading"
        >
          Investigation Evidence
        </h3>
        {summary ? (
          <span
            className={styles.summaryBadge}
            data-testid="evidence-collection-summary"
          >
            <Icon name="check" size={11} aria-hidden="true" />
            {summary}
          </span>
        ) : null}
      </header>
      <ul className={styles.list}>
        {items.map((item) => (
          <li
            key={item.agentId}
            className={styles.item}
            data-agent-id={item.agentId}
            data-system-id={item.systemId}
            data-activity-state={item.activityState}
          >
            <div className={styles.row}>
              <span className={styles.provenance}>
                <strong>{item.agentName}</strong>
                <span aria-hidden="true"> · </span>
                <span className={styles.system}>{item.systemName}</span>
              </span>
              <span
                className={styles.stateBadge}
                data-activity-state={item.activityState}
                aria-label={`Activity: ${ACTIVITY_STATE_LABEL[item.activityState]}`}
              >
                {ACTIVITY_STATE_LABEL[item.activityState]}
              </span>
            </div>
            <div className={styles.activity}>{item.activityLabel}</div>
            {item.evidencePreview ? (
              <div
                className={styles.evidence}
                data-testid={`evidence-preview-${item.agentId}`}
              >
                <Icon
                  name="check"
                  size={11}
                  aria-hidden="true"
                />
                <span>{item.evidencePreview}</span>
              </div>
            ) : (
              <div className={styles.pendingEvidence} aria-hidden="true">
                Evidence not yet retrieved
              </div>
            )}
          </li>
        ))}
      </ul>
    </article>
  )
}
