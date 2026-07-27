import type { RuntimeState } from '../../domain/runtime'

/**
 * US-13 UX helper — Context Notification Strip.
 *
 * A lightweight, non-modal banner that surfaces the current business
 * milestone. The message is a pure derivation from state — no timers, no
 * dialogs, no toasts. When the underlying moment / stage changes, the message
 * changes with it. When there is no message to show, the strip is hidden.
 */

export type NotificationTone = 'progress' | 'success' | 'awaiting' | 'neutral'

export interface NotificationStripViewModel {
  readonly key: string
  readonly message: string
  readonly tone: NotificationTone
}

const INVESTIGATION_MESSAGE = 'AI investigation in progress...'
const CONFLICT_MESSAGE = 'Evidence correlation completed. Review findings below.'
const APPROVAL_MESSAGE = 'AI analysis completed. Waiting for reviewer decision.'

const MESSAGES: Record<string, NotificationStripViewModel> = {
  M04: { key: 'M04', message: INVESTIGATION_MESSAGE, tone: 'progress' },
  M05: { key: 'M05', message: INVESTIGATION_MESSAGE, tone: 'progress' },
  M06: { key: 'M06', message: INVESTIGATION_MESSAGE, tone: 'progress' },
  M07: { key: 'M07', message: INVESTIGATION_MESSAGE, tone: 'progress' },
  M08: { key: 'M08', message: INVESTIGATION_MESSAGE, tone: 'progress' },
  M09: { key: 'M09', message: CONFLICT_MESSAGE, tone: 'success' },
  M10: { key: 'M10', message: APPROVAL_MESSAGE, tone: 'awaiting' },
  M11: { key: 'M11', message: APPROVAL_MESSAGE, tone: 'awaiting' },
  M12: { key: 'M12', message: APPROVAL_MESSAGE, tone: 'awaiting' },
  M13: { key: 'M13', message: APPROVAL_MESSAGE, tone: 'awaiting' },
}

export function selectNotificationStrip(
  state: RuntimeState,
): NotificationStripViewModel | null {
  const moment = state.currentMomentId
  if (moment === null) return null
  return MESSAGES[moment] ?? null
}
