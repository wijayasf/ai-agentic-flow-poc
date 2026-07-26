import type { RuntimeViewModel } from '../../domain/runtime'
import styles from './NowNext.module.css'

export function NowNext({
  viewModel,
}: {
  readonly viewModel: RuntimeViewModel
}) {
  return (
    <dl className={styles.nowNext} aria-label="Current and next workflow actions">
      <div>
        <dt>Now</dt>
        <dd>{viewModel.nowNext.now}</dd>
      </div>
      <div>
        <dt>Next</dt>
        <dd>{viewModel.nowNext.next ?? 'No further action'}</dd>
      </div>
    </dl>
  )
}
