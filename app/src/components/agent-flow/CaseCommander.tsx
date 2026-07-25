import { IconBadge } from '../primitives/IconBadge'
import styles from './CaseCommander.module.css'

export function CaseCommander() {
  return (
    <article className={styles.card} aria-label="Case Commander">
      <IconBadge icon="sparkles" tone="blue" />
      <div>
        <strong>Case Commander</strong>
        <span>Orchestrating agents and resolving conflicts</span>
      </div>
    </article>
  )
}
