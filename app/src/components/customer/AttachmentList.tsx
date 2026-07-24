import { storyAssets } from '../../assets/story'
import type { StoryAttachmentId } from '../../assets/story'
import { Icon } from '../icon/Icon'
import styles from './AttachmentList.module.css'

export interface AttachmentItem {
  readonly id: string
  readonly name: string
  readonly extension: string
}

export interface AttachmentListProps {
  readonly visible: ReadonlyArray<AttachmentItem>
  readonly totalCount: number
}

function AttachmentPreview({ attachmentId }: { attachmentId: StoryAttachmentId }) {
  const asset = storyAssets.attachments[attachmentId]
  return (
    <span className={styles.visual}>
      <img alt={asset.alt} height="640" src={asset.src} width="640" />
      <span className={styles.fileTypeIcon} aria-hidden="true">
        <Icon name={asset.icon} size={14} />
      </span>
    </span>
  )
}

export function AttachmentList({ visible, totalCount }: AttachmentListProps) {
  return (
    <fieldset className={styles.attachments}>
      <legend className={styles.legend}>
        Attachments ({visible.length} of {totalCount})
      </legend>
      <div className={styles.grid}>
        {visible.map((attachment) => (
          <article className={styles.card} key={attachment.id}>
            <AttachmentPreview attachmentId={attachment.id as StoryAttachmentId} />
            <strong className={styles.name}>{attachment.name}</strong>
            <span className={styles.ext}>.{attachment.extension}</span>
          </article>
        ))}
      </div>
    </fieldset>
  )
}
