import { useState } from 'react'
import { Icon } from '../icon/Icon'
import type { RuntimeState, RuntimeViewModel } from '../../domain/runtime'
import {
  selectHumanApproval,
  type ApproverStep,
} from '../agent-flow/humanApproval'
import styles from './HumanApproval.module.css'

const STATE_ICON = {
  waiting: '○',
  reviewing: '●',
  approved: '✓',
} as const

const STATE_LABEL: Readonly<Record<ApproverStep['status'], string>> = {
  waiting: 'Waiting',
  reviewing: 'Reviewing…',
  approved: 'Approved',
}

export function HumanApproval({
  state,
  viewModel,
}: {
  readonly state: RuntimeState
  readonly viewModel: RuntimeViewModel
}) {
  const model = selectHumanApproval(state, viewModel)
  // The derived `isCollapsed` flag flips when Finance enters Preparing
  // Disbursement. Once flipped, the presenter may reopen the details via
  // the toggle; the override remains within the collapsed lifecycle and
  // does not need to reset — clicking `View details` re-expands, clicking
  // `Hide details` re-collapses.
  const [manualExpand, setManualExpand] = useState<boolean>(false)
  const derivedCollapsed = model?.isCollapsed ?? false

  if (model === null) return null
  const isExpanded = derivedCollapsed ? manualExpand : true
  const showApproverList =
    model.enterpriseWorkflowActive || model.enterpriseWorkflowComplete
  const showPackage = showApproverList || model.awaitingHumanDecision
  const dataPhase = derivedCollapsed && !isExpanded
    ? 'collapsed'
    : model.enterpriseWorkflowComplete
      ? 'complete'
      : model.enterpriseWorkflowActive
        ? 'running'
        : 'awaiting'
  return (
    <>
      <div
        className={styles.divider}
        role="separator"
        aria-label="End of AI analysis"
        data-testid="human-approval-divider"
      >
        <span className={styles.dividerLabel}>End of AI Analysis</span>
      </div>
      <section
        className={styles.card}
        aria-labelledby="human-approval-heading"
        data-testid="human-approval"
        data-phase={dataPhase}
        data-collapsed={!isExpanded ? 'true' : undefined}
      >
        <div className={styles.headerRow}>
          <span className={styles.icon} aria-hidden="true">
            <Icon name="user" size={14} />
          </span>
          <div className={styles.headingBlock}>
            <h3 className={styles.heading} id="human-approval-heading">
              {isExpanded ? model.heading : model.collapsedSummary.heading}
            </h3>
            <p className={styles.subtitle} aria-live="polite">
              {isExpanded ? model.subtitle : model.collapsedSummary.progressLabel}
            </p>
          </div>
          {derivedCollapsed ? (
            <button
              type="button"
              className={styles.toggleButton}
              onClick={() => setManualExpand((prev) => !prev)}
              aria-expanded={isExpanded}
              aria-controls="human-approval-detail"
              data-testid="human-approval-toggle"
            >
              {isExpanded ? 'Hide details' : model.collapsedSummary.toggleLabel}
            </button>
          ) : null}
        </div>
        {isExpanded ? (
          <div
            id="human-approval-detail"
            className={styles.detailBody}
            data-testid="human-approval-detail"
          >
            {showPackage ? (
              <div
                className={styles.packageBlock}
                data-testid="human-approval-package"
              >
                <strong className={styles.packageTitle}>
                  {model.package.title}
                </strong>
                <div
                  className={styles.compensationRow}
                  data-testid="compensation-block"
                >
                  <span className={styles.compensationLabel}>
                    Recommended Compensation
                  </span>
                  <span
                    className={styles.compensationAmount}
                    data-testid="compensation-amount"
                  >
                    {model.package.compensation.display}
                  </span>
                </div>
              </div>
            ) : null}
            {showApproverList ? (
              <div
                className={styles.progressBlock}
                data-testid="human-approval-progress"
                role="group"
                aria-labelledby="human-approval-progress-heading"
              >
                <div className={styles.progressHeader}>
                  <span
                    className={styles.progressHeading}
                    id="human-approval-progress-heading"
                  >
                    Approval Progress
                  </span>
                  <span
                    className={styles.progressCount}
                    data-testid="approval-progress-count"
                    aria-live="polite"
                  >
                    {model.progress.label}
                  </span>
                </div>
                <div
                  className={styles.progressTrack}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={4}
                  aria-valuenow={model.progress.completed}
                  aria-valuetext={model.progress.label}
                >
                  <div
                    className={styles.progressFill}
                    style={{ width: `${model.progress.percent}%` }}
                    data-percent={model.progress.percent}
                  />
                </div>
                <ol className={styles.progressSteps} aria-hidden="true">
                  {[1, 2, 3, 4].map((idx) => {
                    const step = model.approvers.find((a) => a.index === idx)
                    return (
                      <li
                        key={idx}
                        className={styles.progressStep}
                        data-status={step?.status ?? 'waiting'}
                      >
                        {idx}
                      </li>
                    )
                  })}
                </ol>
              </div>
            ) : null}
            {showApproverList ? (
              <div
                className={styles.approverScroll}
                aria-label="Approver list"
                data-testid="approver-scroll"
              >
                <ol
                  className={styles.approverList}
                  aria-label="Enterprise approval chain — four approvers"
                  data-testid="approver-list"
                >
                  {model.approvers.map((approver) => (
                    <li
                      key={approver.index}
                      className={styles.approverRow}
                      data-status={approver.status}
                      data-approver-index={approver.index}
                      data-testid={`approver-${approver.index}`}
                    >
                      <span
                        className={styles.approverGlyph}
                        aria-hidden="true"
                        data-status={approver.status}
                      >
                        {STATE_ICON[approver.status]}
                      </span>
                      <div className={styles.approverBody}>
                        <strong className={styles.approverName}>
                          {approver.name}
                        </strong>
                        <span className={styles.approverRole}>{approver.role}</span>
                      </div>
                      <span
                        className={styles.approverStatus}
                        data-status={approver.status}
                      >
                        {STATE_LABEL[approver.status]}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
            {showPackage ? (
              <details className={styles.packageExtras}>
                <summary className={styles.packageExtrasSummary}>
                  Supporting package details
                </summary>
                <dl className={styles.packageDetails}>
                  <div>
                    <dt>Operational Resolution</dt>
                    <dd>
                      <ul>
                        {model.package.operationalResolution.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  <div>
                    <dt>Financial Action</dt>
                    <dd>
                      <ul>
                        {model.package.financialAction.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                </dl>
              </details>
            ) : null}
          </div>
        ) : null}
      </section>
    </>
  )
}
