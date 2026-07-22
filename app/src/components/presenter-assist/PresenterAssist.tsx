import { useEffect } from 'react'
import type { RefObject } from 'react'
import type { PresenterAssistModel } from '../../domain/runtime'
import { Icon } from '../icon/Icon'
import styles from './PresenterAssist.module.css'

export interface PresenterAssistToggleProps {
  readonly buttonRef: RefObject<HTMLButtonElement | null>
  readonly open: boolean
  readonly onToggle: () => void
  readonly variant: 'desktop' | 'mobile'
  readonly mobileView?: 'entry' | 'story' | 'desktop'
}

export function PresenterAssistToggle({
  buttonRef,
  open,
  onToggle,
  variant,
  mobileView,
}: PresenterAssistToggleProps) {
  return (
    <button
      ref={buttonRef}
      className={styles.toggle}
      data-variant={variant}
      data-mobile-view={mobileView}
      type="button"
      aria-label={`Presenter Assist: ${open ? 'On' : 'Off'}`}
      aria-controls="presenter-assist-surface"
      aria-expanded={open}
      aria-pressed={open}
      onClick={onToggle}
    >
      <Icon name="sparkles" size={18} aria-hidden="true" />
      <span>Presenter Assist</span>
      <strong>{open ? 'On' : 'Off'}</strong>
    </button>
  )
}

function PresenterAssistContent({ model }: { readonly model: PresenterAssistModel }) {
  return (
    <div className={styles.content}>
      <section className={styles.stageSummary} aria-labelledby="presenter-current-stage-heading">
        <div>
          <span>Current Stage</span>
          <h3 id="presenter-current-stage-heading" aria-live="polite">{model.stage}</h3>
        </div>
        <span className={styles.remainingTime}>
          <Icon name="clock" size={14} aria-hidden="true" />
          {model.remainingTime}
        </span>
      </section>

      <section aria-labelledby="presenter-key-message-heading">
        <h3 id="presenter-key-message-heading">Key Message</h3>
        <p className={styles.keyMessage}>{model.keyMessage}</p>
      </section>

      <section aria-labelledby="presenter-talking-points-heading">
        <h3 id="presenter-talking-points-heading">Suggested Talking Points</h3>
        <ul>{model.talkingPoints.map((point) => <li key={point}>{point}</li>)}</ul>
      </section>

      <div className={styles.guidanceGrid}>
        <section aria-labelledby="presenter-next-action-heading">
          <span aria-hidden="true"><Icon name="play" size={17} /></span>
          <div><h3 id="presenter-next-action-heading">Next Presenter Action</h3><p>{model.nextAction}</p></div>
        </section>
        <section aria-labelledby="presenter-audience-focus-heading">
          <span aria-hidden="true"><Icon name="search" size={17} /></span>
          <div><h3 id="presenter-audience-focus-heading">Audience Focus</h3><p>{model.audienceFocus}</p></div>
        </section>
      </div>

      <section className={styles.whyItMatters} aria-labelledby="presenter-why-heading">
        <span aria-hidden="true"><Icon name="flag" size={18} /></span>
        <div><h3 id="presenter-why-heading">Why It Matters</h3><p>{model.whyItMatters}</p></div>
      </section>

      <section className={styles.qa} aria-labelledby="presenter-qa-heading">
        <h3 id="presenter-qa-heading">Optional Q&amp;A Prompts</h3>
        <p>Presenter guidance only · not runtime telemetry</p>
        {model.qaPrompts.map((prompt) => (
          <details key={prompt.question}>
            <summary>{prompt.question}</summary>
            <p>{prompt.answer}</p>
          </details>
        ))}
      </section>
    </div>
  )
}

export function PresenterAssistSurface({
  model,
  onClose,
  variant,
}: {
  readonly model: PresenterAssistModel
  readonly onClose: () => void
  readonly variant: 'panel' | 'sheet'
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <aside
      id="presenter-assist-surface"
      className={styles.surface}
      data-variant={variant}
      aria-labelledby="presenter-assist-heading"
      data-testid="presenter-assist-surface"
    >
      <header className={styles.header}>
        <div>
          <span aria-hidden="true"><Icon name="sparkles" size={21} /></span>
          <div><small>Live presentation guidance</small><h2 id="presenter-assist-heading">Presenter Assist</h2></div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close Presenter Assist">
          <span aria-hidden="true">×</span>
        </button>
      </header>
      <div className={styles.scrollArea}>
        <PresenterAssistContent model={model} />
      </div>
    </aside>
  )
}
