import { Icon } from '../icon/Icon'
import type { IconName } from '../icon/Icon'
import styles from '../static-shell/StaticShell.module.css'

export function PanelHeading({
  id,
  icon,
  children,
}: {
  id: string
  icon: IconName
  children: string
}) {
  return (
    <h2 className={styles.panelHeading} id={id}>
      <span className={styles.panelGlyph} aria-hidden="true">
        <Icon name={icon} size={18} />
      </span>
      {children}
    </h2>
  )
}
