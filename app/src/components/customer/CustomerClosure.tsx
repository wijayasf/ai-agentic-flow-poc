import { useEffect, useRef } from 'react'
import { Icon } from '../icon/Icon'
import type { RuntimeViewModel } from '../../domain/runtime'
import {
  selectCustomerClosure,
} from './customerClosureModel'
import styles from './CustomerClosure.module.css'

export function CustomerClosure({
  viewModel,
}: {
  readonly viewModel: RuntimeViewModel
}) {
  const closure = selectCustomerClosure(viewModel)
  const cardRef = useRef<HTMLElement | null>(null)
  const hasScrolledRef = useRef(false)
  const isVisible = closure !== null

  // Auto-scroll the closure card into view exactly once, the first time
  // `finalOutcome` becomes 'approved'. Reduced-motion is honored by degrading
  // to instantaneous scroll. No timers, no polling — this fires when the
  // parent re-renders with the closure now present.
  useEffect(() => {
    if (!isVisible) return
    if (hasScrolledRef.current) return
    const card = cardRef.current
    if (card === null) return
    if (typeof card.scrollIntoView !== 'function') return
    hasScrolledRef.current = true
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    card.scrollIntoView({
      block: 'end',
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }, [isVisible])

  if (closure === null) return null
  return (
    <article
      ref={cardRef}
      className={styles.card}
      aria-labelledby="customer-closure-heading"
      data-testid="customer-closure"
      data-status={closure.status}
    >
      <header className={styles.header}>
        <span className={styles.avatar} aria-hidden="true">
          <Icon name="bot" size={18} />
        </span>
        <div className={styles.senderBlock}>
          <strong className={styles.senderName} id="customer-closure-heading">
            {closure.senderName}
          </strong>
          <span className={styles.senderRole}>{closure.senderRole}</span>
        </div>
        <time
          className={styles.timestamp}
          dateTime={closure.timestampMachine}
          data-testid="customer-closure-timestamp"
        >
          {closure.timestampDisplay}
        </time>
      </header>
      <div className={styles.body} data-testid="customer-closure-body">
        {closure.messageLines.map((line, index) => (
          <p key={index} className={styles.line}>
            {line}
          </p>
        ))}
      </div>
      <footer className={styles.footer}>
        <span
          className={styles.statusChip}
          data-testid="customer-closure-chip"
          aria-label={`Delivery status: ${closure.chipLabel}`}
        >
          <Icon name="check" size={12} aria-hidden="true" />
          {closure.chipLabel}
        </span>
        <span
          className={styles.statusLabel}
          aria-label={`Message status: ${closure.statusLabel}`}
        >
          <Icon name="check" size={11} aria-hidden="true" />
          {closure.statusLabel}
        </span>
      </footer>
    </article>
  )
}
