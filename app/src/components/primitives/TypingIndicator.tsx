import { Icon } from '../icon/Icon'
import styles from '../static-shell/StaticShell.module.css'

export function TypingIndicator({
  label,
  tone,
}: {
  readonly label: string
  readonly tone: 'customer' | 'ai'
}) {
  return (
    <div
      className={styles.typingIndicator}
      data-tone={tone}
      role="status"
      aria-label={label}
    >
      <Icon name={tone === 'customer' ? 'message' : 'bot'} size={18} />
      <span className={styles.typingDots} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>{label}</span>
    </div>
  )
}
