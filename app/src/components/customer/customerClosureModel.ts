import type { RuntimeViewModel } from '../../domain/runtime'

/**
 * US-14 presentation helper — Customer Closure.
 *
 * A single, presentation-only closing message that is appended to the
 * Customer Timeline after the case has been fully approved and executed.
 * All state is derived from the existing `viewModel.finalOutcome`
 * projection — no new runtime fields, timers, or events.
 *
 * The message is customer-facing only. It does NOT expose AI reasoning,
 * investigation, conflict, policy, internal approval, or enterprise-system
 * wording.
 */

export type CustomerClosureStatus = 'delivered'

export interface CustomerClosureViewModel {
  readonly senderName: string
  readonly senderRole: string
  readonly status: CustomerClosureStatus
  readonly statusLabel: string
  readonly timestampDisplay: string
  readonly timestampMachine: string
  readonly messageLines: readonly string[]
  readonly chipLabel: string
}

const SENDER_NAME = 'AI Resolution Officer'
const SENDER_ROLE = 'Customer Care'
const TIMESTAMP_DISPLAY = '10:00 AM'
const TIMESTAMP_MACHINE = '10:00:00'
const STATUS_LABEL = 'Delivered'
const CHIP_LABEL = 'Resolution Delivered'

const MESSAGE_LINES: readonly string[] = [
  'Terima kasih, Bu Rina.',
  'Keluhan dan bukti yang Anda sampaikan telah selesai kami tinjau.',
  'Tindak lanjut operasional telah disiapkan, dan kompensasi sebesar Rp31.000.000 telah memperoleh persetujuan.',
  'Proses pencairan kompensasi telah dimulai.',
  'Kami akan memberikan pembaruan berikutnya sesuai perkembangan.',
]

/**
 * Prohibited claims — the customer message must not assert that funds have
 * been received, transferred, or paid. Exported so regression tests can
 * assert this contract independently of the message body.
 */
export const CUSTOMER_CLOSURE_PROHIBITED_PHRASES: readonly string[] = [
  'pembayaran telah selesai',
  'dana telah ditransfer',
  'dana telah diterima',
  'kompensasi telah diterima',
  'penyelesaian finansial telah selesai',
  'Payment Completed',
  'Funds Transferred',
  'Funds Received',
]

/**
 * Returns the customer-closure view model when the message should render,
 * or `null` otherwise.
 *
 * Visibility contract:
 *   • Runtime terminal outcome resolved as 'approved' (finalOutcome.type === 'approved')
 *     → visible
 *   • Any other state (idle, in-progress, escalated / rejected)
 *     → null
 */
export function selectCustomerClosure(
  viewModel: RuntimeViewModel,
): CustomerClosureViewModel | null {
  const outcome = viewModel.finalOutcome
  if (outcome === null || outcome.type !== 'approved') return null
  return {
    senderName: SENDER_NAME,
    senderRole: SENDER_ROLE,
    status: 'delivered',
    statusLabel: STATUS_LABEL,
    timestampDisplay: TIMESTAMP_DISPLAY,
    timestampMachine: TIMESTAMP_MACHINE,
    messageLines: MESSAGE_LINES,
    chipLabel: CHIP_LABEL,
  }
}
