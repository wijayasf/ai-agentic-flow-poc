import { Icon } from '../icon/Icon'
import type { IconName } from '../icon/Icon'
import styles from '../static-shell/StaticShell.module.css'

export type IconBadgeTone =
  | 'blue'
  | 'green'
  | 'violet'
  | 'orange'
  | 'red'
  | 'amber'

export function IconBadge({
  icon,
  tone,
}: {
  icon: IconName
  tone: IconBadgeTone
}) {
  return (
    <span className={styles.glyph} data-tone={tone} aria-hidden="true">
      <Icon name={icon} size={21} />
    </span>
  )
}
