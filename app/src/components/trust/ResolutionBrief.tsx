import { Icon } from '../icon/Icon'
import type { RuntimeState, RuntimeViewModel } from '../../domain/runtime'
import {
  RESOLUTION_BRIEF_PHASE_LABEL,
  selectResolutionBrief,
} from '../agent-flow/resolutionBrief'
import styles from './ResolutionBrief.module.css'

export function ResolutionBrief({
  state,
}: {
  readonly state: RuntimeState
  readonly viewModel: RuntimeViewModel
}) {
  const brief = selectResolutionBrief(state)
  if (brief === null) return null
  return (
    <article
      className={styles.card}
      aria-labelledby="resolution-brief-heading"
      data-testid="resolution-brief"
      data-phase={brief.phase}
    >
      <header className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          <Icon name="file-text" size={14} />
        </span>
        <div className={styles.headingBlock}>
          <h3 className={styles.heading} id="resolution-brief-heading">
            Approval Package
          </h3>
          <span className={styles.subtitle} aria-live="polite">
            {brief.subtitle}
          </span>
        </div>
        <span
          className={styles.phaseBadge}
          data-phase={brief.phase}
          aria-label={`Brief status: ${RESOLUTION_BRIEF_PHASE_LABEL[brief.phase]}`}
        >
          {RESOLUTION_BRIEF_PHASE_LABEL[brief.phase]}
        </span>
      </header>

      <section
        className={styles.section}
        aria-labelledby="resolution-brief-executive-heading"
        data-testid="resolution-brief-executive"
      >
        <div className={styles.sectionHeader}>
          <Icon name="sparkles" size={11} aria-hidden="true" />
          <h4
            className={styles.sectionTitle}
            id="resolution-brief-executive-heading"
          >
            Executive Summary
          </h4>
        </div>
        <p className={styles.executiveText}>{brief.executiveSummary}</p>
      </section>

      <details
        className={styles.collapsible}
        data-testid="resolution-brief-evidence"
      >
        <summary className={styles.collapsibleSummary}>
          <span className={styles.collapsibleGlyph} aria-hidden="true">
            <Icon name="check" size={11} />
          </span>
          <h4
            className={styles.collapsibleTitle}
            id="resolution-brief-evidence-heading"
          >
            Evidence Packages
          </h4>
          <span className={styles.collapsibleCount}>
            {brief.evidenceSummary.length}
          </span>
          <span className={styles.collapsibleChevron} aria-hidden="true">▾</span>
        </summary>
        <ul className={styles.checkList} aria-label="Evidence packages">
          {brief.evidenceSummary.map((item) => (
            <li
              key={item.id}
              className={styles.checkItem}
              data-testid={`resolution-brief-evidence-${item.id}`}
            >
              <span className={styles.checkGlyph} aria-hidden="true">
                <Icon name="check" size={10} />
              </span>
              <span className={styles.checkLabel}>{item.label}</span>
            </li>
          ))}
        </ul>
      </details>

      <footer
        className={styles.notes}
        data-testid="resolution-brief-notes"
      >
        <div className={styles.notesHeader}>
          <Icon name="bot" size={11} aria-hidden="true" />
          <span className={styles.notesTitle}>AI Notes</span>
        </div>
        <ul className={styles.notesList}>
          {brief.aiNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </footer>
    </article>
  )
}
