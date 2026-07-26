import { Icon } from '../icon/Icon'
import type { IconName } from '../icon/Icon'
import styles from './ComplaintCard.module.css'

export type ComplaintChipTone = 'danger' | 'warning'

export interface ComplaintChip {
  readonly tone: ComplaintChipTone
  readonly icon: IconName
  readonly label: string
  readonly id?: string
}

export interface ComplaintCardProps {
  readonly createdAt: string
  readonly timestampDisplay: string
  readonly message: string
  readonly chips?: ReadonlyArray<ComplaintChip>
}

const CHIP_CLASS: Record<ComplaintChipTone, string> = {
  danger: styles.chipDanger,
  warning: styles.chipWarning,
}

export function ComplaintCard({
  createdAt,
  timestampDisplay,
  message,
  chips,
}: ComplaintCardProps) {
  return (
    <article className={styles.complaint} aria-label="Customer complaint">
      <div className={styles.header}>
        <span className={styles.label}>Complaint</span>
        <time className={styles.timestamp} dateTime={createdAt}>
          {timestampDisplay}
        </time>
      </div>
      <p className={styles.message}>{message}</p>
      {chips && chips.length > 0 ? (
        <div className={styles.chipRow} aria-label="Case priority classification">
          {chips.map((chip) => (
            <span
              className={`${styles.chip} ${CHIP_CLASS[chip.tone]}`}
              key={chip.label}
              data-chip={chip.id}
            >
              <Icon name={chip.icon} size={12} aria-hidden="true" />
              {chip.label}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  )
}
