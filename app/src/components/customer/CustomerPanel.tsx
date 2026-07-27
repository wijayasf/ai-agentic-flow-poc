import complaint from '@fixtures/complaints/complaint-leakage-001.json'
import customer from '@fixtures/customers/customer-rina-putri.json'
import { storyAssets } from '../../assets/story'
import { Icon } from '../icon/Icon'
import { TypingIndicator } from '../primitives/TypingIndicator'
import type { RuntimeViewModel } from '../../domain/runtime'
import shellStyles from '../static-shell/StaticShell.module.css'
import { AttachmentList } from './AttachmentList'
import { ComplaintCard } from './ComplaintCard'
import type { ComplaintChip } from './ComplaintCard'
import complaintChipStyles from './ComplaintCard.module.css'
import { CustomerClosure } from './CustomerClosure'
import { CustomerIdentity } from './CustomerIdentity'
import { IdleDemoFraming } from './IdleDemoFraming'
import styles from './CustomerPanel.module.css'

const CASE_ID = 'CASE-05187'

const CUSTOMER_SEGMENT_LABEL: Record<string, string> = {
  Homeowner: 'Homeowner',
}

const PRIORITY_CHIP: Record<string, ComplaintChip> = {
  high: {
    id: 'high-priority',
    tone: 'danger',
    icon: 'alert',
    label: 'High Priority',
  },
}

const OFFICER_PROMISE_CHIP: ComplaintChip = {
  id: 'daily-update',
  tone: 'warning',
  icon: 'clock',
  label: 'Daily Update Promise',
}

const CHIP_TONE_CLASS: Record<ComplaintChip['tone'], string> = {
  danger: complaintChipStyles.chipDanger,
  warning: complaintChipStyles.chipWarning,
}

function segmentLabel(segment: string): string {
  return CUSTOMER_SEGMENT_LABEL[segment] ?? segment
}

export function CustomerPanel({
  viewModel,
}: {
  readonly viewModel: RuntimeViewModel
}) {
  const { earlyStory } = viewModel
  const visibleAttachments = complaint.attachments.slice(
    0,
    earlyStory.visibleAttachmentCount,
  )
  const showOfficerAcknowledgement = earlyStory.showAiAcknowledgement
  const intakeCompleted = viewModel.agentLifecycle.some(
    (agent) =>
      agent.agentId === 'agent-customer-complaint' &&
      agent.status === 'completed',
  )
  const priorityChip = PRIORITY_CHIP[customer.priority]

  const focusState =
    viewModel.focusTarget === null
      ? undefined
      : viewModel.focusTarget === 'customer-panel'
        ? 'primary'
        : 'secondary'

  return (
    <section
      className={`${shellStyles.panel} ${shellStyles.customerPanel} ${styles.panel}`}
      data-focus={focusState}
      aria-labelledby="customer-experience-heading"
    >
      <h2 className={styles.heading} id="customer-experience-heading">
        <span className={styles.headingGlyph} aria-hidden="true">
          <Icon name="user" size={18} />
        </span>
        Customer Experience
      </h2>

      {earlyStory.isIdle ? (
        <div className={styles.idleBody}>
          <IdleDemoFraming />
        </div>
      ) : (
        <div className={styles.body}>
          {earlyStory.showCustomerIdentity ? (
            <div className={styles.section}>
              <CustomerIdentity
                name={customer.name}
                caseId={CASE_ID}
                segment={segmentLabel(customer.segment)}
                avatarSrc={storyAssets.customerAvatar.src}
                avatarAlt={storyAssets.customerAvatar.alt}
              />
            </div>
          ) : null}

          {earlyStory.showCustomerTyping ? (
            <div className={styles.typingRow}>
              <TypingIndicator label="Customer is typing" tone="customer" />
            </div>
          ) : null}

          {earlyStory.showCustomerIdentity && earlyStory.showCustomerMessage ? (
            <div className={styles.section}>
              <ComplaintCard
                createdAt={complaint.createdAt}
                timestampDisplay="09:15 AM"
                message={complaint.message}
              />
            </div>
          ) : null}

          {visibleAttachments.length > 0 ? (
            <div className={styles.section}>
              <AttachmentList
                visible={visibleAttachments}
                totalCount={complaint.attachments.length}
              />
            </div>
          ) : null}

          {earlyStory.showAiTyping ? (
            <div className={styles.typingRow}>
              <TypingIndicator
                label="AI Resolution Officer is typing"
                tone="ai"
              />
            </div>
          ) : null}

          {showOfficerAcknowledgement ? (
            <article
              className={`${styles.officerReply} ${styles.officerRevealRoot}`}
              aria-labelledby="officer-heading"
              data-reveal="officer"
              data-intake-completed={intakeCompleted ? 'true' : undefined}
            >
              <div
                className={styles.officerHeader}
                data-reveal-block="header"
              >
                <span className={styles.officerBadge} aria-hidden="true">
                  <Icon name="bot" size={18} />
                </span>
                <strong className={styles.officerName} id="officer-heading">
                  AI Resolution Officer
                </strong>
                <time className={styles.officerTime} dateTime="09:16:00">
                  09:16 AM
                </time>
              </div>
              <p
                className={styles.officerMessage}
                data-reveal-block="message"
              >
                Thank you, Rina. I&rsquo;ve received your complaint and
                attachments. I&rsquo;m reviewing with the right systems and
                experts. I&rsquo;ll keep you updated daily until this is
                resolved.
                <span
                  className={styles.officerCursor}
                  aria-hidden="true"
                  data-reveal-block="cursor"
                />
              </p>
              {intakeCompleted ? (
                <div
                  className={styles.officerFooter}
                  aria-label="AI Resolution Officer commitments"
                  data-reveal-block="footer"
                >
                  <div className={styles.officerChipRow}>
                    {priorityChip ? (
                      <span
                        className={`${complaintChipStyles.chip} ${CHIP_TONE_CLASS[priorityChip.tone]} ${styles.officerChip}`}
                        key={priorityChip.label}
                        data-chip={priorityChip.id}
                      >
                        <Icon
                          name={priorityChip.icon}
                          size={12}
                          aria-hidden="true"
                        />
                        {priorityChip.label}
                      </span>
                    ) : null}
                    <span
                      className={`${complaintChipStyles.chip} ${CHIP_TONE_CLASS[OFFICER_PROMISE_CHIP.tone]} ${styles.officerChip}`}
                      key={OFFICER_PROMISE_CHIP.label}
                      data-chip={OFFICER_PROMISE_CHIP.id}
                    >
                      <Icon
                        name={OFFICER_PROMISE_CHIP.icon}
                        size={12}
                        aria-hidden="true"
                      />
                      {OFFICER_PROMISE_CHIP.label}
                    </span>
                  </div>
                  <span
                    className={styles.verifiedMark}
                    aria-label="Verified response"
                    data-reveal-block="verified"
                  >
                    <Icon name="check" size={12} aria-hidden="true" />
                  </span>
                </div>
              ) : null}
            </article>
          ) : null}

          <CustomerClosure viewModel={viewModel} />
        </div>
      )}
    </section>
  )
}
