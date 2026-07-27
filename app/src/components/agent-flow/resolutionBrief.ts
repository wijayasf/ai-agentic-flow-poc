import type { RuntimeState } from '../../domain/runtime'

/**
 * US-12 presentation helper — AI Resolution Brief.
 *
 * Communicates that the AI has finished its investigation and is preparing a
 * structured briefing for a human reviewer. It does not generate a
 * recommendation, does not approve or reject anything, does not preselect an
 * option, and does not surface refund, compensation, severity, risk or
 * confidence data. Those all belong to later stories.
 *
 * State is derived from:
 *   • state.currentMomentId   (existing runtime state)
 * No new runtime fields, no timers, no independent clocks.
 */

export type ResolutionBriefPhase = 'presented' | 'awaiting-review'

export interface EvidenceSummaryItem {
  readonly id: string
  readonly label: string
}

export interface ConflictSummaryItem {
  readonly id: string
  readonly label: string
}

export interface ResolutionOption {
  readonly id: string
  readonly optionLabel: string
  readonly title: string
  readonly description: string
}

export interface ResolutionBriefViewModel {
  readonly phase: ResolutionBriefPhase
  readonly subtitle: string
  readonly executiveSummary: string
  readonly evidenceSummary: readonly EvidenceSummaryItem[]
  readonly conflictSummary: readonly ConflictSummaryItem[]
  readonly resolutionOptions: readonly ResolutionOption[]
  readonly aiNotes: readonly string[]
}

const SUBTITLE_PRESENTED = 'Prepared for Human Review'
const SUBTITLE_AWAITING = 'Awaiting reviewer decision'

const EXECUTIVE_SUMMARY =
  'Investigation completed. Multiple evidence inconsistencies require reviewer validation before further action.'

const EVIDENCE_SUMMARY: readonly EvidenceSummaryItem[] = [
  { id: 'evidence-policy', label: 'Policy Repository reviewed' },
  { id: 'evidence-timeline', label: 'Customer Timeline reviewed' },
  { id: 'evidence-financial', label: 'Financial Context reviewed' },
]

const CONFLICT_SUMMARY: readonly ConflictSummaryItem[] = [
  { id: 'conflict-policy', label: 'Policy inconsistency' },
  { id: 'conflict-timeline', label: 'Timeline inconsistency' },
  { id: 'conflict-financial', label: 'Financial clarification required' },
]

const RESOLUTION_OPTIONS: readonly ResolutionOption[] = [
  {
    id: 'option-policy-review',
    optionLabel: 'Option A',
    title: 'Request policy review',
    description:
      'Ask a policy specialist to reconcile the retrieved criteria with the case handling record.',
  },
  {
    id: 'option-financial-verification',
    optionLabel: 'Option B',
    title: 'Request financial verification',
    description:
      'Ask a finance specialist to clarify the outstanding financial context before further action.',
  },
  {
    id: 'option-manual-assessment',
    optionLabel: 'Option C',
    title: 'Escalate for manual assessment',
    description:
      'Escalate the case for a manual assessment by a senior reviewer.',
  },
]

const AI_NOTES: readonly string[] = [
  'Further human review is required before further action.',
  'No recommendation generated.',
]

/**
 * Returns the resolution-brief view model when the card should be visible,
 * or `null` otherwise.
 *
 * Visibility contract:
 *   • M09 and earlier      → null (brief absent, Conflict Detection still owns the surface)
 *   • M10, M11             → phase 'presented' (Conflict stage — brief prepared)
 *   • M12, M13             → phase 'awaiting-review' (Approval stage — brief carried forward)
 *   • M14 and later        → null (brief unmounts; final outcome / decision takes over)
 */
export function selectResolutionBrief(
  state: RuntimeState,
): ResolutionBriefViewModel | null {
  const moment = state.currentMomentId
  if (moment === 'M10' || moment === 'M11') {
    return buildViewModel('presented')
  }
  if (moment === 'M12' || moment === 'M13') {
    return buildViewModel('awaiting-review')
  }
  return null
}

function buildViewModel(phase: ResolutionBriefPhase): ResolutionBriefViewModel {
  return {
    phase,
    subtitle: phase === 'presented' ? SUBTITLE_PRESENTED : SUBTITLE_AWAITING,
    executiveSummary: EXECUTIVE_SUMMARY,
    evidenceSummary: EVIDENCE_SUMMARY,
    conflictSummary: CONFLICT_SUMMARY,
    resolutionOptions: RESOLUTION_OPTIONS,
    aiNotes: AI_NOTES,
  }
}

/**
 * Compact semantic label used by the overall status badge.
 */
export const RESOLUTION_BRIEF_PHASE_LABEL: Readonly<
  Record<ResolutionBriefPhase, string>
> = {
  presented: 'Prepared',
  'awaiting-review': 'Awaiting Review',
}
