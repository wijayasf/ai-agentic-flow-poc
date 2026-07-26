import styles from './CustomerIdentity.module.css'

export interface CustomerIdentityProps {
  readonly name: string
  readonly caseId: string
  readonly segment: string
  readonly avatarSrc: string
  readonly avatarAlt: string
}

export function CustomerIdentity({
  name,
  caseId,
  segment,
  avatarSrc,
  avatarAlt,
}: CustomerIdentityProps) {
  return (
    <div className={styles.identity}>
      <img
        alt={avatarAlt}
        className={styles.avatar}
        height="640"
        src={avatarSrc}
        width="640"
      />
      <div className={styles.info}>
        <strong className={styles.name}>{name}</strong>
        <div className={styles.meta}>
          <span className={styles.caseId}>{caseId}</span>
          <span aria-hidden="true" className={styles.separator}>·</span>
          <span className={styles.segment}>{segment}</span>
        </div>
      </div>
    </div>
  )
}
