import { Icon } from '../icon/Icon'
import type { RuntimeState } from '../../domain/runtime'
import { selectNotificationStrip } from '../agent-flow/notificationStrip'
import styles from './NotificationStrip.module.css'

export function NotificationStrip({ state }: { readonly state: RuntimeState }) {
  const strip = selectNotificationStrip(state)
  if (strip === null) return null
  return (
    <div
      className={styles.strip}
      data-testid="notification-strip"
      data-tone={strip.tone}
      data-key={strip.key}
      role="status"
      aria-live="polite"
    >
      <span className={styles.glyph} aria-hidden="true">
        <Icon
          name={
            strip.tone === 'success'
              ? 'check'
              : strip.tone === 'awaiting'
                ? 'clock'
                : strip.tone === 'progress'
                  ? 'activity'
                  : 'bot'
          }
          size={12}
        />
      </span>
      <span className={styles.message}>{strip.message}</span>
    </div>
  )
}
