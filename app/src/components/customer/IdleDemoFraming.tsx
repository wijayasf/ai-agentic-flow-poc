import { Icon } from '../icon/Icon'
import styles from './IdleDemoFraming.module.css'

export function IdleDemoFraming() {
  return (
    <article className={styles.idleCard} aria-labelledby="demo-ready-heading">
      <div className={styles.idleMessageGroup}>
        <span className={styles.idleIcon} aria-hidden="true">
          <Icon name="flow" size={30} />
        </span>
        <p className={styles.idleEyebrow}>Guided enterprise simulation</p>
        <h3 className={styles.idleTitle} id="demo-ready-heading">
          See AI collaboration unfold step by step
        </h3>
        <p className={styles.idleDescription}>
          This guided demo shows how multiple AI agents collaborate to investigate a
          customer complaint, validate evidence, detect conflicts, and prepare a
          recommendation for human approval.
        </p>
      </div>
      <div className={styles.readyStatus} role="status">
        <span aria-hidden="true">
          <Icon name="check" size={15} />
        </span>
        <strong>Demo is ready. Press Start to begin.</strong>
      </div>
    </article>
  )
}
